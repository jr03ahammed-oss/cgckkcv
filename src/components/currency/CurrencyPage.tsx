import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_CURRENCIES, getExchangeRate, formatCurrency } from '../../lib/currency';
import { Coins, RefreshCw, ArrowRightLeft, ShieldCheck, Check, Clock, Info } from 'lucide-react';

export const CurrencyPage: React.FC = () => {
  const { profile, rateInfo, refreshRates } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  // Mini calculator state
  const [calcAmount, setCalcAmount] = useState('10000');
  const [calcFrom, setCalcFrom] = useState('BDT');
  const [calcTo, setCalcTo] = useState(profile?.masterCurrency || 'SAR');

  const masterCurrency = profile?.masterCurrency || 'SAR';

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshRates();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const calculatedResult = () => {
    const num = parseFloat(calcAmount);
    if (isNaN(num)) return 0;
    const rate = getExchangeRate(calcFrom, calcTo, rateInfo.rates);
    return num * rate;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#22A06B] dark:text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] dark:text-gray-100">
              Multi-Currency System
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-1">
            Exchange rates used for portfolio consolidation and cross-border financial reporting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#22A06B]' : ''}`} />
            <span>{refreshing ? 'Fetching Latest Rates...' : 'Refresh Rates'}</span>
          </button>
        </div>
      </div>

      {/* Overview Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Master Currency Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-2xs">
          <span className="text-xs font-medium text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
            Active Master Currency
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl select-none leading-none">
              {SUPPORTED_CURRENCIES.find((c) => c.code === masterCurrency)?.flag}
            </span>
            <span className="text-2xl font-bold text-[#1F2937] dark:text-gray-100">{masterCurrency}</span>
            <span className="text-xs text-[#22A06B] dark:text-emerald-400 font-semibold">
              ({SUPPORTED_CURRENCIES.find((c) => c.code === masterCurrency)?.name})
            </span>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-2">
            All investments are converted to this currency for portfolio summary cards and reports.
          </p>
        </div>

        {/* Exchange Rate Source */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-2xs">
          <span className="text-xs font-medium text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
            Exchange-Rate Source
          </span>
          <div className="text-base font-bold text-[#1F2937] dark:text-gray-100 mt-2 truncate">
            {rateInfo.source}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#22A06B] dark:text-emerald-400 mt-2 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Reliable open ECB reference feed</span>
          </div>
        </div>

        {/* Last Updated */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-2xs">
          <span className="text-xs font-medium text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
            Last Updated Date
          </span>
          <div className="text-2xl font-bold text-[#1F2937] dark:text-gray-100 mt-2 font-mono">
            {rateInfo.date}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-2">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Fetched: {new Date(rateInfo.lastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {rateInfo.isFallback && <span className="text-amber-600 dark:text-amber-400 font-semibold">[Cached]</span>}
          </div>
        </div>
      </div>

      {/* Multi-Currency Invariant Notice */}
      <div className="p-4 bg-[#EAF8F1] dark:bg-emerald-950/40 border border-[#22A06B]/20 dark:border-emerald-800/40 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-[#22A06B] dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-[#1F2937] dark:text-gray-200 leading-relaxed">
          <strong className="font-bold">Original Transaction Preservation Guarantee:</strong> CapitalFlow never alters
          or overwrites original financial records. Every transaction in Bangladesh remains permanently stored in <strong>BDT</strong>,
          Saudi Arabia in <strong>SAR</strong>, and India in <strong>INR</strong>. The conversion to your Master Currency ({masterCurrency})
          is strictly calculated for consolidated reporting, preserving the exact original exchange rate and date.
        </div>
      </div>

      {/* Quick Currency Converter Tool */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs">
        <div className="flex items-center gap-2 mb-4">
          <ArrowRightLeft className="w-4 h-4 text-[#22A06B] dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-[#1F2937] dark:text-gray-100">Quick Currency Conversion Estimator</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">Amount</label>
            <input
              type="number"
              value={calcAmount}
              onChange={(e) => setCalcAmount(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-mono text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">From Currency</label>
            <select
              value={calcFrom}
              onChange={(e) => setCalcFrom(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  {c.flag} {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">To Currency</label>
            <select
              value={calcTo}
              onChange={(e) => setCalcTo(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  {c.flag} {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="p-2.5 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 text-right">
            <span className="text-[10px] text-[#6B7280] dark:text-gray-400 block font-medium">Estimated Value</span>
            <span className="text-base font-bold text-[#22A06B] dark:text-emerald-400 font-mono">
              {formatCurrency(calculatedResult(), calcTo)}
            </span>
          </div>
        </div>
      </div>

      {/* Supported Currencies & Live Exchange Rates Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1F2937] dark:text-gray-100">
              Supported Currencies vs 1 {masterCurrency}
            </h2>
            <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
              Live conversion matrix relative to your active master currency.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1F2937] dark:text-gray-200 border-collapse">
            <thead>
              <tr className="bg-[#F7F9F8] dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Country / Region</th>
                <th className="py-3 px-4">Symbol</th>
                <th className="py-3 px-4 text-right">1 {masterCurrency} Equals</th>
                <th className="py-3 px-4 text-right">1 Unit in {masterCurrency}</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-mono text-[12px]">
              {SUPPORTED_CURRENCIES.map((c) => {
                const isCurrentMaster = c.code === masterCurrency;
                const rateFromMaster = getExchangeRate(masterCurrency, c.code, rateInfo.rates);
                const rateToMaster = getExchangeRate(c.code, masterCurrency, rateInfo.rates);

                return (
                  <tr
                    key={c.code}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      isCurrentMaster ? 'bg-[#EAF8F1]/40 dark:bg-emerald-950/30 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="text-base select-none leading-none">{c.flag}</span>
                        {c.countryCode && (
                          <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 font-medium">
                            {c.countryCode}
                          </span>
                        )}
                        <span className="font-bold text-[#1F2937] dark:text-gray-100">{c.code}</span>
                        <span className="text-gray-400 dark:text-gray-500 font-normal">—</span>
                        <span className="text-xs text-[#6B7280] dark:text-gray-400 font-normal">{c.name}</span>
                        {isCurrentMaster && (
                          <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-[#22A06B] text-white rounded">
                            Master
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#6B7280] dark:text-gray-400 font-sans">{c.country}</td>

                    <td className="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                      {c.symbol}
                    </td>

                    <td className="py-3.5 px-4 text-right font-semibold text-[#1F2937] dark:text-gray-100">
                      {rateFromMaster.toFixed(4)} {c.code}
                    </td>

                    <td className="py-3.5 px-4 text-right text-[#22A06B] dark:text-emerald-400 font-semibold">
                      {rateToMaster.toFixed(4)} {masterCurrency}
                    </td>

                    <td className="py-3.5 px-4 text-center font-sans">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#22A06B] dark:text-emerald-400">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
