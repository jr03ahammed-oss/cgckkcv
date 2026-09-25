import React from 'react';
import { SyncStatus } from '../types';

interface Props {
  status: SyncStatus;
  lastSynced: Date | null;
  onSyncNow?: () => void;
  compact?: boolean;
}

export const SyncStatusBadge: React.FC<Props> = ({
  status,
  lastSynced,
  onSyncNow,
  compact = false,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return {
          icon: <span className="text-[#22A06B] dark:text-emerald-400 font-semibold flex items-center gap-1">☁✓</span>,
          text: 'Synced',
          bgColor: 'bg-[#EAF8F1] dark:bg-emerald-950/60',
          textColor: 'text-[#22A06B] dark:text-emerald-400',
          border: 'border-[#22A06B]/20 dark:border-emerald-800',
        };
      case 'syncing':
        return {
          icon: <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 animate-spin">☁↻</span>,
          text: 'Syncing',
          bgColor: 'bg-blue-50 dark:bg-blue-950/60',
          textColor: 'text-blue-700 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800',
        };
      case 'offline':
        return {
          icon: <span className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1">☁</span>,
          text: 'Offline',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-600 dark:text-gray-400',
          border: 'border-gray-200 dark:border-gray-700',
        };
      case 'error':
        return {
          icon: <span className="text-red-500 dark:text-red-400 font-semibold flex items-center gap-1">☁!</span>,
          text: 'Sync problem',
          bgColor: 'bg-red-50 dark:bg-red-950/60',
          textColor: 'text-red-600 dark:text-red-400',
          border: 'border-red-200 dark:border-red-800',
        };
    }
  };

  const config = getStatusConfig();

  const formattedTime = lastSynced
    ? new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(lastSynced)
    : '';

  return (
    <div
      onClick={onSyncNow}
      title={
        status === 'synced'
          ? `All changes saved to Firebase. Last synced at ${formattedTime}`
          : status === 'syncing'
          ? 'Synchronizing data with Cloud Firestore...'
          : status === 'offline'
          ? 'Running in offline mode. Changes will sync when online.'
          : 'Sync issue detected. Click to retry.'
      }
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer select-none ${config.bgColor} ${config.textColor} ${config.border}`}
    >
      <span className="text-sm leading-none">{config.icon}</span>
      {!compact && <span>{config.text}</span>}
      {!compact && formattedTime && status === 'synced' && (
        <span className="text-[10px] opacity-75 font-normal">({formattedTime})</span>
      )}
    </div>
  );
};
