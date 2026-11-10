import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Calendar, Edit3, X } from 'lucide-react';

export default function DataTable({
  title,
  subtitle,
  items = [],
  categories = [],
  loading = false,
  onSelectExpense,
  emptyMessage = "No expenses found",
  showFilters = true,
  defaultPageSize = 5,
  defaultSortBy = 'date',
  defaultSortOrder = 'desc',
  headerExtra = null,
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortOrder, setSortOrder] = useState(defaultSortOrder); // 'asc' or 'desc'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Active filters count
  const activeFiltersCount = [
    selectedCategory !== 'ALL',
    minAmount !== '',
    maxAmount !== '',
    startDate !== '',
    endDate !== '',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory('ALL');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
  };

  // Filter & sort locally or display
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search keyword
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter(item => item.category === selectedCategory);
    }

    // Amount range
    if (minAmount !== '') {
      result = result.filter(item => item.amount >= parseFloat(minAmount));
    }
    if (maxAmount !== '') {
      result = result.filter(item => item.amount <= parseFloat(maxAmount));
    }

    // Date range
    if (startDate) {
      result = result.filter(item => item.date >= startDate);
    }
    if (endDate) {
      result = result.filter(item => item.date <= endDate);
    }

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'amount') {
        valA = Number(valA);
        valB = Number(valB);
      } else if (sortBy === 'title') {
        valA = (valA || '').toLowerCase();
        valB = (valB || '').toLowerCase();
      } else if (sortBy === 'created_at') {
        valA = new Date(a.created_at || a.date).getTime();
        valB = new Date(b.created_at || b.date).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [items, search, selectedCategory, minAmount, maxAmount, startDate, endDate, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-[#09090b] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
      {/* Table Header Section */}
      <div className="p-3.5 sm:p-5 border-b border-[#1f1f23]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-[#71717a] mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {headerExtra}

            {showFilters && (
              <button
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activeFiltersCount > 0
                    ? 'bg-[#18181b] border-[#3f3f46] text-white'
                    : 'bg-black border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46]'
                  }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center ml-0.5">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Global Filter Bar */}
        {showFilters && (
          <div className="mt-3.5 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
              <input
                type="text"
                placeholder="Search by title, notes, or category..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-black border border-[#27272a] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#52525b] transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Drawer details */}
            {showFilterDrawer && (
              <div className="p-3 bg-[#121214] border border-[#27272a] rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                {/* Category selector */}
                <div>
                  <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                    className="w-full bg-black border border-[#27272a] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#52525b]"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min / Max Amount */}
                <div className="flex space-x-1.5">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">Min (€)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={minAmount}
                      onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
                      className="w-full bg-black border border-[#27272a] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#52525b]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">Max (€)</label>
                    <input
                      type="number"
                      placeholder="Any"
                      value={maxAmount}
                      onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
                      className="w-full bg-black border border-[#27272a] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#52525b]"
                    />
                  </div>
                </div>

                {/* Date Range Start */}
                <div>
                  <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                    style={{ colorScheme: 'dark' }}
                    className="w-full bg-black border border-[#27272a] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#52525b]"
                  />
                </div>

                {/* Date Range End & Reset */}
                <div>
                  <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">To Date</label>
                  <div className="flex space-x-1.5">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                      style={{ colorScheme: 'dark' }}
                      className="w-full bg-black border border-[#27272a] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#52525b]"
                    />
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearFilters}
                        title="Reset Filters"
                        className="px-2 py-1 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded text-xs transition-colors shrink-0"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1f1f23] bg-[#0c0c0e] text-[#a1a1aa]">
              <th
                onClick={() => handleSort('date')}
                className="py-2.5 px-3 sm:py-3 sm:px-4 font-medium cursor-pointer hover:text-white transition-colors select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-[#52525b]" />
                </div>
              </th>
              <th
                onClick={() => handleSort('title')}
                className="py-2.5 px-3 sm:py-3 sm:px-4 font-medium cursor-pointer hover:text-white transition-colors select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>Expense</span>
                  <ArrowUpDown className="w-3 h-3 text-[#52525b]" />
                </div>
              </th>
              <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-medium">Category</th>
              <th
                onClick={() => handleSort('amount')}
                className="py-2.5 px-3 sm:py-3 sm:px-4 font-medium text-right cursor-pointer hover:text-white transition-colors select-none"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Amount</span>
                  <ArrowUpDown className="w-3 h-3 text-[#52525b]" />
                </div>
              </th>
              <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-medium text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#18181b]">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-[#71717a]">
                  Loading expenses...
                </td>
              </tr>
            ) : paginatedItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-[#71717a]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectExpense && onSelectExpense(item)}
                  className="hover:bg-[#121215] cursor-pointer transition-colors group"
                >
                  <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-[#a1a1aa] whitespace-nowrap font-mono text-[11px]">
                    {item.date}
                  </td>
                  <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-white font-medium">
                    <div className="flex flex-col">
                      <span className="truncate max-w-[140px] sm:max-w-xs">{item.title}</span>
                      {item.notes && (
                        <span className="text-[11px] text-[#71717a] truncate max-w-[140px] sm:max-w-xs">
                          {item.notes}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 sm:py-3 sm:px-4 whitespace-nowrap">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#18181b] border border-[#27272a] text-[#d4d4d8] text-[11px]">
                      <span>{item.category_emoji || '🏷️'}</span>
                      <span>{item.category}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-right whitespace-nowrap font-mono font-semibold text-white">
                    €{Number(item.amount).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectExpense) onSelectExpense(item);
                      }}
                      className="p-1 rounded text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
                      title="View / Edit expense"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:px-4 border-t border-[#1f1f23] bg-[#0c0c0e] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-[#71717a]">
        <div className="text-[11px] sm:text-xs">
          Showing {filteredItems.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length} entries
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-2 w-full sm:w-auto">
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="bg-black border border-[#27272a] rounded px-2 py-1 text-xs text-white focus:outline-none"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
          </select>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded bg-black border border-[#27272a] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#18181b]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-white font-mono text-[11px]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded bg-black border border-[#27272a] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#18181b]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

