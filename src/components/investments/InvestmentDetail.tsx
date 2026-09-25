import React, { useState } from 'react';
import { Investment } from '../../types';
import { useApp } from '../../context/AppContext';
import { calculateInvestmentFinancials } from '../../lib/calculations';
import { formatCurrency, getCurrencyFlag } from '../../lib/currency';
import { MonthlyTrackerTable } from './MonthlyTrackerTable';
import { CapitalRecoveryProgress } from '../dashboard/CapitalRecoveryProgress';
import { SummaryCard } from '../dashboard/SummaryCard';
import { AddInvestmentModal } from './AddInvestmentModal';
import { ConfirmDialog } from '../ConfirmDialog';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Landmark, 
  Wallet, 
  PieChart, 
  Info, 
  FileText,
  LogOut
} from 'lucide-react';

interface Props {
  investment: Investment;
  onBack: () => void;
  onDeleted: () => void;
}

export const InvestmentDetail: React.FC<Props> = ({
  investment,
  onBack,
  onDeleted,
}) => {
  const { 
    monthlyRecords, 
    rateInfo, 
    profile, 
    addMonthlyRecord, 
    updateMonthlyRecord, 
    deleteMonthlyRecord, 
    deleteInvestment 
  } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const masterCurrency = profile?.masterCurrency || 'SAR';
  const records = monthlyRecords[investment.id] || [];

  const financials = calculateInvestmentFinancials(
    investment,
    records,
    masterCurrency,
    rateInfo
  );

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteInvestment(investment.id);
      setIsDeleteConfirmOpen(false);
      onDeleted();
    } catch (err) {
      console.error('Failed to delete investment:', err);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = () => {
    switch (financials.status) {
      case 'Profit Generated':
        return 'bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 border-[#22A06B]/20 dark:border-emerald-800';
      case 'Operating at Loss':
        return 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'Break-even':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Target Period Approaching':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Target Period Missed':
        return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'Awaiting Capital':
      case 'No Activity':
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const isDifferentCurrency = investment.currency !== masterCurrency;
  const currencyFlag = getCurrencyFlag(investment.currency);

  return (
    <div className="space-y-6 pb-16">
      {/* ================= 1. INVESTMENT SUMMARY (TOP HEADER) ================= */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-2xs transition-colors">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-600 shadow-2xs transition-colors shrink-0"
            title="Back to portfolio"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] dark:text-gray-100 truncate">
                {investment.name}
              </h1>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadge()}`}>
                {financials.status}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#6B7280] dark:text-gray-400 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium text-[#1F2937] dark:text-gray-200">
                <span className="text-base leading-none">{currencyFlag}</span>
                <span>{investment.country}</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-semibold font-mono text-[11px]">
                <span>{currencyFlag}</span>
                <span>{investment.currency}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Started: {investment.startDate}
              </span>
              {investment.targetPeriod && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Target: {investment.targetPeriod}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Currency Conversion Alert Banner if currency differs */}
        {isDifferentCurrency && (
          <div className="mt-4 p-3.5 bg-[#EAF8F1]/70 dark:bg-emerald-950/40 border border-[#22A06B]/30 dark:border-emerald-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-[#22A06B] dark:text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-[#1F2937] dark:text-gray-100">
                  Multi-Currency Integration Active:
                </span>{' '}
                <span className="text-[#6B7280] dark:text-gray-400">
                  Original records are strictly preserved in {investment.currency}. Converted to Master Currency ({masterCurrency}) at rate{' '}
                  <strong className="text-[#1F2937] dark:text-gray-200 font-mono">1 {investment.currency} = {financials.rateToMaster.toFixed(4)} {masterCurrency}</strong>.
                </span>
              </div>
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Source: {financials.rateSource} ({financials.rateDate})
              {financials.isCachedRate && ' [Cached]'}
            </div>
          </div>
        )}
      </div>

      {/* ================= 2. MONTHLY TRACKER — PRIMARY ACTION ================= */}
      {/* Placed prominently near the top right after the summary */}
      <section aria-label="Monthly Tracker Section">
        <MonthlyTrackerTable
          investment={investment}
          records={records}
          onAddRecord={(data) => addMonthlyRecord(investment.id, data)}
          onUpdateRecord={(recId, data) => updateMonthlyRecord(investment.id, recId, data)}
          onDeleteRecord={(recId) => deleteMonthlyRecord(investment.id, recId)}
        />
      </section>

      {/* ================= 3 & 4. EXISTING INVESTMENT & FINANCIAL INFORMATION ================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1F2937] dark:text-gray-200 uppercase tracking-wider">
            Financial Position ({investment.currency})
          </h3>
          {isDifferentCurrency && (
            <span className="text-xs text-[#6B7280] dark:text-gray-400">
              Master Equiv.: ≈ {formatCurrency(financials.convertedTotalInvested, masterCurrency)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            title="Initial Capital"
            value={formatCurrency(financials.initialCapital, investment.currency)}
            subtitle={
              isDifferentCurrency
                ? `≈ ${formatCurrency(financials.convertedTotalInvested, masterCurrency)}`
                : 'Principal amount'
            }
            icon={<Landmark className="w-4 h-4 text-[#22A06B] dark:text-emerald-400" />}
          />

          <SummaryCard
            title="Additional Capital"
            value={formatCurrency(financials.additionalCapital, investment.currency)}
            subtitle={`Withdrawals: ${formatCurrency(financials.withdrawals, investment.currency)}`}
            icon={<Wallet className="w-4 h-4" />}
          />

          <SummaryCard
            title="Total Invested Capital"
            value={formatCurrency(financials.totalInvestedCapital, investment.currency)}
            subtitle="Initial + Additions - Withdrawals"
            badgeType="primary"
            badge="Net Capital"
            icon={<PieChart className="w-4 h-4" />}
          />

          <SummaryCard
            title="Total Return"
            value={formatCurrency(financials.totalReturn, investment.currency)}
            subtitle={`Expenses: ${formatCurrency(financials.totalExpense, investment.currency)}`}
            valueColor="text-[#22A06B] dark:text-emerald-400"
            icon={<TrendingUp className="w-4 h-4 text-[#22A06B] dark:text-emerald-400" />}
          />

          <SummaryCard
            title="Total Expense"
            value={formatCurrency(financials.totalExpense, investment.currency)}
            subtitle="Operational expenses"
            valueColor="text-gray-700 dark:text-gray-300"
          />

          <SummaryCard
            title="Net Profit"
            value={formatCurrency(financials.netProfit, investment.currency)}
            subtitle="Income - Expense"
            valueColor={financials.netProfit >= 0 ? 'text-[#22A06B] dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
            badge={financials.netProfit >= 0 ? 'Profitable' : 'Deficit'}
            badgeType={financials.netProfit >= 0 ? 'positive' : 'negative'}
          />

          <SummaryCard
            title="Investment ROI"
            value={`${financials.roi.toFixed(2)}%`}
            subtitle="Net Profit / Invested × 100"
            valueColor={financials.roi >= 0 ? 'text-[#22A06B] dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
            badge={financials.roi >= 0 ? '+ROI' : '-ROI'}
            badgeType={financials.roi >= 0 ? 'positive' : 'negative'}
          />

          <SummaryCard
            title="Remaining Unrecovered"
            value={formatCurrency(financials.remainingCapital, investment.currency)}
            subtitle={`Recovered: ${formatCurrency(financials.capitalRecovered, investment.currency)}`}
            badge={financials.recoveryStatus}
            badgeType={financials.recoveryStatus === 'Profit Phase' ? 'positive' : 'warning'}
          />
        </div>
      </div>

      {/* ================= 5. CAPITAL RECOVERY ================= */}
      <CapitalRecoveryProgress
        totalInvested={financials.totalInvestedCapital}
        capitalRecovered={financials.capitalRecovered}
        remainingCapital={financials.remainingCapital}
        recoveryPercentage={financials.recoveryPercentage}
        status={financials.recoveryStatus}
        currency={investment.currency}
      />

      {/* ================= 6. EXISTING OTHER SECTIONS (NOTES) ================= */}
      {investment.notes && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-2">
            <FileText className="w-4 h-4 text-[#22A06B]" />
            <span>Investment Thesis & Contract Notes</span>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
            {investment.notes}
          </p>
        </div>
      )}

      {/* ================= 7. SECONDARY ACTIONS (EDIT / EXIT / DELETE) ================= */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-[#1F2937] dark:text-gray-100">
              Secondary Asset Actions
            </h4>
            <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
              Edit investment asset parameters, return to portfolio, or remove this asset from your portfolio.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Edit */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-600 shadow-2xs transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Asset</span>
            </button>

            {/* Exit */}
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-600 shadow-2xs transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit to Portfolio</span>
            </button>

            {/* Delete */}
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-800 shadow-2xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Investment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AddInvestmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        investmentToEdit={investment}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Investment Asset"
        message={`Are you sure you want to permanently delete "${investment.name}" and all of its associated monthly records? This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Investment'}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
};
