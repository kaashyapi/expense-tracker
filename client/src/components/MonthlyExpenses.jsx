import React, { useState } from 'react';
import DataTable from './DataTable';
import { CalendarDays, ChevronDown, TrendingUp } from 'lucide-react';

export default function MonthlyExpenses({
  monthlySummaries = [],
  allExpenses = [],
  categories = [],
  loading = false,
  onSelectExpense
}) {
  // Default to the first month in list (which is current month e.g., Nov 2026)
  const [activeMonthKey, setActiveMonthKey] = useState(null);

  // If activeMonthKey is null and monthlySummaries has items, choose current month or index 0
  const currentKey = activeMonthKey || (monthlySummaries.length > 0 ? monthlySummaries[0].month : '');
  const activeSummary = monthlySummaries.find(m => m.month === currentKey) || monthlySummaries[0];

  // Filter expenses belonging strictly to this month
  const monthExpenses = allExpenses.filter(e => e.date && e.date.startsWith(currentKey));

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center space-x-2 text-white">
        <CalendarDays className="w-4 h-4 text-[#a1a1aa]" />
        <h2 className="text-base font-semibold tracking-tight">Monthly Breakdown</h2>
      </div>

      {/* Month Selection Bar / Horizontal Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
        {monthlySummaries.map((m) => {
          const isSelected = m.month === currentKey;
          return (
            <button
              key={m.month}
              onClick={() => setActiveMonthKey(m.month)}
              className={`flex flex-col items-start px-3 py-2 rounded-lg border text-left shrink-0 transition-all ${
                isSelected
                  ? 'bg-[#18181b] border-white text-white shadow-sm'
                  : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-medium">{m.month_name}</span>
                {m.is_current && (
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-[#27272a] text-[#4ade80] font-mono">
                    Current
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono mt-1 text-[#d4d4d8]">
                €{Number(m.total_amount || 0).toFixed(2)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Month Detail Card */}
      {activeSummary && (
        <div className="space-y-3">
          {/* Category-wise Breakdown Cards for Active Month */}
          <div className="p-4 bg-[#09090b] border border-[#27272a] rounded-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f1f23]">
              <h3 className="text-sm font-semibold text-white">
                {activeSummary.month_name} {activeSummary.is_current ? '(Current)' : ''}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#71717a]">Total:</span>
                <span className="text-sm font-mono font-bold text-white">
                  €{Number(activeSummary.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Category Subtotals */}
            <div className="mt-3">
              {(!activeSummary.categories || activeSummary.categories.length === 0) ? (
                <div className="text-xs text-[#71717a] py-1">
                  No spending recorded for this month
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeSummary.categories.map((cat) => (
                    <div
                      key={cat.category}
                      className="px-2.5 py-1.5 rounded-lg bg-[#121214] border border-[#222226] flex items-center space-x-2 text-xs"
                    >
                      <span>{cat.emoji}</span>
                      <span className="text-white font-medium">{cat.category}</span>
                      <span className="font-mono text-[#a1a1aa] pl-1 border-l border-[#27272a]">
                        €{Number(cat.total).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Paginated DataTable for this month's expenses */}
          <DataTable
            title={activeSummary.month_name}
            items={monthExpenses}
            categories={categories}
            loading={loading}
            onSelectExpense={onSelectExpense}
            emptyMessage="No expenses for this month."
            showFilters={true}
            defaultPageSize={5}
          />
        </div>
      )}
    </section>
  );
}

