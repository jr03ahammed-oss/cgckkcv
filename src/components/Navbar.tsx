import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Coins, 
  FileSpreadsheet, 
  Settings, 
  Plus, 
  LogOut,
  ChevronDown,
  Building2,
  User as UserIcon,
  MoreHorizontal,
  Wallet,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_CURRENCIES, getCurrencyFlag } from '../lib/currency';
import { SyncStatusBadge } from './SyncStatusBadge';
import { logOut } from '../lib/firebase';
import { APP_VERSION } from '../config/version';

export type TabType = 'dashboard' | 'investments' | 'currency' | 'funding' | 'reports' | 'settings';

interface Props {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAddInvestment: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  onOpenAddInvestment,
}) => {
  const { profile, setMasterCurrency, syncStatus, lastSynced, syncNow, user } = useApp();

  const [isDesktopMoreOpen, setIsDesktopMoreOpen] = useState(
    currentTab === 'funding' || currentTab === 'reports'
  );
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMasterCurrency(e.target.value);
  };

  const masterCurrency = profile?.masterCurrency || 'SAR';
  const companyName = profile?.companyName || 'Vayxon Capital';
  const isMoreActive = currentTab === 'funding' || currentTab === 'reports';

  return (
    <>
      {/* ================= DESKTOP / TABLET SIDEBAR ================= */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors">
        {/* Brand & Company Section */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center font-bold text-lg border border-[#22A06B]/20">
                CF
              </div>
              <div>
                <span className="font-bold text-base text-[#1F2937] dark:text-gray-100 tracking-tight">CapitalFlow</span>
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 rounded-md">
                  V{APP_VERSION}
                </span>
              </div>
            </div>
            <SyncStatusBadge status={syncStatus} lastSynced={lastSynced} onSyncNow={syncNow} compact />
          </div>

          {/* Company / Portfolio card */}
          <div className="p-3 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200/80 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-gray-400">
              <Building2 className="w-3.5 h-3.5 text-[#22A06B] dark:text-emerald-400" />
              <span className="font-medium">Portfolio Entity</span>
            </div>
            <div className="text-sm font-semibold text-[#1F2937] dark:text-gray-100 truncate mt-0.5">
              {companyName}
            </div>

            {/* Master Currency Picker */}
            <div className="mt-2.5 pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-xs">
              <span className="text-[#6B7280] dark:text-gray-400 font-medium">Master Currency:</span>
              <div className="relative flex items-center gap-1.5">
                <span className="text-base select-none leading-none">{getCurrencyFlag(masterCurrency)}</span>
                <div className="relative">
                  <select
                    value={masterCurrency}
                    onChange={handleCurrencyChange}
                    className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1 pr-6 text-xs font-semibold text-[#1F2937] dark:text-gray-100 hover:border-[#22A06B] focus:outline-none focus:ring-1 focus:ring-[#22A06B] cursor-pointer"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        {c.flag} {c.code} — {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-gray-500 dark:text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Primary Quick Action Button */}
          <button
            onClick={onOpenAddInvestment}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#22A06B] hover:bg-[#1b8357] text-white rounded-xl text-sm font-medium transition-all shadow-xs active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Investment</span>
          </button>
        </div>

        {/* Navigation Links: Dashboard | Investments | Currency | More | Settings */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* 1. Dashboard */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              currentTab === 'dashboard'
                ? 'bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 font-semibold'
                : 'text-[#6B7280] dark:text-gray-400 hover:text-[#1F2937] dark:hover:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-700/50'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${currentTab === 'dashboard' ? 'text-[#22A06B] dark:text-emerald-400' : 'text-[#6B7280] dark:text-gray-400'}`} />
            <span>Dashboard</span>
          </button>

          {/* 2. Investments */}
          <button
            onClick={() => onSelectTab('investments')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              currentTab === 'investments'
                ? 'bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 font-semibold'
                : 'text-[#6B7280] dark:text-gray-400 hover:text-[#1F2937] dark:hover:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-700/50'
            }`}
          >
            <Briefcase className={`w-5 h-5 ${currentTab === 'investments' ? 'text-[#22A06B] dark:text-emerald-400' : 'text-[#6B7280] dark:text-gray-400'}`} />
            <span>Investments</span>
          </button>

          {/* 3. Currency */}
          <button
            onClick={() => onSelectTab('currency')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              currentTab === 'currency'
                ? 'bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 font-semibold'
                : 'text-[#6B7280] dark:text-gray-400 hover:text-[#1F2937] dark:hover:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-700/50'
            }`}
          >
            <Coins className={`w-5 h-5 ${currentTab === 'currency' ? 'text-[#22A06B] dark:text-emerald-400' : 'text-[#6B7280] dark:text-gray-400'}`} />
            <span>Currency</span>
          </button>

          {/* 4. More (Contains ONLY: Funding, Reports) */}
          <div className="pt-0.5">
            <button
              onClick={() => setIsDesktopMoreOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                isMoreActive
                  ? 'bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 font-semibold'
                  : 'text-[#6B7280] dark:text-gray-400 hover:text-[#1F2937] dark:hover:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <MoreHorizontal className={`w-5 h-5 ${isMoreActive ? 'text-[#22A06B] dark:text-emerald-400' : 'text-[#6B7280] dark:text-gray-400'}`} />
                <span>More</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 text-gray-400 ${
                  isDesktopMoreOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Sub-items: Funding & Reports */}
            {isDesktopMoreOpen && (
              <div className="mt-1 ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-1 py-1">
                <button
                  onClick={() => onSelectTab('funding')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                    currentTab === 'funding'
                      ? 'bg-[#EAF8F1] dark:bg-emerald-950/80 text-[#22A06B] dark:text-emerald-400'
                      : 'text-[#6B7280] dark:text-gray-400 hover:text-[#1F2937] dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>Funding</span>
                </button>
                <button
                  onClick={() => onSelectTab('reports')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                    currentTab === 'reports'
                      ? 'bg-[#EAF8F1] dark:bg-emerald-950/80 text-[#22A06B] dark:text-emerald-400'
                      : 'text-[#6B7280] dark:text-gray-400 hover:text-[#1F2937] dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Reports</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. Settings (Always visible separate main navigation item) */}
          <button
            onClick={() => onSelectTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              currentTab === 'settings'
                ? 'bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 font-semibold'
                : 'text-[#6B7280] dark:text-gray-400 hover:text-[#1F2937] dark:hover:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-700/50'
            }`}
          >
            <Settings className={`w-5 h-5 ${currentTab === 'settings' ? 'text-[#22A06B] dark:text-emerald-400' : 'text-[#6B7280] dark:text-gray-400'}`} />
            <span>Settings</span>
          </button>
        </nav>

        {/* User Profile & Logout Bottom Bar */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-[#F7F9F8] dark:bg-gray-900/60">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.ownerName || 'User'}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center text-xs font-bold border border-[#22A06B]/20">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#1F2937] dark:text-gray-200 truncate">
                  {profile?.ownerName || user?.displayName || 'Investor'}
                </div>
                <div className="text-[10px] text-[#6B7280] dark:text-gray-400 truncate">
                  {user?.email}
                </div>
              </div>
            </div>
            <button
              onClick={() => logOut()}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE TOP HEADER ================= */}
      <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-[#22A06B]/20 shrink-0">
            CF
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-[#1F2937] dark:text-gray-100 truncate leading-tight">
              {companyName}
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-[#6B7280] dark:text-gray-400">Master:</span>
              <span className="text-xs select-none leading-none">{getCurrencyFlag(masterCurrency)}</span>
              <select
                value={masterCurrency}
                onChange={handleCurrencyChange}
                className="bg-transparent text-[11px] font-semibold text-[#22A06B] dark:text-emerald-400 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SyncStatusBadge status={syncStatus} lastSynced={lastSynced} onSyncNow={syncNow} compact />
          <button
            onClick={onOpenAddInvestment}
            className="p-1.5 bg-[#22A06B] text-white rounded-lg text-xs font-medium flex items-center justify-center shadow-xs"
            title="Add Investment"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ================= MOBILE BOTTOM NAVIGATION BAR ================= */}
      {/* Exactly: Dashboard | Investments | Currency | More | Settings */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-1.5 flex items-center justify-around safe-area-bottom shadow-lg transition-colors">
        {/* 1. Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            currentTab === 'dashboard'
              ? 'text-[#22A06B] dark:text-emerald-400 font-bold'
              : 'text-[#6B7280] dark:text-gray-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>

        {/* 2. Investments */}
        <button
          onClick={() => onSelectTab('investments')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            currentTab === 'investments'
              ? 'text-[#22A06B] dark:text-emerald-400 font-bold'
              : 'text-[#6B7280] dark:text-gray-400'
          }`}
        >
          <Briefcase className="w-5 h-5 mb-0.5" />
          <span>Investments</span>
        </button>

        {/* 3. Currency */}
        <button
          onClick={() => onSelectTab('currency')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            currentTab === 'currency'
              ? 'text-[#22A06B] dark:text-emerald-400 font-bold'
              : 'text-[#6B7280] dark:text-gray-400'
          }`}
        >
          <Coins className="w-5 h-5 mb-0.5" />
          <span>Currency</span>
        </button>

        {/* 4. More (Opens drawer with Funding & Reports) */}
        <button
          onClick={() => setIsMobileMoreOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            isMoreActive
              ? 'text-[#22A06B] dark:text-emerald-400 font-bold'
              : 'text-[#6B7280] dark:text-gray-400'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>

        {/* 5. Settings */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            currentTab === 'settings'
              ? 'text-[#22A06B] dark:text-emerald-400 font-bold'
              : 'text-[#6B7280] dark:text-gray-400'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span>Settings</span>
        </button>
      </nav>

      {/* ================= MOBILE "MORE" BOTTOM SHEET ================= */}
      {isMobileMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs">
          <div 
            className="w-full bg-white dark:bg-gray-800 rounded-t-3xl p-6 shadow-2xl border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-6 duration-200"
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MoreHorizontal className="w-5 h-5 text-[#22A06B] dark:text-emerald-400" />
                <h3 className="text-base font-bold text-[#1F2937] dark:text-gray-100">
                  More Options
                </h3>
              </div>
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4">
              {/* Option 1: Funding */}
              <button
                onClick={() => {
                  onSelectTab('funding');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  currentTab === 'funding'
                    ? 'bg-[#EAF8F1] dark:bg-emerald-950/60 border-[#22A06B] dark:border-emerald-600'
                    : 'bg-[#F7F9F8] dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-xs text-[#22A06B] dark:text-emerald-400 mb-3">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1F2937] dark:text-gray-100">
                    Funding
                  </div>
                  <div className="text-[11px] text-[#6B7280] dark:text-gray-400 mt-0.5">
                    Capital injections & allocations
                  </div>
                </div>
              </button>

              {/* Option 2: Reports */}
              <button
                onClick={() => {
                  onSelectTab('reports');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  currentTab === 'reports'
                    ? 'bg-[#EAF8F1] dark:bg-emerald-950/60 border-[#22A06B] dark:border-emerald-600'
                    : 'bg-[#F7F9F8] dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-xs text-[#22A06B] dark:text-emerald-400 mb-3">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1F2937] dark:text-gray-100">
                    Reports
                  </div>
                  <div className="text-[11px] text-[#6B7280] dark:text-gray-400 mt-0.5">
                    Financial statements & audits
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
