import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, getExchangeRate, getCurrencyFlag } from '../../lib/currency';
import { FundingRecord, FundingType, FundingStatus } from '../../types';
import { AddFundingModal } from './AddFundingModal';
import { ConfirmDialog } from '../ConfirmDialog';
import { 
  Plus, 
  Download, 
  Filter, 
  Layers, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  Edit2, 
  Trash2,
  PieChart,
  Users
} from 'lucide-react';

export const FundingPage: React.FC = () => {
  const { 
    fundingRecords, 
    fundingSummary, 
    profile, 
    rateInfo, 
    deleteFundingRecord 
  } = useApp();

  const masterCurrency = profile?.masterCurrency || 'SAR';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FundingRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtered records
  const filteredRecords = useMemo(() => {
    return fundingRecords.filter((rec) => {
      if (typeFilter !== 'all' && rec.type !== typeFilter) return false;
      if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
      return true;
    });
  }, [fundingRecords, typeFilter, statusFilter]);

  // Handle Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    const timestamp = new Date().toISOString().split('T')[0];

    csvContent += `CapitalFlow Funding & Allocation Ledger\n`;
    csvContent += `Generated Date: ${timestamp}, Master Currency: ${masterCurrency}\n\n`;
    csvContent += 'Date,Source / Investor,Type,Amount,Currency,Master Value (' + masterCurrency + '),Allocation,Status,Notes\n';

    filteredRecords.forEach((r) => {
      const rate = getExchangeRate(r.currency, masterCurrency, rateInfo.rates);
      const converted = (r.amount || 0) * rate;
      const row = [
        r.date,
        `"${r.source}"`,
        `"${r.type}"`,
        r.amount,
        r.currency,
        converted.toFixed(2),
        `"${r.allocatedInvestmentName || 'Unallocated Pool'}"`,
        r.status,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CapitalFlow_Funding_Ledger_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeBadgeClass = (type: FundingType) => {
    switch (type) {
      case 'Capital Injection':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Partner Contribution':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Reinvested Returns':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Debt / Credit Facility':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Capital Distribution':
      case 'Withdrawal':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusBadgeClass = (status: FundingStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-[#22A06B] dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40';
      case 'Committed':
        return 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/40';
      case 'Pending':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#22A06B]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] dark:text-gray-100">
              Funding & Capital Allocation
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-1">
            Track capital injections, partner contributions, credit facilities, and deployment to assets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#22A06B]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingRecord(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#22A06B] hover:bg-[#1b8357] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Funding</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Funded */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-gray-400">
            <span>Total Capital Funded</span>
            <ArrowUpRight className="w-4 h-4 text-[#22A06B]" />
          </div>
          <div className="text-xl font-bold text-[#1F2937] dark:text-gray-100 font-mono mt-2">
            {formatCurrency(fundingSummary.totalFundedMaster, masterCurrency)}
          </div>
          <div className="text-[11px] text-[#6B7280] dark:text-gray-400 mt-1">
            Across {fundingRecords.length} capital transactions
          </div>
        </div>

        {/* Total Allocated */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-gray-400">
            <span>Allocated to Investments</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-[#1F2937] dark:text-gray-100 font-mono mt-2">
            {formatCurrency(fundingSummary.totalAllocatedMaster, masterCurrency)}
          </div>
          <div className="text-[11px] text-[#6B7280] dark:text-gray-400 mt-1">
            {fundingSummary.totalFundedMaster > 0 
              ? `${((fundingSummary.totalAllocatedMaster / fundingSummary.totalFundedMaster) * 100).toFixed(1)}% deployed` 
              : '0% deployed'}
          </div>
        </div>

        {/* Liquid Reserve / Unallocated */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-gray-400">
            <span>Unallocated Liquidity Reserve</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-[#22A06B] dark:text-emerald-400 font-mono mt-2">
            {formatCurrency(fundingSummary.unallocatedReserveMaster, masterCurrency)}
          </div>
          <div className="text-[11px] text-[#6B7280] dark:text-gray-400 mt-1">
            Available for opportunistic deals
          </div>
        </div>

        {/* Capital Distributed */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-gray-400">
            <span>Returned / Distributed</span>
            <ArrowDownLeft className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-gray-700 dark:text-gray-300 font-mono mt-2">
            {formatCurrency(fundingSummary.totalDistributedMaster, masterCurrency)}
          </div>
          <div className="text-[11px] text-[#6B7280] dark:text-gray-400 mt-1">
            Returned to partners / owners
          </div>
        </div>
      </div>

      {/* Funding Sources & Investor Equity Breakdown */}
      {fundingSummary.sourceBreakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            <Users className="w-4 h-4 text-[#22A06B]" />
            <h2 className="text-sm font-bold text-[#1F2937] dark:text-gray-100">
              Funding Sources & Equity Distribution
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fundingSummary.sourceBreakdown.map((src) => (
              <div 
                key={src.source} 
                className="p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200/80 dark:border-gray-700 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1F2937] dark:text-gray-200 truncate">
                    {src.source}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#22A06B] dark:text-emerald-400">
                    {src.sharePercent.toFixed(1)}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#22A06B] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, src.sharePercent)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-gray-400 font-mono">
                  <span>{formatCurrency(src.totalAmountMaster, masterCurrency)}</span>
                  <span>{src.count} {src.count === 1 ? 'transaction' : 'transactions'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[#6B7280] dark:text-gray-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent font-semibold text-[#1F2937] dark:text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Capital Injection">Capital Injection</option>
              <option value="Partner Contribution">Partner Contribution</option>
              <option value="Reinvested Returns">Reinvested Returns</option>
              <option value="Debt / Credit Facility">Debt / Credit Facility</option>
              <option value="Capital Distribution">Capital Distribution</option>
              <option value="Withdrawal">Withdrawal</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
            <span className="text-[#6B7280] dark:text-gray-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-semibold text-[#1F2937] dark:text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Committed">Committed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-[#6B7280] dark:text-gray-400">
          Showing {filteredRecords.length} of {fundingRecords.length} records
        </div>
      </div>

      {/* Funding Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1F2937] dark:text-gray-100">
            Funding Transactions Ledger
          </h3>
          <span className="text-xs text-[#6B7280] dark:text-gray-400">
            Master Unit: {masterCurrency}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1F2937] dark:text-gray-200 border-collapse">
            <thead>
              <tr className="bg-[#F7F9F8] dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Source / Investor</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-right">Amount (Original)</th>
                <th className="py-3 px-3 text-right">Master Value ({masterCurrency})</th>
                <th className="py-3 px-4">Allocated Asset</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-mono text-[12px]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 dark:text-gray-500 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wallet className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm">No funding records found.</p>
                      <button
                        onClick={() => {
                          setEditingRecord(null);
                          setIsModalOpen(true);
                        }}
                        className="mt-1 px-3 py-1.5 bg-[#22A06B] text-white text-xs font-semibold rounded-lg hover:bg-[#1b8357] transition-colors"
                      >
                        + Add First Funding Record
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const rate = getExchangeRate(r.currency, masterCurrency, rateInfo.rates);
                  const convertedAmount = (r.amount || 0) * rate;

                  return (
                    <tr 
                      key={r.id} 
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-sans text-gray-800 dark:text-gray-300 whitespace-nowrap">
                        {r.date}
                      </td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-[#1F2937] dark:text-gray-100">
                        {r.source}
                      </td>
                      <td className="py-3.5 px-3 font-sans whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium border ${getTypeBadgeClass(r.type)}`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-[#1F2937] dark:text-gray-200">
                        <span className="inline-flex items-center gap-1 justify-end">
                          <span className="text-xs select-none">{getCurrencyFlag(r.currency)}</span>
                          <span>{formatCurrency(r.amount, r.currency)}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-[#22A06B] dark:text-emerald-400">
                        <span className="inline-flex items-center gap-1 justify-end">
                          <span className="text-xs select-none">{getCurrencyFlag(masterCurrency)}</span>
                          <span>{formatCurrency(convertedAmount, masterCurrency)}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-xs text-[#6B7280] dark:text-gray-300">
                        <span className="font-medium text-[#1F2937] dark:text-gray-200">
                          {r.allocatedInvestmentName || 'Unallocated Pool'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-sans">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold border ${getStatusBadgeClass(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-xs text-[#6B7280] dark:text-gray-400 max-w-xs truncate" title={r.notes}>
                        {r.notes || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingRecord(r);
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(r.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Add / Edit Funding Modal */}
      <AddFundingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        editRecord={editingRecord}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Funding Transaction"
        message="Are you sure you want to permanently delete this funding entry? This will update your total capital and reserve balances."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (deletingId) {
            await deleteFundingRecord(deletingId);
            setDeletingId(null);
          }
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
