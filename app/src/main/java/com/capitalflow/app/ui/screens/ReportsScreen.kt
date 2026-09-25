package com.capitalflow.app.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.capitalflow.app.data.Calculations
import com.capitalflow.app.data.CurrencyHelper
import com.capitalflow.app.model.*
import com.capitalflow.app.ui.components.CapitalRecoveryProgressBar
import com.capitalflow.app.ui.components.SummaryKpiCard
import com.capitalflow.app.ui.theme.*

@Composable
fun ReportsScreen(
    profile: UserProfile?,
    investments: List<Investment>,
    monthlyRecords: Map<String, List<MonthlyRecord>>,
    rateInfo: CurrencyRateInfo
) {
    val context = LocalContext.current
    val masterCurr = profile?.masterCurrency ?: "SAR"
    val summary = remember(investments, monthlyRecords, masterCurr, rateInfo) {
        Calculations.calculatePortfolioSummary(investments, monthlyRecords, masterCurr, rateInfo)
    }

    val investmentFinList = remember(investments, monthlyRecords, masterCurr, rateInfo) {
        investments.map { inv ->
            val recs = monthlyRecords[inv.id] ?: emptyList()
            Pair(inv, Calculations.calculateInvestmentFinancials(inv, recs, masterCurr, rateInfo))
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Portfolio Intelligence Report",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = "Executive performance metrics & consolidation",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                    )
                }

                IconButton(
                    onClick = {
                        val shareText = buildString {
                            appendLine("📊 ${profile?.companyName ?: "Vayxon Capital"} — Portfolio Summary")
                            appendLine("Reporting Currency: $masterCurr")
                            appendLine("Total Invested: ${CurrencyHelper.formatCurrency(summary.totalInvestedCapital, masterCurr)}")
                            appendLine("Total Returns: ${CurrencyHelper.formatCurrency(summary.totalReturn, masterCurr)}")
                            appendLine("Net Profit: ${CurrencyHelper.formatCurrency(summary.netProfit, masterCurr)} (${String.format(java.util.Locale.US, "%.1f", summary.roi)}% ROI)")
                            appendLine("Capital Recovered: ${CurrencyHelper.formatCurrency(summary.capitalRecovered, masterCurr)} (${String.format(java.util.Locale.US, "%.1f", summary.recoveryPercentage)}%)")
                            appendLine("Remaining Capital: ${CurrencyHelper.formatCurrency(summary.remainingCapital, masterCurr)}")
                            appendLine("Active Holdings: ${summary.activeInvestmentsCount}")
                            appendLine()
                            appendLine("Holdings Breakdown:")
                            investmentFinList.forEach { (inv, fin) ->
                                appendLine("• ${inv.name} (${inv.country}): Invested ${CurrencyHelper.formatCurrency(fin.totalInvestedCapital, inv.currency)} | ROI ${String.format(java.util.Locale.US, "%.1f", fin.roi)}% | ${fin.recoveryStatus.label}")
                            }
                        }
                        val intent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_SUBJECT, "CapitalFlow Portfolio Report")
                            putExtra(Intent.EXTRA_TEXT, shareText)
                        }
                        context.startActivity(Intent.createChooser(intent, "Share Portfolio Report"))
                    }
                ) {
                    Icon(imageVector = Icons.Default.Share, contentDescription = "Share Report", tint = EmeraldPrimary)
                }
            }
        }

        // Executive KPI Cards
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    SummaryKpiCard(
                        title = "TOTAL CAPITAL",
                        value = CurrencyHelper.formatCurrency(summary.totalInvestedCapital, masterCurr),
                        subtitle = "${investments.size} venture contracts",
                        icon = Icons.Default.AccountBalance,
                        modifier = Modifier.weight(1f)
                    )
                    SummaryKpiCard(
                        title = "NET PORTFOLIO GAIN",
                        value = CurrencyHelper.formatCurrency(summary.netProfit, masterCurr),
                        subtitle = "Overall ROI: ${String.format(java.util.Locale.US, "%.1f", summary.roi)}%",
                        icon = Icons.Default.TrendingUp,
                        iconColor = if (summary.netProfit >= 0) StatusGreen else StatusRed,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Recovery Progress
        item {
            CapitalRecoveryProgressBar(
                percentage = summary.recoveryPercentage,
                recoveredFormatted = CurrencyHelper.formatCurrency(summary.capitalRecovered, masterCurr),
                totalFormatted = CurrencyHelper.formatCurrency(summary.totalInvestedCapital, masterCurr),
                status = summary.recoveryStatus
            )
        }

        // Breakdown List Header
        item {
            Text(
                text = "Holdings Performance Matrix",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        // Performance Rows
        items(investmentFinList) { (inv, fin) ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(text = CurrencyHelper.getCurrencyFlag(inv.currency), fontSize = 20.sp)
                            Column {
                                Text(
                                    text = inv.name,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "${inv.country} • ${inv.currency}",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                                )
                            }
                        }

                        Text(
                            text = "${String.format(java.util.Locale.US, "%.1f", fin.roi)}% ROI",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (fin.netProfit >= 0) StatusGreen else StatusRed
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Invested Deployed", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                            Text(
                                CurrencyHelper.formatCurrency(fin.totalInvestedCapital, inv.currency),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Total Returns", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                            Text(
                                CurrencyHelper.formatCurrency(fin.totalReturn, inv.currency),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = StatusGreen
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text("Net in $masterCurr", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                            Text(
                                CurrencyHelper.formatCurrency(fin.convertedNetProfit, masterCurr),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (fin.convertedNetProfit >= 0) StatusGreen else StatusRed
                            )
                        }
                    }
                }
            }
        }
    }
}
