import React, { useState } from 'react';
import { useApp, AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthScreen } from './components/AuthScreen';
import { Navbar, TabType } from './components/Navbar';
import { MasterDashboard } from './components/dashboard/MasterDashboard';
import { InvestmentsList } from './components/investments/InvestmentsList';
import { InvestmentDetail } from './components/investments/InvestmentDetail';
import { CurrencyPage } from './components/currency/CurrencyPage';
import { FundingPage } from './components/funding/FundingPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { AddInvestmentModal } from './components/investments/AddInvestmentModal';
import { Investment } from './types';

const MainAppContent: React.FC = () => {
  const { user, loadingAuth, investments } = useApp();

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // If currently selected investment exists
  const selectedInvestment = selectedInvestmentId
    ? investments.find((i) => i.id === selectedInvestmentId) || null
    : null;

  // If auth is still loading
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#F7F9F8] dark:bg-gray-900 flex flex-col items-center justify-center transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center font-bold text-xl border border-[#22A06B]/20 mb-4 animate-pulse">
          CF
        </div>
        <div className="w-6 h-6 border-2 border-[#22A06B] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-[#6B7280] dark:text-gray-400 font-medium tracking-wide">
          Loading CapitalFlow...
        </p>
      </div>
    );
  }

  // If not authenticated
  if (!user) {
    return <AuthScreen />;
  }

  const handleSelectTab = (tab: TabType) => {
    setSelectedInvestmentId(null);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectInvestment = (inv: Investment) => {
    setSelectedInvestmentId(inv.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F7F9F8] dark:bg-gray-900 text-[#1F2937] dark:text-gray-100 flex flex-col md:flex-row transition-colors">
      {/* Navigation: Desktop Sidebar + Mobile Top/Bottom bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenAddInvestment={() => setIsAddModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 min-w-0 flex flex-col pb-20 md:pb-6">
        <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {selectedInvestment ? (
            <InvestmentDetail
              investment={selectedInvestment}
              onBack={() => setSelectedInvestmentId(null)}
              onDeleted={() => setSelectedInvestmentId(null)}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <MasterDashboard
                  onSelectInvestment={handleSelectInvestment}
                  onOpenAddInvestment={() => setIsAddModalOpen(true)}
                />
              )}

              {currentTab === 'investments' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] dark:text-gray-100">
                      Investments Directory
                    </h1>
                    <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-1">
                      Manage all cross-border holdings, contracts, and venture investments.
                    </p>
                  </div>
                  <InvestmentsList
                    onSelectInvestment={handleSelectInvestment}
                    onOpenAddInvestment={() => setIsAddModalOpen(true)}
                    title="All Portfolio Investments"
                    showHeaderActions={true}
                  />
                </div>
              )}

              {currentTab === 'currency' && <CurrencyPage />}

              {currentTab === 'funding' && <FundingPage />}

              {currentTab === 'reports' && <ReportsPage />}

              {currentTab === 'settings' && <SettingsPage />}
            </>
          )}
        </div>
      </main>

      {/* Global Add Investment Modal */}
      <AddInvestmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(id) => {
          setSelectedInvestmentId(id);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
