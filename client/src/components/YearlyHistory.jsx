import React, { useState, useMemo } from 'react';
import DataTable from './DataTable';
import { History, Calendar } from 'lucide-react';

export default function YearlyHistory({
  allExpenses = [],
  categories = [],
  loading = false,
  onSelectExpense,
  currencySymbol = '€'
}) {
  const currentYear = new Date().getFullYear().toString(); // e.g. 2026
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Collect available years from expenses + current year
  const availableYears = useMemo(() => {
    const years = new Set([currentYear, (Number(currentYear) - 1).toString(), (Number(currentYear) - 2).toString()]);
    allExpenses.forEach(e => {
      if (e.date) {
        const y = e.date.substring(0, 4);
        if (y) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [allExpenses, currentYear]);

  // Expenses for the selected year
  const yearExpenses = useMemo(() => {
    return allExpenses.filter(e => e.date && e.date.startsWith(selectedYear));
  }, [allExpenses, selectedYear]);

  // Total for the selected year
  const totalYearAmount = useMemo(() => {
    return yearExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [yearExpenses]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-white">
          <History className="w-4 h-4 text-[#a1a1aa]" />
          <h2 className="text-base font-semibold tracking-tight">Yearly History</h2>
        </div>

        {/* Year Selector */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-3.5 h-3.5 text-[#71717a]" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1 text-xs text-white font-medium focus:outline-none focus:border-[#52525b]"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>
                Year {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        title={`Annual Statement — ${selectedYear}`}
        items={yearExpenses}
        categories={categories}
        loading={loading}
        onSelectExpense={onSelectExpense}
        emptyMessage={`No expenses recorded for ${selectedYear}.`}
        showFilters={true}
        defaultPageSize={10}
        currencySymbol={currencySymbol}
        headerExtra={
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] text-xs font-mono text-white">
            <span className="text-[#71717a]">Total:</span>
            <span>{currencySymbol}{totalYearAmount.toFixed(2)}</span>
          </div>
        }
      />
    </section>
  );
}

