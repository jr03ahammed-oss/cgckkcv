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
import com.capitalflow.app.model.MonthlyRecord
import com.capitalflow.app.ui.theme.EmeraldPrimary
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun AddMonthlyRecordDialog(
    currency: String,
    initialRecord: MonthlyRecord? = null,
    onDismiss: () -> Unit,
    onSave: (month: String, date: String, income: Double, expense: Double, additionalCapital: Double, withdrawal: Double, notes: String?, status: String?) -> Unit
) {
    var month by remember {
        mutableStateOf(initialRecord?.month ?: SimpleDateFormat("MMM yyyy", Locale.US).format(Date()))
    }
    var date by remember {
        mutableStateOf(initialRecord?.date ?: SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()))
    }
    var incomeStr by remember {
        mutableStateOf(if (initialRecord != null && initialRecord.income > 0) initialRecord.income.toString() else "")
    }
    var expenseStr by remember {
        mutableStateOf(if (initialRecord != null && initialRecord.expense > 0) initialRecord.expense.toString() else "")
    }
    var addCapitalStr by remember {
        mutableStateOf(if (initialRecord != null && initialRecord.additionalCapital > 0) initialRecord.additionalCapital.toString() else "")
    }
    var withdrawalStr by remember {
        mutableStateOf(if (initialRecord != null && initialRecord.withdrawal > 0) initialRecord.withdrawal.toString() else "")
    }
    var notes by remember { mutableStateOf(initialRecord?.notes ?: "") }
    var status by remember { mutableStateOf(initialRecord?.status ?: "Operating") }

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
                    text = if (initialRecord == null) "Add Monthly Record" else "Edit Monthly Record",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Track revenue, costs and capital changes in $currency",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = month,
                        onValueChange = { month = it },
                        label = { Text("Month Label") },
                        placeholder = { Text("e.g. May 2024") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )

                    OutlinedTextField(
                        value = date,
                        onValueChange = { date = it },
                        label = { Text("Record Date") },
                        placeholder = { Text("YYYY-MM-DD") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = incomeStr,
                        onValueChange = { incomeStr = it },
                        label = { Text("Income / Return ($currency)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )

                    OutlinedTextField(
                        value = expenseStr,
                        onValueChange = { expenseStr = it },
                        label = { Text("Expense ($currency)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = addCapitalStr,
                        onValueChange = { addCapitalStr = it },
                        label = { Text("Add'l Capital") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )

                    OutlinedTextField(
                        value = withdrawalStr,
                        onValueChange = { withdrawalStr = it },
                        label = { Text("Withdrawal") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = status,
                    onValueChange = { status = it },
                    label = { Text("Status Badge (e.g. Operating, Dividend, Milestone)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes / Monthly Highlights") },
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
                            val inc = incomeStr.toDoubleOrNull() ?: 0.0
                            val exp = expenseStr.toDoubleOrNull() ?: 0.0
                            val addCap = addCapitalStr.toDoubleOrNull() ?: 0.0
                            val withdr = withdrawalStr.toDoubleOrNull() ?: 0.0
                            if (month.isNotBlank() && date.isNotBlank()) {
                                onSave(
                                    month.trim(),
                                    date.trim(),
                                    inc,
                                    exp,
                                    addCap,
                                    withdr,
                                    notes.ifBlank { null },
                                    status.ifBlank { null }
                                )
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        enabled = month.isNotBlank() && date.isNotBlank()
                    ) {
                        Text(if (initialRecord == null) "Add Record" else "Save Changes")
                    }
                }
            }
        }
    }
}
