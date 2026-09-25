import React, { useState } from 'react';
import { Investment, MonthlyRecord } from '../../types';
import { computeMonthlyRecords } from '../../lib/calculations';
import { formatCurrency } from '../../lib/currency';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../ConfirmDialog';
import { Modal } from '../Modal';

interface Props {
  investment: Investment;
  records: MonthlyRecord[];
  onAddRecord: (data: Omit<MonthlyRecord, 'id' | 'userId' | 'investmentId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  onUpdateRecord: (recordId: string, data: Partial<MonthlyRecord>) => Promise<void>;
  onDeleteRecord: (recordId: string) => Promise<void>;
}

export const MonthlyTrackerTable: React.FC<Props> = ({
  investment,
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
}) => {
  const computedRecords = computeMonthlyRecords(investment, records);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MonthlyRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [month, setMonth] = useState('');
  const [date, setDate] = useState('');
  const [income, setIncome] = useState('');
  const [expense, setExpense] = useState('');
  const [additionalCapital, setAdditionalCapital] = useState('');
  const [withdrawal, setWithdrawal] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Completed');
  const [submitting, setSubmitting] = useState(false);

  // Prefill next month
  const openNewEntry = () => {
    setEditingRecord(null);
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (computedRecords.length > 0) {
      const last = computedRecords[computedRecords.length - 1];
      const lastDate = new Date(last.date);
      lastDate.setMonth(lastDate.getMonth() + 1);
      const nextMonthName = `${months[lastDate.getMonth()]} ${lastDate.getFullYear()}`;
      setMonth(nextMonthName);
      setDate(lastDate.toISOString().split('T')[0]);
    } else {
      setMonth(`${months[now.getMonth()]} ${now.getFullYear()}`);
      setDate(now.toISOString().split('T')[0]);
    }

    setIncome('');
    setExpense('0');
    setAdditionalCapital('0');
    setWithdrawal('0');
    setNotes('');
    setStatus('Completed');
    setIsAddModalOpen(true);
  };

  // Edit existing entry
  const openEditEntry = (rec: MonthlyRecord) => {
    setEditingRecord(rec);
    setMonth(rec.month);
    setDate(rec.date);
    setIncome(rec.income.toString());
    setExpense(rec.expense.toString());
    setAdditionalCapital(rec.additionalCapital.toString());
    setWithdrawal(rec.withdrawal.toString());
    setNotes(rec.notes || '');
    setStatus(rec.status || 'Completed');
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!month.trim() || !date) return;

    setSubmitting(true);
    try {
      const parsedIncome = parseFloat(income) || 0;
      const parsedExpense = parseFloat(expense) || 0;
      const parsedAdditional = parseFloat(additionalCapital) || 0;
      const parsedWithdrawal = parseFloat(withdrawal) || 0;

      if (editingRecord) {
        await onUpdateRecord(editingRecord.id, {
          month: month.trim(),
          date,
          income: parsedIncome,
          expense: parsedExpense,
          additionalCapital: parsedAdditional,
          withdrawal: parsedWithdrawal,
          notes: notes.trim(),
          status,
        });
      } else {
        await onAddRecord({
          month: month.trim(),
          date,
          income: parsedIncome,
          expense: parsedExpense,
          additionalCapital: parsedAdditional,
          withdrawal: parsedWithdrawal,
          notes: notes.trim(),
          status,
        });
      }
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to save monthly record:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await onDeleteRecord(deletingId);
      setDeletingId(null);
    } catch (err) {
      console.error('Failed to delete monthly record:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-[#22A06B]/30 dark:border-[#22A06B]/40 overflow-hidden shadow-xs transition-colors">
      {/* Header bar */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#F0F9F5] via-[#F7FAF8] to-white dark:from-emerald-950/40 dark:via-gray-900/60 dark:to-gray-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg font-bold text-[#1F2937] dark:text-gray-100">Monthly Tracker</h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-[#22A06B] text-white shadow-2xs">
              PRIMARY ACTION
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-mono">
              {computedRecords.length} {computedRecords.length === 1 ? 'Month' : 'Months'}
            </span>
          </div>
          <p className="text-sm font-semibold text-[#22A06B] dark:text-emerald-400 mt-1">
            Add monthly income, expense, capital & profit
          </p>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">
            This is where I enter my monthly investment data. Records are strictly preserved in {investment.currency}.
          </p>
        </div>

        <button
          onClick={openNewEntry}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#22A06B] hover:bg-[#1b8357] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all self-start sm:self-auto active:scale-98 cursor-pointer ring-2 ring-[#22A06B]/20"
        >
          <Plus className="w-5 h-5" />
          <span>+ Add Monthly Entry</span>
        </button>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#1F2937] dark:text-gray-200 border-collapse font-sans">
          <thead>
            <tr className="bg-[#F1F5F3] dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider select-none">
              <th className="py-3 px-3">Month</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3 text-right">Income / Return</th>
              <th className="py-3 px-3 text-right">Expense</th>
              <th className="py-3 px-3 text-right">Net Monthly Profit</th>
              <th className="py-3 px-3 text-right">Add. Capital</th>
              <th className="py-3 px-3 text-right">Withdrawal</th>
              <th className="py-3 px-3 text-right">Remaining Capital</th>
              <th className="py-3 px-3 text-right">Monthly ROI</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3">Notes</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-mono text-[12px]">
            {computedRecords.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-[#6B7280] dark:text-gray-400 font-sans">
                  <div className="max-w-xs mx-auto text-center space-y-2">
                    <p className="text-sm font-semibold text-[#1F2937] dark:text-gray-100">No monthly records entered yet</p>
                    <p className="text-xs text-[#6B7280] dark:text-gray-400">
                      Click "Add Monthly Entry" above to log initial returns or ongoing operational activity.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              computedRecords.map((rec, idx) => {
                const isNetPositive = rec.netProfit > 0;
                const isNetNegative = rec.netProfit < 0;

                return (
                  <tr
                    key={rec.id}
                    className={`hover:bg-[#F9FBFA] dark:hover:bg-gray-700/50 transition-colors ${
                      idx % 2 === 1 ? 'bg-[#FCFDFD] dark:bg-gray-800/60' : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    {/* Month */}
                    <td className="py-2.5 px-3 font-semibold text-[#1F2937] dark:text-gray-100 font-sans whitespace-nowrap">
                      {rec.month}
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-3 text-[#6B7280] dark:text-gray-400 whitespace-nowrap">
                      {rec.date}
                    </td>

                    {/* Income */}
                    <td className="py-2.5 px-3 text-right text-[#22A06B] dark:text-emerald-400 font-semibold whitespace-nowrap">
                      {formatCurrency(rec.income, investment.currency)}
                    </td>

                    {/* Expense */}
                    <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatCurrency(rec.expense, investment.currency)}
                    </td>

                    {/* Net Monthly Profit */}
                    <td
                      className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                        isNetPositive
                          ? 'text-[#22A06B] dark:text-emerald-400'
                          : isNetNegative
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {formatCurrency(rec.netProfit, investment.currency)}
                    </td>

                    {/* Additional Capital */}
                    <td className="py-2.5 px-3 text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {rec.additionalCapital > 0
                        ? `+${formatCurrency(rec.additionalCapital, investment.currency)}`
                        : '-'}
                    </td>

                    {/* Withdrawal */}
                    <td className="py-2.5 px-3 text-right text-purple-600 dark:text-purple-400 whitespace-nowrap">
                      {rec.withdrawal > 0
                        ? `-${formatCurrency(rec.withdrawal, investment.currency)}`
                        : '-'}
                    </td>

                    {/* Remaining Capital */}
                    <td className="py-2.5 px-3 text-right font-semibold text-[#1F2937] dark:text-gray-100 whitespace-nowrap">
                      {formatCurrency(rec.remainingCapitalAfter, investment.currency)}
                    </td>

                    {/* Monthly ROI */}
                    <td
                      className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                        rec.monthlyRoi > 0
                          ? 'text-[#22A06B] dark:text-emerald-400'
                          : rec.monthlyRoi < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {rec.monthlyRoi.toFixed(2)}%
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 text-center font-sans whitespace-nowrap">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 border border-[#22A06B]/20 dark:border-emerald-800">
                        {rec.status || 'Completed'}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="py-2.5 px-3 text-[#6B7280] dark:text-gray-400 font-sans text-xs max-w-xs truncate" title={rec.notes}>
                      {rec.notes || '-'}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right font-sans whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditEntry(rec)}
                          title="Edit Record"
                          className="p-1 text-gray-400 hover:text-[#22A06B] dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(rec.id)}
                          title="Delete Record"
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Entry Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingRecord ? 'Edit Monthly Entry' : 'Add Monthly Record'}
        subtitle={`Track revenue and expenses for ${investment.name} in ${investment.currency}.`}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
                Month Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="e.g. Jan 2026, Q1 2026"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
                Income / Return ({investment.currency})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-mono text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
                Expense ({investment.currency})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={expense}
                onChange={(e) => setExpense(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-mono text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
                Additional Capital ({investment.currency})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={additionalCapital}
                onChange={(e) => setAdditionalCapital(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-mono text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
              />
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Injections / Capital expansion</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
                Withdrawal ({investment.currency})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={withdrawal}
                onChange={(e) => setWithdrawal(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-mono text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
              />
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Capital drawn down or dividend taken</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] dark:text-gray-200 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Quarterly dividend, maintenance repairs, bonus payout"
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-[#1F2937] dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#22A06B]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#22A06B] hover:bg-[#1b8357] text-white text-sm font-medium rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{editingRecord ? 'Update Entry' : 'Save Entry'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Safety Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Monthly Record"
        message="Are you sure you want to delete this monthly financial record? All financial totals and remaining capital will be recalculated."
        confirmLabel="Delete Record"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
