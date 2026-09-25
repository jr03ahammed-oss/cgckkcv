package com.capitalflow.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.capitalflow.app.data.Calculations
import com.capitalflow.app.data.CurrencyHelper
import com.capitalflow.app.model.*
import com.capitalflow.app.ui.components.*
import com.capitalflow.app.ui.theme.*

@Composable
fun DashboardScreen(
    profile: UserProfile?,
    investments: List<Investment>,
    monthlyRecords: Map<String, List<MonthlyRecord>>,
    rateInfo: CurrencyRateInfo,
    syncStatus: SyncStatus,
    onSelectInvestment: (Investment) -> Unit,
    onOpenAddInvestment: () -> Unit,
    onOpenAddFunding: () -> Unit,
    onNavigateTab: (String) -> Unit
) {
    val masterCurr = profile?.masterCurrency ?: "SAR"
    val summary = remember(investments, monthlyRecords, masterCurr, rateInfo) {
        Calculations.calculatePortfolioSummary(investments, monthlyRecords, masterCurr, rateInfo)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Header Banner
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = profile?.companyName ?: "Vayxon Capital",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Master Portfolio Dashboard",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }

                        SyncStatusChip(status = syncStatus)
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Master currency badge
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(EmeraldLight)
                                .clickable { onNavigateTab("currency") }
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = "${CurrencyHelper.getCurrencyFlag(masterCurr)} Reporting: $masterCurr",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = EmeraldBadgeText
                            )
                            Icon(
                                imageVector = Icons.Default.ArrowDropDown,
                                contentDescription = null,
                                tint = EmeraldBadgeText,
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        Text(
                            text = "Rate Base: ${rateInfo.base} (${rateInfo.date.ifBlank { "Live" }})",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }
            }
        }

        // 2. Capital Recovery Progress Bar
        item {
            CapitalRecoveryProgressBar(
                percentage = summary.recoveryPercentage,
                recoveredFormatted = CurrencyHelper.formatCompactCurrency(summary.capitalRecovered, masterCurr),
                totalFormatted = CurrencyHelper.formatCompactCurrency(summary.totalInvestedCapital, masterCurr),
                status = summary.recoveryStatus
            )
        }

        // 3. KPI Grid (2 columns)
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    SummaryKpiCard(
                        title = "TOTAL INVESTED",
                        value = CurrencyHelper.formatCurrency(summary.totalInvestedCapital, masterCurr),
                        subtitle = "${summary.activeInvestmentsCount} active holdings",
                        icon = Icons.Default.AccountBalanceWallet,
                        iconColor = Color(0xFF2563EB),
                        modifier = Modifier.weight(1f)
                    )
                    SummaryKpiCard(
                        title = "TOTAL RETURN",
                        value = CurrencyHelper.formatCurrency(summary.totalReturn, masterCurr),
                        subtitle = "Gross revenue & distributions",
                        icon = Icons.Default.Savings,
                        iconColor = EmeraldPrimary,
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    SummaryKpiCard(
                        title = "NET PROFIT",
                        value = CurrencyHelper.formatCurrency(summary.netProfit, masterCurr),
                        subtitle = "ROI: ${String.format(java.util.Locale.US, "%.1f", summary.roi)}%",
                        icon = Icons.Default.TrendingUp,
                        iconColor = if (summary.netProfit >= 0) StatusGreen else StatusRed,
                        modifier = Modifier.weight(1f)
                    )
                    SummaryKpiCard(
                        title = "REMAINING CAPITAL",
                        value = CurrencyHelper.formatCurrency(summary.remainingCapital, masterCurr),
                        subtitle = "To reach full breakeven",
                        icon = Icons.Default.HourglassTop,
                        iconColor = StatusAmber,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // 4. Quick Action Triggers
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                QuickActionButton(
                    icon = Icons.Default.Add,
                    label = "Add Holding",
                    onClick = onOpenAddInvestment,
                    modifier = Modifier.weight(1f)
                )
                QuickActionButton(
                    icon = Icons.Default.Payments,
                    label = "Add Funding",
                    onClick = onOpenAddFunding,
                    modifier = Modifier.weight(1f)
                )
                QuickActionButton(
                    icon = Icons.Default.CurrencyExchange,
                    label = "Currencies",
                    onClick = { onNavigateTab("currency") },
                    modifier = Modifier.weight(1f)
                )
                QuickActionButton(
                    icon = Icons.Default.BarChart,
                    label = "Reports",
                    onClick = { onNavigateTab("reports") },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // 5. Holdings Section Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Active Portfolio Holdings",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Text(
                    text = "View All (${investments.size})",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = EmeraldPrimary,
                    modifier = Modifier.clickable { onNavigateTab("investments") }
                )
            }
        }

        // 6. Investments List items
        if (investments.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.FolderOpen,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                            modifier = Modifier.size(40.dp)
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "No Investments Added Yet",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Tap 'Add Holding' above to record your first venture or contract.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                }
            }
        } else {
            items(investments.take(5)) { inv ->
                val records = monthlyRecords[inv.id] ?: emptyList()
                val fin = remember(inv, records, masterCurr, rateInfo) {
                    Calculations.calculateInvestmentFinancials(inv, records, masterCurr, rateInfo)
                }

                InvestmentCardItem(
                    investment = inv,
                    financials = fin,
                    masterCurrency = masterCurr,
                    onClick = { onSelectInvestment(inv) }
                )
            }
        }
    }
}

@Composable
private fun QuickActionButton(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .padding(vertical = 12.dp, horizontal = 4.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(EmeraldLight),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = EmeraldPrimary,
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@Composable
fun InvestmentCardItem(
    investment: Investment,
    financials: InvestmentFinancials,
    masterCurrency: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = CurrencyHelper.getCurrencyFlag(investment.currency),
                        fontSize = 20.sp
                    )
                    Column {
                        Text(
                            text = investment.name,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "${investment.country} • ${investment.currency} ${if (investment.targetPeriod != null) "• " + investment.targetPeriod else ""}",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                        )
                    }
                }

                FinancialBadge(status = financials.status)
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Invested Capital",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                    )
                    Text(
                        text = CurrencyHelper.formatCurrency(financials.totalInvestedCapital, investment.currency),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (investment.currency != masterCurrency) {
                        Text(
                            text = "≈ ${CurrencyHelper.formatCurrency(financials.convertedTotalInvested, masterCurrency)}",
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f)
                        )
                    }
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Net Profit (ROI)",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                    )
                    Text(
                        text = "${CurrencyHelper.formatCurrency(financials.netProfit, investment.currency)} (${String.format(java.util.Locale.US, "%.1f", financials.roi)}%)",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (financials.netProfit >= 0) StatusGreen else StatusRed
                    )
                    Text(
                        text = "${String.format(java.util.Locale.US, "%.1f", financials.recoveryPercentage)}% recovered",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f)
                    )
                }
            }
        }
    }
}
