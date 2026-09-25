package com.capitalflow.app.model

data class UserProfile(
    val id: String = "",
    val email: String = "",
    val companyName: String = "Vayxon Capital",
    val ownerName: String = "",
    val photoURL: String = "",
    val masterCurrency: String = "SAR",
    val defaultCountry: String = "Saudi Arabia",
    val defaultCurrency: String = "SAR",
    val notificationReminder: Boolean = true,
    val reminderDay: Int = 1,
    val reminderTime: String = "09:00",
    val themePreference: String = "system", // "light" | "dark" | "system"
    val permanentUrl: String = "",
    val createdAt: String = "",
    val updatedAt: String = ""
)

enum class FundingType(val displayName: String) {
    CAPITAL_INJECTION("Capital Injection"),
    PARTNER_CONTRIBUTION("Partner Contribution"),
    REINVESTED_RETURNS("Reinvested Returns"),
    DEBT_CREDIT_FACILITY("Debt / Credit Facility"),
    CAPITAL_DISTRIBUTION("Capital Distribution"),
    WITHDRAWAL("Withdrawal");

    companion object {
        fun fromString(value: String): FundingType {
            return entries.find { it.displayName.equals(value, ignoreCase = true) } ?: CAPITAL_INJECTION
        }
    }
}

enum class FundingStatus(val displayName: String) {
    COMPLETED("Completed"),
    COMMITTED("Committed"),
    PENDING("Pending");

    companion object {
        fun fromString(value: String): FundingStatus {
            return entries.find { it.displayName.equals(value, ignoreCase = true) } ?: COMPLETED
        }
    }
}

data class FundingRecord(
    val id: String = "",
    val userId: String = "",
    val source: String = "",
    val type: String = "Capital Injection",
    val amount: Double = 0.0,
    val currency: String = "SAR",
    val date: String = "",
    val allocatedInvestmentId: String? = null,
    val allocatedInvestmentName: String? = null,
    val status: String = "Completed",
    val notes: String? = null,
    val createdAt: String = "",
    val updatedAt: String = ""
)

data class SourceBreakdown(
    val source: String,
    val totalAmountMaster: Double,
    val count: Int,
    val sharePercent: Double
)

data class FundingSummary(
    val totalFundedMaster: Double = 0.0,
    val totalAllocatedMaster: Double = 0.0,
    val unallocatedReserveMaster: Double = 0.0,
    val totalDistributedMaster: Double = 0.0,
    val sourceBreakdown: List<SourceBreakdown> = emptyList()
)

data class Investment(
    val id: String = "",
    val userId: String = "",
    val name: String = "",
    val country: String = "Saudi Arabia",
    val currency: String = "SAR",
    val initialCapital: Double = 0.0,
    val startDate: String = "",
    val targetPeriod: String? = null,
    val notes: String? = null,
    val createdAt: String = "",
    val updatedAt: String = ""
)

data class MonthlyRecord(
    val id: String = "",
    val userId: String = "",
    val investmentId: String = "",
    val month: String = "",
    val date: String = "",
    val income: Double = 0.0,
    val expense: Double = 0.0,
    val additionalCapital: Double = 0.0,
    val withdrawal: Double = 0.0,
    val notes: String? = null,
    val status: String? = null,
    val exchangeRate: Double? = null,
    val exchangeRateDate: String? = null,
    val createdAt: String = "",
    val updatedAt: String = ""
)

data class ComputedMonthlyRecord(
    val record: MonthlyRecord,
    val netProfit: Double,
    val remainingCapitalAfter: Double,
    val monthlyRoi: Double
)

enum class CapitalRecoveryStatus(val label: String) {
    IN_PROGRESS("Capital Recovery in Progress"),
    RECOVERED("Capital Recovered"),
    PROFIT_PHASE("Profit Phase")
}

enum class InvestmentFinancialStatus(val label: String) {
    AWAITING_CAPITAL("Awaiting Capital"),
    NO_ACTIVITY("No Activity"),
    PROFIT_GENERATED("Profit Generated"),
    OPERATING_AT_LOSS("Operating at Loss"),
    BREAK_EVEN("Break-even"),
    TARGET_APPROACHING("Target Period Approaching"),
    TARGET_MISSED("Target Period Missed")
}

data class InvestmentFinancials(
    val initialCapital: Double,
    val additionalCapital: Double,
    val withdrawals: Double,
    val totalInvestedCapital: Double,
    val totalReturn: Double,
    val totalExpense: Double,
    val netProfit: Double,
    val roi: Double,
    val capitalRecovered: Double,
    val remainingCapital: Double,
    val recoveryPercentage: Double,
    val recoveryStatus: CapitalRecoveryStatus,
    val status: InvestmentFinancialStatus,
    val rateToMaster: Double,
    val rateDate: String,
    val rateSource: String,
    val isCachedRate: Boolean,
    val convertedTotalInvested: Double,
    val convertedTotalReturn: Double,
    val convertedTotalExpense: Double,
    val convertedNetProfit: Double,
    val convertedCapitalRecovered: Double,
    val convertedRemainingCapital: Double
)

data class PortfolioSummary(
    val masterCurrency: String = "SAR",
    val totalInvestedCapital: Double = 0.0,
    val totalReturn: Double = 0.0,
    val totalExpense: Double = 0.0,
    val netProfit: Double = 0.0,
    val roi: Double = 0.0,
    val capitalRecovered: Double = 0.0,
    val remainingCapital: Double = 0.0,
    val recoveryPercentage: Double = 0.0,
    val recoveryStatus: CapitalRecoveryStatus = CapitalRecoveryStatus.IN_PROGRESS,
    val activeInvestmentsCount: Int = 0
)

enum class SyncStatus {
    SYNCED,
    SYNCING,
    OFFLINE,
    ERROR
}

data class CurrencyMeta(
    val code: String,
    val name: String,
    val symbol: String,
    val flag: String,
    val country: String,
    val countryCode: String
)

data class CurrencyRateInfo(
    val base: String = "USD",
    val date: String = "",
    val source: String = "Baseline Rates",
    val rates: Map<String, Double> = emptyMap(),
    val lastFetched: Long = 0L,
    val isFallback: Boolean = false
)
