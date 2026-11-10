import React, { useMemo } from 'react';
import DataTable from './DataTable';
import { Clock } from 'lucide-react';

export default function RecentExpenses({
  expenses = [],
  categories = [],
  loading = false,
  onSelectExpense
}) {
  // Sort strictly by created date/time descending so newly logged records are at the top
  const sortedRecentExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      const timeA = new Date(a.created_at || a.date).getTime();
      const timeB = new Date(b.created_at || b.date).getTime();
      return timeB - timeA;
    }).slice(0, 7);
  }, [expenses]);

  return (
    <section className="space-y-3">
      <div className="flex items-center space-x-2 text-white">
        <Clock className="w-4 h-4 text-[#a1a1aa]" />
        <h2 className="text-base font-semibold tracking-tight">Recent Expenses</h2>
      </div>

      <DataTable
        title="Recent Expenses"
        items={sortedRecentExpenses}
        categories={categories}
        loading={loading}
        onSelectExpense={onSelectExpense}
        emptyMessage="No expenses logged yet."
        showFilters={true}
        defaultPageSize={7}
        defaultSortBy="created_at"
        defaultSortOrder="desc"
      />
    </section>
  );
}
