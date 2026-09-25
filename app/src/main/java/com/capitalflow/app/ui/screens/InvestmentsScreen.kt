package com.capitalflow.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.capitalflow.app.data.Calculations
import com.capitalflow.app.model.CurrencyRateInfo
import com.capitalflow.app.model.Investment
import com.capitalflow.app.model.MonthlyRecord
import com.capitalflow.app.model.UserProfile
import com.capitalflow.app.ui.theme.EmeraldPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvestmentsScreen(
    profile: UserProfile?,
    investments: List<Investment>,
    monthlyRecords: Map<String, List<MonthlyRecord>>,
    rateInfo: CurrencyRateInfo,
    onSelectInvestment: (Investment) -> Unit,
    onOpenAddInvestment: () -> Unit
) {
    val masterCurr = profile?.masterCurrency ?: "SAR"
    var searchQuery by remember { mutableStateOf("") }
    var selectedCountry by remember { mutableStateOf("All") }
    var selectedCurrency by remember { mutableStateOf("All") }
    var sortBy by remember { mutableStateOf("Name") } // Name, Capital, ROI, Date

    // Distinct filters
    val countries = remember(investments) {
        listOf("All") + investments.map { it.country }.distinct().filter { it.isNotBlank() }
    }
    val currencies = remember(investments) {
        listOf("All") + investments.map { it.currency }.distinct().filter { it.isNotBlank() }
    }

    val filteredList = remember(investments, monthlyRecords, searchQuery, selectedCountry, selectedCurrency, sortBy, rateInfo) {
        investments.filter { inv ->
            val matchQuery = searchQuery.isBlank() || inv.name.contains(searchQuery, ignoreCase = true) || inv.notes?.contains(searchQuery, ignoreCase = true) == true
            val matchCountry = selectedCountry == "All" || inv.country.equals(selectedCountry, ignoreCase = true)
            val matchCurr = selectedCurrency == "All" || inv.currency.equals(selectedCurrency, ignoreCase = true)
            matchQuery && matchCountry && matchCurr
        }.sortedWith { a, b ->
            when (sortBy) {
                "Capital" -> b.initialCapital.compareTo(a.initialCapital)
                "ROI" -> {
                    val finA = Calculations.calculateInvestmentFinancials(a, monthlyRecords[a.id] ?: emptyList(), masterCurr, rateInfo)
                    val finB = Calculations.calculateInvestmentFinancials(b, monthlyRecords[b.id] ?: emptyList(), masterCurr, rateInfo)
                    finB.roi.compareTo(finA.roi)
                }
                "Date" -> b.startDate.compareTo(a.startDate)
                else -> a.name.compareTo(b.name, ignoreCase = true)
            }
        }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = onOpenAddInvestment,
                containerColor = EmeraldPrimary,
                contentColor = MaterialTheme.colorScheme.surface
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Add Investment")
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Screen Title & Search Bar
            item {
                Column {
                    Text(
                        text = "Investments Directory",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = "${investments.size} Cross-Border Holdings & Contracts",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search by name or strategy...") },
                        leadingIcon = {
                            Icon(Icons.Default.Search, contentDescription = null)
                        },
                        trailingIcon = {
                            if (searchQuery.isNotBlank()) {
                                IconButton(onClick = { searchQuery = "" }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Clear")
                                }
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            // Filter Chips
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Country filter
                    countries.forEach { c ->
                        FilterChip(
                            selected = selectedCountry == c,
                            onClick = { selectedCountry = c },
                            label = { Text(if (c == "All") "All Countries" else c) }
                        )
                    }

                    // Currency filter
                    currencies.filter { it != "All" }.forEach { curr ->
                        FilterChip(
                            selected = selectedCurrency == curr,
                            onClick = { selectedCurrency = if (selectedCurrency == curr) "All" else curr },
                            label = { Text(curr) }
                        )
                    }
                }
            }

            // Count & Sort row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Showing ${filteredList.size} investments",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                    )

                    var sortMenuOpen by remember { mutableStateOf(false) }
                    Box {
                        TextButton(onClick = { sortMenuOpen = true }) {
                            Icon(Icons.Default.Sort, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Sort: $sortBy", fontSize = 12.sp)
                        }
                        DropdownMenu(
                            expanded = sortMenuOpen,
                            onDismissRequest = { sortMenuOpen = false }
                        ) {
                            listOf("Name", "Capital", "ROI", "Date").forEach { opt ->
                                DropdownMenuItem(
                                    text = { Text(opt) },
                                    onClick = {
                                        sortBy = opt
                                        sortMenuOpen = false
                                    }
                                )
                            }
                        }
                    }
                }
            }

            // Investment List
            if (filteredList.isEmpty()) {
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
                            Text(
                                text = "No matching investments found",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            } else {
                items(filteredList) { inv ->
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
}
