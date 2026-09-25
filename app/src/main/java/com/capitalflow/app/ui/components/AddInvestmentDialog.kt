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
import com.capitalflow.app.model.Investment
import com.capitalflow.app.ui.theme.EmeraldPrimary
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddInvestmentDialog(
    initialInvestment: Investment? = null,
    defaultCurrency: String = "SAR",
    defaultCountry: String = "Saudi Arabia",
    onDismiss: () -> Unit,
    onSave: (name: String, country: String, currency: String, initialCapital: Double, startDate: String, targetPeriod: String?, notes: String?) -> Unit
) {
    var name by remember { mutableStateOf(initialInvestment?.name ?: "") }
    var country by remember { mutableStateOf(initialInvestment?.country ?: defaultCountry) }
    var currency by remember { mutableStateOf(initialInvestment?.currency ?: defaultCurrency) }
    var initialCapitalStr by remember {
        mutableStateOf(if (initialInvestment != null && initialInvestment.initialCapital > 0) initialInvestment.initialCapital.toString() else "")
    }
    var startDate by remember {
        mutableStateOf(initialInvestment?.startDate ?: SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()))
    }
    var targetPeriod by remember { mutableStateOf(initialInvestment?.targetPeriod ?: "12 Months") }
    var notes by remember { mutableStateOf(initialInvestment?.notes ?: "") }

    var currencyDropdownExpanded by remember { mutableStateOf(false) }

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
                    text = if (initialInvestment == null) "Add New Investment" else "Edit Investment",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Track capital, duration and cross-border currency",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Investment Name *") },
                    placeholder = { Text("e.g. Riyadh Logistics Park") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Country
                    OutlinedTextField(
                        value = country,
                        onValueChange = { country = it },
                        label = { Text("Country") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )

                    // Currency Selector Dropdown
                    ExposedDropdownMenuBox(
                        expanded = currencyDropdownExpanded,
                        onExpandedChange = { currencyDropdownExpanded = !currencyDropdownExpanded },
                        modifier = Modifier.weight(1f)
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
                                    text = { Text("${meta.flag} ${meta.code} (${meta.symbol})") },
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

                OutlinedTextField(
                    value = initialCapitalStr,
                    onValueChange = { initialCapitalStr = it },
                    label = { Text("Initial Capital ($currency) *") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = startDate,
                        onValueChange = { startDate = it },
                        label = { Text("Start Date") },
                        placeholder = { Text("YYYY-MM-DD") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )

                    OutlinedTextField(
                        value = targetPeriod,
                        onValueChange = { targetPeriod = it },
                        label = { Text("Target Period") },
                        placeholder = { Text("e.g. 18 Months") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes / Asset Strategy") },
                    maxLines = 3,
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
                            val cap = initialCapitalStr.toDoubleOrNull() ?: 0.0
                            if (name.isNotBlank()) {
                                onSave(
                                    name.trim(),
                                    country.trim(),
                                    currency.trim(),
                                    cap,
                                    startDate.trim(),
                                    targetPeriod.ifBlank { null },
                                    notes.ifBlank { null }
                                )
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        enabled = name.isNotBlank()
                    ) {
                        Text(if (initialInvestment == null) "Create Investment" else "Save Changes")
                    }
                }
            }
        }
    }
}
