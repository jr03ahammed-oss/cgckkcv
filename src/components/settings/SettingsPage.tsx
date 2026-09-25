import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { SUPPORTED_CURRENCIES } from '../../lib/currency';
import { logOut, storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { SyncStatusBadge } from '../SyncStatusBadge';
import { ConfirmDialog } from '../ConfirmDialog';
import { QrCode } from '../common/QrCode';
import { APP_NAME, APP_VERSION, APP_VERSION_STRING, RELEASE_DATE } from '../../config/version';
import { getPermanentAppUrl } from '../../config/appUrl';
import { 
  Building2, 
  User as UserIcon, 
  Coins, 
  Bell, 
  Sun, 
  Moon, 
  Laptop, 
  Share2, 
  Smartphone, 
  Cloud, 
  ShieldCheck, 
  Info, 
  LogOut, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Copy, 
  ExternalLink, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

type SettingsView = 
  | 'menu' 
  | 'profile' 
  | 'currency' 
  | 'reminders' 
  | 'theme' 
  | 'share' 
  | 'webapp' 
  | 'data' 
  | 'privacy' 
  | 'about';

export const SettingsPage: React.FC = () => {
  const { 
    user, 
    profile, 
    updateProfile, 
    syncStatus, 
    lastSynced, 
    syncNow, 
    importSampleData,
    clearAllData 
  } = useApp();

  const { theme, setTheme } = useTheme();

  // Active sub-screen view
  const [activeView, setActiveView] = useState<SettingsView>('menu');

  // Profile fields
  const [companyName, setCompanyName] = useState(profile?.companyName || 'Vayxon Capital');
  const [ownerName, setOwnerName] = useState(profile?.ownerName || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');

  // Portfolio settings
  const [masterCurrency, setMasterCurrencyState] = useState(profile?.masterCurrency || 'SAR');
  const [defaultCountry, setDefaultCountry] = useState(profile?.defaultCountry || 'Saudi Arabia');
  const [defaultCurrency, setDefaultCurrency] = useState(profile?.defaultCurrency || 'SAR');

  // Notifications
  const [notificationReminder, setNotificationReminder] = useState(profile?.notificationReminder ?? true);
  const [reminderDay, setReminderDay] = useState(profile?.reminderDay || 1);
  const [reminderTime, setReminderTime] = useState(profile?.reminderTime || '09:00');

  // Permanent URL state
  const permanentUrl = getPermanentAppUrl(profile?.permanentUrl);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [sharedNotice, setSharedNotice] = useState(false);

  // Status flags
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // Dialog states
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isSampleConfirmOpen, setIsSampleConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Sync state from profile
  useEffect(() => {
    if (profile) {
      setCompanyName(profile.companyName || 'Vayxon Capital');
      setOwnerName(profile.ownerName || '');
      setPhotoURL(profile.photoURL || '');
      setMasterCurrencyState(profile.masterCurrency || 'SAR');
      setDefaultCountry(profile.defaultCountry || 'Saudi Arabia');
      setDefaultCurrency(profile.defaultCurrency || 'SAR');
      setNotificationReminder(profile.notificationReminder ?? true);
      setReminderDay(profile.reminderDay || 1);
      setReminderTime(profile.reminderTime || '09:00');
      if (profile.themePreference && profile.themePreference !== theme) {
        setTheme(profile.themePreference);
      }
    }
  }, [profile]);

  // Immediate Save Helpers
  const handleThemeChange = async (newTheme: ThemeMode) => {
    setTheme(newTheme);
    try {
      await updateProfile({ themePreference: newTheme });
    } catch (err) {
      console.error('Failed to save theme preference:', err);
    }
  };

  const handleMasterCurrencyChange = async (newCurrency: string) => {
    setMasterCurrencyState(newCurrency);
    try {
      await updateProfile({ masterCurrency: newCurrency });
    } catch (err) {
      console.error('Failed to update master currency:', err);
    }
  };

  const handleDefaultCountryChange = async (newCountry: string) => {
    setDefaultCountry(newCountry);
    try {
      await updateProfile({ defaultCountry: newCountry });
    } catch (err) {
      console.error('Failed to update default country:', err);
    }
  };

  const handleDefaultCurrencyChange = async (newCurrency: string) => {
    setDefaultCurrency(newCurrency);
    try {
      await updateProfile({ defaultCurrency: newCurrency });
    } catch (err) {
      console.error('Failed to update default currency:', err);
    }
  };

  const handleNotificationReminderToggle = async (val: boolean) => {
    setNotificationReminder(val);
    try {
      await updateProfile({ notificationReminder: val });
    } catch (err) {
      console.error('Failed to update notification reminder:', err);
    }
  };

  const handleReminderDayChange = async (val: number) => {
    const day = Math.max(1, Math.min(31, val));
    setReminderDay(day);
    try {
      await updateProfile({ reminderDay: day });
    } catch (err) {
      console.error('Failed to update reminder day:', err);
    }
  };

  const handleReminderTimeChange = async (val: string) => {
    setReminderTime(val);
    try {
      await updateProfile({ reminderTime: val });
    } catch (err) {
      console.error('Failed to update reminder time:', err);
    }
  };

  const handleSaveProfileNames = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        companyName: companyName.trim() || 'Vayxon Capital',
        ownerName: ownerName.trim(),
      });
      setProfileSavedToast(true);
      setTimeout(() => setProfileSavedToast(false), 2500);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    try {
      const storageRef = ref(storage, `users/${user.uid}/profile_${Date.now()}`);
      try {
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setPhotoURL(url);
        await updateProfile({ photoURL: url });
      } catch (storageErr) {
        console.warn('Firebase Storage direct upload failed, using Data URL fallback:', storageErr);
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const dataUrl = evt.target?.result as string;
          if (dataUrl) {
            setPhotoURL(dataUrl);
            await updateProfile({ photoURL: dataUrl });
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Failed to upload photo:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoURL('');
    await updateProfile({ photoURL: '' });
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(permanentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: companyName,
          text: `CapitalFlow Portfolio Management — ${companyName}`,
          url: permanentUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyUrl();
      setSharedNotice(true);
      setTimeout(() => setSharedNotice(false), 2500);
    }
  };

  // Helper format for reminder time
  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return '09:00 AM';
    const [h, m] = timeStr.split(':');
    const hourNum = parseInt(h, 10);
    if (isNaN(hourNum)) return timeStr;
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${m || '00'} ${ampm}`;
  };

  // --------------------------------------------------------------------------
  // SUB-SCREEN: 1. PROFILE & PORTFOLIO IDENTITY
  // --------------------------------------------------------------------------
  const renderProfileDetail = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveView('menu')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22A06B] dark:text-emerald-400 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>
        <span className="text-xs text-[#6B7280] dark:text-gray-400">Profile & Identity</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#1F2937] dark:text-gray-100">
            Profile & Portfolio Identity
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
            Configure your company or fund brand name and investor profile.
          </p>
        </div>

        {/* Profile Photo */}
        <div>
          <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-2">
            Portfolio / Avatar Photo
          </label>
          <div className="flex items-center gap-4">
            {photoURL ? (
              <img
                src={photoURL}
                alt="Profile"
                className="w-16 h-16 rounded-2xl object-cover border border-gray-200 dark:border-gray-700 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center font-bold text-xl border border-[#22A06B]/20">
                <UserIcon className="w-8 h-8" />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-medium text-[#1F2937] dark:text-gray-200 shadow-2xs transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#22A06B]" />
                  <span>{uploadingPhoto ? 'Uploading...' : photoURL ? 'Change Photo' : '+ Add Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>

                {photoURL && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[#6B7280] dark:text-gray-400">
                JPG or PNG. Synchronized to cloud storage and cached locally.
              </p>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <form onSubmit={handleSaveProfileNames} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
              Company / Portfolio Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Vayxon Capital"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
            />
            <p className="text-[10px] text-[#6B7280] dark:text-gray-400 mt-1">
              Appears prominently across your Master Dashboard and reports.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
              Owner / Managing Partner Name <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
            />
          </div>

          {/* Google Account Email (Read-only) */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
              Google Account Identity
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {profileSavedToast ? (
              <span className="text-xs text-[#22A06B] dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Profile saved successfully!
              </span>
            ) : <span />}

            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 bg-[#22A06B] hover:bg-[#1b8357] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {savingProfile && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // SUB-SCREEN: 2. CURRENCY & REGIONAL SETTINGS
  // --------------------------------------------------------------------------
  const renderCurrencyDetail = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveView('menu')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22A06B] dark:text-emerald-400 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>
        <span className="text-xs text-[#6B7280] dark:text-gray-400">Currency & Regional</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#1F2937] dark:text-gray-100">
            Currency & Regional Settings
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
            Select your master reporting currency and regional parameters. Changes save immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Master Currency */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
              Master Reporting Currency
            </label>
            <select
              value={masterCurrency}
              onChange={(e) => handleMasterCurrencyChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B] cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  {c.flag} {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-[#6B7280] dark:text-gray-400 mt-1">
              All portfolio totals and dashboard financial cards consolidate to this currency.
            </p>
          </div>

          {/* Default Currency */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
              Default Currency for New Assets
            </label>
            <select
              value={defaultCurrency}
              onChange={(e) => handleDefaultCurrencyChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B] cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  {c.flag} {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-[#6B7280] dark:text-gray-400 mt-1">
              Pre-filled currency when creating new investments.
            </p>
          </div>

          {/* Default Country */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
              Default Regional Country
            </label>
            <input
              type="text"
              value={defaultCountry}
              onChange={(e) => setDefaultCountry(e.target.value)}
              onBlur={(e) => handleDefaultCountryChange(e.target.value)}
              placeholder="e.g. Saudi Arabia"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
            />
          </div>
        </div>

        {/* Currency Reference Matrix with flags */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-2">
            Supported Currencies & Flags Reference
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {SUPPORTED_CURRENCIES.map((c) => (
              <div
                key={c.code}
                onClick={() => handleMasterCurrencyChange(c.code)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  c.code === masterCurrency
                    ? 'bg-[#EAF8F1] dark:bg-emerald-950/50 border-[#22A06B] dark:border-emerald-500'
                    : 'bg-[#F7F9F8] dark:bg-gray-900/40 border-gray-200/80 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl select-none leading-none shrink-0">{c.flag}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1F2937] dark:text-gray-100 truncate">
                      {c.code} — {c.name}
                    </div>
                    <div className="text-[10px] text-[#6B7280] dark:text-gray-400 truncate">
                      {c.country}
                    </div>
                  </div>
                </div>
                {c.code === masterCurrency && (
                  <span className="text-[10px] font-bold text-[#22A06B] dark:text-emerald-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md border border-[#22A06B]/30 shrink-0">
                    Active Master
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // SUB-SCREEN: 3. REMINDERS
  // --------------------------------------------------------------------------
  const renderRemindersDetail = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveView('menu')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22A06B] dark:text-emerald-400 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>
        <span className="text-xs text-[#6B7280] dark:text-gray-400">Reminders</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#1F2937] dark:text-gray-100">
            Monthly Ledger Entry Reminders
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
            Configure automated notifications to log monthly income, rent, returns, and expenses.
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700">
          <div>
            <div className="text-sm font-semibold text-[#1F2937] dark:text-gray-100">
              Enable Monthly Reminders
            </div>
            <div className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
              Active scheduled reminder on chosen day of each month.
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationReminder}
              onChange={(e) => handleNotificationReminderToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22A06B]"></div>
          </label>
        </div>

        {notificationReminder && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
                Reminder Day of Month (1 - 31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={reminderDay}
                onChange={(e) => handleReminderDayChange(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-mono text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
              />
              <p className="text-[10px] text-[#6B7280] dark:text-gray-400 mt-1">
                e.g. Day 1 fires at the start of every calendar month.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
                Reminder Time
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => handleReminderTimeChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-mono text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
              />
              <p className="text-[10px] text-[#6B7280] dark:text-gray-400 mt-1">
                Configured: {formatTimeDisplay(reminderTime)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // SUB-SCREEN: 4. THEME
  // --------------------------------------------------------------------------
  const renderThemeDetail = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveView('menu')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22A06B] dark:text-emerald-400 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>
        <span className="text-xs text-[#6B7280] dark:text-gray-400">Theme</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#1F2937] dark:text-gray-100">
            Theme Appearance
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
            Choose how CapitalFlow looks on your display. Preference saves immediately.
          </p>
        </div>

        <div className="space-y-3">
          {/* Light */}
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
              theme === 'light'
                ? 'bg-[#EAF8F1] dark:bg-emerald-950/60 border-[#22A06B] dark:border-emerald-500 ring-2 ring-[#22A06B]/20'
                : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${theme === 'light' ? 'bg-[#22A06B] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1F2937] dark:text-gray-100">Light</div>
                <div className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
                  Clean crisp canvas with emerald green accents.
                </div>
              </div>
            </div>
            {theme === 'light' && (
              <span className="w-6 h-6 rounded-full bg-[#22A06B] text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            )}
          </button>

          {/* Dark */}
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
              theme === 'dark'
                ? 'bg-[#EAF8F1] dark:bg-emerald-950/60 border-[#22A06B] dark:border-emerald-500 ring-2 ring-[#22A06B]/20'
                : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-[#22A06B] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1F2937] dark:text-gray-100">Dark</div>
                <div className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
                  Deep dark slate background designed for low-light environments.
                </div>
              </div>
            </div>
            {theme === 'dark' && (
              <span className="w-6 h-6 rounded-full bg-[#22A06B] text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            )}
          </button>

          {/* System */}
          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
              theme === 'system'
                ? 'bg-[#EAF8F1] dark:bg-emerald-950/60 border-[#22A06B] dark:border-emerald-500 ring-2 ring-[#22A06B]/20'
                : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${theme === 'system' ? 'bg-[#22A06B] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1F2937] dark:text-gray-100">System / Automatic</div>
                <div className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
                  Matches your operating system's light or dark display preference automatically.
                </div>
              </div>
            </div>
            {theme === 'system' && (
              <span className="w-6 h-6 rounded-full bg-[#22A06B] text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // SUB-SCREEN: 5. SHARE & INVITE
  // --------------------------------------------------------------------------
  const renderShareDetail = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveView('menu')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22A06B] dark:text-emerald-400 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>
        <span className="text-xs text-[#6B7280] dark:text-gray-400">Share & Invite</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#1F2937] dark:text-gray-100">
            Share Portfolio App URL
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
            Share the permanent link or scan the QR code to open CapitalFlow on any phone, tablet, or laptop.
          </p>
        </div>

        {/* Permanent URL box */}
        <div className="p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
          <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200">
            Permanent Web App Link
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={permanentUrl}
              className="flex-1 px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-mono text-[#1F2937] dark:text-gray-200 select-all focus:outline-none"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#22A06B] hover:bg-[#1b8357] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied Link!' : 'Copy Link'}</span>
              </button>
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center justify-center p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl transition-colors"
                title="Share..."
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {sharedNotice && (
            <span className="text-xs text-[#22A06B] dark:text-emerald-400 font-semibold block">
              Link copied to clipboard!
            </span>
          )}
        </div>

        {/* QR Code */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs shrink-0">
            <QrCode url={permanentUrl} size={140} />
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-sm font-bold text-[#1F2937] dark:text-gray-100">
              Scan with Mobile Camera
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
              Open your smartphone camera app, point it at this QR code, and tap the link to load the app directly in Safari or Chrome.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // SUB-SCREEN: 6. WEB APP & DEVICE ACCESS
  // --------------------------------------------------------------------------
  const renderWebAppDetail = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveView('menu')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22A06B] dark:text-emerald-400 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>
        <span className="text-xs text-[#6B7280] dark:text-gray-400">Web App & Devices</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#1F2937] dark:text-gray-100">
            Permanent Web App & Cross-Device Access
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
            Install CapitalFlow as a standalone application on iOS, Android, and Desktop without App Store friction.
          </p>
        </div>

        {/* URL Card */}
        <div className="p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
          <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200">
            Official Web App URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={permanentUrl}
              className="flex-1 px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-mono text-[#1F2937] dark:text-gray-200 select-all"
            />
            <button
              onClick={handleCopyUrl}
              className="px-4 py-2.5 bg-[#22A06B] hover:bg-[#1b8357] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
            >
              {copiedUrl ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Native Android Project Banner */}
        <div className="p-4 bg-[#EAF8F1] dark:bg-emerald-950/60 rounded-xl border border-[#22A06B]/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#22A06B] text-white">
                <Smartphone className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-[#1F2937] dark:text-gray-100">
                  Native Android Project (Kotlin & Jetpack Compose)
                </h3>
                <p className="text-[11px] text-[#22A06B] dark:text-emerald-400 font-medium">
                  Configured with Firebase Auth, Firestore Database & Offline Persistence
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#22A06B] text-white">
              NATIVE COMPOSE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#1F2937] dark:text-gray-200">
            <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-[10px] text-[#6B7280] dark:text-gray-400 uppercase tracking-wider block font-semibold">Package Name</span>
              <span className="font-mono text-[11px] font-semibold">com.capitalflow.app</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-[10px] text-[#6B7280] dark:text-gray-400 uppercase tracking-wider block font-semibold">Build Command</span>
              <span className="font-mono text-[11px] font-semibold">./gradlew assembleDebug</span>
            </div>
          </div>

          <div className="text-[11px] text-[#6B7280] dark:text-gray-400 leading-relaxed bg-white/70 dark:bg-gray-800/70 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <strong>How to build & install on your Android phone:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5 pl-1">
              <li>Open the project root directory in <strong>Android Studio</strong> or run <code>./gradlew assembleDebug</code>.</li>
              <li>To install on a connected Android phone with USB debugging enabled, run <code>./gradlew installDebug</code>.</li>
              <li>Generated APK location: <code>app/build/outputs/apk/debug/app-debug.apk</code>.</li>
            </ul>
          </div>
        </div>

        {/* Step-by-step installation guides */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#1F2937] dark:text-gray-100">
            Instant Android Device Testing (Zero Friction)
          </h3>

          {/* Android Chrome */}
          <div className="p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-[#1F2937] dark:text-gray-100">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Direct Android Device Testing (Instant Phone Installation)</span>
            </div>
            <ol className="list-decimal list-inside text-xs text-[#6B7280] dark:text-gray-400 space-y-1.5 leading-relaxed pl-1">
              <li>Scan the QR code under <strong>Share & Invite</strong> or open the App URL in <strong>Google Chrome</strong> on your Android phone.</li>
              <li>Tap the <strong>three vertical dots menu (⋮)</strong> in Chrome or tap the install prompt banner at the bottom.</li>
              <li>Select <strong>“Install app”</strong> or <strong>“Add to Home screen”</strong>.</li>
              <li>CapitalFlow launches in native fullscreen mode with full Firestore sync, camera scanning, and offline cached persistence.</li>
            </ol>
          </div>

          {/* iPhone Safari */}
          <div className="p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-[#1F2937] dark:text-gray-100">
              <Smartphone className="w-4 h-4 text-[#22A06B]" />
              <span>Apple iPhone & iPad (Safari)</span>
            </div>
            <ol className="list-decimal list-inside text-xs text-[#6B7280] dark:text-gray-400 space-y-1.5 leading-relaxed pl-1">
              <li>Open the Permanent URL in <strong>Apple Safari</strong>.</li>
              <li>Tap the <strong>Share</strong> button (the square with an arrow pointing up).</li>
              <li>Scroll down and tap <strong>“Add to Home Screen”</strong>.</li>
              <li>Tap <strong>“Add”</strong> in the top right corner. The app will launch in full-screen standalone mode.</li>
            </ol>
          </div>

          {/* Desktop */}
          <div className="p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-[#1F2937] dark:text-gray-100">
              <Laptop className="w-4 h-4 text-purple-500" />
              <span>Desktop Workstation (Chrome, Edge, Brave)</span>
            </div>
            <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
              Click the install icon in the address bar (or Menu → <em>Install CapitalFlow</em>) for a dedicated desktop window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // SUB-SCREEN: 7. DATA & SYNC
  // --------------------------------------------------------------------------
  const renderDataDetail = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveView('menu')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22A06B] dark:text-emerald-400 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>
        <span className="text-xs text-[#6B7280] dark:text-gray-400">Data & Cloud Sync</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#1F2937] dark:text-gray-100">
            Data & Cloud Synchronization
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
            Cloud Firestore synchronizes with your device's high-speed local cache.
          </p>
        </div>

        {/* Sync Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700">
          <div>
            <div className="text-xs text-[#6B7280] dark:text-gray-400 font-medium">Synchronization Status:</div>
            <div className="mt-1.5 flex items-center gap-2">
              <SyncStatusBadge status={syncStatus} lastSynced={lastSynced} />
              <span className="text-xs text-[#1F2937] dark:text-gray-200 font-medium">
                {syncStatus === 'synced' ? 'IndexedDB Local Cache & Cloud Firestore in sync' : 'Processing updates...'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => syncNow()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl shadow-2xs transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#22A06B]" />
            <span>Sync Now</span>
          </button>
        </div>

        {/* Sample Demo Data & Clear Actions */}
        <div className="p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
          <h3 className="text-sm font-bold text-[#1F2937] dark:text-gray-100">
            Portfolio Demo & Maintenance
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-gray-400">
            Load realistic multi-currency sample investments with monthly tracker entries, or reset all portfolio records.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsSampleConfirmOpen(true)}
              className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-[#1F2937] dark:text-gray-200 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-600 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#22A06B]" />
              <span>Import Sample Portfolio</span>
            </button>

            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-800 shadow-2xs transition-colors"
            >
              Clear Portfolio Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // SUB-SCREEN: 8. PRIVACY & SECURITY
  // --------------------------------------------------------------------------
  const renderPrivacyDetail = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveView('menu')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22A06B] dark:text-emerald-400 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>
        <span className="text-xs text-[#6B7280] dark:text-gray-400">Privacy & Security</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#1F2937] dark:text-gray-100">
            Privacy & Security Architecture
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
            Your financial data is strictly isolated to your verified account.
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 font-bold text-xs text-[#1F2937] dark:text-gray-100 mb-1">
              <ShieldCheck className="w-4 h-4 text-[#22A06B]" />
              <span>Isolated Firestore Database Rules</span>
            </div>
            <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
              Every document query and write is verified server-side with strict Firebase security rules (<code className="font-mono text-[11px] text-[#22A06B]">request.auth.uid == resource.data.userId</code>). No other user can access your portfolio.
            </p>
          </div>

          <div className="p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 font-bold text-xs text-[#1F2937] dark:text-gray-100 mb-1">
              <UserIcon className="w-4 h-4 text-blue-500" />
              <span>Current Authenticated Identity</span>
            </div>
            <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
              Authenticated via Google Sign-In as <strong className="text-[#1F2937] dark:text-gray-200 font-mono">{user?.email}</strong>.
            </p>
          </div>

          <div className="p-4 bg-[#F7F9F8] dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 font-bold text-xs text-[#1F2937] dark:text-gray-100 mb-1">
              <Cloud className="w-4 h-4 text-purple-500" />
              <span>Local Privacy & Zero Tracking</span>
            </div>
            <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
              CapitalFlow contains zero telemetry, third-party analytics trackers, or advertising scripts. Your financial amounts are never shared with external services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // SUB-SCREEN: 9. ABOUT THIS APP
  // --------------------------------------------------------------------------
  const renderAboutDetail = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveView('menu')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22A06B] dark:text-emerald-400 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>
        <span className="text-xs text-[#6B7280] dark:text-gray-400">About This App</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center font-extrabold text-2xl border border-[#22A06B]/20">
            CF
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1F2937] dark:text-gray-100">
              {APP_NAME}
            </h2>
            <div className="text-xs font-semibold text-[#22A06B] dark:text-emerald-400">
              {APP_VERSION_STRING}
            </div>
            <div className="text-[11px] text-[#6B7280] dark:text-gray-400 mt-0.5">
              Release: {RELEASE_DATE}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#F7F9F8] dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-700">
            <span className="text-[#6B7280] dark:text-gray-400 block font-medium">Version</span>
            <strong className="text-[#1F2937] dark:text-gray-200 font-mono text-sm">v{APP_VERSION}</strong>
          </div>
          <div className="p-3 bg-[#F7F9F8] dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-700">
            <span className="text-[#6B7280] dark:text-gray-400 block font-medium">Architecture</span>
            <strong className="text-[#1F2937] dark:text-gray-200">React + Firestore + IndexedDB</strong>
          </div>
          <div className="p-3 bg-[#F7F9F8] dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-700">
            <span className="text-[#6B7280] dark:text-gray-400 block font-medium">Currency Engine</span>
            <strong className="text-[#1F2937] dark:text-gray-200">Preserved Native Records</strong>
          </div>
        </div>

        <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
          CapitalFlow is an institutional-grade investment portfolio management engine designed for multi-currency investments, monthly tracker ledgers, capital recovery tracking, and consolidated reporting.
        </p>
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // MAIN VIEW: COMPACT MOBILE-APP STYLE MENU (EXACT 10 ROWS IN REQUIRED ORDER)
  // --------------------------------------------------------------------------
  if (activeView !== 'menu') {
    return (
      <div className="max-w-2xl mx-auto pb-12">
        {activeView === 'profile' && renderProfileDetail()}
        {activeView === 'currency' && renderCurrencyDetail()}
        {activeView === 'reminders' && renderRemindersDetail()}
        {activeView === 'theme' && renderThemeDetail()}
        {activeView === 'share' && renderShareDetail()}
        {activeView === 'webapp' && renderWebAppDetail()}
        {activeView === 'data' && renderDataDetail()}
        {activeView === 'privacy' && renderPrivacyDetail()}
        {activeView === 'about' && renderAboutDetail()}

        {/* Clear Data Dialog */}
        <ConfirmDialog
          isOpen={isClearConfirmOpen}
          title="Clear All Portfolio Investments & Funding"
          message="Are you sure you want to permanently delete all investments, monthly tracker logs, and funding records from your account? This action cannot be undone."
          confirmLabel="Clear All Data"
          onConfirm={async () => {
            setIsClearConfirmOpen(false);
            await clearAllData();
          }}
          onCancel={() => setIsClearConfirmOpen(false)}
        />

        {/* Sample Import Dialog */}
        <ConfirmDialog
          isOpen={isSampleConfirmOpen}
          title="Import Sample Portfolio Demo"
          message="This will add 4 realistic sample cross-border investments with monthly logs and 5 funding allocation records to demonstrate the workbook calculations. Do you want to proceed?"
          confirmLabel="Import Sample Data"
          isDestructive={false}
          onConfirm={async () => {
            setIsSampleConfirmOpen(false);
            await importSampleData();
          }}
          onCancel={() => setIsSampleConfirmOpen(false)}
        />
      </div>
    );
  }

  // Value preview strings for menu rows
  const profilePreview = profile?.companyName || 'Vayxon Capital';
  const currencyPreview = `${masterCurrency} • ${defaultCountry || 'Saudi Arabia'}`;
  const remindersPreview = notificationReminder 
    ? `Monthly • Day ${reminderDay} • ${formatTimeDisplay(reminderTime)}`
    : 'Disabled';
  const themePreview = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System / Automatic';
  const sharePreview = 'Share app, copy link or QR';
  const webAppPreview = 'Cross-device access';
  const dataPreview = syncStatus === 'synced' ? 'Synced' : 'Processing...';
  const privacyPreview = 'Account and data protection';
  const aboutPreview = `Version ${APP_VERSION}`;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* Compact Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-2xs">
        <h1 className="text-xl font-bold text-[#1F2937] dark:text-gray-100">
          Settings
        </h1>
        <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
          Portfolio parameters, regional defaults & preferences
        </p>
      </div>

      {/* Main 10-Row Menu List in Exact Required Order */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/60 overflow-hidden shadow-2xs">
        {/* 1. Profile & Portfolio Identity */}
        <button
          type="button"
          onClick={() => setActiveView('profile')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#22A06B]/20">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1F2937] dark:text-gray-100 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors">
                Profile & Portfolio Identity
              </div>
              <div className="text-xs text-[#6B7280] dark:text-gray-400 truncate mt-0.5 font-medium">
                {profilePreview}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
        </button>

        {/* 2. Currency & Regional Settings */}
        <button
          type="button"
          onClick={() => setActiveView('currency')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#22A06B]/20">
              <Coins className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1F2937] dark:text-gray-100 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors">
                Currency & Regional Settings
              </div>
              <div className="text-xs text-[#6B7280] dark:text-gray-400 truncate mt-0.5 font-medium">
                {currencyPreview}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
        </button>

        {/* 3. Reminders */}
        <button
          type="button"
          onClick={() => setActiveView('reminders')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#22A06B]/20">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1F2937] dark:text-gray-100 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors">
                Reminders
              </div>
              <div className="text-xs text-[#6B7280] dark:text-gray-400 truncate mt-0.5 font-medium">
                {remindersPreview}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
        </button>

        {/* 4. Theme */}
        <button
          type="button"
          onClick={() => setActiveView('theme')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#22A06B]/20">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4" />
              ) : theme === 'light' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Laptop className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1F2937] dark:text-gray-100 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors">
                Theme
              </div>
              <div className="text-xs text-[#6B7280] dark:text-gray-400 truncate mt-0.5 font-medium">
                {themePreview}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
        </button>

        {/* 5. Share & Invite */}
        <button
          type="button"
          onClick={() => setActiveView('share')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#22A06B]/20">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1F2937] dark:text-gray-100 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors">
                Share & Invite
              </div>
              <div className="text-xs text-[#6B7280] dark:text-gray-400 truncate mt-0.5 font-medium">
                {sharePreview}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
        </button>

        {/* 6. Web App & Device Access */}
        <button
          type="button"
          onClick={() => setActiveView('webapp')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#22A06B]/20">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1F2937] dark:text-gray-100 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors">
                Web App & Device Access
              </div>
              <div className="text-xs text-[#6B7280] dark:text-gray-400 truncate mt-0.5 font-medium">
                {webAppPreview}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
        </button>

        {/* 7. Data & Sync */}
        <button
          type="button"
          onClick={() => setActiveView('data')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#22A06B]/20">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1F2937] dark:text-gray-100 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors">
                Data & Sync
              </div>
              <div className="text-xs text-[#6B7280] dark:text-gray-400 truncate mt-0.5 font-medium">
                {dataPreview}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
        </button>

        {/* 8. Privacy & Security */}
        <button
          type="button"
          onClick={() => setActiveView('privacy')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#22A06B]/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1F2937] dark:text-gray-100 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors">
                Privacy & Security
              </div>
              <div className="text-xs text-[#6B7280] dark:text-gray-400 truncate mt-0.5 font-medium">
                {privacyPreview}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
        </button>

        {/* 9. About This App */}
        <button
          type="button"
          onClick={() => setActiveView('about')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#22A06B]/20">
              <Info className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1F2937] dark:text-gray-100 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors">
                About This App
              </div>
              <div className="text-xs text-[#6B7280] dark:text-gray-400 truncate mt-0.5 font-medium">
                {aboutPreview}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#22A06B] dark:group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
        </button>

        {/* 10. Logout */}
        <button
          type="button"
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-800">
              <LogOut className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                Logout
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 font-mono">
                {user?.email || 'Sign out of session'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors shrink-0 ml-2" />
        </button>
      </div>

      {/* Safety Confirmation for Logout */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        title="Sign Out of CapitalFlow"
        message="Are you sure you want to end your current session? Your local data is preserved and will resume upon next sign-in."
        confirmLabel="Sign Out"
        isDestructive={false}
        onConfirm={async () => {
          setIsLogoutConfirmOpen(false);
          await logOut();
        }}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </div>
  );
};
