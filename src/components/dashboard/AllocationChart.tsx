import React from 'react';
import { Investment, MonthlyRecord, CurrencyRateInfo } from '../../types';
import { calculateInvestmentFinancials } from '../../lib/calculations';
import { formatCurrency, formatCompactCurrency } from '../../lib/currency';
import { PieChart, TrendingUp } from 'lucide-react';

interface Props {
  investments: Investment[];
  monthlyRecords: Record<string, MonthlyRecord[]>;
  masterCurrency: string;
  rateInfo: CurrencyRateInfo;
}

export const AllocationChart: React.FC<Props> = ({
  investments,
  monthlyRecords,
  masterCurrency,
  rateInfo,
}) => {
  // Compute allocation per investment in master currency
  const items = investments.map((inv) => {
    const recs = monthlyRecords[inv.id] || [];
    const f = calculateInvestmentFinancials(inv, recs, masterCurrency, rateInfo);
    return {
      id: inv.id,
      name: inv.name,
      country: inv.country,
      currency: inv.currency,
      capitalInMaster: f.convertedTotalInvested,
      netProfitInMaster: f.convertedNetProfit,
      roi: f.roi,
    };
  });

  const totalCapital = items.reduce((sum, item) => sum + item.capitalInMaster, 0);

  // Group monthly profits across all investments chronologically
  const monthlyAggregates: Record<string, number> = {};
  investments.forEach((inv) => {
    const recs = monthlyRecords[inv.id] || [];
    const f = calculateInvestmentFinancials(inv, recs, masterCurrency, rateInfo);
    recs.forEach((r) => {
      const net = (r.income || 0) - (r.expense || 0);
      const convertedNet = net * f.rateToMaster;
      const key = r.month || r.date.substring(0, 7);
      monthlyAggregates[key] = (monthlyAggregates[key] || 0) + convertedNet;
    });
  });

  const monthKeys = Object.keys(monthlyAggregates).slice(-6); // last 6 months
  const maxMonthValue = Math.max(1, ...monthKeys.map((k) => Math.abs(monthlyAggregates[k] || 0)));

  // Distinct clean color palette for assets
  const colors = [
    '#22A06B', // emerald
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#F59E0B', // amber
    '#06B6D4', // cyan
    '#EC4899', // pink
    '#64748B', // slate
  ];

  if (investments.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 1. Capital Allocation Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200/90 dark:border-gray-700 shadow-2xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#22A06B] dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-[#1F2937] dark:text-gray-100">Capital Allocation</h3>
          </div>
          <span className="text-xs text-[#6B7280] dark:text-gray-400 font-mono">
            Total: {formatCurrency(totalCapital, masterCurrency)}
          </span>
        </div>

        {/* Stacked bar visual */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-700 mb-4 border border-gray-200 dark:border-gray-600">
          {items.map((item, index) => {
            const pct = totalCapital > 0 ? (item.capitalInMaster / totalCapital) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={item.id}
                className="h-full transition-all duration-300 relative group"
                style={{
                  width: `${pct}%`,
                  backgroundColor: colors[index % colors.length],
                }}
                title={`${item.name}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>

        {/* Asset Allocation Legend & Percentages */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {items.map((item, index) => {
            const pct = totalCapital > 0 ? (item.capitalInMaster / totalCapital) * 100 : 0;
            const color = colors[index % colors.length];

            return (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-semibold text-[#1F2937] dark:text-gray-200 truncate">{item.name}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">({item.country})</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {formatCompactCurrency(item.capitalInMaster, masterCurrency)}
                  </span>
                  <span className="font-bold text-[#1F2937] dark:text-gray-200 w-12 text-right">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Monthly Profit Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200/90 dark:border-gray-700 shadow-2xs flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#22A06B] dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-[#1F2937] dark:text-gray-100">Consolidated Profit Trend</h3>
            </div>
            <span className="text-xs text-[#6B7280] dark:text-gray-400">
              In {masterCurrency}
            </span>
          </div>

          {monthKeys.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#6B7280] dark:text-gray-400">
              Add monthly records to view multi-month net profit trajectory.
            </div>
          ) : (
            <div className="pt-2">
              <div className="h-32 flex items-end gap-3 justify-between px-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                {monthKeys.map((k) => {
                  const val = monthlyAggregates[k] || 0;
                  const heightPercent = maxMonthValue > 0 ? (Math.abs(val) / maxMonthValue) * 100 : 0;
                  const isPositive = val >= 0;

                  return (
                    <div key={k} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20">
                        {k}: {formatCurrency(val, masterCurrency)}
                      </div>

                      <div className="w-full h-24 flex items-end justify-center">
                        <div
                          className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                            isPositive ? 'bg-[#22A06B] hover:bg-[#1b8357]' : 'bg-red-500 hover:bg-red-600'
                          }`}
                          style={{ height: `${Math.max(8, heightPercent)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#6B7280] dark:text-gray-400 font-medium truncate w-full text-center">
                        {k}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-[#6B7280] dark:text-gray-400">
          <span>Dynamically converted from original investment currencies</span>
          <span className="font-semibold text-[#22A06B] dark:text-emerald-400">ECB Verified Rates</span>
        </div>
      </div>
    </div>
  );
};
