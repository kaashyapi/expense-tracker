import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export const getTodayLocalString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CalendarDatePicker({
  value,
  onChange,
  className = '',
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  const todayStr = getTodayLocalString();
  const selectedDateStr = value || todayStr;

  const [viewDate, setViewDate] = useState(() => {
    const parts = (value || todayStr).split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    }
    return new Date();
  });

  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setViewDate(new Date(Number(parts[0]), Number(parts[1]) - 1, 1));
      }
    }
  }, [value]);

  // Close calendar popover on outside click or ESC key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const prevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const jumpToToday = () => {
    const today = getTodayLocalString();
    onChange(today);
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setIsOpen(false);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const formatFriendlyDate = (dateStr) => {
    if (!dateStr) return 'Pick a date';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    if (isNaN(dateObj.getTime())) return dateStr;

    const isToday = dateStr === todayStr;
    const formatted = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    return isToday ? `${formatted} (Today)` : formatted;
  };

  const handleSelectDay = (dayNum) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    const newDateStr = `${viewYear}-${mm}-${dd}`;
    onChange(newDateStr);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between bg-black border border-[#27272a] hover:border-[#3f3f46] active:border-white rounded-lg px-3 py-2 text-xs sm:text-sm text-white transition-colors select-none text-left"
      >
        <div className="flex items-center space-x-2 truncate">
          <CalendarIcon className="w-4 h-4 text-[#a1a1aa] shrink-0" />
          <span className="font-mono text-xs">{selectedDateStr}</span>
          <span className="text-xs text-[#71717a] truncate">
            • {formatFriendlyDate(selectedDateStr)}
          </span>
        </div>
        <span className="text-[10px] sm:text-[11px] text-[#a1a1aa] bg-[#18181b] px-1.5 py-0.5 rounded border border-[#27272a] shrink-0 ml-1">
          Calendar
        </span>
      </button>

      {/* Portal Calendar Dialog: Rendered at root level so it NEVER gets clipped by modal overflow */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
            <div
              ref={popoverRef}
              className="w-full max-w-xs sm:max-w-sm bg-[#0c0c0e] border border-[#27272a] rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3"
            >
              {/* Calendar Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1f1f23]">
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {monthNames[viewMonth]} {viewYear}
                  </h4>
                  <p className="text-[11px] text-[#71717a] font-mono">
                    Selected: {selectedDateStr}
                  </p>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition-colors"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={jumpToToday}
                    className="px-2.5 py-1 text-[11px] font-medium bg-[#18181b] hover:bg-[#27272a] text-[#4ade80] rounded-lg transition-colors border border-[#1f3a22]"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition-colors"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors ml-1"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {dayHeaders.map((dh) => (
                  <span
                    key={dh}
                    className="text-[11px] font-semibold text-[#71717a] py-1"
                  >
                    {dh}
                  </span>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Previous month padding days */}
                {Array.from({ length: firstDayIndex }).map((_, i) => {
                  const prevDayNum = daysInPrevMonth - firstDayIndex + i + 1;
                  return (
                    <div
                      key={`prev-${i}`}
                      className="h-9 flex items-center justify-center text-xs text-[#3f3f46] select-none"
                    >
                      {prevDayNum}
                    </div>
                  );
                })}

                {/* Days of current month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const mm = String(viewMonth + 1).padStart(2, '0');
                  const dd = String(dayNum).padStart(2, '0');
                  const thisDayStr = `${viewYear}-${mm}-${dd}`;

                  const isSelected = thisDayStr === selectedDateStr;
                  const isToday = thisDayStr === todayStr;

                  return (
                    <button
                      type="button"
                      key={thisDayStr}
                      onClick={() => handleSelectDay(dayNum)}
                      className={`h-9 rounded-lg transition-all flex items-center justify-center font-mono text-xs relative active:scale-90 ${
                        isSelected
                          ? 'bg-white text-black font-bold shadow-md'
                          : isToday
                          ? 'bg-[#18181b] text-[#4ade80] font-semibold border border-[#2e4d31]'
                          : 'text-[#d4d4d8] hover:bg-[#1f1f23] hover:text-white'
                      }`}
                    >
                      {dayNum}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#4ade80]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-[#1f1f23] flex items-center justify-between text-xs text-[#71717a]">
                <span>Quick manual input:</span>
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => {
                    if (e.target.value) {
                      onChange(e.target.value);
                      setIsOpen(false);
                    }
                  }}
                  style={{ colorScheme: 'dark' }}
                  className="bg-black border border-[#27272a] rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
