package com.capitalflow.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.capitalflow.app.data.CurrencyHelper
import com.capitalflow.app.model.FundingRecord
import com.capitalflow.app.model.Investment
import com.capitalflow.app.ui.theme.EmeraldPrimary
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddFundingRecordDialog(
    investments: List<Investment>,
    defaultCurrency: String = "SAR",
    initialRecord: FundingRecord? = null,
    onDismiss: () -> Unit,
    onSave: (source: String, type: String, amount: Double, currency: String, date: String, allocatedInvestmentId: String?, allocatedInvestmentName: String?, status: String, notes: String?) -> Unit
) {
    var source by remember { mutableStateOf(initialRecord?.source ?: "") }
    var type by remember { mutableStateOf(initialRecord?.type ?: "Capital Injection") }
    var amountStr by remember {
        mutableStateOf(if (initialRecord != null && initialRecord.amount > 0) initialRecord.amount.toString() else "")
    }
    var currency by remember { mutableStateOf(initialRecord?.currency ?: defaultCurrency) }
    var date by remember {
        mutableStateOf(initialRecord?.date ?: SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()))
    }
    var selectedInvestmentId by remember { mutableStateOf(initialRecord?.allocatedInvestmentId ?: "") }
    var status by remember { mutableStateOf(initialRecord?.status ?: "Completed") }
    var notes by remember { mutableStateOf(initialRecord?.notes ?: "") }

    var typeDropdownExpanded by remember { mutableStateOf(false) }
    var currencyDropdownExpanded by remember { mutableStateOf(false) }
    var invDropdownExpanded by remember { mutableStateOf(false) }
    var statusDropdownExpanded by remember { mutableStateOf(false) }

    val types = listOf(
        "Capital Injection",
        "Partner Contribution",
        "Reinvested Returns",
        "Debt / Credit Facility",
        "Capital Distribution",
        "Withdrawal"
    )

    val statuses = listOf("Completed", "Committed", "Pending")

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = if (initialRecord == null) "New Funding Transaction" else "Edit Funding Record",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Track injections, investor capital and returns distribution",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = source,
                    onValueChange = { source = it },
                    label = { Text("Funding Source / Partner *") },
                    placeholder = { Text("e.g. Al-Rajhi Syndicate, Self-Funded") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Type Dropdown
                ExposedDropdownMenuBox(
                    expanded = typeDropdownExpanded,
                    onExpandedChange = { typeDropdownExpanded = !typeDropdownExpanded },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = type,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Transaction Type") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = typeDropdownExpanded) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = typeDropdownExpanded,
                        onDismissRequest = { typeDropdownExpanded = false }
                    ) {
                        types.forEach { t ->
                            DropdownMenuItem(
                                text = { Text(t) },
                                onClick = {
                                    type = t
                                    typeDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = amountStr,
                        onValueChange = { amountStr = it },
                        label = { Text("Amount *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.weight(1.2f)
                    )

                    // Currency Dropdown
                    ExposedDropdownMenuBox(
                        expanded = currencyDropdownExpanded,
                        onExpandedChange = { currencyDropdownExpanded = !currencyDropdownExpanded },
                        modifier = Modifier.weight(0.8f)
                    ) {
                        OutlinedTextField(
                            value = currency,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Currency") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = currencyDropdownExpanded) },
                            modifier = Modifier.menuAnchor()
                        )
                        ExposedDropdownMenu(
                            expanded = currencyDropdownExpanded,
                            onDismissRequest = { currencyDropdownExpanded = false }
                        ) {
                            CurrencyHelper.SUPPORTED_CURRENCIES.forEach { meta ->
                                DropdownMenuItem(
                                    text = { Text("${meta.flag} ${meta.code}") },
                                    onClick = {
                                        currency = meta.code
                                        currencyDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Allocated Investment Dropdown
                val selectedInvName = investments.find { it.id == selectedInvestmentId }?.name ?: "Unallocated Reserve"
                ExposedDropdownMenuBox(
                    expanded = invDropdownExpanded,
                    onExpandedChange = { invDropdownExpanded = !invDropdownExpanded },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = selectedInvName,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Allocated To Investment") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = invDropdownExpanded) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = invDropdownExpanded,
                        onDismissRequest = { invDropdownExpanded = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Unallocated Reserve (Treasury)") },
                            onClick = {
                                selectedInvestmentId = ""
                                invDropdownExpanded = false
                            }
                        )
                        investments.forEach { inv ->
                            DropdownMenuItem(
                                text = { Text("${inv.name} (${inv.currency})") },
                                onClick = {
                                    selectedInvestmentId = inv.id
                                    invDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = date,
                        onValueChange = { date = it },
                        label = { Text("Date") },
                        placeholder = { Text("YYYY-MM-DD") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )

                    // Status Dropdown
                    ExposedDropdownMenuBox(
                        expanded = statusDropdownExpanded,
                        onExpandedChange = { statusDropdownExpanded = !statusDropdownExpanded },
                        modifier = Modifier.weight(1f)
                    ) {
                        OutlinedTextField(
                            value = status,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Status") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = statusDropdownExpanded) },
                            modifier = Modifier.menuAnchor()
                        )
                        ExposedDropdownMenu(
                            expanded = statusDropdownExpanded,
                            onDismissRequest = { statusDropdownExpanded = false }
                        ) {
                            statuses.forEach { s ->
                                DropdownMenuItem(
                                    text = { Text(s) },
                                    onClick = {
                                        status = s
                                        statusDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes / Terms") },
                    maxLines = 2,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val amt = amountStr.toDoubleOrNull() ?: 0.0
                            if (source.isNotBlank() && amt > 0) {
                                val allocName = investments.find { it.id == selectedInvestmentId }?.name
                                onSave(
                                    source.trim(),
                                    type,
                                    amt,
                                    currency,
                                    date.trim(),
                                    selectedInvestmentId.ifBlank { null },
                                    allocName,
                                    status,
                                    notes.ifBlank { null }
                                )
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        enabled = source.isNotBlank() && (amountStr.toDoubleOrNull() ?: 0.0) > 0
                    ) {
                        Text(if (initialRecord == null) "Record Funding" else "Save Changes")
                    }
                }
            }
        }
    }
}
