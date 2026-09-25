import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_CURRENCIES } from '../../lib/currency';
import { FundingRecord, FundingType, FundingStatus } from '../../types';
import { X, Landmark, Building, Calendar, Tag, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editRecord?: FundingRecord | null;
}

const FUNDING_TYPES: FundingType[] = [
  'Capital Injection',
  'Partner Contribution',
  'Reinvested Returns',
  'Debt / Credit Facility',
  'Capital Distribution',
  'Withdrawal',
];

const FUNDING_STATUSES: FundingStatus[] = ['Completed', 'Committed', 'Pending'];

export const AddFundingModal: React.FC<Props> = ({ isOpen, onClose, editRecord }) => {
  const { investments, profile, addFundingRecord, updateFundingRecord } = useApp();

  const [source, setSource] = useState(editRecord?.source || '');
  const [type, setType] = useState<FundingType>(editRecord?.type || 'Capital Injection');
  const [amount, setAmount] = useState(editRecord?.amount?.toString() || '');
  const [currency, setCurrency] = useState(editRecord?.currency || profile?.masterCurrency || 'SAR');
  const [date, setDate] = useState(editRecord?.date || new Date().toISOString().split('T')[0]);
  const [allocatedInvestmentId, setAllocatedInvestmentId] = useState(editRecord?.allocatedInvestmentId || 'unallocated');
  const [status, setStatus] = useState<FundingStatus>(editRecord?.status || 'Completed');
  const [notes, setNotes] = useState(editRecord?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if editRecord changes
  React.useEffect(() => {
    if (editRecord) {
      setSource(editRecord.source);
      setType(editRecord.type);
      setAmount(editRecord.amount.toString());
      setCurrency(editRecord.currency);
      setDate(editRecord.date);
      setAllocatedInvestmentId(editRecord.allocatedInvestmentId || 'unallocated');
      setStatus(editRecord.status);
      setNotes(editRecord.notes || '');
    } else {
      setSource('');
      setType('Capital Injection');
      setAmount('');
      setCurrency(profile?.masterCurrency || 'SAR');
      setDate(new Date().toISOString().split('T')[0]);
      setAllocatedInvestmentId('unallocated');
      setStatus('Completed');
      setNotes('');
    }
    setError(null);
  }, [editRecord, profile?.masterCurrency, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive funding amount.');
      return;
    }

    if (!source.trim()) {
      setError('Please specify the funding source or investor name.');
      return;
    }

    setLoading(true);
    try {
      const selectedInv = investments.find((i) => i.id === allocatedInvestmentId);
      const allocatedInvestmentName = selectedInv 
        ? selectedInv.name 
        : allocatedInvestmentId === 'unallocated' 
        ? 'Unallocated Reserve Pool' 
        : '';

      if (editRecord) {
        await updateFundingRecord(editRecord.id, {
          source: source.trim(),
          type,
          amount: numAmount,
          currency,
          date,
          allocatedInvestmentId,
          allocatedInvestmentName,
          status,
          notes: notes.trim(),
        });
      } else {
        await addFundingRecord({
          source: source.trim(),
          type,
          amount: numAmount,
          currency,
          date,
          allocatedInvestmentId,
          allocatedInvestmentName,
          status,
          notes: notes.trim(),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save funding record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 flex items-center justify-center font-bold">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2937] dark:text-gray-100">
                {editRecord ? 'Edit Funding Transaction' : 'Record Capital Funding'}
              </h2>
              <p className="text-[11px] text-[#6B7280] dark:text-gray-400">
                Track partner contributions, capital injections, or capital returns.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Source / Investor */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
              Funding Source / Investor / Facility <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Primary General Partner, Angel Syndicate, Mezzanine Facility"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
            />
          </div>

          {/* Type & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
                Transaction Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as FundingType)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
              >
                {FUNDING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
                Funding Status <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FundingStatus)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
              >
                {FUNDING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500000"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-mono text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    {c.flag} {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Allocation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
                Funding Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
                Allocated To
              </label>
              <select
                value={allocatedInvestmentId}
                onChange={(e) => setAllocatedInvestmentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
              >
                <option value="unallocated">Unallocated / Liquid Reserve Pool</option>
                {investments.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} ({inv.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
              Notes & Terms <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 15% preferred return Hurdle, repayment in 24 months, tranches schedule..."
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#22A06B] hover:bg-[#1b8357] text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{editRecord ? 'Update Record' : 'Save Funding'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
