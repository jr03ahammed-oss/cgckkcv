package com.capitalflow.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
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
import com.capitalflow.app.data.CurrencyHelper
import com.capitalflow.app.model.UserProfile
import com.capitalflow.app.ui.theme.EmeraldBadgeText
import com.capitalflow.app.ui.theme.EmeraldLight
import com.capitalflow.app.ui.theme.EmeraldPrimary
import com.capitalflow.app.ui.theme.StatusRed
import com.google.firebase.auth.FirebaseUser

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    user: FirebaseUser?,
    profile: UserProfile?,
    themePreference: String,
    onUpdateTheme: (String) -> Unit,
    onUpdateProfile: (companyName: String, ownerName: String, masterCurrency: String, defaultCountry: String, defaultCurrency: String) -> Unit,
    onImportSampleData: () -> Unit,
    onClearAllData: () -> Unit,
    onSignOut: () -> Unit
) {
    var companyName by remember(profile) { mutableStateOf(profile?.companyName ?: "Vayxon Capital") }
    var ownerName by remember(profile) { mutableStateOf(profile?.ownerName ?: user?.displayName ?: "") }
    var masterCurrency by remember(profile) { mutableStateOf(profile?.masterCurrency ?: "SAR") }
    var defaultCountry by remember(profile) { mutableStateOf(profile?.defaultCountry ?: "Saudi Arabia") }
    var defaultCurrency by remember(profile) { mutableStateOf(profile?.defaultCurrency ?: "SAR") }

    var masterCurrExpanded by remember { mutableStateOf(false) }
    var defaultCurrExpanded by remember { mutableStateOf(false) }

    var showClearConfirmDialog by remember { mutableStateOf(false) }
    var isSaving by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        item {
            Column {
                Text(
                    text = "System Settings & Profile",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Text(
                    text = "Portfolio configuration, theme, currency defaults and cloud sync",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                )
            }
        }

        // Profile Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(50.dp)
                                .clip(CircleShape)
                                .background(EmeraldLight),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = (ownerName.take(1).ifBlank { user?.email?.take(1) ?: "U" }).uppercase(),
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = EmeraldPrimary
                            )
                        }

                        Column {
                            Text(
                                text = companyName,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = user?.email ?: "jr03ahammed@gmail.com",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = companyName,
                        onValueChange = { companyName = it },
                        label = { Text("Company / Portfolio Title") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = ownerName,
                        onValueChange = { ownerName = it },
                        label = { Text("Managing Partner / Owner Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        // Theme Preference Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "Display Theme",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Choose light, dark, or follow your Android system theme",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf(
                            Triple("system", "System", Icons.Default.SettingsBrightness),
                            Triple("light", "Light", Icons.Default.LightMode),
                            Triple("dark", "Dark", Icons.Default.DarkMode)
                        ).forEach { (mode, label, icon) ->
                            val isSelected = themePreference == mode
                            OutlinedButton(
                                onClick = { onUpdateTheme(mode) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (isSelected) EmeraldLight else Color.Transparent
                                ),
                                border = if (isSelected) ButtonDefaults.outlinedButtonBorder.copy(brush = androidx.compose.ui.graphics.SolidColor(EmeraldPrimary)) else ButtonDefaults.outlinedButtonBorder
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Icon(
                                        imageVector = icon,
                                        contentDescription = null,
                                        tint = if (isSelected) EmeraldBadgeText else MaterialTheme.colorScheme.onSurface,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = label,
                                        fontSize = 12.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                        color = if (isSelected) EmeraldBadgeText else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Currency & Country Defaults Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "Portfolio Currency Defaults",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Configure global reporting and defaults for newly added holdings",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Master Currency
                    ExposedDropdownMenuBox(
                        expanded = masterCurrExpanded,
                        onExpandedChange = { masterCurrExpanded = !masterCurrExpanded },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = "${CurrencyHelper.getCurrencyFlag(masterCurrency)} $masterCurrency — ${CurrencyHelper.getCurrencyMeta(masterCurrency)?.name}",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Master Reporting Currency") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = masterCurrExpanded) },
                            modifier = Modifier
                                .menuAnchor()
                                .fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = masterCurrExpanded,
                            onDismissRequest = { masterCurrExpanded = false }
                        ) {
                            CurrencyHelper.SUPPORTED_CURRENCIES.forEach { meta ->
                                DropdownMenuItem(
                                    text = { Text("${meta.flag} ${meta.code} — ${meta.name}") },
                                    onClick = {
                                        masterCurrency = meta.code
                                        masterCurrExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = defaultCountry,
                        onValueChange = { defaultCountry = it },
                        label = { Text("Default Country for New Assets") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Default Currency
                    ExposedDropdownMenuBox(
                        expanded = defaultCurrExpanded,
                        onExpandedChange = { defaultCurrExpanded = !defaultCurrExpanded },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = "${CurrencyHelper.getCurrencyFlag(defaultCurrency)} $defaultCurrency",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Default Currency for New Assets") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = defaultCurrExpanded) },
                            modifier = Modifier
                                .menuAnchor()
                                .fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = defaultCurrExpanded,
                            onDismissRequest = { defaultCurrExpanded = false }
                        ) {
                            CurrencyHelper.SUPPORTED_CURRENCIES.forEach { meta ->
                                DropdownMenuItem(
                                    text = { Text("${meta.flag} ${meta.code} — ${meta.name}") },
                                    onClick = {
                                        defaultCurrency = meta.code
                                        defaultCurrExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = {
                            isSaving = true
                            onUpdateProfile(companyName, ownerName, masterCurrency, defaultCountry, defaultCurrency)
                            isSaving = false
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Save Profile & Preferences")
                    }
                }
            }
        }

        // Data Management Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "Data Management",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Import realistic financial sample data or clear all records",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedButton(
                        onClick = onImportSampleData,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(imageVector = Icons.Default.CloudDownload, contentDescription = null, tint = EmeraldPrimary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Load Sample Portfolio Data", color = EmeraldPrimary)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedButton(
                        onClick = { showClearConfirmDialog = true },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(imageVector = Icons.Default.DeleteSweep, contentDescription = null, tint = StatusRed)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Clear All Portfolio Data", color = StatusRed)
                    }
                }
            }
        }

        // Account / Sign Out Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Button(
                        onClick = onSignOut,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(imageVector = Icons.Default.Logout, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Sign Out of CapitalFlow")
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "CapitalFlow Native Android Version 1.2\nFirestore Database: ai-studio-remixcapitalflow",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }
            }
        }
    }

    if (showClearConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showClearConfirmDialog = false },
            title = { Text("Clear All Data") },
            text = { Text("This will permanently delete all investments, monthly tracker records, and funding records from your Firestore database. Continue?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showClearConfirmDialog = false
                        onClearAllData()
                    }
                ) {
                    Text("Clear All Data", color = StatusRed, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearConfirmDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
