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
import com.capitalflow.app.ui.components.SummaryKpiCard
import com.capitalflow.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FundingScreen(
    profile: UserProfile?,
    fundingRecords: List<FundingRecord>,
    investments: List<Investment>,
    rateInfo: CurrencyRateInfo,
    onOpenAddFunding: () -> Unit,
    onEditFunding: (FundingRecord) -> Unit,
    onDeleteFunding: (String) -> Unit
) {
    val masterCurr = profile?.masterCurrency ?: "SAR"
    val fundingSummary = remember(fundingRecords, masterCurr, rateInfo) {
        Calculations.calculateFundingSummary(fundingRecords, masterCurr, rateInfo)
    }

    var recordToDeleteId by remember { mutableStateOf<String?>(null) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = onOpenAddFunding,
                containerColor = EmeraldPrimary,
                contentColor = MaterialTheme.colorScheme.surface
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Add Funding")
            }
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
            // Header
            item {
                Column {
                    Text(
                        text = "Portfolio Funding Ledger",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = "Capital injections, partner contributions, facilities and profit distributions",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                    )
                }
            }

            // Funding Summary KPI Cards
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        SummaryKpiCard(
                            title = "TOTAL FUNDED",
                            value = CurrencyHelper.formatCurrency(fundingSummary.totalFundedMaster, masterCurr),
                            subtitle = "Across all partners & sources",
                            icon = Icons.Default.AccountBalanceWallet,
                            iconColor = Color(0xFF2563EB),
                            modifier = Modifier.weight(1f)
                        )
                        SummaryKpiCard(
                            title = "ALLOCATED CAPITAL",
                            value = CurrencyHelper.formatCurrency(fundingSummary.totalAllocatedMaster, masterCurr),
                            subtitle = "Deployed to active assets",
                            icon = Icons.Default.TrendingUp,
                            iconColor = EmeraldPrimary,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        SummaryKpiCard(
                            title = "UNALLOCATED RESERVE",
                            value = CurrencyHelper.formatCurrency(fundingSummary.unallocatedReserveMaster, masterCurr),
                            subtitle = "Available dry powder",
                            icon = Icons.Default.Savings,
                            iconColor = StatusAmber,
                            modifier = Modifier.weight(1f)
                        )
                        SummaryKpiCard(
                            title = "DISTRIBUTED CAPITAL",
                            value = CurrencyHelper.formatCurrency(fundingSummary.totalDistributedMaster, masterCurr),
                            subtitle = "Paid out to syndicate LPs",
                            icon = Icons.Default.Payments,
                            iconColor = Color(0xFF8B5CF6),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // Source Allocation Breakdown
            if (fundingSummary.sourceBreakdown.isNotEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "Capital Source Distribution",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(10.dp))

                            fundingSummary.sourceBreakdown.forEach { item ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = item.source,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = "${item.count} transaction(s)",
                                            fontSize = 10.sp,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                    }
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text(
                                            text = CurrencyHelper.formatCurrency(item.totalAmountMaster, masterCurr),
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = "${String.format(java.util.Locale.US, "%.1f", item.sharePercent)}%",
                                            fontSize = 11.sp,
                                            color = EmeraldPrimary,
                                            fontWeight = FontWeight.Medium
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Transactions Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Transactions Ledger (${fundingRecords.size})",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }
            }

            // Funding Transactions List
            if (fundingRecords.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.ReceiptLong,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                                modifier = Modifier.size(36.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "No Funding Transactions Recorded",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Tap '+' to record capital contributions, facilities or distributions.",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                }
            } else {
                items(fundingRecords) { rec ->
                    FundingRecordCard(
                        record = rec,
                        masterCurrency = masterCurr,
                        rateInfo = rateInfo,
                        onEdit = { onEditFunding(rec) },
                        onDelete = { recordToDeleteId = rec.id }
                    )
                }
            }
        }
    }

    if (recordToDeleteId != null) {
        AlertDialog(
            onDismissRequest = { recordToDeleteId = null },
            title = { Text("Delete Transaction") },
            text = { Text("Are you sure you want to delete this funding transaction?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        val id = recordToDeleteId
                        recordToDeleteId = null
                        if (id != null) onDeleteFunding(id)
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
private fun FundingRecordCard(
    record: FundingRecord,
    masterCurrency: String,
    rateInfo: CurrencyRateInfo,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val convertedAmount = CurrencyHelper.convertCurrency(record.amount, record.currency, masterCurrency, rateInfo.rates)

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
                        text = record.source,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${record.date} • ${record.type}",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = record.status,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium,
                        color = if (record.status.equals("Completed", ignoreCase = true)) EmeraldBadgeText else Color(0xFFD97706),
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (record.status.equals("Completed", ignoreCase = true)) EmeraldLight else Color(0xFFFEF3C7))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                    IconButton(onClick = onEdit, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(15.dp))
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = StatusRed, modifier = Modifier.size(15.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Allocation",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                    Text(
                        text = record.allocatedInvestmentName ?: "Unallocated Treasury",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = CurrencyHelper.formatCurrency(record.amount, record.currency),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (record.currency != masterCurrency) {
                        Text(
                            text = "≈ ${CurrencyHelper.formatCurrency(convertedAmount, masterCurrency)}",
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }
            }

            if (!record.notes.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Note: ${record.notes}",
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                )
            }
        }
    }
}
