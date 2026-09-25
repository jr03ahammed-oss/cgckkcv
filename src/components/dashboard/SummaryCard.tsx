import React from 'react';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  badge?: string;
  badgeType?: 'positive' | 'negative' | 'neutral' | 'warning' | 'primary';
  icon?: React.ReactNode;
  valueColor?: string;
}

export const SummaryCard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  badge,
  badgeType = 'neutral',
  icon,
  valueColor,
}) => {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'positive':
        return 'bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 border border-[#22A06B]/20 dark:border-emerald-800';
      case 'negative':
        return 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'primary':
        return 'bg-[#22A06B] text-white';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200/90 dark:border-gray-700 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-[#F7F9F8] dark:bg-gray-700/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-700">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-1">
        <div
          className={`text-xl sm:text-2xl font-bold tracking-tight ${
            valueColor ? valueColor : 'text-[#1F2937] dark:text-gray-100'
          }`}
        >
          {value}
        </div>

        {(subtitle || badge) && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {badge && (
              <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${getBadgeStyle()}`}>
                {badge}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-[#6B7280] dark:text-gray-400">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
