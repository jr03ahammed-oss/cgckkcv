import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs 
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  testConnection, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { 
  UserProfile, 
  Investment, 
  MonthlyRecord, 
  FundingRecord,
  FundingSummary,
  SyncStatus, 
  CurrencyRateInfo, 
  PortfolioSummary 
} from '../types';
import { fetchExchangeRates, getExchangeRate } from '../lib/currency';
import { calculatePortfolioSummary } from '../lib/calculations';

interface AppContextValue {
  user: User | null;
  loadingAuth: boolean;
  profile: UserProfile | null;
  investments: Investment[];
  monthlyRecords: Record<string, MonthlyRecord[]>;
  fundingRecords: FundingRecord[];
  rateInfo: CurrencyRateInfo;
  syncStatus: SyncStatus;
  lastSynced: Date | null;
  portfolioSummary: PortfolioSummary;
  fundingSummary: FundingSummary;
  // Actions
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setMasterCurrency: (currency: string) => Promise<void>;
  addInvestment: (investmentData: Omit<Investment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateInvestment: (id: string, investmentData: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  addMonthlyRecord: (investmentId: string, recordData: Omit<MonthlyRecord, 'id' | 'userId' | 'investmentId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMonthlyRecord: (investmentId: string, recordId: string, recordData: Partial<MonthlyRecord>) => Promise<void>;
  deleteMonthlyRecord: (investmentId: string, recordId: string) => Promise<void>;
  addFundingRecord: (fundingData: Omit<FundingRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateFundingRecord: (id: string, fundingData: Partial<FundingRecord>) => Promise<void>;
  deleteFundingRecord: (id: string) => Promise<void>;
  refreshRates: () => Promise<void>;
  syncNow: () => Promise<void>;
  importSampleData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [monthlyRecords, setMonthlyRecords] = useState<Record<string, MonthlyRecord[]>>({});
  const [fundingRecords, setFundingRecords] = useState<FundingRecord[]>([]);
  
  const [rateInfo, setRateInfo] = useState<CurrencyRateInfo>({
    base: 'USD',
    date: new Date().toISOString().split('T')[0],
    source: 'Initializing...',
    rates: { USD: 1.0, SAR: 3.75, BDT: 122.8, INR: 86.8, PKR: 278.5, EUR: 0.92, GBP: 0.79 },
    lastFetched: Date.now(),
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());

  // Network online/offline monitor
  useEffect(() => {
    const handleOnline = () => setSyncStatus('synced');
    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch exchange rates on load
  const loadRates = useCallback(async () => {
    try {
      const rates = await fetchExchangeRates();
      setRateInfo(rates);
    } catch (err) {
      console.error('Failed to load currency rates:', err);
    }
  }, []);

  useEffect(() => {
    loadRates();
    // Test initial firestore connection as requested by skill
    testConnection();
  }, [loadRates]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync User Profile from Firestore
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setInvestments([]);
      setMonthlyRecords({});
      setFundingRecords([]);
      return;
    }

    setSyncStatus('syncing');
    const profilePath = `users/${user.uid}`;
    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data() as UserProfile);
          setSyncStatus('synced');
          setLastSynced(new Date());
        } else {
          // Initialize user profile on first Google sign-in
          const initialProfile: UserProfile = {
            id: user.uid,
            email: user.email || '',
            companyName: 'Vayxon Capital',
            ownerName: user.displayName || '',
            photoURL: user.photoURL || '',
            masterCurrency: 'SAR',
            defaultCountry: 'Saudi Arabia',
            defaultCurrency: 'SAR',
            notificationReminder: true,
            reminderDay: 1,
            reminderTime: '09:00',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          try {
            await setDoc(userDocRef, initialProfile);
            setProfile(initialProfile);
            setSyncStatus('synced');
            setLastSynced(new Date());
          } catch (err) {
            setSyncStatus('error');
            handleFirestoreError(err, OperationType.WRITE, profilePath);
          }
        }
      },
      (error) => {
        setSyncStatus('error');
        handleFirestoreError(error, OperationType.GET, profilePath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Sync Investments collection for the authenticated user
  useEffect(() => {
    if (!user) return;

    const investmentsPath = `users/${user.uid}/investments`;
    const colRef = collection(db, 'users', user.uid, 'investments');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const invList: Investment[] = [];
        snapshot.forEach((d) => {
          invList.push({ id: d.id, ...d.data() } as Investment);
        });
        // Sort by start date desc or creation
        invList.sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());
        setInvestments(invList);
        setSyncStatus('synced');
        setLastSynced(new Date());
      },
      (error) => {
        setSyncStatus('error');
        handleFirestoreError(error, OperationType.LIST, investmentsPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Sync Monthly Records for all active investments
  useEffect(() => {
    if (!user || investments.length === 0) {
      setMonthlyRecords({});
      return;
    }

    const unsubscribers: (() => void)[] = [];

    investments.forEach((inv) => {
      const recordsPath = `users/${user.uid}/investments/${inv.id}/monthlyRecords`;
      const recsRef = collection(db, 'users', user.uid, 'investments', inv.id, 'monthlyRecords');

      const unsub = onSnapshot(
        recsRef,
        (snapshot) => {
          const recList: MonthlyRecord[] = [];
          snapshot.forEach((d) => {
            recList.push({ id: d.id, ...d.data() } as MonthlyRecord);
          });
          setMonthlyRecords((prev) => ({
            ...prev,
            [inv.id]: recList,
          }));
          setSyncStatus('synced');
          setLastSynced(new Date());
        },
        (error) => {
          setSyncStatus('error');
          handleFirestoreError(error, OperationType.LIST, recordsPath);
        }
      );
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [user, investments]);

  // Sync Funding Records collection for the authenticated user
  useEffect(() => {
    if (!user) return;

    const fundingPath = `users/${user.uid}/fundingRecords`;
    const colRef = collection(db, 'users', user.uid, 'fundingRecords');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const fList: FundingRecord[] = [];
        snapshot.forEach((d) => {
          fList.push({ id: d.id, ...d.data() } as FundingRecord);
        });
        fList.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setFundingRecords(fList);
        setSyncStatus('synced');
        setLastSynced(new Date());
      },
      (error) => {
        setSyncStatus('error');
        handleFirestoreError(error, OperationType.LIST, fundingPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Consolidated Dynamic Portfolio Summary
  const portfolioSummary = useMemo(() => {
    const masterCur = profile?.masterCurrency || 'SAR';
    return calculatePortfolioSummary(investments, monthlyRecords, masterCur, rateInfo);
  }, [investments, monthlyRecords, profile?.masterCurrency, rateInfo]);

  // Consolidated Funding Summary
  const fundingSummary: FundingSummary = useMemo(() => {
    const masterCur = profile?.masterCurrency || 'SAR';
    let totalFunded = 0;
    let totalAllocated = 0;
    let totalDistributed = 0;
    const sourceMap: Record<string, { totalAmountMaster: number; count: number }> = {};

    fundingRecords.forEach((f) => {
      const rate = getExchangeRate(f.currency, masterCur, rateInfo.rates);
      const convertedAmount = (Number(f.amount) || 0) * rate;

      if (f.type === 'Capital Distribution' || f.type === 'Withdrawal') {
        totalDistributed += convertedAmount;
      } else {
        totalFunded += convertedAmount;
        if (f.allocatedInvestmentId && f.allocatedInvestmentId !== 'unallocated') {
          totalAllocated += convertedAmount;
        }

        const src = f.source?.trim() || 'General Equity';
        if (!sourceMap[src]) {
          sourceMap[src] = { totalAmountMaster: 0, count: 0 };
        }
        sourceMap[src].totalAmountMaster += convertedAmount;
        sourceMap[src].count += 1;
      }
    });

    const netActiveFunded = Math.max(0, totalFunded - totalDistributed);
    const unallocated = Math.max(0, netActiveFunded - totalAllocated);

    const sourceBreakdown = Object.entries(sourceMap).map(([source, data]) => ({
      source,
      totalAmountMaster: data.totalAmountMaster,
      count: data.count,
      sharePercent: totalFunded > 0 ? (data.totalAmountMaster / totalFunded) * 100 : 0,
    })).sort((a, b) => b.totalAmountMaster - a.totalAmountMaster);

    return {
      totalFundedMaster: totalFunded,
      totalAllocatedMaster: totalAllocated,
      unallocatedReserveMaster: unallocated,
      totalDistributedMaster: totalDistributed,
      sourceBreakdown,
    };
  }, [fundingRecords, profile?.masterCurrency, rateInfo]);

  // Action: Update User Profile
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('User not logged in');
    setSyncStatus('syncing');
    const path = `users/${user.uid}`;
    try {
      const updated = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'users', user.uid), updated);
      setProfile((prev) => (prev ? { ...prev, ...updated } : null));
      setSyncStatus('synced');
      setLastSynced(new Date());
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Action: Set Master Currency
  const setMasterCurrency = async (newCurrency: string) => {
    await updateProfile({ masterCurrency: newCurrency });
  };

  // Action: Add Investment
  const addInvestment = async (
    investmentData: Omit<Investment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!user) throw new Error('User not logged in');
    setSyncStatus('syncing');
    const newId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `users/${user.uid}/investments/${newId}`;

    const newDoc: Investment = {
      ...investmentData,
      id: newId,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'investments', newId), newDoc);
      setSyncStatus('synced');
      setLastSynced(new Date());
      return newId;
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.CREATE, path);
      throw err;
    }
  };

  // Action: Update Investment
  const updateInvestment = async (id: string, investmentData: Partial<Investment>) => {
    if (!user) throw new Error('User not logged in');
    setSyncStatus('syncing');
    const path = `users/${user.uid}/investments/${id}`;
    try {
      const updated = {
        ...investmentData,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'users', user.uid, 'investments', id), updated);
      setSyncStatus('synced');
      setLastSynced(new Date());
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.UPDATE, path);
      throw err;
    }
  };

  // Action: Delete Investment and its monthly records
  const deleteInvestment = async (id: string) => {
    if (!user) throw new Error('User not logged in');
    setSyncStatus('syncing');
    const path = `users/${user.uid}/investments/${id}`;
    try {
      // First delete subcollection records
      const recsRef = collection(db, 'users', user.uid, 'investments', id, 'monthlyRecords');
      const recsSnap = await getDocs(recsRef);
      for (const d of recsSnap.docs) {
        await deleteDoc(d.ref);
      }
      // Delete investment document
      await deleteDoc(doc(db, 'users', user.uid, 'investments', id));
      setSyncStatus('synced');
      setLastSynced(new Date());
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.DELETE, path);
      throw err;
    }
  };

  // Action: Add Monthly Record
  const addMonthlyRecord = async (
    investmentId: string,
    recordData: Omit<MonthlyRecord, 'id' | 'userId' | 'investmentId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!user) throw new Error('User not logged in');
    setSyncStatus('syncing');
    const newRecordId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `users/${user.uid}/investments/${investmentId}/monthlyRecords/${newRecordId}`;

    // Capture exchange rate to master currency at the time of entry
    const inv = investments.find((i) => i.id === investmentId);
    const masterCur = profile?.masterCurrency || 'SAR';
    const currentRate = inv ? getExchangeRate(inv.currency, masterCur, rateInfo.rates) : 1;

    const newRecord: MonthlyRecord = {
      ...recordData,
      id: newRecordId,
      userId: user.uid,
      investmentId,
      exchangeRate: currentRate,
      exchangeRateDate: rateInfo.date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(
        doc(db, 'users', user.uid, 'investments', investmentId, 'monthlyRecords', newRecordId),
        newRecord
      );
      setSyncStatus('synced');
      setLastSynced(new Date());
      return newRecordId;
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.CREATE, path);
      throw err;
    }
  };

  // Action: Update Monthly Record
  const updateMonthlyRecord = async (
    investmentId: string,
    recordId: string,
    recordData: Partial<MonthlyRecord>
  ) => {
    if (!user) throw new Error('User not logged in');
    setSyncStatus('syncing');
    const path = `users/${user.uid}/investments/${investmentId}/monthlyRecords/${recordId}`;
    try {
      const updated = {
        ...recordData,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(
        doc(db, 'users', user.uid, 'investments', investmentId, 'monthlyRecords', recordId),
        updated
      );
      setSyncStatus('synced');
      setLastSynced(new Date());
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.UPDATE, path);
      throw err;
    }
  };

  // Action: Delete Monthly Record
  const deleteMonthlyRecord = async (investmentId: string, recordId: string) => {
    if (!user) throw new Error('User not logged in');
    setSyncStatus('syncing');
    const path = `users/${user.uid}/investments/${investmentId}/monthlyRecords/${recordId}`;
    try {
      await deleteDoc(
        doc(db, 'users', user.uid, 'investments', investmentId, 'monthlyRecords', recordId)
      );
      setSyncStatus('synced');
      setLastSynced(new Date());
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.DELETE, path);
      throw err;
    }
  };

  // Action: Add Funding Record
  const addFundingRecord = async (
    fundingData: Omit<FundingRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!user) throw new Error('User not logged in');
    setSyncStatus('syncing');
    const newId = `fnd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `users/${user.uid}/fundingRecords/${newId}`;

    const newDoc: FundingRecord = {
      ...fundingData,
      id: newId,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'fundingRecords', newId), newDoc);
      setSyncStatus('synced');
      setLastSynced(new Date());
      return newId;
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.CREATE, path);
      throw err;
    }
  };

  // Action: Update Funding Record
  const updateFundingRecord = async (id: string, fundingData: Partial<FundingRecord>) => {
    if (!user) throw new Error('User not logged in');
    setSyncStatus('syncing');
    const path = `users/${user.uid}/fundingRecords/${id}`;
    try {
      const updated = {
        ...fundingData,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'users', user.uid, 'fundingRecords', id), updated);
      setSyncStatus('synced');
      setLastSynced(new Date());
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.UPDATE, path);
      throw err;
    }
  };

  // Action: Delete Funding Record
  const deleteFundingRecord = async (id: string) => {
    if (!user) throw new Error('User not logged in');
    setSyncStatus('syncing');
    const path = `users/${user.uid}/fundingRecords/${id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'fundingRecords', id));
      setSyncStatus('synced');
      setLastSynced(new Date());
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.DELETE, path);
      throw err;
    }
  };

  // Action: Refresh Rates
  const refreshRates = async () => {
    setSyncStatus('syncing');
    await loadRates();
    setSyncStatus('synced');
    setLastSynced(new Date());
  };

  // Action: Sync Now
  const syncNow = async () => {
    setSyncStatus('syncing');
    await loadRates();
    await testConnection();
    setSyncStatus('synced');
    setLastSynced(new Date());
  };

  // Action: Import Sample Demo Data (per Section 21)
  const importSampleData = async () => {
    if (!user) return;
    setSyncStatus('syncing');

    // Create 4 realistic cross-border investments
    const sampleInvestments = [
      {
        name: 'Dhaka Logistics Hub',
        country: 'Bangladesh',
        currency: 'BDT',
        initialCapital: 1500000,
        startDate: '2025-06-01',
        targetPeriod: '18 Months',
        notes: 'Cold storage and regional distribution fleet operations in Gazipur corridor.',
        months: [
          { month: 'Jun 2025', date: '2025-06-30', income: 75000, expense: 12000, additionalCapital: 0, withdrawal: 0, notes: 'Fleet commissioning' },
          { month: 'Jul 2025', date: '2025-07-31', income: 98000, expense: 15000, additionalCapital: 50000, withdrawal: 0, notes: 'Added cargo van' },
          { month: 'Aug 2025', date: '2025-08-31', income: 110000, expense: 16500, additionalCapital: 0, withdrawal: 20000, notes: 'Commercial partner contract' },
          { month: 'Sep 2025', date: '2025-09-30', income: 125000, expense: 18000, additionalCapital: 0, withdrawal: 25000, notes: 'Peak season dispatch' },
        ],
      },
      {
        name: 'Riyadh Commercial Tower Lease',
        country: 'Saudi Arabia',
        currency: 'SAR',
        initialCapital: 350000,
        startDate: '2025-01-15',
        targetPeriod: '24 Months',
        notes: 'Premium executive office space sublease in Olaya Financial District.',
        months: [
          { month: 'Jan 2025', date: '2025-01-31', income: 18000, expense: 3500, additionalCapital: 0, withdrawal: 0, notes: 'Initial tenant occupancy' },
          { month: 'Feb 2025', date: '2025-02-28', income: 24000, expense: 4200, additionalCapital: 0, withdrawal: 5000, notes: 'Fully leased floor 4' },
          { month: 'Mar 2025', date: '2025-03-31', income: 26000, expense: 4000, additionalCapital: 0, withdrawal: 5000, notes: 'Stable corporate lease' },
          { month: 'Apr 2025', date: '2025-04-30', income: 28500, expense: 4500, additionalCapital: 20000, withdrawal: 8000, notes: 'Added co-working suite' },
        ],
      },
      {
        name: 'Bangalore Fintech Equity Note',
        country: 'India',
        currency: 'INR',
        initialCapital: 1200000,
        startDate: '2025-03-01',
        targetPeriod: '12 Months',
        notes: 'Pre-Series A structured convertible financing in B2B payment gateway.',
        months: [
          { month: 'Mar 2025', date: '2025-03-31', income: 60000, expense: 8000, additionalCapital: 0, withdrawal: 0, notes: 'Q1 dividend yield' },
          { month: 'Apr 2025', date: '2025-04-30', income: 65000, expense: 8500, additionalCapital: 0, withdrawal: 15000, notes: 'Revenue share distribution' },
          { month: 'May 2025', date: '2025-05-31', income: 72000, expense: 9000, additionalCapital: 0, withdrawal: 20000, notes: 'Expanded merchant base' },
        ],
      },
      {
        name: 'London Prime Rental Unit',
        country: 'United Kingdom',
        currency: 'GBP',
        initialCapital: 85000,
        startDate: '2025-05-01',
        targetPeriod: '3 Years',
        notes: 'Residential flat rental portfolio in Canary Wharf vicinity.',
        months: [
          { month: 'May 2025', date: '2025-05-31', income: 4200, expense: 650, additionalCapital: 0, withdrawal: 0, notes: 'New tenant 2-yr tenancy' },
          { month: 'Jun 2025', date: '2025-06-30', income: 4200, expense: 600, additionalCapital: 0, withdrawal: 1500, notes: 'Quarterly owner payout' },
          { month: 'Jul 2025', date: '2025-07-31', income: 4200, expense: 600, additionalCapital: 0, withdrawal: 1500, notes: 'Net yield received' },
        ],
      },
    ];

    try {
      for (const sample of sampleInvestments) {
        const invId = await addInvestment({
          name: sample.name,
          country: sample.country,
          currency: sample.currency,
          initialCapital: sample.initialCapital,
          startDate: sample.startDate,
          targetPeriod: sample.targetPeriod,
          notes: sample.notes,
        });

        for (const m of sample.months) {
          await addMonthlyRecord(invId, {
            month: m.month,
            date: m.date,
            income: m.income,
            expense: m.expense,
            additionalCapital: m.additionalCapital,
            withdrawal: m.withdrawal,
            notes: m.notes,
            status: 'Completed',
          });
        }
      }

      // Sample Funding Records
      const sampleFunding = [
        {
          source: 'Primary General Partner Equity',
          type: 'Capital Injection' as const,
          amount: 500000,
          currency: 'SAR',
          date: '2025-01-10',
          allocatedInvestmentName: 'Riyadh Commercial Tower Lease',
          status: 'Completed' as const,
          notes: 'Founding principal investment allocation for prime commercial real estate.',
        },
        {
          source: 'Gulf Angel Syndicate',
          type: 'Partner Contribution' as const,
          amount: 1500000,
          currency: 'BDT',
          date: '2025-05-20',
          allocatedInvestmentName: 'Dhaka Logistics Hub',
          status: 'Completed' as const,
          notes: 'Co-investment for regional fleet acquisition.',
        },
        {
          source: 'Apex Mezzanine Facility',
          type: 'Debt / Credit Facility' as const,
          amount: 1200000,
          currency: 'INR',
          date: '2025-02-25',
          allocatedInvestmentName: 'Bangalore Fintech Equity Note',
          status: 'Completed' as const,
          notes: 'Structured credit line backing convertible venture debt.',
        },
        {
          source: 'Family Office Liquidity Reserve',
          type: 'Capital Injection' as const,
          amount: 100000,
          currency: 'GBP',
          date: '2025-04-15',
          allocatedInvestmentName: 'London Prime Rental Unit',
          status: 'Completed' as const,
          notes: 'Direct equity placement for UK residential acquisition.',
        },
        {
          source: 'Portfolio Retained Earnings',
          type: 'Reinvested Returns' as const,
          amount: 60000,
          currency: 'SAR',
          date: '2025-08-01',
          allocatedInvestmentName: 'Unallocated Liquidity Pool',
          status: 'Completed' as const,
          notes: 'Accumulated Q2 dividend distributions retained in treasury reserve.',
        },
      ];

      for (const sf of sampleFunding) {
        await addFundingRecord(sf);
      }

      setSyncStatus('synced');
    } catch (e) {
      console.error('Failed to import sample portfolio data:', e);
      setSyncStatus('error');
    }
  };

  // Action: Clear all user portfolio data
  const clearAllData = async () => {
    if (!user) return;
    setSyncStatus('syncing');
    try {
      for (const inv of investments) {
        await deleteInvestment(inv.id);
      }
      for (const f of fundingRecords) {
        await deleteFundingRecord(f.id);
      }
      setSyncStatus('synced');
    } catch (e) {
      console.error('Failed to clear portfolio data:', e);
      setSyncStatus('error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loadingAuth,
        profile,
        investments,
        monthlyRecords,
        fundingRecords,
        rateInfo,
        syncStatus,
        lastSynced,
        portfolioSummary,
        fundingSummary,
        updateProfile,
        setMasterCurrency,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addMonthlyRecord,
        updateMonthlyRecord,
        deleteMonthlyRecord,
        addFundingRecord,
        updateFundingRecord,
        deleteFundingRecord,
        refreshRates,
        syncNow,
        importSampleData,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
