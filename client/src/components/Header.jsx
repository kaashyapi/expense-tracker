import React from 'react';
import { Plus, LogOut, Wallet } from 'lucide-react';

export default function Header({ user, onOpenAddExpense, onLogout }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1f1f23] bg-black/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Left: Brand Heading */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <h1 className="text-sm sm:text-lg font-semibold tracking-tight text-white whitespace-nowrap">
            Expense Tracker
          </h1>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <button
            onClick={onOpenAddExpense}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-white text-black hover:bg-[#e4e4e7] transition-colors shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Add Expense</span>
            <span className="xs:hidden">Add</span>
          </button>

          {user && (
            <div className="flex items-center space-x-1.5 sm:space-x-2 pl-1.5 sm:pl-2 border-l border-[#27272a]">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-[#3f3f46] object-cover"
                />
              ) : (
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#27272a] text-xs flex items-center justify-center font-medium text-white">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="text-xs text-[#a1a1aa] font-medium hidden md:inline max-w-[100px] truncate">
                {user.name}
              </span>
              <button
                onClick={onLogout}
                title="Log out"
                className="p-1 sm:p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

