import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { SUPPORTED_CURRENCIES } from '../../lib/currency';
import { Investment } from '../../types';
import { useApp } from '../../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investmentToEdit?: Investment | null;
  onSuccess?: (id: string) => void;
}

export const AddInvestmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  investmentToEdit,
  onSuccess,
}) => {
  const { addInvestment, updateInvestment, profile } = useApp();

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [initialCapital, setInitialCapital] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetPeriod, setTargetPeriod] = useState('12 Months');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (investmentToEdit) {
      setName(investmentToEdit.name || '');
      setCountry(investmentToEdit.country || '');
      setCurrency(investmentToEdit.currency || 'SAR');
      setInitialCapital(String(investmentToEdit.initialCapital ?? ''));
      setStartDate(investmentToEdit.startDate || '');
      setTargetPeriod(investmentToEdit.targetPeriod || '12 Months');
      setNotes(investmentToEdit.notes || '');
    } else {
      setName('');
      setCountry(profile?.defaultCountry || 'Saudi Arabia');
      setCurrency(profile?.defaultCurrency || profile?.masterCurrency || 'SAR');
      setInitialCapital('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setTargetPeriod('12 Months');
      setNotes('');
    }
    setError(null);
  }, [investmentToEdit, isOpen, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter an investment name.');
      return;
    }
    if (!country.trim()) {
      setError('Please enter a country.');
      return;
    }
    const capitalNum = parseFloat(initialCapital);
    if (isNaN(capitalNum) || capitalNum < 0) {
      setError('Please enter a valid non-negative initial capital amount.');
      return;
    }
    if (!startDate) {
      setError('Please specify an investment start date.');
      return;
    }

    setSubmitting(true);
    try {
      if (investmentToEdit) {
        await updateInvestment(investmentToEdit.id, {
          name: name.trim(),
          country: country.trim(),
          currency,
          initialCapital: capitalNum,
          startDate,
          targetPeriod: targetPeriod.trim(),
          notes: notes.trim(),
        });
        onSuccess?.(investmentToEdit.id);
      } else {
        const newId = await addInvestment({
          name: name.trim(),
          country: country.trim(),
          currency,
          initialCapital: capitalNum,
          startDate,
          targetPeriod: targetPeriod.trim(),
          notes: notes.trim(),
        });
        onSuccess?.(newId);
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving investment:', err);
      setError(err?.message || 'Failed to save investment. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={investmentToEdit ? 'Edit Investment' : 'Add New Investment'}
      subtitle={
        investmentToEdit
          ? 'Modify investment asset details and currency settings.'
          : 'Create a new portfolio asset with independent currency tracking.'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Investment Name */}
        <div>
          <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
            Investment Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Riyadh Commercial Tower Lease, Dhaka Fleet"
            className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#22A06B] focus:border-[#22A06B]"
          />
        </div>

        {/* Country and Currency row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Saudi Arabia, Bangladesh"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#22A06B] focus:border-[#22A06B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
              Investment Currency <span className="text-red-500">*</span>
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B] focus:border-[#22A06B]"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  {c.flag} {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-[#6B7280] dark:text-gray-400 mt-1">
              All transactions for this asset remain stored in {currency}.
            </p>
          </div>
        </div>

        {/* Initial Capital & Start Date row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
              Initial Capital ({currency}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              placeholder="e.g. 100000"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-mono text-[#1F2937] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#22A06B] focus:border-[#22A06B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B] focus:border-[#22A06B]"
            />
          </div>
        </div>

        {/* Target Period */}
        <div>
          <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
            Target Period
          </label>
          <input
            type="text"
            value={targetPeriod}
            onChange={(e) => setTargetPeriod(e.target.value)}
            placeholder="e.g. 12 Months, 24 Months, 3 Years"
            className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#22A06B] focus:border-[#22A06B]"
          />
          <p className="text-[10px] text-[#6B7280] dark:text-gray-400 mt-1">
            Used to monitor capital recovery schedule and target approaching/missed warnings.
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
            Notes / Investment Thesis
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key partners, contracts, terms or expected payback..."
            className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#22A06B] focus:border-[#22A06B]"
          />
        </div>

        {/* Action buttons */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-[#22A06B] hover:bg-[#1b8357] text-white text-sm font-medium rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{investmentToEdit ? 'Save Changes' : 'Create Investment'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
