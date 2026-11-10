# Minimalist Expense Tracker (Full Black & Grey Edition)

A high-contrast, pure black & charcoal grey responsive web application connected to MongoDB Atlas for tracking personal finances.

---

## Features

- **Strict Online-Only Operation**: Live connection heartbeat to MongoDB Atlas (`expensetracker` database). Operations freeze and notify if connectivity is lost.
- **Minimalist Black/Grey Theme**: Engineered with `#000000`, deep zinc/charcoal surfaces (`#09090b`, `#121214`, `#18181b`, `#27272a`), subtle 1px border lines, and clean monospace numeric typography.
- **Top Dashboard — Recent 7 Entries**: Displays your latest 7 logged transactions with instant click-to-view/edit/delete modal.
- **Categories (11 Presets + Custom)**:
  - 🛒 Groceries
  - 🎓 Education
  - 🧾 Bills & Rents
  - 🛡️ Insurances
  - 🚗 Transport
  - 🛍️ Product Shopping
  - 🧴 Hygiene & Health
  - 🤝 Lend/Borrow
  - 💸 INR Transfer
  - 🍕 Fun & Eat-Out
  - 🚬 Bad Habits
  - **Custom Categories**: `+` button at the top-right of the Categories card opens a modal to create new categories. Features a unique emoji picker that deduplicates and only displays unassigned emojis.
- **Monthly Breakdown (12 Months Sequence)**:
  - Sequences 12 months starting from current month (e.g. Nov 2026) downwards.
  - Category-wise spending breakdown and monthly grand totals.
  - Full paginated DataTables (Page 1, Page 2...) for user expenses logged in that month.
- **Yearly History**:
  - Year selector (defaults to current year).
  - Annual grand total summary.
- **Unified Data Tables & Global Filters**:
  - Search by title or notes
  - Category dropdown filter
  - Min & Max amount (€ EUR)
  - Date range filter
  - Column sorting (Date, Title, Amount)
  - Configurable page size (5, 10, 20 per page)
- **Add Expense Modal (`+` Icon)**:
  - Quick access from the global header.
  - Title, Category dropdown (with emojis), Amount (default `€`), Date picker, and Notes.
- **View / Edit / Delete Modal**:
  - Click any expense row to open details, edit fields inline, or delete.
- **Authentication**:
  - Google Sign-In button with Google Identity Services.
  - Dev/Demo 1-click instant login button for instant access.
- **MongoDB Database**:
  - Exactly 2 collections in `expensetracker` db: `users` and `expenses`.

---

## How to Run

### Option 1: Quick Start (Windows)
Double-click `run.bat` or run in PowerShell:
```powershell
.\venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Open your browser to: **http://localhost:8000**

### Option 2: Frontend Development Mode
If editing client UI in hot-reload mode:
```bash
# Terminal 1 (Backend API):
.\venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000 --reload

# Terminal 2 (Vite Frontend):
cd client
npm run dev
```
Open **http://localhost:5173**

