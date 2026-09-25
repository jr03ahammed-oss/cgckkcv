export interface UserProfile {
  id: string;
  email: string;
  companyName: string;
  ownerName?: string;
  photoURL?: string;
  masterCurrency: string;
  defaultCountry?: string;
  defaultCurrency?: string;
  notificationReminder?: boolean;
  reminderDay?: number;
  reminderTime?: string;
  themePreference?: 'light' | 'dark' | 'system';
  permanentUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type FundingType = 
  | 'Capital Injection' 
  | 'Partner Contribution' 
  | 'Reinvested Returns' 
  | 'Debt / Credit Facility' 
  | 'Capital Distribution' 
  | 'Withdrawal';

export type FundingStatus = 'Completed' | 'Committed' | 'Pending';

export interface FundingRecord {
  id: string;
  userId: string;
  source: string;
  type: FundingType;
  amount: number;
  currency: string;
  date: string;
  allocatedInvestmentId?: string;
  allocatedInvestmentName?: string;
  status: FundingStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FundingSummary {
  totalFundedMaster: number;
  totalAllocatedMaster: number;
  unallocatedReserveMaster: number;
  totalDistributedMaster: number;
  sourceBreakdown: {
    source: string;
    totalAmountMaster: number;
    count: number;
    sharePercent: number;
  }[];
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  country: string;
  currency: string;
  initialCapital: number;
  startDate: string;
  targetPeriod?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MonthlyRecord {
  id: string;
  userId: string;
  investmentId: string;
  month: string;
  date: string;
  income: number;
  expense: number;
  additionalCapital: number;
  withdrawal: number;
  notes?: string;
  status?: string;
  exchangeRate?: number;
  exchangeRateDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CapitalRecoveryStatus = 
  | 'Capital Recovery in Progress' 
  | 'Capital Recovered' 
  | 'Profit Phase';

export type InvestmentFinancialStatus = 
  | 'Awaiting Capital'
  | 'No Activity'
  | 'Profit Generated'
  | 'Operating at Loss'
  | 'Break-even'
  | 'Target Period Approaching'
  | 'Target Period Missed';

export interface ComputedMonthlyRecord extends MonthlyRecord {
  netProfit: number;
  remainingCapitalAfter: number;
  monthlyRoi: number;
}

export interface InvestmentFinancials {
  initialCapital: number;
  additionalCapital: number;
  withdrawals: number;
  totalInvestedCapital: number;
  totalReturn: number;
  totalExpense: number;
  netProfit: number;
  roi: number;
  capitalRecovered: number;
  remainingCapital: number;
  recoveryPercentage: number;
  recoveryStatus: CapitalRecoveryStatus;
  status: InvestmentFinancialStatus;
  // Converted values in master currency
  rateToMaster: number;
  rateDate: string;
  rateSource: string;
  isCachedRate: boolean;
  convertedTotalInvested: number;
  convertedTotalReturn: number;
  convertedTotalExpense: number;
  convertedNetProfit: number;
  convertedCapitalRecovered: number;
  convertedRemainingCapital: number;
}

export interface PortfolioSummary {
  masterCurrency: string;
  totalInvestedCapital: number;
  totalReturn: number;
  totalExpense: number;
  netProfit: number;
  roi: number;
  capitalRecovered: number;
  remainingCapital: number;
  recoveryPercentage: number;
  recoveryStatus: CapitalRecoveryStatus;
  activeInvestmentsCount: number;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface CurrencyRateInfo {
  base: string;
  date: string;
  source: string;
  rates: Record<string, number>;
  lastFetched: number;
  isFallback?: boolean;
}
