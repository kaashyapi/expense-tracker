import React, { useState, useEffect } from 'react';
import { X, Tag, FileText, Check } from 'lucide-react';
import CalendarDatePicker, { getTodayLocalString } from './CalendarDatePicker';

export default function AddExpenseModal({
  isOpen,
  onClose,
  categories = [],
  onAddExpense,
  isSubmitting = false,
  defaultCurrency = 'EUR',
  isFirstExpense = false,
}) {
  const [title, setTitle] = useState('');
  const [categoryName, setCategoryName] = useState(categories[0]?.name || 'Groceries');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayLocalString());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Whenever user opens the modal, reset date to current today's date & clear form
  useEffect(() => {
    if (isOpen) {
      setDate(getTodayLocalString());
      setTitle('');
      setAmount('');
      setNotes('');
      setCurrency(defaultCurrency);
      setError('');
      if (categories.length > 0 && !categories.some(c => c.name === categoryName)) {
        setCategoryName(categories[0].name);
      }
    }
  }, [isOpen, categories, defaultCurrency]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Strict validation: Verify required fields before making any API request
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Expense Title is required.');
      return;
    }

    if (!categoryName) {
      setError('Category is required.');
      return;
    }

    if (!amount || amount.toString().trim() === '') {
      setError('Amount is required.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!date || !date.trim()) {
      setError('Date is required.');
      return;
    }

    const matchedCat = categories.find(c => c.name === categoryName);
    const categoryEmoji = matchedCat ? matchedCat.emoji : '🏷️';

    try {
      // Hit API only after all required fields pass validation
      await onAddExpense({
        title: cleanTitle,
        category: categoryName,
        category_emoji: categoryEmoji,
        amount: numAmount,
        currency: currency || 'EUR',
        date: date.trim(),
        notes: notes.trim(),
      });

      // Reset form fields
      setTitle('');
      setAmount('');
      setNotes('');
      setDate(getTodayLocalString());
      setError('');

      // Automatically close pop-up on own
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save expense');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#09090b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#1f1f23] flex items-center justify-between shrink-0">
          <h3 className="text-base font-semibold text-white tracking-tight">Add Expense</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto">
          {/* First expense prompt */}
          {isFirstExpense && (
            <div className="p-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs space-y-1">
              <div className="font-semibold text-white flex items-center justify-between">
                <span>Select Currency</span>
                <span className="text-[10px] text-[#4ade80] font-mono uppercase px-1.5 py-0.5 rounded bg-[#1f2937]">First Entry</span>
              </div>
              <p className="text-[#a1a1aa] leading-relaxed">
                Default currency is <strong>EUR (€)</strong>. Switch to <strong>INR (₹)</strong> below if you prefer, or toggle between them anytime at the top bar.
              </p>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-[#270e0e] border border-[#4a1818] text-xs text-[#fca5a5]">
              {error}
            </div>
          )}

          {/* Currency Toggle */}
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
              Currency
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCurrency('EUR')}
                className={`py-1.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
                  currency === 'EUR'
                    ? 'bg-white text-black border-white shadow-sm font-semibold'
                    : 'bg-black text-[#a1a1aa] border-[#27272a] hover:border-[#3f3f46] hover:text-white'
                }`}
              >
                <span className="font-semibold">€</span>
                <span>EUR (Euro)</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`py-1.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
                  currency === 'INR'
                    ? 'bg-white text-black border-white shadow-sm font-semibold'
                    : 'bg-black text-[#a1a1aa] border-[#27272a] hover:border-[#3f3f46] hover:text-white'
                }`}
              >
                <span className="font-semibold">₹</span>
                <span>INR (Rupee)</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
              Expense Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Weekly Supermarket Run"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border border-[#27272a] rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-white transition-colors"
              autoFocus
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
              Category <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full bg-black border border-[#27272a] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-white transition-colors appearance-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name} className="bg-[#121214] text-white">
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#71717a] text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Amount & Date Grid - Stack on mobile, 2 cols on tablet/desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Amount ({currency === 'INR' ? '₹ INR' : '€ EUR'}) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] text-xs font-mono font-medium">
                  {currency === 'INR' ? '₹' : '€'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black border border-[#27272a] rounded-lg pl-7 pr-3 py-2 text-xs sm:text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-white font-mono transition-colors"
                />
              </div>
            </div>

            {/* Date Calendar Picker */}
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Date <span className="text-red-400">*</span>
              </label>
              <CalendarDatePicker
                value={date}
                onChange={(newDate) => setDate(newDate)}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Any details or receipt remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-black border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-white transition-colors resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#27272a] text-xs text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-[#e4e4e7] transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Expense'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

