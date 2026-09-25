package com.capitalflow.app

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.capitalflow.app.data.FirebaseRepository
import com.capitalflow.app.model.FundingRecord
import com.capitalflow.app.model.Investment
import com.capitalflow.app.model.MonthlyRecord
import com.capitalflow.app.ui.components.AddFundingRecordDialog
import com.capitalflow.app.ui.components.AddInvestmentDialog
import com.capitalflow.app.ui.components.AddMonthlyRecordDialog
import com.capitalflow.app.ui.screens.*
import com.capitalflow.app.ui.theme.CapitalFlowTheme
import com.capitalflow.app.ui.theme.EmeraldPrimary
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var repository: FirebaseRepository
    private lateinit var googleSignInClient: GoogleSignInClient

    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account: GoogleSignInAccount = task.getResult(ApiException::class.java)
            val credential = GoogleAuthProvider.getCredential(account.idToken, null)
            FirebaseAuth.getInstance().signInWithCredential(credential)
                .addOnSuccessListener {
                    Toast.makeText(this, "Welcome to CapitalFlow!", Toast.LENGTH_SHORT).show()
                }
                .addOnFailureListener { e ->
                    Toast.makeText(this, "Sign in failed: ${e.message}", Toast.LENGTH_LONG).show()
                }
        } catch (e: Exception) {
            Toast.makeText(this, "Google sign in error: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        repository = FirebaseRepository(applicationContext)

        // Configure Google Sign-In options using Web Client ID from config
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)

        setContent {
            val currentUser by repository.currentUser.collectAsState()
            val userProfile by repository.userProfile.collectAsState()
            val investments by repository.investments.collectAsState()
            val monthlyRecords by repository.monthlyRecords.collectAsState()
            val fundingRecords by repository.fundingRecords.collectAsState()
            val syncStatus by repository.syncStatus.collectAsState()
            val rateInfo by repository.rateInfo.collectAsState()

            var themePreference by remember { mutableStateOf("system") }
            LaunchedEffect(userProfile?.themePreference) {
                userProfile?.themePreference?.let { themePreference = it }
            }

            val coroutineScope = rememberCoroutineScope()

            CapitalFlowTheme(themePreference = themePreference) {
                // If not authenticated, show AuthScreen
                if (currentUser == null) {
                    var isAuthLoading by remember { mutableStateOf(false) }

                    AuthScreen(
                        isLoading = isAuthLoading,
                        onGoogleSignIn = {
                            val signInIntent = googleSignInClient.signInIntent
                            googleSignInLauncher.launch(signInIntent)
                        },
                        onDemoSignIn = {
                            isAuthLoading = true
                            // Sign in anonymously or with test credential for local testing
                            FirebaseAuth.getInstance().signInAnonymously()
                                .addOnSuccessListener {
                                    isAuthLoading = false
                                    Toast.makeText(this@MainActivity, "Signed in with Demo Account", Toast.LENGTH_SHORT).show()
                                }
                                .addOnFailureListener { err ->
                                    isAuthLoading = false
                                    Toast.makeText(this@MainActivity, "Demo sign in failed: ${err.message}", Toast.LENGTH_LONG).show()
                                }
                        }
                    )
                } else {
                    // Main App Navigation
                    var currentTab by remember { mutableStateOf("dashboard") }
                    var selectedInvestmentId by remember { mutableStateOf<String?>(null) }

                    // Dialog States
                    var isAddInvestmentOpen by remember { mutableStateOf(false) }
                    var editingInvestment by remember { mutableStateOf<Investment?>(null) }

                    var isAddMonthlyOpen by remember { mutableStateOf(false) }
                    var editingMonthlyRecord by remember { mutableStateOf<MonthlyRecord?>(null) }

                    var isAddFundingOpen by remember { mutableStateOf(false) }
                    var editingFundingRecord by remember { mutableStateOf<FundingRecord?>(null) }

                    val selectedInvestment = remember(selectedInvestmentId, investments) {
                        investments.find { it.id == selectedInvestmentId }
                    }

                    Scaffold(
                        bottomBar = {
                            NavigationBar(
                                containerColor = MaterialTheme.colorScheme.surface,
                                tonalElevation = 3.dp
                            ) {
                                val navItems = listOf(
                                    NavigationItem("dashboard", "Dashboard", Icons.Filled.Dashboard, Icons.Outlined.Dashboard),
                                    NavigationItem("investments", "Holdings", Icons.Filled.BusinessCenter, Icons.Outlined.BusinessCenter),
                                    NavigationItem("currency", "Currency", Icons.Filled.CurrencyExchange, Icons.Outlined.CurrencyExchange),
                                    NavigationItem("funding", "Funding", Icons.Filled.Payments, Icons.Outlined.Payments),
                                    NavigationItem("reports", "Reports", Icons.Filled.BarChart, Icons.Outlined.BarChart),
                                    NavigationItem("settings", "Settings", Icons.Filled.Settings, Icons.Outlined.Settings)
                                )

                                navItems.forEach { item ->
                                    val isSelected = currentTab == item.route && selectedInvestmentId == null
                                    NavigationBarItem(
                                        selected = isSelected,
                                        onClick = {
                                            selectedInvestmentId = null
                                            currentTab = item.route
                                        },
                                        icon = {
                                            Icon(
                                                imageVector = if (isSelected) item.selectedIcon else item.unselectedIcon,
                                                contentDescription = item.label
                                            )
                                        },
                                        label = { Text(item.label, fontSize = 10.sp) },
                                        colors = NavigationBarItemDefaults.colors(
                                            selectedIconColor = EmeraldPrimary,
                                            selectedTextColor = EmeraldPrimary,
                                            indicatorColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)
                                        )
                                    )
                                }
                            }
                        }
                    ) { innerPadding ->
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding)
                        ) {
                            if (selectedInvestment != null) {
                                val recs = monthlyRecords[selectedInvestment.id] ?: emptyList()
                                InvestmentDetailScreen(
                                    investment = selectedInvestment,
                                    monthlyRecords = recs,
                                    profile = userProfile,
                                    rateInfo = rateInfo,
                                    onBack = { selectedInvestmentId = null },
                                    onEditInvestment = {
                                        editingInvestment = selectedInvestment
                                        isAddInvestmentOpen = true
                                    },
                                    onDeleteInvestment = {
                                        coroutineScope.launch {
                                            repository.deleteInvestment(selectedInvestment.id)
                                            selectedInvestmentId = null
                                            Toast.makeText(this@MainActivity, "Investment deleted", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    onAddMonthlyRecord = {
                                        editingMonthlyRecord = null
                                        isAddMonthlyOpen = true
                                    },
                                    onEditMonthlyRecord = { rec ->
                                        editingMonthlyRecord = rec
                                        isAddMonthlyOpen = true
                                    },
                                    onDeleteMonthlyRecord = { recId ->
                                        coroutineScope.launch {
                                            repository.deleteMonthlyRecord(selectedInvestment.id, recId)
                                            Toast.makeText(this@MainActivity, "Record deleted", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                )
                            } else {
                                when (currentTab) {
                                    "dashboard" -> DashboardScreen(
                                        profile = userProfile,
                                        investments = investments,
                                        monthlyRecords = monthlyRecords,
                                        rateInfo = rateInfo,
                                        syncStatus = syncStatus,
                                        onSelectInvestment = { inv -> selectedInvestmentId = inv.id },
                                        onOpenAddInvestment = {
                                            editingInvestment = null
                                            isAddInvestmentOpen = true
                                        },
                                        onOpenAddFunding = {
                                            editingFundingRecord = null
                                            isAddFundingOpen = true
                                        },
                                        onNavigateTab = { tab -> currentTab = tab }
                                    )
                                    "investments" -> InvestmentsScreen(
                                        profile = userProfile,
                                        investments = investments,
                                        monthlyRecords = monthlyRecords,
                                        rateInfo = rateInfo,
                                        onSelectInvestment = { inv -> selectedInvestmentId = inv.id },
                                        onOpenAddInvestment = {
                                            editingInvestment = null
                                            isAddInvestmentOpen = true
                                        }
                                    )
                                    "currency" -> CurrencyScreen(
                                        profile = userProfile,
                                        rateInfo = rateInfo,
                                        onSetMasterCurrency = { curr ->
                                            coroutineScope.launch {
                                                repository.setMasterCurrency(curr)
                                                Toast.makeText(this@MainActivity, "Master currency updated to $curr", Toast.LENGTH_SHORT).show()
                                            }
                                        },
                                        onRefreshRates = {
                                            coroutineScope.launch {
                                                repository.refreshRates()
                                                Toast.makeText(this@MainActivity, "Exchange rates refreshed", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    )
                                    "funding" -> FundingScreen(
                                        profile = userProfile,
                                        fundingRecords = fundingRecords,
                                        investments = investments,
                                        rateInfo = rateInfo,
                                        onOpenAddFunding = {
                                            editingFundingRecord = null
                                            isAddFundingOpen = true
                                        },
                                        onEditFunding = { fund ->
                                            editingFundingRecord = fund
                                            isAddFundingOpen = true
                                        },
                                        onDeleteFunding = { fundId ->
                                            coroutineScope.launch {
                                                repository.deleteFundingRecord(fundId)
                                                Toast.makeText(this@MainActivity, "Funding record deleted", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    )
                                    "reports" -> ReportsScreen(
                                        profile = userProfile,
                                        investments = investments,
                                        monthlyRecords = monthlyRecords,
                                        rateInfo = rateInfo
                                    )
                                    "settings" -> SettingsScreen(
                                        user = currentUser,
                                        profile = userProfile,
                                        themePreference = themePreference,
                                        onUpdateTheme = { newTheme ->
                                            themePreference = newTheme
                                            coroutineScope.launch {
                                                repository.updateProfile(mapOf("themePreference" to newTheme))
                                            }
                                        },
                                        onUpdateProfile = { comp, owner, master, defCountry, defCurr ->
                                            coroutineScope.launch {
                                                repository.updateProfile(
                                                    mapOf(
                                                        "companyName" to comp,
                                                        "ownerName" to owner,
                                                        "masterCurrency" to master,
                                                        "defaultCountry" to defCountry,
                                                        "defaultCurrency" to defCurr
                                                    )
                                                )
                                                Toast.makeText(this@MainActivity, "Preferences saved", Toast.LENGTH_SHORT).show()
                                            }
                                        },
                                        onImportSampleData = {
                                            coroutineScope.launch {
                                                Toast.makeText(this@MainActivity, "Importing sample portfolio data...", Toast.LENGTH_SHORT).show()
                                                repository.importSampleData()
                                                Toast.makeText(this@MainActivity, "Sample data imported successfully!", Toast.LENGTH_SHORT).show()
                                            }
                                        },
                                        onClearAllData = {
                                            coroutineScope.launch {
                                                repository.clearAllData()
                                                Toast.makeText(this@MainActivity, "Portfolio data reset", Toast.LENGTH_SHORT).show()
                                            }
                                        },
                                        onSignOut = {
                                            googleSignInClient.signOut().addOnCompleteListener {
                                                repository.signOut()
                                            }
                                        }
                                    )
                                }
                            }
                        }

                        // Add / Edit Investment Dialog
                        if (isAddInvestmentOpen) {
                            AddInvestmentDialog(
                                initialInvestment = editingInvestment,
                                defaultCurrency = userProfile?.defaultCurrency ?: "SAR",
                                defaultCountry = userProfile?.defaultCountry ?: "Saudi Arabia",
                                onDismiss = {
                                    isAddInvestmentOpen = false
                                    editingInvestment = null
                                },
                                onSave = { name, country, currency, initialCap, startDate, targetPeriod, notes ->
                                    coroutineScope.launch {
                                        val edit = editingInvestment
                                        if (edit == null) {
                                            val newId = repository.addInvestment(
                                                name, country, currency, initialCap, startDate, targetPeriod, notes
                                            )
                                            selectedInvestmentId = newId
                                            Toast.makeText(this@MainActivity, "Investment created", Toast.LENGTH_SHORT).show()
                                        } else {
                                            repository.updateInvestment(
                                                edit.id,
                                                mapOf(
                                                    "name" to name,
                                                    "country" to country,
                                                    "currency" to currency,
                                                    "initialCapital" to initialCap,
                                                    "startDate" to startDate,
                                                    "targetPeriod" to (targetPeriod ?: ""),
                                                    "notes" to (notes ?: "")
                                                )
                                            )
                                            Toast.makeText(this@MainActivity, "Investment updated", Toast.LENGTH_SHORT).show()
                                        }
                                        isAddInvestmentOpen = false
                                        editingInvestment = null
                                    }
                                }
                            )
                        }

                        // Add / Edit Monthly Record Dialog
                        if (isAddMonthlyOpen && selectedInvestment != null) {
                            AddMonthlyRecordDialog(
                                currency = selectedInvestment.currency,
                                initialRecord = editingMonthlyRecord,
                                onDismiss = {
                                    isAddMonthlyOpen = false
                                    editingMonthlyRecord = null
                                },
                                onSave = { month, date, income, expense, addCap, withdr, notes, status ->
                                    coroutineScope.launch {
                                        val edit = editingMonthlyRecord
                                        if (edit == null) {
                                            repository.addMonthlyRecord(
                                                selectedInvestment.id,
                                                month, date, income, expense, addCap, withdr, notes, status
                                            )
                                            Toast.makeText(this@MainActivity, "Monthly record added", Toast.LENGTH_SHORT).show()
                                        } else {
                                            repository.updateMonthlyRecord(
                                                selectedInvestment.id,
                                                edit.id,
                                                mapOf(
                                                    "month" to month,
                                                    "date" to date,
                                                    "income" to income,
                                                    "expense" to expense,
                                                    "additionalCapital" to addCap,
                                                    "withdrawal" to withdr,
                                                    "notes" to (notes ?: ""),
                                                    "status" to (status ?: "")
                                                )
                                            )
                                            Toast.makeText(this@MainActivity, "Record updated", Toast.LENGTH_SHORT).show()
                                        }
                                        isAddMonthlyOpen = false
                                        editingMonthlyRecord = null
                                    }
                                }
                            )
                        }

                        // Add / Edit Funding Record Dialog
                        if (isAddFundingOpen) {
                            AddFundingRecordDialog(
                                investments = investments,
                                defaultCurrency = userProfile?.defaultCurrency ?: "SAR",
                                initialRecord = editingFundingRecord,
                                onDismiss = {
                                    isAddFundingOpen = false
                                    editingFundingRecord = null
                                },
                                onSave = { src, type, amt, curr, date, allocId, allocName, status, notes ->
                                    coroutineScope.launch {
                                        val edit = editingFundingRecord
                                        if (edit == null) {
                                            repository.addFundingRecord(
                                                src, type, amt, curr, date, allocId, allocName, status, notes
                                            )
                                            Toast.makeText(this@MainActivity, "Funding recorded", Toast.LENGTH_SHORT).show()
                                        } else {
                                            repository.updateFundingRecord(
                                                edit.id,
                                                mapOf(
                                                    "source" to src,
                                                    "type" to type,
                                                    "amount" to amt,
                                                    "currency" to curr,
                                                    "date" to date,
                                                    "allocatedInvestmentId" to (allocId ?: ""),
                                                    "allocatedInvestmentName" to (allocName ?: ""),
                                                    "status" to status,
                                                    "notes" to (notes ?: "")
                                                )
                                            )
                                            Toast.makeText(this@MainActivity, "Funding updated", Toast.LENGTH_SHORT).show()
                                        }
                                        isAddFundingOpen = false
                                        editingFundingRecord = null
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

private data class NavigationItem(
    val route: String,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
)
