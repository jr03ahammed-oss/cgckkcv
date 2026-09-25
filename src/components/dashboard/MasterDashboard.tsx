import React from 'react';
import { useApp } from '../../context/AppContext';
import { SummaryCard } from './SummaryCard';
import { CapitalRecoveryProgress } from './CapitalRecoveryProgress';
import { AllocationChart } from './AllocationChart';
import { InvestmentsList } from '../investments/InvestmentsList';
import { formatCurrency, SUPPORTED_CURRENCIES, getCurrencyFlag } from '../../lib/currency';
import { Investment } from '../../types';
import { 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  ShieldCheck, 
  Clock, 
  Layers, 
  ChevronDown, 
  Sparkles, 
  Building2,
  Plus
} from 'lucide-react';

interface Props {
  onSelectInvestment: (investment: Investment) => void;
  onOpenAddInvestment: () => void;
}

export const MasterDashboard: React.FC<Props> = ({
  onSelectInvestment,
  onOpenAddInvestment,
}) => {
  const { 
    portfolioSummary, 
    profile, 
    setMasterCurrency, 
    investments, 
    monthlyRecords, 
    rateInfo,
    importSampleData 
  } = useApp();

  const masterCurrency = profile?.masterCurrency || 'SAR';
  const companyName = profile?.companyName || 'Vayxon Capital';
  const ownerName = profile?.ownerName || '';

  const isNetProfitPositive = portfolioSummary.netProfit >= 0;

  return (
    <div className="space-y-6 pb-12">
      {/* ================= TOP DASHBOARD BANNER ================= */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={companyName}
              className="w-14 h-14 rounded-2xl object-cover border border-gray-200 dark:border-gray-700 shadow-xs"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center font-bold text-xl border border-[#22A06B]/20 shadow-xs">
              <Building2 className="w-7 h-7" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] dark:text-gray-100">
                {companyName}
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 rounded-full border border-[#22A06B]/20">
                Master Portfolio
              </span>
            </div>
            <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
              {ownerName ? `Managed by ${ownerName} • ` : ''}
              Dynamic consolidation across all asset currencies.
            </p>
          </div>
        </div>

        {/* Master Currency Picker & Action */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="flex items-center gap-2 bg-[#F7F9F8] dark:bg-gray-900/60 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
            <span className="text-xs text-[#6B7280] dark:text-gray-400 font-medium">Master Currency:</span>
            <div className="relative flex items-center gap-1.5">
              <span className="text-base select-none leading-none">{getCurrencyFlag(masterCurrency)}</span>
              <div className="relative">
                <select
                  value={masterCurrency}
                  onChange={(e) => setMasterCurrency(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1 pr-6 text-xs font-bold text-[#1F2937] dark:text-gray-100 hover:border-[#22A06B] focus:outline-none focus:ring-1 focus:ring-[#22A06B] cursor-pointer"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {c.flag} {c.code} — {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <button
            onClick={onOpenAddInvestment}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#22A06B] hover:bg-[#1b8357] text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Investment</span>
          </button>
        </div>
      </div>

      {/* Empty State with Demo Import Prompt */}
      {investments.length === 0 && (
        <div className="bg-[#EAF8F1]/60 dark:bg-emerald-950/30 border border-[#22A06B]/30 dark:border-emerald-800/40 rounded-2xl p-6 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-[#22A06B] dark:text-emerald-400 mx-auto shadow-xs border border-[#22A06B]/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1F2937] dark:text-gray-100">Your Portfolio is Empty</h3>
            <p className="text-xs text-[#6B7280] dark:text-gray-400">
              Start tracking by adding your first investment, or load sample cross-border investment data to preview the full Excel-grade dashboard.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenAddInvestment}
                className="px-4 py-2 bg-[#22A06B] hover:bg-[#1b8357] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                + Add First Investment
              </button>
              <button
                onClick={importSampleData}
                className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-[#1F2937] dark:text-gray-200 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-600 shadow-2xs transition-colors"
              >
                Load Sample Portfolio Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 8 SUMMARY CARDS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* 1. Total Capital Invested */}
        <SummaryCard
          title="Total Capital Invested"
          value={formatCurrency(portfolioSummary.totalInvestedCapital, masterCurrency)}
          subtitle="Net deployed capital"
          badgeType="primary"
          badge={masterCurrency}
          icon={<Landmark className="w-4 h-4 text-[#22A06B] dark:text-emerald-400" />}
        />

        {/* 2. Total Return */}
        <SummaryCard
          title="Total Return"
          value={formatCurrency(portfolioSummary.totalReturn, masterCurrency)}
          subtitle="Cumulative gross income"
          valueColor="text-[#22A06B] dark:text-emerald-400"
          icon={<TrendingUp className="w-4 h-4 text-[#22A06B] dark:text-emerald-400" />}
        />

        {/* 3. Total Expense */}
        <SummaryCard
          title="Total Expense"
          value={formatCurrency(portfolioSummary.totalExpense, masterCurrency)}
          subtitle="Direct & operational costs"
          valueColor="text-gray-700 dark:text-gray-300"
          icon={<TrendingDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
        />

        {/* 4. Net Profit */}
        <SummaryCard
          title="Net Profit"
          value={formatCurrency(portfolioSummary.netProfit, masterCurrency)}
          subtitle="Return minus Expense"
          valueColor={isNetProfitPositive ? 'text-[#22A06B] dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
          badge={isNetProfitPositive ? 'Net Gain' : 'Deficit'}
          badgeType={isNetProfitPositive ? 'positive' : 'negative'}
        />

        {/* 5. Portfolio ROI */}
        <SummaryCard
          title="Portfolio ROI"
          value={`${portfolioSummary.roi.toFixed(2)}%`}
          subtitle="Net Profit / Capital × 100"
          valueColor={portfolioSummary.roi >= 0 ? 'text-[#22A06B] dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
          badge={portfolioSummary.roi >= 0 ? 'Positive Yield' : 'Negative Yield'}
          badgeType={portfolioSummary.roi >= 0 ? 'positive' : 'negative'}
          icon={<Percent className="w-4 h-4" />}
        />

        {/* 6. Capital Recovered */}
        <SummaryCard
          title="Capital Recovered"
          value={formatCurrency(portfolioSummary.capitalRecovered, masterCurrency)}
          subtitle={`${portfolioSummary.recoveryPercentage.toFixed(1)}% recouped`}
          valueColor="text-[#22A06B] dark:text-emerald-400"
          badge={portfolioSummary.recoveryStatus}
          badgeType={portfolioSummary.recoveryStatus === 'Profit Phase' ? 'positive' : 'warning'}
          icon={<ShieldCheck className="w-4 h-4 text-[#22A06B] dark:text-emerald-400" />}
        />

        {/* 7. Remaining Capital */}
        <SummaryCard
          title="Remaining Capital"
          value={formatCurrency(portfolioSummary.remainingCapital, masterCurrency)}
          subtitle="Unrecovered principal"
          icon={<Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
        />

        {/* 8. Active Investments */}
        <SummaryCard
          title="Active Investments"
          value={String(portfolioSummary.activeInvestmentsCount)}
          subtitle="Projects & ventures"
          badge={`${portfolioSummary.activeInvestmentsCount} Total`}
          badgeType="neutral"
          icon={<Layers className="w-4 h-4" />}
        />
      </div>

      {/* ================= CAPITAL RECOVERY TRACKER ================= */}
      {investments.length > 0 && (
        <CapitalRecoveryProgress
          totalInvested={portfolioSummary.totalInvestedCapital}
          capitalRecovered={portfolioSummary.capitalRecovered}
          remainingCapital={portfolioSummary.remainingCapital}
          recoveryPercentage={portfolioSummary.recoveryPercentage}
          status={portfolioSummary.recoveryStatus}
          currency={masterCurrency}
          isConsolidated={true}
        />
      )}

      {/* ================= MINIMAL CHARTS ================= */}
      {investments.length > 0 && (
        <AllocationChart
          investments={investments}
          monthlyRecords={monthlyRecords}
          masterCurrency={masterCurrency}
          rateInfo={rateInfo}
        />
      )}

      {/* ================= INVESTMENT OVERVIEW SECTION ================= */}
      <InvestmentsList
        onSelectInvestment={onSelectInvestment}
        onOpenAddInvestment={onOpenAddInvestment}
        title="Investment Overview"
        showHeaderActions={true}
      />
    </div>
  );
};
