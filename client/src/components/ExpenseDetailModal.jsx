import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit3, Check, Calendar, Tag, Clock } from 'lucide-react';
import CalendarDatePicker from './CalendarDatePicker';

export default function ExpenseDetailModal({
  isOpen,
  expense,
  categories = [],
  onClose,
  onUpdateExpense,
  onDeleteExpense
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (expense) {
      setTitle(expense.title || '');
      setCategoryName(expense.category || categories[0]?.name || '');
      setAmount(expense.amount ? expense.amount.toString() : '');
      setDate(expense.date || '');
      setNotes(expense.notes || '');
      setIsEditing(false);
      setIsDeleting(false);
      setError('');
    }
  }, [expense, categories]);

  if (!isOpen || !expense) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    const matchedCat = categories.find(c => c.name === categoryName);
    const categoryEmoji = matchedCat ? matchedCat.emoji : (expense.category_emoji || '🏷️');

    try {
      setIsSaving(true);
      await onUpdateExpense(expense.id, {
        title: title.trim(),
        category: categoryName,
        category_emoji: categoryEmoji,
        amount: numAmount,
        currency: expense.currency || 'EUR',
        date,
        notes: notes.trim(),
      });
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update expense');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSaving(true);
      await onDeleteExpense(expense.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete expense');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#09090b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#1f1f23] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{expense.category_emoji || '🏷️'}</span>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                {isEditing ? 'Edit Expense Record' : 'Expense Details'}
              </h3>
              <p className="text-[11px] text-[#71717a] font-mono">ID: {expense.id.slice(-8)}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-2.5 rounded-lg bg-[#270e0e] border border-[#4a1818] text-xs text-[#fca5a5]">
              {error}
            </div>
          )}

          {isEditing ? (
            /* Editing Form */
            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Category</label>
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full bg-black border border-[#27272a] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Amount (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Date</label>
                <CalendarDatePicker
                  value={date}
                  onChange={(newDate) => setDate(newDate)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-black border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#27272a] text-xs text-[#a1a1aa] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-[#e4e4e7]"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            /* Read-only View */
            <div className="space-y-4">
              <div className="p-3 bg-[#121214] border border-[#222226] rounded-lg">
                <div className="text-xs text-[#71717a]">Title</div>
                <div className="text-sm font-semibold text-white mt-0.5">{expense.title}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#121214] border border-[#222226] rounded-lg">
                  <div className="text-xs text-[#71717a]">Amount</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5">
                    €{Number(expense.amount).toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-[#121214] border border-[#222226] rounded-lg">
                  <div className="text-xs text-[#71717a]">Category</div>
                  <div className="text-xs font-medium text-white mt-1 flex items-center space-x-1">
                    <span>{expense.category_emoji}</span>
                    <span>{expense.category}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#121214] border border-[#222226] rounded-lg">
                  <div className="text-xs text-[#71717a]">Date</div>
                  <div className="text-xs font-mono text-white mt-0.5">{expense.date}</div>
                </div>
                <div className="p-3 bg-[#121214] border border-[#222226] rounded-lg">
                  <div className="text-xs text-[#71717a]">Logged At</div>
                  <div className="text-[11px] font-mono text-[#a1a1aa] mt-0.5 truncate">
                    {expense.created_at ? new Date(expense.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              {expense.notes && (
                <div className="p-3 bg-[#121214] border border-[#222226] rounded-lg">
                  <div className="text-xs text-[#71717a]">Notes</div>
                  <div className="text-xs text-[#d4d4d8] mt-0.5 whitespace-pre-wrap">{expense.notes}</div>
                </div>
              )}

              {/* View Mode Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-[#1f1f23]">
                {isDeleting ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-red-400">Confirm delete?</span>
                    <button
                      onClick={handleDelete}
                      disabled={isSaving}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-medium"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setIsDeleting(false)}
                      className="px-2 py-1 text-xs text-[#a1a1aa] hover:text-white"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsDeleting(true)}
                    className="flex items-center space-x-1 text-xs text-[#ef4444] hover:text-[#f87171] p-1.5 rounded hover:bg-[#1f1313] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Record</span>
                  </button>
                )}

                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-[#e4e4e7] transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Record</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

