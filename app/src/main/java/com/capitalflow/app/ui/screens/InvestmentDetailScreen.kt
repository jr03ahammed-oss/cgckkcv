package com.capitalflow.app.ui.screens

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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.capitalflow.app.data.Calculations
import com.capitalflow.app.data.CurrencyHelper
import com.capitalflow.app.model.*
import com.capitalflow.app.ui.components.*
import com.capitalflow.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvestmentDetailScreen(
    investment: Investment,
    monthlyRecords: List<MonthlyRecord>,
    profile: UserProfile?,
    rateInfo: CurrencyRateInfo,
    onBack: () -> Unit,
    onEditInvestment: () -> Unit,
    onDeleteInvestment: () -> Unit,
    onAddMonthlyRecord: () -> Unit,
    onEditMonthlyRecord: (MonthlyRecord) -> Unit,
    onDeleteMonthlyRecord: (String) -> Unit
) {
    val masterCurr = profile?.masterCurrency ?: "SAR"
    val financials = remember(investment, monthlyRecords, masterCurr, rateInfo) {
        Calculations.calculateInvestmentFinancials(investment, monthlyRecords, masterCurr, rateInfo)
    }
    val computedMonthly = remember(investment, monthlyRecords) {
        Calculations.computeMonthlyRecords(investment, monthlyRecords)
    }

    var showDeleteConfirmDialog by remember { mutableStateOf(false) }
    var recordToDeleteId by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = investment.name,
                        maxLines = 1,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = onEditInvestment) {
                        Icon(imageVector = Icons.Default.Edit, contentDescription = "Edit")
                    }
                    IconButton(onClick = { showDeleteConfirmDialog = true }) {
                        Icon(imageVector = Icons.Default.DeleteOutline, contentDescription = "Delete", tint = StatusRed)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onAddMonthlyRecord,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Add Monthly Entry") },
                containerColor = EmeraldPrimary,
                contentColor = MaterialTheme.colorScheme.surface
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Info Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = CurrencyHelper.getCurrencyFlag(investment.currency),
                                    fontSize = 24.sp
                                )
                                Column {
                                    Text(
                                        text = investment.name,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = "${investment.country} • Native Currency: ${investment.currency}",
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
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
                            Text(
                                text = "Start: ${investment.startDate}",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                            if (investment.targetPeriod != null) {
                                Text(
                                    text = "Target: ${investment.targetPeriod}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = EmeraldPrimary
                                )
                            }
                        }

                        if (!investment.notes.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = investment.notes,
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f),
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.background)
                                    .padding(8.dp)
                                    .fillMaxWidth()
                            )
                        }
                    }
                }
            }

            // Capital Recovery Progress
            item {
                CapitalRecoveryProgressBar(
                    percentage = financials.recoveryPercentage,
                    recoveredFormatted = CurrencyHelper.formatCurrency(financials.capitalRecovered, investment.currency),
                    totalFormatted = CurrencyHelper.formatCurrency(financials.totalInvestedCapital, investment.currency),
                    status = financials.recoveryStatus
                )
            }

            // Financial Metrics Grid
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        SummaryKpiCard(
                            title = "TOTAL DEPLOYED",
                            value = CurrencyHelper.formatCurrency(financials.totalInvestedCapital, investment.currency),
                            subtitle = if (investment.currency != masterCurr) "≈ ${CurrencyHelper.formatCurrency(financials.convertedTotalInvested, masterCurr)}" else null,
                            icon = Icons.Default.AccountBalance,
                            modifier = Modifier.weight(1f)
                        )
                        SummaryKpiCard(
                            title = "TOTAL RETURNS",
                            value = CurrencyHelper.formatCurrency(financials.totalReturn, investment.currency),
                            subtitle = if (investment.currency != masterCurr) "≈ ${CurrencyHelper.formatCurrency(financials.convertedTotalReturn, masterCurr)}" else null,
                            icon = Icons.Default.Payments,
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
                            value = CurrencyHelper.formatCurrency(financials.netProfit, investment.currency),
                            subtitle = "ROI: ${String.format(java.util.Locale.US, "%.1f", financials.roi)}%",
                            icon = Icons.Default.TrendingUp,
                            iconColor = if (financials.netProfit >= 0) StatusGreen else StatusRed,
                            modifier = Modifier.weight(1f)
                        )
                        SummaryKpiCard(
                            title = "REMAINING CAPITAL",
                            value = CurrencyHelper.formatCurrency(financials.remainingCapital, investment.currency),
                            subtitle = "Remaining to Breakeven",
                            icon = Icons.Default.HourglassBottom,
                            iconColor = StatusAmber,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // Currency Conversion Indicator (if different from master)
            if (investment.currency != masterCurr) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Exchange Rate: 1 ${investment.currency} = ${String.format(java.util.Locale.US, "%.4f", financials.rateToMaster)} $masterCurr",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = financials.rateSource,
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    }
                }
            }

            // Monthly Tracker Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Monthly Financial Tracker",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Text(
                            text = "${computedMonthly.size} chronological records",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                        )
                    }

                    Button(
                        onClick = onAddMonthlyRecord,
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Add Entry", fontSize = 12.sp)
                    }
                }
            }

            // Monthly Records List
            if (computedMonthly.isEmpty()) {
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
                                imageVector = Icons.Default.CalendarMonth,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                                modifier = Modifier.size(36.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "No Monthly Records Yet",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Add monthly income and expenses to track return on capital.",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                }
            } else {
                items(computedMonthly) { comp ->
                    MonthlyRecordCard(
                        computed = comp,
                        currency = investment.currency,
                        onEdit = { onEditMonthlyRecord(comp.record) },
                        onDelete = { recordToDeleteId = comp.record.id }
                    )
                }
            }
        }
    }

    // Confirm Delete Investment Dialog
    if (showDeleteConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirmDialog = false },
            title = { Text("Delete Investment") },
            text = { Text("Are you sure you want to delete '${investment.name}' and all its monthly tracking records? This action cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteConfirmDialog = false
                        onDeleteInvestment()
                    }
                ) {
                    Text("Delete", color = StatusRed, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirmDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Confirm Delete Monthly Record Dialog
    if (recordToDeleteId != null) {
        AlertDialog(
            onDismissRequest = { recordToDeleteId = null },
            title = { Text("Delete Record") },
            text = { Text("Are you sure you want to delete this monthly record?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        val id = recordToDeleteId
                        recordToDeleteId = null
                        if (id != null) onDeleteMonthlyRecord(id)
                    }
                ) {
                    Text("Delete", color = StatusRed, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { recordToDeleteId = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun MonthlyRecordCard(
    computed: ComputedMonthlyRecord,
    currency: String,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val rec = computed.record
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
                Column {
                    Text(
                        text = rec.month,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = rec.date,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (!rec.status.isNullOrBlank()) {
                        Text(
                            text = rec.status,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium,
                            color = EmeraldBadgeText,
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(EmeraldLight)
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                    }
                    IconButton(onClick = onEdit, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(15.dp))
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = StatusRed, modifier = Modifier.size(15.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Financial row 1: Income & Expense
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Income / Return", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f))
                    Text(
                        CurrencyHelper.formatCurrency(rec.income, currency),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = StatusGreen
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Expense", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f))
                    Text(
                        CurrencyHelper.formatCurrency(rec.expense, currency),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text("Net Profit", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f))
                    Text(
                        CurrencyHelper.formatCurrency(computed.netProfit, currency),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (computed.netProfit >= 0) StatusGreen else StatusRed
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Financial row 2: Capital changes & Remaining capital
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(MaterialTheme.colorScheme.background)
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                if (rec.additionalCapital > 0 || rec.withdrawal > 0) {
                    Text(
                        text = "Cap: +${CurrencyHelper.formatCurrency(rec.additionalCapital, currency)} / -${CurrencyHelper.formatCurrency(rec.withdrawal, currency)}",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                } else {
                    Text(
                        text = "Mo. ROI: ${String.format(java.util.Locale.US, "%.1f", computed.monthlyRoi)}%",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }

                Text(
                    text = "Remaining Cap: ${CurrencyHelper.formatCurrency(computed.remainingCapitalAfter, currency)}",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            if (!rec.notes.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Note: ${rec.notes}",
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                )
            }
        }
    }
}
