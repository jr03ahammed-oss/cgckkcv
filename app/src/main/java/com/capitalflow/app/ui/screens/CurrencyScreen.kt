package com.capitalflow.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.capitalflow.app.data.CurrencyHelper
import com.capitalflow.app.model.CurrencyRateInfo
import com.capitalflow.app.model.UserProfile
import com.capitalflow.app.ui.theme.EmeraldBadgeText
import com.capitalflow.app.ui.theme.EmeraldLight
import com.capitalflow.app.ui.theme.EmeraldPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CurrencyScreen(
    profile: UserProfile?,
    rateInfo: CurrencyRateInfo,
    onSetMasterCurrency: (String) -> Unit,
    onRefreshRates: () -> Unit
) {
    val masterCurr = profile?.masterCurrency ?: "SAR"

    // Converter Calculator state
    var calcAmountStr by remember { mutableStateOf("1000") }
    var calcFromCurr by remember { mutableStateOf("USD") }
    var calcToCurr by remember { mutableStateOf(masterCurr) }

    var fromCurrExpanded by remember { mutableStateOf(false) }
    var toCurrExpanded by remember { mutableStateOf(false) }

    val calcAmount = calcAmountStr.toDoubleOrNull() ?: 0.0
    val convertedResult = remember(calcAmount, calcFromCurr, calcToCurr, rateInfo) {
        CurrencyHelper.convertCurrency(calcAmount, calcFromCurr, calcToCurr, rateInfo.rates)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Header
        item {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Multi-Currency Management",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Text(
                            text = "Live feeds from ECB & Open Exchange Rates",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                        )
                    }

                    IconButton(onClick = onRefreshRates) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = "Refresh Rates", tint = EmeraldPrimary)
                    }
                }
            }
        }

        // 2. Master Currency Selection Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "Master Reporting Currency",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "All investments and funding metrics across the app are consolidated into this base.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    var masterExpanded by remember { mutableStateOf(false) }
                    ExposedDropdownMenuBox(
                        expanded = masterExpanded,
                        onExpandedChange = { masterExpanded = !masterExpanded }
                    ) {
                        OutlinedTextField(
                            value = "${CurrencyHelper.getCurrencyFlag(masterCurr)} $masterCurr — ${CurrencyHelper.getCurrencyMeta(masterCurr)?.name}",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Selected Master Currency") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = masterExpanded) },
                            modifier = Modifier
                                .menuAnchor()
                                .fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = masterExpanded,
                            onDismissRequest = { masterExpanded = false }
                        ) {
                            CurrencyHelper.SUPPORTED_CURRENCIES.forEach { meta ->
                                DropdownMenuItem(
                                    text = { Text("${meta.flag} ${meta.code} — ${meta.name} (${meta.country})") },
                                    onClick = {
                                        onSetMasterCurrency(meta.code)
                                        masterExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }

        // 3. Quick Converter Calculator Card
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
                        Text(
                            text = "Live Conversion Calculator",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Icon(
                            imageVector = Icons.Default.Calculate,
                            contentDescription = null,
                            tint = EmeraldPrimary,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = calcAmountStr,
                        onValueChange = { calcAmountStr = it },
                        label = { Text("Amount") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // From currency
                        ExposedDropdownMenuBox(
                            expanded = fromCurrExpanded,
                            onExpandedChange = { fromCurrExpanded = !fromCurrExpanded },
                            modifier = Modifier.weight(1f)
                        ) {
                            OutlinedTextField(
                                value = "${CurrencyHelper.getCurrencyFlag(calcFromCurr)} $calcFromCurr",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("From") },
                                modifier = Modifier.menuAnchor()
                            )
                            ExposedDropdownMenu(
                                expanded = fromCurrExpanded,
                                onDismissRequest = { fromCurrExpanded = false }
                            ) {
                                CurrencyHelper.SUPPORTED_CURRENCIES.forEach { meta ->
                                    DropdownMenuItem(
                                        text = { Text("${meta.flag} ${meta.code}") },
                                        onClick = {
                                            calcFromCurr = meta.code
                                            fromCurrExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        IconButton(
                            onClick = {
                                val tmp = calcFromCurr
                                calcFromCurr = calcToCurr
                                calcToCurr = tmp
                            }
                        ) {
                            Icon(Icons.Default.SwapHoriz, contentDescription = "Swap")
                        }

                        // To currency
                        ExposedDropdownMenuBox(
                            expanded = toCurrExpanded,
                            onExpandedChange = { toCurrExpanded = !toCurrExpanded },
                            modifier = Modifier.weight(1f)
                        ) {
                            OutlinedTextField(
                                value = "${CurrencyHelper.getCurrencyFlag(calcToCurr)} $calcToCurr",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("To") },
                                modifier = Modifier.menuAnchor()
                            )
                            ExposedDropdownMenu(
                                expanded = toCurrExpanded,
                                onDismissRequest = { toCurrExpanded = false }
                            ) {
                                CurrencyHelper.SUPPORTED_CURRENCIES.forEach { meta ->
                                    DropdownMenuItem(
                                        text = { Text("${meta.flag} ${meta.code}") },
                                        onClick = {
                                            calcToCurr = meta.code
                                            toCurrExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Result Box
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(EmeraldLight)
                            .padding(14.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "Converted Value",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium,
                                color = EmeraldBadgeText
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = CurrencyHelper.formatCurrency(convertedResult, calcToCurr, showCode = true),
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = EmeraldBadgeText
                            )
                            Text(
                                text = "1 $calcFromCurr = ${String.format(java.util.Locale.US, "%.4f", CurrencyHelper.getExchangeRate(calcFromCurr, calcToCurr, rateInfo.rates))} $calcToCurr",
                                fontSize = 11.sp,
                                color = EmeraldBadgeText.copy(alpha = 0.8f)
                            )
                        }
                    }
                }
            }
        }

        // 4. Rate Table Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Supported Exchange Rates (${CurrencyHelper.SUPPORTED_CURRENCIES.size})",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Text(
                    text = if (rateInfo.isFallback) "Baseline Cached" else "Live Feed",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    color = if (rateInfo.isFallback) Color(0xFFD97706) else EmeraldPrimary
                )
            }
        }

        // 5. Rate Rows
        items(CurrencyHelper.SUPPORTED_CURRENCIES) { meta ->
            val rateToMaster = CurrencyHelper.getExchangeRate(meta.code, masterCurr, rateInfo.rates)
            val rateToUsd = CurrencyHelper.getExchangeRate(meta.code, "USD", rateInfo.rates)

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(text = meta.flag, fontSize = 24.sp)
                        Column {
                            Text(
                                text = "${meta.code} • ${meta.symbol}",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "${meta.name} (${meta.country})",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                            )
                        }
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "1 ${meta.code} = ${String.format(java.util.Locale.US, "%.4f", rateToMaster)} $masterCurr",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "≈ ${String.format(java.util.Locale.US, "%.4f", rateToUsd)} USD",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }
            }
        }
    }
}
