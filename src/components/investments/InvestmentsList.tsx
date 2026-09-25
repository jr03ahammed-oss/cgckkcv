import React, { useState, useMemo } from 'react';
import { Investment } from '../../types';
import { useApp } from '../../context/AppContext';
import { calculateInvestmentFinancials } from '../../lib/calculations';
import { formatCurrency, getCurrencyFlag } from '../../lib/currency';
import { Plus, Search, Filter, ArrowUpRight, Globe, Layers } from 'lucide-react';

interface Props {
  onSelectInvestment: (investment: Investment) => void;
  onOpenAddInvestment: () => void;
  title?: string;
  showHeaderActions?: boolean;
}

export const InvestmentsList: React.FC<Props> = ({
  onSelectInvestment,
  onOpenAddInvestment,
  title = 'Investment Overview',
  showHeaderActions = true,
}) => {
  const { investments, monthlyRecords, rateInfo, profile } = useApp();
  const masterCurrency = profile?.masterCurrency || 'SAR';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filter investments
  const filtered = useMemo(() => {
    return investments.filter((inv) => {
      const matchSearch =
        inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.currency.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (statusFilter === 'ALL') return true;

      const records = monthlyRecords[inv.id] || [];
      const f = calculateInvestmentFinancials(inv, records, masterCurrency, rateInfo);
      return f.status === statusFilter || f.recoveryStatus === statusFilter;
    });
  }, [investments, monthlyRecords, masterCurrency, rateInfo, searchTerm, statusFilter]);

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'Profit Generated':
      case 'Profit Phase':
      case 'Capital Recovered':
        return 'bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 border-[#22A06B]/20 dark:border-emerald-800';
      case 'Operating at Loss':
      case 'Target Period Missed':
        return 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'Break-even':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Target Period Approaching':
      case 'Capital Recovery in Progress':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xs transition-colors">
      {/* Header bar */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#1F2937] dark:text-gray-100">{title}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400">
              {investments.length} {investments.length === 1 ? 'Asset' : 'Assets'}
            </span>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
            Click any investment to view its detailed ledger, monthly returns, and capital recovery progress.
          </p>
        </div>

        {showHeaderActions && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenAddInvestment}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#22A06B] hover:bg-[#1b8357] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Investment</span>
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="px-5 py-3 bg-[#F7F9F8] dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, country, or currency..."
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-[#1F2937] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#22A06B] focus:border-[#22A06B]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs text-[#1F2937] dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Profit Generated">Profit Generated</option>
            <option value="Profit Phase">Profit Phase</option>
            <option value="Capital Recovery in Progress">Recovery in Progress</option>
            <option value="Capital Recovered">Capital Recovered</option>
            <option value="Operating at Loss">Operating at Loss</option>
            <option value="Break-even">Break-even</option>
            <option value="No Activity">No Activity</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#1F2937] dark:text-gray-200 border-collapse">
          <thead>
            <tr className="bg-[#F7F9F8] dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider select-none">
              <th className="py-3 px-4">Investment Name</th>
              <th className="py-3 px-3">Country</th>
              <th className="py-3 px-3">Currency</th>
              <th className="py-3 px-3 text-right">Total Capital</th>
              <th className="py-3 px-3 text-right">Total Return</th>
              <th className="py-3 px-3 text-right">Total Expense</th>
              <th className="py-3 px-3 text-right">Net Profit</th>
              <th className="py-3 px-3 text-right">ROI</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-4 text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-mono text-[12px]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-[#6B7280] dark:text-gray-400 font-sans">
                  <div className="max-w-sm mx-auto text-center space-y-2">
                    <Layers className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm font-semibold text-[#1F2937] dark:text-gray-100">No investments found</p>
                    <p className="text-xs text-[#6B7280] dark:text-gray-400">
                      {searchTerm || statusFilter !== 'ALL'
                        ? 'Try clearing the search or filter.'
                        : 'Get started by clicking "+ Add Investment" to create your first portfolio asset.'}
                    </p>
                    {!searchTerm && statusFilter === 'ALL' && (
                      <button
                        onClick={onOpenAddInvestment}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#22A06B] text-white text-xs font-semibold rounded-xl shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Investment</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((inv) => {
                const records = monthlyRecords[inv.id] || [];
                const f = calculateInvestmentFinancials(inv, records, masterCurrency, rateInfo);
                const isProfitable = f.netProfit > 0;
                const isLoss = f.netProfit < 0;

                return (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvestment(inv)}
                    className="hover:bg-[#F4F9F6] dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                  >
                    {/* Investment Name */}
                    <td className="py-3.5 px-4 font-semibold text-[#1F2937] dark:text-gray-100 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors">
                          {inv.name}
                        </span>
                        {inv.currency !== masterCurrency && (
                          <span
                            title={`Converted to ${masterCurrency} in consolidated reports`}
                            className="text-[10px] text-gray-400 dark:text-gray-500 font-normal"
                          >
                            (≈ {formatCurrency(f.convertedTotalInvested, masterCurrency)})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Country */}
                    <td className="py-3.5 px-3 text-[#6B7280] dark:text-gray-400 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base select-none leading-none">{getCurrencyFlag(inv.currency)}</span>
                        <span>{inv.country}</span>
                      </div>
                    </td>

                    {/* Currency */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                        <span className="select-none">{getCurrencyFlag(inv.currency)}</span>
                        <span>{inv.currency}</span>
                      </span>
                    </td>

                    {/* Total Capital */}
                    <td className="py-3.5 px-3 text-right font-medium text-[#1F2937] dark:text-gray-200">
                      {formatCurrency(f.totalInvestedCapital, inv.currency)}
                    </td>

                    {/* Total Return */}
                    <td className="py-3.5 px-3 text-right text-[#22A06B] dark:text-emerald-400 font-semibold">
                      {formatCurrency(f.totalReturn, inv.currency)}
                    </td>

                    {/* Total Expense */}
                    <td className="py-3.5 px-3 text-right text-gray-600 dark:text-gray-400">
                      {formatCurrency(f.totalExpense, inv.currency)}
                    </td>

                    {/* Net Profit */}
                    <td
                      className={`py-3.5 px-3 text-right font-bold ${
                        isProfitable
                          ? 'text-[#22A06B] dark:text-emerald-400'
                          : isLoss
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {formatCurrency(f.netProfit, inv.currency)}
                    </td>

                    {/* ROI */}
                    <td
                      className={`py-3.5 px-3 text-right font-bold ${
                        f.roi > 0
                          ? 'text-[#22A06B] dark:text-emerald-400'
                          : f.roi < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {f.roi.toFixed(1)}%
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center font-sans">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusBadge(
                          f.status
                        )}`}
                      >
                        {f.status}
                      </span>
                    </td>

                    {/* Action Arrow */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 group-hover:bg-[#EAF8F1] dark:group-hover:bg-emerald-950/60 transition-all">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
