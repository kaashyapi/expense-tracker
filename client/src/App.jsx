import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import OfflineBanner from './components/OfflineBanner';
import RecentExpenses from './components/RecentExpenses';
import CategoriesSection from './components/CategoriesSection';
import MonthlyExpenses from './components/MonthlyExpenses';
import YearlyHistory from './components/YearlyHistory';
import AddExpenseModal from './components/AddExpenseModal';
import ExpenseDetailModal from './components/ExpenseDetailModal';
import AddCategoryModal from './components/AddCategoryModal';
import AuthModal from './components/AuthModal';
import { api, getAuthToken, setAuthToken, removeAuthToken, getStoredUser, setStoredUser } from './api';

export default function App({ isGoogleConfigured = false }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getAuthToken());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCheckingOnline, setIsCheckingOnline] = useState(false);

  // Active currency tab ('EUR' or 'INR')
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    return localStorage.getItem('et_selected_currency') || 'EUR';
  });

  const handleSelectCurrency = (newCurrency) => {
    setSelectedCurrency(newCurrency);
    localStorage.setItem('et_selected_currency', newCurrency);
  };

  const currencySymbol = selectedCurrency === 'INR' ? '₹' : '€';

  // Data states
  const [categories, setCategories] = useState([]);
  const [remainingEmojis, setRemainingEmojis] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [monthlySummaries, setMonthlySummaries] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Check online status + MongoDB connectivity
  const verifyConnectivity = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return false;
    }
    try {
      setIsCheckingOnline(true);
      const res = await api.checkHealth();
      const onlineStatus = res.mongodb_connected === true;
      setIsOnline(onlineStatus);
      return onlineStatus;
    } catch {
      setIsOnline(false);
      return false;
    } finally {
      setIsCheckingOnline(false);
    }
  }, []);

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => verifyConnectivity();
    const handleOffline = () => setIsOnline(false);
    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('auth-expired', handleAuthExpired);

    // Initial check
    verifyConnectivity();
    const interval = setInterval(verifyConnectivity, 15000); // 15s heartbeat

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('auth-expired', handleAuthExpired);
      clearInterval(interval);
    };
  }, [verifyConnectivity]);

  // Load user data when authenticated & online
  const refreshAllData = useCallback(async (currencyToUse = selectedCurrency) => {
    if (!token) return;
    try {
      setLoadingData(true);
      const [catsRes, recentsRes, allRes, monthlyRes] = await Promise.all([
        api.getCategories(),
        api.getRecentExpenses(currencyToUse),
        api.getExpenses({ page_size: 100, currency: currencyToUse }), // recent 100 for tables
        api.getMonthlySummary(undefined, currencyToUse),
      ]);

      setCategories(catsRes.categories || []);
      setRemainingEmojis(catsRes.remaining_emojis || []);
      setRecentExpenses(recentsRes || []);
      setAllExpenses(allRes.items || []);
      setMonthlySummaries(monthlyRes || []);
    } catch (err) {
      console.error('Failed to load tracker data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [token, selectedCurrency]);

  useEffect(() => {
    if (token && isOnline) {
      refreshAllData(selectedCurrency);
    }
  }, [token, isOnline, selectedCurrency, refreshAllData]);

  // Handle Login
  const handleLogin = async (payload) => {
    const res = await api.googleAuth(payload);
    setAuthToken(res.token);
    setStoredUser(res.user);
    setToken(res.token);
    setUser(res.user);
  };

  const handleLogout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  // Add Expense
  const handleAddExpense = async (expenseData) => {
    if (!isOnline || !navigator.onLine) {
      throw new Error("You are offline. You won't be able to save anything until your connection is restored.");
    }
    setIsSubmittingExpense(true);
    try {
      await api.createExpense(expenseData);
      setIsAddExpenseOpen(false);
      // If the expense was added with a different currency than current view, switch to it
      if (expenseData.currency && expenseData.currency !== selectedCurrency) {
        handleSelectCurrency(expenseData.currency);
      } else {
        await refreshAllData();
      }
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Update Expense
  const handleUpdateExpense = async (expenseId, updateData) => {
    if (!isOnline || !navigator.onLine) {
      throw new Error("You are offline. You won't be able to save changes until your connection is restored.");
    }
    await api.updateExpense(expenseId, updateData);
    await refreshAllData();
    setSelectedExpense(null);
  };

  // Delete Expense
  const handleDeleteExpense = async (expenseId) => {
    if (!isOnline || !navigator.onLine) {
      throw new Error("You are offline. You won't be able to delete records until your connection is restored.");
    }
    await api.deleteExpense(expenseId);
    await refreshAllData();
    setSelectedExpense(null);
  };

  // Add Category
  const handleAddCategory = async (catData) => {
    if (!isOnline || !navigator.onLine) {
      throw new Error("You are offline. You won't be able to save categories until your connection is restored.");
    }
    await api.addCategory(catData);
    setIsAddCategoryOpen(false);
    await refreshAllData();
  };

  // Compute category statistics (spending & transaction count)
  const categoryStats = useMemo(() => {
    const stats = {};
    allExpenses.forEach(item => {
      const cat = item.category;
      if (!stats[cat]) {
        stats[cat] = { total: 0, count: 0 };
      }
      stats[cat].total += Number(item.amount) || 0;
      stats[cat].count += 1;
    });
    return stats;
  }, [allExpenses]);

  // If not logged in, show Auth Screen
  if (!token) {
    return (
      <AuthModal
        onLoginSuccess={handleLogin}
        isOnline={isOnline}
        isGoogleConfigured={isGoogleConfigured}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#e4e4e7] flex flex-col font-sans selection:bg-[#27272a] selection:text-white">
      {/* Sticky Header */}
      <Header
        user={user}
        selectedCurrency={selectedCurrency}
        onSelectCurrency={handleSelectCurrency}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        onLogout={handleLogout}
      />

      {/* Offline Status Warning Banner */}
      {!isOnline && (
        <OfflineBanner
          onRetry={verifyConnectivity}
          isChecking={isCheckingOnline}
        />
      )}

      {/* Main Single Scrollable Page */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        
        {/* 1. Recent Top 7 Logged Expenses */}
        <RecentExpenses
          expenses={recentExpenses}
          categories={categories}
          loading={loadingData}
          onSelectExpense={(item) => setSelectedExpense(item)}
          currencySymbol={currencySymbol}
        />

        {/* 2. Categories with + icon on top right to add new */}
        <CategoriesSection
          categories={categories}
          categoryStats={categoryStats}
          currencySymbol={currencySymbol}
          onOpenAddCategory={() => setIsAddCategoryOpen(true)}
          onSelectCategoryFilter={(catName) => {
            // Scroll to yearly history or monthly
            const el = document.getElementById('yearly-history-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 3. Monthly Expenses (12 Months Sequence from current downwards) */}
        <MonthlyExpenses
          monthlySummaries={monthlySummaries}
          allExpenses={allExpenses}
          categories={categories}
          loading={loadingData}
          onSelectExpense={(item) => setSelectedExpense(item)}
          currencySymbol={currencySymbol}
        />

        {/* 4. Yearly History with Global DataTable Filters */}
        <div id="yearly-history-section">
          <YearlyHistory
            allExpenses={allExpenses}
            categories={categories}
            loading={loadingData}
            onSelectExpense={(item) => setSelectedExpense(item)}
            currencySymbol={currencySymbol}
          />
        </div>

      </main>

      {/* Modals & Overlays */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        categories={categories}
        onAddExpense={handleAddExpense}
        isSubmitting={isSubmittingExpense}
        defaultCurrency={selectedCurrency}
        isFirstExpense={allExpenses.length === 0 && recentExpenses.length === 0}
      />

      <ExpenseDetailModal
        isOpen={!!selectedExpense}
        expense={selectedExpense}
        categories={categories}
        onClose={() => setSelectedExpense(null)}
        onUpdateExpense={handleUpdateExpense}
        onDeleteExpense={handleDeleteExpense}
      />

      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        remainingEmojis={remainingEmojis}
        existingCategories={categories}
        onAddCategory={handleAddCategory}
      />

      {/* Footer */}
      <footer className="border-t border-[#1f1f23] py-5 px-4 text-center text-xs text-[#52525b]">
        Expense Tracker
      </footer>
    </div>
  );
}

