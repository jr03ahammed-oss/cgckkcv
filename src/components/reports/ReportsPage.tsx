import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateInvestmentFinancials } from '../../lib/calculations';
import { formatCurrency } from '../../lib/currency';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Filter 
} from 'lucide-react';

type ReportType = 
  | 'portfolio' 
  | 'investments' 
  | 'monthlyProfit' 
  | 'expenses' 
  | 'roi' 
  | 'capitalRecovery';

export const ReportsPage: React.FC = () => {
  const { investments, monthlyRecords, profile, rateInfo, portfolioSummary } = useApp();
  const masterCurrency = profile?.masterCurrency || 'SAR';
  const companyName = profile?.companyName || 'Vayxon Capital';

  const [activeReport, setActiveReport] = useState<ReportType>('portfolio');
  const [dateFilter, setDateFilter] = useState<'all' | 'year' | 'sixMonths'>('all');

  // Compute all investment financials
  const investmentFinancialsList = useMemo(() => {
    return investments.map((inv) => {
      const allRecs = monthlyRecords[inv.id] || [];
      const now = new Date();
      const currentYear = now.getFullYear();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      const filteredRecs = allRecs.filter((r) => {
        if (dateFilter === 'all') return true;
        const d = new Date(r.date);
        if (dateFilter === 'year') {
          return d.getFullYear() === currentYear;
        }
        if (dateFilter === 'sixMonths') {
          return d >= sixMonthsAgo;
        }
        return true;
      });

      const f = calculateInvestmentFinancials(inv, filteredRecs, masterCurrency, rateInfo);
      return {
        investment: inv,
        records: filteredRecs,
        financials: f,
      };
    });
  }, [investments, monthlyRecords, masterCurrency, rateInfo, dateFilter]);

  // Aggregate monthly records across all investments
  const allMonthlyRows = useMemo(() => {
    const rows: {
      investmentName: string;
      currency: string;
      month: string;
      date: string;
      income: number;
      expense: number;
      netProfit: number;
      convertedIncome: number;
      convertedExpense: number;
      convertedNet: number;
    }[] = [];

    investmentFinancialsList.forEach(({ investment, records, financials }) => {
      records.forEach((r) => {
        const net = (r.income || 0) - (r.expense || 0);
        rows.push({
          investmentName: investment.name,
          currency: investment.currency,
          month: r.month,
          date: r.date,
          income: r.income || 0,
          expense: r.expense || 0,
          netProfit: net,
          convertedIncome: (r.income || 0) * financials.rateToMaster,
          convertedExpense: (r.expense || 0) * financials.rateToMaster,
          convertedNet: net * financials.rateToMaster,
        });
      });
    });

    // Sort descending by date
    rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return rows;
  }, [investmentFinancialsList]);

  // CSV Export utility
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    const timestamp = new Date().toISOString().split('T')[0];

    if (activeReport === 'portfolio' || activeReport === 'investments') {
      csvContent += `CapitalFlow Investment Summary Report - ${companyName}\n`;
      csvContent += `Generated Date: ${timestamp}, Master Currency: ${masterCurrency}\n\n`;
      csvContent += 'Investment Name,Country,Original Currency,Total Invested,Total Return,Total Expense,Net Profit,ROI %,Status,Converted Invested (' + masterCurrency + '),Converted Net Profit (' + masterCurrency + ')\n';

      investmentFinancialsList.forEach(({ investment, financials }) => {
        const row = [
          `"${investment.name}"`,
          `"${investment.country}"`,
          investment.currency,
          financials.totalInvestedCapital,
          financials.totalReturn,
          financials.totalExpense,
          financials.netProfit,
          financials.roi.toFixed(2),
          `"${financials.status}"`,
          financials.convertedTotalInvested.toFixed(2),
          financials.convertedNetProfit.toFixed(2),
        ].join(',');
        csvContent += row + '\n';
      });
    } else if (activeReport === 'monthlyProfit' || activeReport === 'expenses') {
      csvContent += `CapitalFlow Monthly Ledger Report - ${companyName}\n`;
      csvContent += `Generated Date: ${timestamp}, Master Currency: ${masterCurrency}\n\n`;
      csvContent += 'Investment Name,Month,Date,Original Currency,Income,Expense,Net Profit,Converted Income (' + masterCurrency + '),Converted Expense (' + masterCurrency + '),Converted Net Profit (' + masterCurrency + ')\n';

      allMonthlyRows.forEach((r) => {
        const row = [
          `"${r.investmentName}"`,
          `"${r.month}"`,
          r.date,
          r.currency,
          r.income,
          r.expense,
          r.netProfit,
          r.convertedIncome.toFixed(2),
          r.convertedExpense.toFixed(2),
          r.convertedNet.toFixed(2),
        ].join(',');
        csvContent += row + '\n';
      });
    } else {
      // Capital Recovery / ROI
      csvContent += `CapitalFlow Capital Recovery & ROI Report - ${companyName}\n`;
      csvContent += `Generated Date: ${timestamp}, Master Currency: ${masterCurrency}\n\n`;
      csvContent += 'Investment Name,Original Currency,Total Invested,Capital Recovered,Remaining Capital,Recovery %,Recovery Status,ROI %\n';

      investmentFinancialsList.forEach(({ investment, financials }) => {
        const row = [
          `"${investment.name}"`,
          investment.currency,
          financials.totalInvestedCapital,
          financials.capitalRecovered,
          financials.remainingCapital,
          financials.recoveryPercentage.toFixed(2),
          `"${financials.recoveryStatus}"`,
          financials.roi.toFixed(2),
        ].join(',');
        csvContent += row + '\n';
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CapitalFlow_${activeReport}_Report_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const reportTabs = [
    { id: 'portfolio' as ReportType, label: 'Portfolio Summary' },
    { id: 'investments' as ReportType, label: 'Investment-wise' },
    { id: 'monthlyProfit' as ReportType, label: 'Monthly Profit' },
    { id: 'expenses' as ReportType, label: 'Expense Report' },
    { id: 'roi' as ReportType, label: 'ROI Report' },
    { id: 'capitalRecovery' as ReportType, label: 'Capital Recovery' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#22A06B] dark:text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] dark:text-gray-100">Financial Reports</h1>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-1">
            Consolidated statements, monthly yield analysis, and capital recovery audits.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5 no-print">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-[#22A06B] dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#22A06B] hover:bg-[#1b8357] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {reportTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                activeReport === tab.id
                  ? 'bg-[#22A06B] text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          <span className="text-[#6B7280] dark:text-gray-400">Date Filter:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-transparent font-semibold text-[#1F2937] dark:text-gray-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="year">This Year ({new Date().getFullYear()})</option>
            <option value="sixMonths">Last 6 Months</option>
          </select>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block p-4 border-b border-gray-300">
        <h2 className="text-xl font-bold">{companyName} - Financial Report</h2>
        <p className="text-sm text-gray-600">
          Report: {reportTabs.find((t) => t.id === activeReport)?.label} • Master Currency: {masterCurrency} • Date: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* ================= REPORT CONTENT ================= */}

      {/* 1. Portfolio Summary Report */}
      {activeReport === 'portfolio' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs">
            <h3 className="text-base font-bold text-[#1F2937] dark:text-gray-100 mb-4">
              Executive Portfolio Position ({masterCurrency})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-[#6B7280] dark:text-gray-400">Total Capital Invested</div>
                <div className="text-lg font-bold text-[#1F2937] dark:text-gray-100 mt-1 font-mono">
                  {formatCurrency(portfolioSummary.totalInvestedCapital, masterCurrency)}
                </div>
              </div>

              <div className="p-4 bg-[#EAF8F1] dark:bg-emerald-950/40 rounded-xl border border-[#22A06B]/20 dark:border-emerald-800/40">
                <div className="text-xs text-[#22A06B] dark:text-emerald-400">Total Cash Return</div>
                <div className="text-lg font-bold text-[#22A06B] dark:text-emerald-400 mt-1 font-mono">
                  {formatCurrency(portfolioSummary.totalReturn, masterCurrency)}
                </div>
              </div>

              <div className="p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-[#6B7280] dark:text-gray-400">Total Operating Expense</div>
                <div className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-1 font-mono">
                  {formatCurrency(portfolioSummary.totalExpense, masterCurrency)}
                </div>
              </div>

              <div className="p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-[#6B7280] dark:text-gray-400">Net Consolidated Profit</div>
                <div className={`text-lg font-bold mt-1 font-mono ${portfolioSummary.netProfit >= 0 ? 'text-[#22A06B] dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(portfolioSummary.netProfit, masterCurrency)}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[#6B7280] dark:text-gray-400">Portfolio ROI:</span>{' '}
                <strong className="text-[#1F2937] dark:text-gray-200 font-mono text-sm">{portfolioSummary.roi.toFixed(2)}%</strong>
              </div>
              <div>
                <span className="text-[#6B7280] dark:text-gray-400">Capital Recouped:</span>{' '}
                <strong className="text-[#22A06B] dark:text-emerald-400 font-mono text-sm">{portfolioSummary.recoveryPercentage.toFixed(1)}% ({portfolioSummary.recoveryStatus})</strong>
              </div>
              <div>
                <span className="text-[#6B7280] dark:text-gray-400">Active Investments:</span>{' '}
                <strong className="text-[#1F2937] dark:text-gray-200 text-sm">{investments.length} Assets</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Investment-wise Summary Report */}
      {(activeReport === 'portfolio' || activeReport === 'investments') && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1F2937] dark:text-gray-100">Asset Performance Summary</h3>
            <span className="text-xs text-[#6B7280] dark:text-gray-400">Normalized to {masterCurrency}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1F2937] dark:text-gray-200 border-collapse">
              <thead>
                <tr className="bg-[#F7F9F8] dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Investment</th>
                  <th className="py-3 px-3">Country</th>
                  <th className="py-3 px-3">Original Currency</th>
                  <th className="py-3 px-3 text-right">Original Capital</th>
                  <th className="py-3 px-3 text-right">Converted Capital ({masterCurrency})</th>
                  <th className="py-3 px-3 text-right">Net Profit ({masterCurrency})</th>
                  <th className="py-3 px-3 text-right">ROI %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-mono text-[12px]">
                {investmentFinancialsList.map(({ investment, financials }) => (
                  <tr key={investment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 font-semibold text-[#1F2937] dark:text-gray-100 font-sans">
                      {investment.name}
                    </td>
                    <td className="py-3 px-3 text-[#6B7280] dark:text-gray-400 font-sans">
                      {investment.country}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 font-bold">
                        {investment.currency}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatCurrency(financials.totalInvestedCapital, investment.currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#1F2937] dark:text-gray-100">
                      {formatCurrency(financials.convertedTotalInvested, masterCurrency)}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${financials.convertedNetProfit >= 0 ? 'text-[#22A06B] dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(financials.convertedNetProfit, masterCurrency)}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${financials.roi >= 0 ? 'text-[#22A06B] dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {financials.roi.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 text-[10px] rounded-full font-semibold bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 border border-[#22A06B]/20 dark:border-emerald-800">
                        {financials.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Monthly Profit / Expense Ledger Report */}
      {(activeReport === 'monthlyProfit' || activeReport === 'expenses') && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1F2937] dark:text-gray-100">
              {activeReport === 'monthlyProfit' ? 'Monthly Profit Records' : 'Direct Expense Audit'}
            </h3>
            <span className="text-xs text-[#6B7280] dark:text-gray-400">{allMonthlyRows.length} Monthly Entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1F2937] dark:text-gray-200 border-collapse">
              <thead>
                <tr className="bg-[#F7F9F8] dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Investment</th>
                  <th className="py-3 px-3">Month</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Income (Original)</th>
                  <th className="py-3 px-3 text-right">Expense (Original)</th>
                  <th className="py-3 px-3 text-right">Net Profit (Original)</th>
                  <th className="py-3 px-4 text-right">Net Profit ({masterCurrency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-mono text-[12px]">
                {allMonthlyRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400 font-sans">
                      No monthly records match this criteria.
                    </td>
                  </tr>
                ) : (
                  allMonthlyRows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 font-sans font-semibold text-[#1F2937] dark:text-gray-100">
                        {r.investmentName}
                      </td>
                      <td className="py-3 px-3 font-sans text-gray-800 dark:text-gray-300">{r.month}</td>
                      <td className="py-3 px-3 text-[#6B7280] dark:text-gray-400">{r.date}</td>
                      <td className="py-3 px-3 text-right text-[#22A06B] dark:text-emerald-400">
                        {formatCurrency(r.income, r.currency)}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-700 dark:text-gray-300">
                        {formatCurrency(r.expense, r.currency)}
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${r.netProfit >= 0 ? 'text-[#22A06B] dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(r.netProfit, r.currency)}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${r.convertedNet >= 0 ? 'text-[#22A06B] dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(r.convertedNet, masterCurrency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ROI & Capital Recovery Report */}
      {(activeReport === 'roi' || activeReport === 'capitalRecovery') && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1F2937] dark:text-gray-100">Capital Recovery & ROI Schedule</h3>
            <span className="text-xs text-[#6B7280] dark:text-gray-400">{investments.length} Assets Tracked</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1F2937] dark:text-gray-200 border-collapse">
              <thead>
                <tr className="bg-[#F7F9F8] dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Investment</th>
                  <th className="py-3 px-3">Currency</th>
                  <th className="py-3 px-3 text-right">Invested Capital</th>
                  <th className="py-3 px-3 text-right">Capital Recovered</th>
                  <th className="py-3 px-3 text-right">Remaining to Recoup</th>
                  <th className="py-3 px-3 text-right">Recovery %</th>
                  <th className="py-3 px-3 text-right">ROI %</th>
                  <th className="py-3 px-4 text-center">Recovery Phase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-mono text-[12px]">
                {investmentFinancialsList.map(({ investment, financials }) => (
                  <tr key={investment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 font-sans font-semibold text-[#1F2937] dark:text-gray-100">
                      {investment.name}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 font-bold">
                        {investment.currency}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatCurrency(financials.totalInvestedCapital, investment.currency)}
                    </td>
                    <td className="py-3 px-3 text-right text-[#22A06B] dark:text-emerald-400 font-semibold">
                      {formatCurrency(financials.capitalRecovered, investment.currency)}
                    </td>
                    <td className="py-3 px-3 text-right text-[#1F2937] dark:text-gray-100">
                      {formatCurrency(financials.remainingCapital, investment.currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#1F2937] dark:text-gray-100">
                      {financials.recoveryPercentage.toFixed(1)}%
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${financials.roi >= 0 ? 'text-[#22A06B] dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {financials.roi.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] rounded-full font-semibold border ${
                          financials.recoveryStatus === 'Profit Phase'
                            ? 'bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 border-[#22A06B]/20 dark:border-emerald-800'
                            : financials.recoveryStatus === 'Capital Recovered'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {financials.recoveryStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
