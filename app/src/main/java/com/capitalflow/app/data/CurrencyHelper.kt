package com.capitalflow.app.data

import android.content.Context
import com.capitalflow.app.model.CurrencyMeta
import com.capitalflow.app.model.CurrencyRateInfo
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.text.DecimalFormat
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit
import kotlin.math.abs

object CurrencyHelper {

    val SUPPORTED_CURRENCIES: List<CurrencyMeta> = listOf(
        CurrencyMeta("SAR", "Saudi Riyal", "SAR", "🇸🇦", "Saudi Arabia", "SA"),
        CurrencyMeta("USD", "US Dollar", "$", "🇺🇸", "United States", "US"),
        CurrencyMeta("EUR", "Euro", "€", "🇪🇺", "Europe (Eurozone)", "EU"),
        CurrencyMeta("GBP", "British Pound", "£", "🇬🇧", "United Kingdom", "GB"),
        CurrencyMeta("BDT", "Bangladeshi Taka", "BDT", "🇧🇩", "Bangladesh", "BD"),
        CurrencyMeta("INR", "Indian Rupee", "INR", "🇮🇳", "India", "IN"),
        CurrencyMeta("PKR", "Pakistani Rupee", "PKR", "🇵🇰", "Pakistan", "PK"),
        CurrencyMeta("AED", "UAE Dirham", "AED", "🇦🇪", "United Arab Emirates", "AE"),
        CurrencyMeta("QAR", "Qatari Riyal", "QAR", "🇶🇦", "Qatar", "QA"),
        CurrencyMeta("KWD", "Kuwaiti Dinar", "KWD", "🇰🇼", "Kuwait", "KW"),
        CurrencyMeta("CAD", "Canadian Dollar", "CA$", "🇨🇦", "Canada", "CA"),
        CurrencyMeta("AUD", "Australian Dollar", "A$", "🇦🇺", "Australia", "AU"),
        CurrencyMeta("JPY", "Japanese Yen", "¥", "🇯🇵", "Japan", "JP"),
        CurrencyMeta("CHF", "Swiss Franc", "CHF", "🇨🇭", "Switzerland", "CH"),
        CurrencyMeta("CNY", "Chinese Yuan", "¥", "🇨🇳", "China", "CN"),
        CurrencyMeta("SGD", "Singapore Dollar", "S$", "🇸🇬", "Singapore", "SG"),
        CurrencyMeta("MYR", "Malaysian Ringgit", "RM", "🇲🇾", "Malaysia", "MY"),
        CurrencyMeta("TRY", "Turkish Lira", "₺", "🇹🇷", "Turkey", "TR")
    )

    val FALLBACK_USD_RATES: Map<String, Double> = mapOf(
        "USD" to 1.0,
        "SAR" to 3.75,
        "BDT" to 122.8,
        "INR" to 86.8,
        "PKR" to 278.5,
        "EUR" to 0.92,
        "GBP" to 0.79,
        "AED" to 3.67,
        "QAR" to 3.64,
        "KWD" to 0.31,
        "CAD" to 1.41,
        "AUD" to 1.55,
        "JPY" to 154.2,
        "CHF" to 0.88,
        "CNY" to 7.24,
        "SGD" to 1.34,
        "MYR" to 4.45,
        "TRY" to 35.8
    )

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .build()

    private const val PREFS_NAME = "capitalflow_currency_prefs"
    private const val CACHE_KEY = "cached_rate_info"

    fun getCurrencyMeta(code: String): CurrencyMeta? {
        return SUPPORTED_CURRENCIES.find { it.code.equals(code, ignoreCase = true) }
    }

    fun getCurrencyFlag(code: String): String {
        return getCurrencyMeta(code)?.flag ?: "🌐"
    }

    fun getCurrencySymbol(code: String): String {
        return getCurrencyMeta(code)?.symbol ?: code
    }

    fun getCurrencyDisplayRow(code: String): String {
        val meta = getCurrencyMeta(code) ?: return code
        return "${meta.flag} ${meta.code} — ${meta.name} (${meta.country})"
    }

    fun getExchangeRate(
        fromCurrency: String,
        toCurrency: String,
        rates: Map<String, Double> = FALLBACK_USD_RATES
    ): Double {
        if (fromCurrency.equals(toCurrency, ignoreCase = true)) return 1.0
        val fromRate = rates[fromCurrency.uppercase()] ?: FALLBACK_USD_RATES[fromCurrency.uppercase()] ?: 1.0
        val toRate = rates[toCurrency.uppercase()] ?: FALLBACK_USD_RATES[toCurrency.uppercase()] ?: 1.0
        return if (fromRate > 0.0) toRate / fromRate else 1.0
    }

    fun convertCurrency(
        amount: Double,
        fromCurrency: String,
        toCurrency: String,
        rates: Map<String, Double> = FALLBACK_USD_RATES
    ): Double {
        if (fromCurrency.equals(toCurrency, ignoreCase = true)) return amount
        val rate = getExchangeRate(fromCurrency, toCurrency, rates)
        return amount * rate
    }

    fun formatCurrency(
        amount: Double,
        currencyCode: String = "SAR",
        showSymbol: Boolean = true,
        showCode: Boolean = false,
        decimals: Int = 2
    ): String {
        val safeCurrency = if (currencyCode.isBlank()) "SAR" else currencyCode.uppercase()
        val symbol = getCurrencySymbol(safeCurrency)
        val absAmount = abs(amount)

        val pattern = if (decimals > 0) "#,##0." + "0".repeat(decimals) else "#,##0"
        val df = DecimalFormat(pattern, java.text.DecimalFormatSymbols(Locale.US))
        val formattedNum = df.format(absAmount)
        val sign = if (amount < 0) "-" else ""

        return when {
            showCode -> "$sign$formattedNum $safeCurrency"
            showSymbol -> {
                if (symbol.length > 1) "$sign$symbol $formattedNum" else "$sign$symbol$formattedNum"
            }
            else -> "$sign$formattedNum"
        }
    }

    fun formatCompactCurrency(
        amount: Double,
        currencyCode: String = "SAR"
    ): String {
        val safeCurrency = if (currencyCode.isBlank()) "SAR" else currencyCode.uppercase()
        val symbol = getCurrencySymbol(safeCurrency)
        val sign = if (amount < 0) "-" else ""
        val absAmount = abs(amount)

        val formatted = when {
            absAmount >= 1_000_000_000.0 -> String.format(Locale.US, "%.1fB", absAmount / 1_000_000_000.0)
            absAmount >= 1_000_000.0 -> String.format(Locale.US, "%.1fM", absAmount / 1_000_000.0)
            absAmount >= 100_000.0 -> String.format(Locale.US, "%.0fk", absAmount / 1_000.0)
            absAmount >= 10_000.0 -> String.format(Locale.US, "%,.0f", absAmount)
            else -> String.format(Locale.US, "%,.1f", absAmount)
        }

        return if (symbol.length > 1) "$sign$symbol $formatted" else "$sign$symbol$formatted"
    }

    suspend fun fetchExchangeRates(context: Context? = null): CurrencyRateInfo = withContext(Dispatchers.IO) {
        val prefs = context?.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val gson = Gson()

        // Check local cache within 4 hours
        if (prefs != null) {
            val cachedJson = prefs.getString(CACHE_KEY, null)
            if (cachedJson != null) {
                try {
                    val cached = gson.fromJson(cachedJson, CurrencyRateInfo::class.java)
                    if (System.currentTimeMillis() - cached.lastFetched < 4 * 60 * 60 * 1000) {
                        return@withContext cached
                    }
                } catch (_: Exception) { }
            }
        }

        // Try Open Exchange Rates feed
        try {
            val request = Request.Builder()
                .url("https://open.er-api.com/v6/latest/USD")
                .build()
            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string()
                if (body != null) {
                    val jsonMap = gson.fromJson(body, Map::class.java)
                    val ratesMap = (jsonMap["rates"] as? Map<*, *>) ?: emptyMap<Any, Any>()
                    val parsedRates = mutableMapOf<String, Double>()
                    parsedRates.putAll(FALLBACK_USD_RATES)
                    for ((k, v) in ratesMap) {
                        val key = k.toString().uppercase()
                        val num = (v as? Number)?.toDouble()
                        if (num != null) {
                            parsedRates[key] = num
                        }
                    }

                    val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
                    val rateInfo = CurrencyRateInfo(
                        base = "USD",
                        date = today,
                        source = "Open Exchange Rates API",
                        rates = parsedRates,
                        lastFetched = System.currentTimeMillis(),
                        isFallback = false
                    )

                    prefs?.edit()?.putString(CACHE_KEY, gson.toJson(rateInfo))?.apply()
                    return@withContext rateInfo
                }
            }
        } catch (_: Exception) { }

        // Fallback to cached or hardcoded baseline
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        CurrencyRateInfo(
            base = "USD",
            date = today,
            source = "Cached Baseline Rates (Offline Mode)",
            rates = FALLBACK_USD_RATES,
            lastFetched = System.currentTimeMillis(),
            isFallback = true
        )
    }
}
