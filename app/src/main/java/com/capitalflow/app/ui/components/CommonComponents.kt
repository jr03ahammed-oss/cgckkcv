package com.capitalflow.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.capitalflow.app.model.CapitalRecoveryStatus
import com.capitalflow.app.model.InvestmentFinancialStatus
import com.capitalflow.app.model.SyncStatus
import com.capitalflow.app.ui.theme.*

@Composable
fun SyncStatusChip(status: SyncStatus) {
    val (bgColor, textColor, label, icon) = when (status) {
        SyncStatus.SYNCED -> Quad(Color(0xFFEAF8F1), Color(0xFF1B8357), "Cloud Synced", Icons.Default.CloudDone)
        SyncStatus.SYNCING -> Quad(Color(0xFFEFF6FF), Color(0xFF1D4ED8), "Syncing...", Icons.Default.CloudSync)
        SyncStatus.OFFLINE -> Quad(Color(0xFFFEF3C7), Color(0xFFB45309), "Offline Cache", Icons.Default.CloudOff)
        SyncStatus.ERROR -> Quad(Color(0xFFFEE2E2), Color(0xFFB91C1C), "Sync Error", Icons.Default.ErrorOutline)
    }

    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = textColor,
            modifier = Modifier.size(13.dp)
        )
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = textColor
        )
    }
}

private data class Quad<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)

@Composable
fun RecoveryBadge(status: CapitalRecoveryStatus) {
    val (bg, fg) = when (status) {
        CapitalRecoveryStatus.IN_PROGRESS -> Pair(Color(0xFFEFF6FF), Color(0xFF1D4ED8))
        CapitalRecoveryStatus.RECOVERED -> Pair(Color(0xFFEAF8F1), Color(0xFF1B8357))
        CapitalRecoveryStatus.PROFIT_PHASE -> Pair(Color(0xFFF3E8FF), Color(0xFF7E22CE))
    }

    Text(
        text = status.label,
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        color = fg,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bg)
            .padding(horizontal = 8.dp, vertical = 3.dp)
    )
}

@Composable
fun FinancialBadge(status: InvestmentFinancialStatus) {
    val (bg, fg) = when (status) {
        InvestmentFinancialStatus.PROFIT_GENERATED -> Pair(Color(0xFFEAF8F1), Color(0xFF1B8357))
        InvestmentFinancialStatus.OPERATING_AT_LOSS -> Pair(Color(0xFFFEE2E2), Color(0xFFB91C1C))
        InvestmentFinancialStatus.BREAK_EVEN -> Pair(Color(0xFFFEF3C7), Color(0xFFB45309))
        InvestmentFinancialStatus.TARGET_APPROACHING -> Pair(Color(0xFFFFFBEB), Color(0xFFD97706))
        InvestmentFinancialStatus.TARGET_MISSED -> Pair(Color(0xFFFEF2F2), Color(0xFFDC2626))
        else -> Pair(Color(0xFFF3F4F6), Color(0xFF4B5563))
    }

    Text(
        text = status.label,
        fontSize = 11.sp,
        fontWeight = FontWeight.Medium,
        color = fg,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bg)
            .padding(horizontal = 8.dp, vertical = 3.dp)
    )
}

@Composable
fun SummaryKpiCard(
    title: String,
    value: String,
    subtitle: String? = null,
    icon: ImageVector,
    iconColor: Color = EmeraldPrimary,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .padding(14.dp)
                .fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f),
                    fontWeight = FontWeight.Medium
                )
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(iconColor.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = iconColor,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            if (!subtitle.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                )
            }
        }
    }
}

@Composable
fun CapitalRecoveryProgressBar(
    percentage: Double,
    recoveredFormatted: String,
    totalFormatted: String,
    status: CapitalRecoveryStatus,
    modifier: Modifier = Modifier
) {
    val progress = (percentage / 100.0).coerceIn(0.0, 1.0).toFloat()
    val barColor = when (status) {
        CapitalRecoveryStatus.PROFIT_PHASE -> Color(0xFF8B5CF6)
        CapitalRecoveryStatus.RECOVERED -> EmeraldPrimary
        CapitalRecoveryStatus.IN_PROGRESS -> Color(0xFF3B82F6)
    }

    Card(
        modifier = modifier.fillMaxWidth(),
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
                Text(
                    text = "Capital Recovery Progress",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                RecoveryBadge(status = status)
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Linear Progress Indicator
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(10.dp)
                    .clip(RoundedCornerShape(5.dp)),
                color = barColor,
                trackColor = barColor.copy(alpha = 0.15f)
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "$recoveredFormatted recovered (${String.format(java.util.Locale.US, "%.1f", percentage)}%)",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Target: $totalFormatted",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
        }
    }
}
