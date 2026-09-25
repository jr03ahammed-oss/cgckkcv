import React from 'react';
import { CapitalRecoveryStatus } from '../../types';
import { formatCurrency } from '../../lib/currency';
import { CheckCircle2, TrendingUp, Clock } from 'lucide-react';

interface Props {
  totalInvested: number;
  capitalRecovered: number;
  remainingCapital: number;
  recoveryPercentage: number;
  status: CapitalRecoveryStatus;
  currency: string;
  isConsolidated?: boolean;
}

export const CapitalRecoveryProgress: React.FC<Props> = ({
  totalInvested,
  capitalRecovered,
  remainingCapital,
  recoveryPercentage,
  status,
  currency,
  isConsolidated = false,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'Profit Phase':
        return {
          icon: <TrendingUp className="w-4 h-4 text-[#22A06B] dark:text-emerald-400" />,
          text: 'Profit Phase',
          bg: 'bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 border-[#22A06B]/30 dark:border-emerald-800',
          desc: '100% of original capital returned! All further income is pure net profit.',
        };
      case 'Capital Recovered':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-[#22A06B] dark:text-emerald-400" />,
          text: 'Capital Recovered',
          bg: 'bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 border-[#22A06B]/30 dark:border-emerald-800',
          desc: 'Principal investment fully recouped (Break-even reached).',
        };
      case 'Capital Recovery in Progress':
      default:
        return {
          icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          text: 'Capital Recovery in Progress',
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
          desc: 'Generating returns towards full principal recovery.',
        };
    }
  };

  const statusConfig = getStatusBadge();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200/90 dark:border-gray-700 shadow-2xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#1F2937] dark:text-gray-100">Capital Recovery Tracking</h3>
            {isConsolidated && (
              <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                Portfolio Consolidated
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">{statusConfig.desc}</p>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg}`}
        >
          {statusConfig.icon}
          <span>{statusConfig.text}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B7280] dark:text-gray-400 font-medium">Principal Recouped</span>
          <span className="font-bold text-[#1F2937] dark:text-gray-100 font-mono">
            {recoveryPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden p-0.5 border border-gray-200 dark:border-gray-600">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              recoveryPercentage >= 100
                ? 'bg-[#22A06B]'
                : recoveryPercentage >= 50
                ? 'bg-emerald-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, recoveryPercentage))}%` }}
          />
        </div>
      </div>

      {/* Metric 3-Column Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="p-3 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="text-[11px] font-medium text-[#6B7280] dark:text-gray-400">Total Invested Capital</div>
          <div className="text-base font-bold text-[#1F2937] dark:text-gray-100 font-mono mt-1">
            {formatCurrency(totalInvested, currency)}
          </div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Initial + Additions - Withdrawals</div>
        </div>

        <div className="p-3 bg-[#EAF8F1]/60 dark:bg-emerald-950/40 rounded-xl border border-[#22A06B]/20 dark:border-emerald-800/40">
          <div className="text-[11px] font-medium text-[#22A06B] dark:text-emerald-400">Capital Recovered</div>
          <div className="text-base font-bold text-[#22A06B] dark:text-emerald-400 font-mono mt-1">
            {formatCurrency(capitalRecovered, currency)}
          </div>
          <div className="text-[10px] text-[#22A06B]/80 dark:text-emerald-400/80 mt-0.5">Cumulative cash return</div>
        </div>

        <div className="p-3 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="text-[11px] font-medium text-[#6B7280] dark:text-gray-400">Remaining Capital to Recover</div>
          <div className="text-base font-bold text-[#1F2937] dark:text-gray-100 font-mono mt-1">
            {formatCurrency(remainingCapital, currency)}
          </div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Unrecouped balance</div>
        </div>
      </div>
    </div>
  );
};
