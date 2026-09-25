package com.capitalflow.app.data

import com.capitalflow.app.model.*
import java.text.SimpleDateFormat
import java.util.Locale
import kotlin.math.max
import kotlin.math.min

object Calculations {

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    /**
     * Computes running spreadsheet values for an investment.
     */
    fun computeMonthlyRecords(
        investment: Investment,
        records: List<MonthlyRecord>
    ): List<ComputedMonthlyRecord> {
        val sorted = records.sortedBy { rec ->
            try {
                dateFormat.parse(rec.date)?.time ?: 0L
            } catch (_: Exception) {
                0L
            }
        }

        var cumulativeCapital = investment.initialCapital
        var cumulativeRecovered = 0.0

        return sorted.map { rec ->
            val netProfit = rec.income - rec.expense
            cumulativeCapital += rec.additionalCapital - rec.withdrawal
            cumulativeRecovered += rec.income

            val remainingCapitalAfter = max(0.0, cumulativeCapital - cumulativeRecovered)
            val monthlyRoi = if (cumulativeCapital > 0.0) (netProfit / cumulativeCapital) * 100.0 else 0.0

            ComputedMonthlyRecord(
                record = rec,
                netProfit = netProfit,
                remainingCapitalAfter = remainingCapitalAfter,
                monthlyRoi = monthlyRoi
            )
        }
    }

    /**
     * Calculates dynamic financials for a single investment.
     */
    fun calculateInvestmentFinancials(
        investment: Investment,
        records: List<MonthlyRecord>,
        masterCurrency: String,
        rateInfo: CurrencyRateInfo
    ): InvestmentFinancials {
        val initialCapital = investment.initialCapital
        var additionalCapital = 0.0
        var withdrawals = 0.0
        var totalReturn = 0.0
        var totalExpense = 0.0

        records.forEach { rec ->
            additionalCapital += rec.additionalCapital
            withdrawals += rec.withdrawal
            totalReturn += rec.income
            totalExpense += rec.expense
        }

        val totalInvestedCapital = initialCapital + additionalCapital - withdrawals
        val netProfit = totalReturn - totalExpense
        val roi = if (totalInvestedCapital > 0.0) (netProfit / totalInvestedCapital) * 100.0 else 0.0

        val capitalRecovered = totalReturn
        val remainingCapital = max(0.0, totalInvestedCapital - capitalRecovered)

        val recoveryPercentage = if (totalInvestedCapital > 0.0) {
            min(100.0, max(0.0, (capitalRecovered / totalInvestedCapital) * 100.0))
        } else {
            0.0
        }

        var recoveryStatus = CapitalRecoveryStatus.IN_PROGRESS
        if (totalInvestedCapital > 0.0 && capitalRecovered >= totalInvestedCapital) {
            recoveryStatus = if (netProfit > 0.0) {
                CapitalRecoveryStatus.PROFIT_PHASE
            } else {
                CapitalRecoveryStatus.RECOVERED
            }
        }

        var status = InvestmentFinancialStatus.NO_ACTIVITY
        if (totalInvestedCapital == 0.0 && records.isEmpty()) {
            status = InvestmentFinancialStatus.AWAITING_CAPITAL
        } else if (records.isEmpty()) {
            status = InvestmentFinancialStatus.NO_ACTIVITY
        } else if (netProfit > 0.0) {
            status = InvestmentFinancialStatus.PROFIT_GENERATED
        } else if (netProfit < 0.0) {
            status = InvestmentFinancialStatus.OPERATING_AT_LOSS
        } else if (netProfit == 0.0 && (totalReturn > 0.0 || totalExpense > 0.0)) {
            status = InvestmentFinancialStatus.BREAK_EVEN
        }

        // Target period check
        val targetPeriod = investment.targetPeriod
        val startDateStr = investment.startDate
        if (!targetPeriod.isNullOrBlank() && startDateStr.isNotBlank()) {
            try {
                val start = dateFormat.parse(startDateStr)?.time
                if (start != null) {
                    val now = System.currentTimeMillis()
                    val regex = Regex("""(\d+)\s*(month|year)""", RegexOption.IGNORE_CASE)
                    val match = regex.find(targetPeriod)
                    if (match != null) {
                        val num = match.groupValues[1].toIntOrNull() ?: 0
                        val isYear = match.groupValues[2].startsWith("year", ignoreCase = true)
                        val targetMonths = if (isYear) num * 12 else num
                        val targetEndDate = start + (targetMonths * 30.4375 * 24 * 60 * 60 * 1000).toLong()
                        val daysLeft = (targetEndDate - now) / (1000.0 * 60 * 60 * 24)

                        if (daysLeft < 0 && recoveryStatus != CapitalRecoveryStatus.RECOVERED && recoveryStatus != CapitalRecoveryStatus.PROFIT_PHASE) {
                            status = InvestmentFinancialStatus.TARGET_MISSED
                        } else if (daysLeft in 0.0..60.0 && recoveryStatus == CapitalRecoveryStatus.IN_PROGRESS) {
                            status = InvestmentFinancialStatus.TARGET_APPROACHING
                        }
                    }
                }
            } catch (_: Exception) { }
        }

        // Currency conversions
        val rateToMaster = CurrencyHelper.getExchangeRate(investment.currency, masterCurrency, rateInfo.rates)
        val convertedTotalInvested = CurrencyHelper.convertCurrency(totalInvestedCapital, investment.currency, masterCurrency, rateInfo.rates)
        val convertedTotalReturn = CurrencyHelper.convertCurrency(totalReturn, investment.currency, masterCurrency, rateInfo.rates)
        val convertedTotalExpense = CurrencyHelper.convertCurrency(totalExpense, investment.currency, masterCurrency, rateInfo.rates)
        val convertedNetProfit = CurrencyHelper.convertCurrency(netProfit, investment.currency, masterCurrency, rateInfo.rates)
        val convertedCapitalRecovered = CurrencyHelper.convertCurrency(capitalRecovered, investment.currency, masterCurrency, rateInfo.rates)
        val convertedRemainingCapital = CurrencyHelper.convertCurrency(remainingCapital, investment.currency, masterCurrency, rateInfo.rates)

        return InvestmentFinancials(
            initialCapital = initialCapital,
            additionalCapital = additionalCapital,
            withdrawals = withdrawals,
            totalInvestedCapital = totalInvestedCapital,
            totalReturn = totalReturn,
            totalExpense = totalExpense,
            netProfit = netProfit,
            roi = roi,
            capitalRecovered = capitalRecovered,
            remainingCapital = remainingCapital,
            recoveryPercentage = recoveryPercentage,
            recoveryStatus = recoveryStatus,
            status = status,
            rateToMaster = rateToMaster,
            rateDate = rateInfo.date,
            rateSource = rateInfo.source,
            isCachedRate = rateInfo.isFallback,
            convertedTotalInvested = convertedTotalInvested,
            convertedTotalReturn = convertedTotalReturn,
            convertedTotalExpense = convertedTotalExpense,
            convertedNetProfit = convertedNetProfit,
            convertedCapitalRecovered = convertedCapitalRecovered,
            convertedRemainingCapital = convertedRemainingCapital
        )
    }

    /**
     * Consolidates all portfolio assets into Master Currency.
     */
    fun calculatePortfolioSummary(
        investments: List<Investment>,
        recordsByInvestment: Map<String, List<MonthlyRecord>>,
        masterCurrency: String,
        rateInfo: CurrencyRateInfo
    ): PortfolioSummary {
        var totalInvestedCapital = 0.0
        var totalReturn = 0.0
        var totalExpense = 0.0
        var netProfit = 0.0
        var capitalRecovered = 0.0
        var remainingCapital = 0.0

        investments.forEach { inv ->
            val records = recordsByInvestment[inv.id] ?: emptyList()
            val fin = calculateInvestmentFinancials(inv, records, masterCurrency, rateInfo)

            totalInvestedCapital += fin.convertedTotalInvested
            totalReturn += fin.convertedTotalReturn
            totalExpense += fin.convertedTotalExpense
            netProfit += fin.convertedNetProfit
            capitalRecovered += fin.convertedCapitalRecovered
            remainingCapital += fin.convertedRemainingCapital
        }

        val roi = if (totalInvestedCapital > 0.0) (netProfit / totalInvestedCapital) * 100.0 else 0.0
        val recoveryPercentage = if (totalInvestedCapital > 0.0) {
            min(100.0, max(0.0, (capitalRecovered / totalInvestedCapital) * 100.0))
        } else {
            0.0
        }

        var recoveryStatus = CapitalRecoveryStatus.IN_PROGRESS
        if (totalInvestedCapital > 0.0 && capitalRecovered >= totalInvestedCapital) {
            recoveryStatus = if (netProfit > 0.0) {
                CapitalRecoveryStatus.PROFIT_PHASE
            } else {
                CapitalRecoveryStatus.RECOVERED
            }
        }

        return PortfolioSummary(
            masterCurrency = masterCurrency,
            totalInvestedCapital = totalInvestedCapital,
            totalReturn = totalReturn,
            totalExpense = totalExpense,
            netProfit = netProfit,
            roi = roi,
            capitalRecovered = capitalRecovered,
            remainingCapital = remainingCapital,
            recoveryPercentage = recoveryPercentage,
            recoveryStatus = recoveryStatus,
            activeInvestmentsCount = investments.size
        )
    }

    /**
     * Calculates funding summary and source breakdowns.
     */
    fun calculateFundingSummary(
        records: List<FundingRecord>,
        masterCurrency: String,
        rateInfo: CurrencyRateInfo
    ): FundingSummary {
        var totalFunded = 0.0
        var totalAllocated = 0.0
        var totalDistributed = 0.0

        val sourceTotals = mutableMapOf<String, Pair<Double, Int>>()

        records.forEach { rec ->
            val convertedAmount = CurrencyHelper.convertCurrency(rec.amount, rec.currency, masterCurrency, rateInfo.rates)
            val type = rec.type.lowercase()

            if (type.contains("distribution") || type.contains("withdrawal")) {
                totalDistributed += convertedAmount
            } else {
                totalFunded += convertedAmount
                if (!rec.allocatedInvestmentId.isNullOrBlank()) {
                    totalAllocated += convertedAmount
                }

                val current = sourceTotals[rec.source] ?: Pair(0.0, 0)
                sourceTotals[rec.source] = Pair(current.first + convertedAmount, current.second + 1)
            }
        }

        val unallocatedReserve = max(0.0, totalFunded - totalAllocated - totalDistributed)

        val breakdown = sourceTotals.map { (source, pair) ->
            val share = if (totalFunded > 0.0) (pair.first / totalFunded) * 100.0 else 0.0
            SourceBreakdown(
                source = source,
                totalAmountMaster = pair.first,
                count = pair.second,
                sharePercent = share
            )
        }.sortedByDescending { it.totalAmountMaster }

        return FundingSummary(
            totalFundedMaster = totalFunded,
            totalAllocatedMaster = totalAllocated,
            unallocatedReserveMaster = unallocatedReserve,
            totalDistributedMaster = totalDistributed,
            sourceBreakdown = breakdown
        )
    }
}
