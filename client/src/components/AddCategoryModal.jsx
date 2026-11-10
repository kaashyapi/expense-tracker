import React, { useState } from 'react';
import { X, Plus, Sparkles, Check } from 'lucide-react';

export default function AddCategoryModal({
  isOpen,
  onClose,
  remainingEmojis = [],
  existingCategories = [],
  onAddCategory,
}) {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(remainingEmojis[0] || '🏷️');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please provide a category name.');
      return;
    }

    // Check duplicate name
    const exists = existingCategories.some(
      c => c.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      setError(`A category named "${cleanName}" already exists.`);
      return;
    }

    if (!selectedEmoji) {
      setError('Please select an emoji.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddCategory({
        name: cleanName,
        emoji: selectedEmoji,
      });
      setName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#09090b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#1f1f23] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{selectedEmoji}</span>
            <h3 className="text-base font-semibold text-white tracking-tight">New Category</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto">
          {error && (
            <div className="p-2.5 rounded-lg bg-[#270e0e] border border-[#4a1818] text-xs text-[#fca5a5]">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
              Category Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Freelancing, Pet Care, Fitness"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-[#27272a] rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-white transition-colors"
              autoFocus
            />
          </div>

          {/* Unique Remaining Emoji Grid */}
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
              Choose Emoji
            </label>

            <div className="p-2.5 bg-black border border-[#27272a] rounded-lg max-h-44 overflow-y-auto">
              {remainingEmojis.length === 0 ? (
                <div className="text-xs text-[#71717a] py-4 text-center">
                  All available preset emojis are currently assigned.
                </div>
              ) : (
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5 sm:gap-2">
                  {remainingEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`text-xl p-2 rounded-lg transition-all flex items-center justify-center select-none ${
                        selectedEmoji === emoji
                          ? 'bg-[#27272a] border border-white scale-110 shadow-sm'
                          : 'bg-[#121214] border border-[#222226] hover:bg-[#1c1c1f]'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#27272a] text-xs text-[#a1a1aa] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-[#e4e4e7] transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Creating...' : 'Create Category'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

