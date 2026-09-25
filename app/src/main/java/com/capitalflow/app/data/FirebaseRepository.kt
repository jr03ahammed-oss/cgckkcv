package com.capitalflow.app.data

import android.content.Context
import android.util.Log
import com.capitalflow.app.model.*
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.PersistentCacheSettings
import com.google.firebase.firestore.firestoreSettings
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

class FirebaseRepository(private val context: Context) {

    private val auth: FirebaseAuth by lazy { FirebaseAuth.getInstance() }
    
    // Connect to the specific Firestore database ID configured for this project
    private val firestoreDatabaseId = "ai-studio-remixcapitalflow-632f4b91-b754-4f4d-b1e1-d43e960ab586"
    val db: FirebaseFirestore by lazy {
        try {
            val app = FirebaseApp.getInstance()
            val instance = FirebaseFirestore.getInstance(app, firestoreDatabaseId)
            val settings = firestoreSettings {
                setLocalCacheSettings(PersistentCacheSettings.newBuilder().build())
            }
            instance.firestoreSettings = settings
            instance
        } catch (e: Exception) {
            Log.w("FirebaseRepository", "Using default Firestore instance due to: ${e.message}")
            FirebaseFirestore.getInstance()
        }
    }

    private val scope = CoroutineScope(Dispatchers.Main)

    // State flows
    private val _currentUser = MutableStateFlow<FirebaseUser?>(auth.currentUser)
    val currentUser: StateFlow<FirebaseUser?> = _currentUser.asStateFlow()

    private val _userProfile = MutableStateFlow<UserProfile?>(null)
    val userProfile: StateFlow<UserProfile?> = _userProfile.asStateFlow()

    private val _investments = MutableStateFlow<List<Investment>>(emptyList())
    val investments: StateFlow<List<Investment>> = _investments.asStateFlow()

    private val _monthlyRecords = MutableStateFlow<Map<String, List<MonthlyRecord>>>(emptyMap())
    val monthlyRecords: StateFlow<Map<String, List<MonthlyRecord>>> = _monthlyRecords.asStateFlow()

    private val _fundingRecords = MutableStateFlow<List<FundingRecord>>(emptyList())
    val fundingRecords: StateFlow<List<FundingRecord>> = _fundingRecords.asStateFlow()

    private val _syncStatus = MutableStateFlow(SyncStatus.SYNCED)
    val syncStatus: StateFlow<SyncStatus> = _syncStatus.asStateFlow()

    private val _rateInfo = MutableStateFlow(
        CurrencyRateInfo(
            base = "USD",
            date = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()),
            source = "Initializing...",
            rates = CurrencyHelper.FALLBACK_USD_RATES,
            lastFetched = System.currentTimeMillis()
        )
    )
    val rateInfo: StateFlow<CurrencyRateInfo> = _rateInfo.asStateFlow()

    private var profileListener: ListenerRegistration? = null
    private var investmentsListener: ListenerRegistration? = null
    private val monthlyListeners = mutableMapOf<String, ListenerRegistration>()
    private var fundingListener: ListenerRegistration? = null

    init {
        // Observe auth state changes
        auth.addAuthStateListener { fbAuth ->
            val user = fbAuth.currentUser
            _currentUser.value = user
            if (user != null) {
                attachListeners(user.uid, user.email, user.displayName, user.photoUrl?.toString())
            } else {
                detachListeners()
                _userProfile.value = null
                _investments.value = emptyList()
                _monthlyRecords.value = emptyMap()
                _fundingRecords.value = emptyList()
            }
        }

        // Fetch currency rates
        scope.launch {
            refreshRates()
        }
    }

    suspend fun refreshRates() {
        try {
            val rates = CurrencyHelper.fetchExchangeRates(context)
            _rateInfo.value = rates
        } catch (e: Exception) {
            Log.e("FirebaseRepository", "Failed to refresh rates: ${e.message}")
        }
    }

    private fun attachListeners(userId: String, email: String?, displayName: String?, photoUrl: String?) {
        detachListeners()
        _syncStatus.value = SyncStatus.SYNCING

        val userDoc = db.collection("users").document(userId)

        // 1. Profile listener
        profileListener = userDoc.addSnapshotListener { snapshot, error ->
            if (error != null) {
                Log.e("FirebaseRepository", "Profile listener error: ${error.message}")
                _syncStatus.value = SyncStatus.ERROR
                return@addSnapshotListener
            }

            if (snapshot != null && snapshot.exists()) {
                val p = snapshot.toObject(UserProfile::class.java)
                _userProfile.value = p
                _syncStatus.value = SyncStatus.SYNCED
            } else {
                // Initialize profile if not existing
                val today = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())
                val newProfile = UserProfile(
                    id = userId,
                    email = email ?: "",
                    companyName = "Vayxon Capital",
                    ownerName = displayName ?: "",
                    photoURL = photoUrl ?: "",
                    masterCurrency = "SAR",
                    defaultCountry = "Saudi Arabia",
                    defaultCurrency = "SAR",
                    notificationReminder = true,
                    reminderDay = 1,
                    reminderTime = "09:00",
                    createdAt = today,
                    updatedAt = today
                )
                userDoc.set(newProfile)
                _userProfile.value = newProfile
                _syncStatus.value = SyncStatus.SYNCED
            }
        }

        // 2. Investments listener
        investmentsListener = userDoc.collection("investments").addSnapshotListener { snapshot, error ->
            if (error != null) {
                Log.e("FirebaseRepository", "Investments listener error: ${error.message}")
                _syncStatus.value = SyncStatus.ERROR
                return@addSnapshotListener
            }

            if (snapshot != null) {
                val list = snapshot.documents.mapNotNull { it.toObject(Investment::class.java) }
                _investments.value = list
                _syncStatus.value = SyncStatus.SYNCED

                // Attach monthly record listeners for all investments
                list.forEach { inv ->
                    if (!monthlyListeners.containsKey(inv.id)) {
                        attachMonthlyListener(userId, inv.id)
                    }
                }
            }
        }

        // 3. Funding records listener
        fundingListener = userDoc.collection("fundingRecords").addSnapshotListener { snapshot, error ->
            if (error != null) {
                Log.e("FirebaseRepository", "Funding listener error: ${error.message}")
                _syncStatus.value = SyncStatus.ERROR
                return@addSnapshotListener
            }

            if (snapshot != null) {
                val list = snapshot.documents.mapNotNull { it.toObject(FundingRecord::class.java) }
                _fundingRecords.value = list
                _syncStatus.value = SyncStatus.SYNCED
            }
        }
    }

    private fun attachMonthlyListener(userId: String, investmentId: String) {
        val listener = db.collection("users").document(userId)
            .collection("investments").document(investmentId)
            .collection("monthlyRecords")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e("FirebaseRepository", "Monthly records error for $investmentId: ${error.message}")
                    return@addSnapshotListener
                }

                if (snapshot != null) {
                    val records = snapshot.documents.mapNotNull { it.toObject(MonthlyRecord::class.java) }
                    val currentMap = _monthlyRecords.value.toMutableMap()
                    currentMap[investmentId] = records
                    _monthlyRecords.value = currentMap
                }
            }
        monthlyListeners[investmentId] = listener
    }

    private fun detachListeners() {
        profileListener?.remove()
        profileListener = null
        investmentsListener?.remove()
        investmentsListener = null
        monthlyListeners.values.forEach { it.remove() }
        monthlyListeners.clear()
        fundingListener?.remove()
        fundingListener = null
    }

    // Profile Actions
    suspend fun updateProfile(updates: Map<String, Any>) {
        val user = auth.currentUser ?: return
        val mapWithTimestamp = updates.toMutableMap()
        mapWithTimestamp["updatedAt"] = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())
        db.collection("users").document(user.uid).update(mapWithTimestamp).await()
    }

    suspend fun setMasterCurrency(newCurrency: String) {
        updateProfile(mapOf("masterCurrency" to newCurrency))
    }

    // Investment Actions
    suspend fun addInvestment(
        name: String,
        country: String,
        currency: String,
        initialCapital: Double,
        startDate: String,
        targetPeriod: String?,
        notes: String?
    ): String {
        val user = auth.currentUser ?: throw IllegalStateException("Not authenticated")
        val id = "inv_" + UUID.randomUUID().toString().replace("-", "").take(12)
        val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())

        val inv = Investment(
            id = id,
            userId = user.uid,
            name = name,
            country = country,
            currency = currency,
            initialCapital = initialCapital,
            startDate = startDate,
            targetPeriod = targetPeriod,
            notes = notes,
            createdAt = now,
            updatedAt = now
        )

        db.collection("users").document(user.uid)
            .collection("investments").document(id)
            .set(inv).await()

        return id
    }

    suspend fun updateInvestment(id: String, updates: Map<String, Any>) {
        val user = auth.currentUser ?: return
        val map = updates.toMutableMap()
        map["updatedAt"] = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())
        db.collection("users").document(user.uid)
            .collection("investments").document(id)
            .update(map).await()
    }

    suspend fun deleteInvestment(id: String) {
        val user = auth.currentUser ?: return
        // Delete subcollection monthly records first
        val monthlyDocs = db.collection("users").document(user.uid)
            .collection("investments").document(id)
            .collection("monthlyRecords").get().await()

        for (d in monthlyDocs.documents) {
            d.reference.delete().await()
        }

        db.collection("users").document(user.uid)
            .collection("investments").document(id)
            .delete().await()
    }

    // Monthly Record Actions
    suspend fun addMonthlyRecord(
        investmentId: String,
        month: String,
        date: String,
        income: Double,
        expense: Double,
        additionalCapital: Double,
        withdrawal: Double,
        notes: String?,
        status: String?
    ): String {
        val user = auth.currentUser ?: throw IllegalStateException("Not authenticated")
        val id = "rec_" + UUID.randomUUID().toString().replace("-", "").take(12)
        val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())

        val inv = _investments.value.find { it.id == investmentId }
        val masterCurr = _userProfile.value?.masterCurrency ?: "SAR"
        val rate = if (inv != null) {
            CurrencyHelper.getExchangeRate(inv.currency, masterCurr, _rateInfo.value.rates)
        } else null

        val record = MonthlyRecord(
            id = id,
            userId = user.uid,
            investmentId = investmentId,
            month = month,
            date = date,
            income = income,
            expense = expense,
            additionalCapital = additionalCapital,
            withdrawal = withdrawal,
            notes = notes,
            status = status,
            exchangeRate = rate,
            exchangeRateDate = _rateInfo.value.date,
            createdAt = now,
            updatedAt = now
        )

        db.collection("users").document(user.uid)
            .collection("investments").document(investmentId)
            .collection("monthlyRecords").document(id)
            .set(record).await()

        return id
    }

    suspend fun updateMonthlyRecord(investmentId: String, recordId: String, updates: Map<String, Any>) {
        val user = auth.currentUser ?: return
        val map = updates.toMutableMap()
        map["updatedAt"] = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())
        db.collection("users").document(user.uid)
            .collection("investments").document(investmentId)
            .collection("monthlyRecords").document(recordId)
            .update(map).await()
    }

    suspend fun deleteMonthlyRecord(investmentId: String, recordId: String) {
        val user = auth.currentUser ?: return
        db.collection("users").document(user.uid)
            .collection("investments").document(investmentId)
            .collection("monthlyRecords").document(recordId)
            .delete().await()
    }

    // Funding Record Actions
    suspend fun addFundingRecord(
        source: String,
        type: String,
        amount: Double,
        currency: String,
        date: String,
        allocatedInvestmentId: String?,
        allocatedInvestmentName: String?,
        status: String,
        notes: String?
    ): String {
        val user = auth.currentUser ?: throw IllegalStateException("Not authenticated")
        val id = "fund_" + UUID.randomUUID().toString().replace("-", "").take(12)
        val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())

        val record = FundingRecord(
            id = id,
            userId = user.uid,
            source = source,
            type = type,
            amount = amount,
            currency = currency,
            date = date,
            allocatedInvestmentId = allocatedInvestmentId,
            allocatedInvestmentName = allocatedInvestmentName,
            status = status,
            notes = notes,
            createdAt = now,
            updatedAt = now
        )

        db.collection("users").document(user.uid)
            .collection("fundingRecords").document(id)
            .set(record).await()

        return id
    }

    suspend fun updateFundingRecord(id: String, updates: Map<String, Any>) {
        val user = auth.currentUser ?: return
        val map = updates.toMutableMap()
        map["updatedAt"] = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())
        db.collection("users").document(user.uid)
            .collection("fundingRecords").document(id)
            .update(map).await()
    }

    suspend fun deleteFundingRecord(id: String) {
        val user = auth.currentUser ?: return
        db.collection("users").document(user.uid)
            .collection("fundingRecords").document(id)
            .delete().await()
    }

    // Sign out
    fun signOut() {
        auth.signOut()
    }

    // Import sample portfolio data matching web demo
    suspend fun importSampleData() {
        val user = auth.currentUser ?: return
        val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())

        // 1. Riyadh Logistics Hub
        val inv1Id = addInvestment(
            name = "Riyadh Logistics Park & Cold Chain",
            country = "Saudi Arabia",
            currency = "SAR",
            initialCapital = 450000.0,
            startDate = "2024-01-15",
            targetPeriod = "24 Months",
            notes = "Prime warehousing facility with automated pallet storage near King Khalid Airport."
        )

        addMonthlyRecord(inv1Id, "Jan 2024", "2024-01-31", 12500.0, 3200.0, 0.0, 0.0, "Tenant move-in", "Operating")
        addMonthlyRecord(inv1Id, "Feb 2024", "2024-02-28", 18400.0, 2900.0, 0.0, 0.0, "Capacity at 80%", "Operating")
        addMonthlyRecord(inv1Id, "Mar 2024", "2024-03-31", 21200.0, 3100.0, 0.0, 0.0, "Full ramp up", "Operating")
        addMonthlyRecord(inv1Id, "Apr 2024", "2024-04-30", 22000.0, 3500.0, 0.0, 0.0, "Standard dividend", "Operating")

        // 2. Dhaka Textile Export Expansion
        val inv2Id = addInvestment(
            name = "Dhaka High-Yield Apparel Facility",
            country = "Bangladesh",
            currency = "BDT",
            initialCapital = 12000000.0,
            startDate = "2024-02-01",
            targetPeriod = "18 Months",
            notes = "Tier-1 eco-friendly export unit serving European retail conglomerates."
        )

        addMonthlyRecord(inv2Id, "Feb 2024", "2024-02-28", 450000.0, 95000.0, 0.0, 0.0, "Initial shipment batch", "Operating")
        addMonthlyRecord(inv2Id, "Mar 2024", "2024-03-31", 620000.0, 110000.0, 0.0, 0.0, "Spring collection export", "Operating")

        // 3. UAE AI Cloud Infrastructure
        val inv3Id = addInvestment(
            name = "Dubai Enterprise AI Computing Cluster",
            country = "United Arab Emirates",
            currency = "AED",
            initialCapital = 250000.0,
            startDate = "2024-03-10",
            targetPeriod = "12 Months",
            notes = "High-performance GPU cluster colocated in DIFC data center."
        )

        addMonthlyRecord(inv3Id, "Mar 2024", "2024-03-31", 16500.0, 4200.0, 0.0, 0.0, "First cloud contracts", "Operating")

        // 4. Sample Funding records
        addFundingRecord(
            source = "Al-Rajhi Family Syndicate",
            type = "Partner Contribution",
            amount = 500000.0,
            currency = "SAR",
            date = "2024-01-10",
            allocatedInvestmentId = inv1Id,
            allocatedInvestmentName = "Riyadh Logistics Park & Cold Chain",
            status = "Completed",
            notes = "Series A LP contribution"
        )

        addFundingRecord(
            source = "Falcon Venture Debt Facility",
            type = "Debt / Credit Facility",
            amount = 150000.0,
            currency = "USD",
            date = "2024-02-20",
            allocatedInvestmentId = null,
            allocatedInvestmentName = null,
            status = "Completed",
            notes = "Revolving treasury reserve"
        )
    }

    suspend fun clearAllData() {
        val user = auth.currentUser ?: return
        for (inv in _investments.value) {
            deleteInvestment(inv.id)
        }
        for (f in _fundingRecords.value) {
            deleteFundingRecord(f.id)
        }
    }
}
