# FinPulse — Personal Finance Dashboard

A local-first personal finance dashboard built with React. Track income and expenses, monitor SIP investments, manage loans, and get analytics — all stored in your browser with no backend required.

## Live Demo

(https://fin-pulse-finance-dashboard.vercel.app/)

## Features

- **Dashboard** — Net balance, income/expense stat cards, cash flow chart, spending by category (pie chart), and recent activity table
- **Transactions** — Full ledger with search, sort, and type filters. Click any row to view or edit. Export to CSV or Excel
- **Analytics** — Monthly income vs expense bar chart, expense distribution, balance trend, ranked category breakdowns
- **Savings (SIP)** — Track multiple SIP plans with projected corpus, growth path chart, and maturity details
- **Loans** — EMI calculator with amortization schedule, outstanding balance tracker, and principal vs interest breakdown
- **Date range filter** — Filter all dashboard, transaction, and analytics data by month or custom date range
- **Dark mode** — Fully supported, saved to device
- **Admin / Viewer roles** — Viewer is read-only, Admin can add, edit, delete, and reset data
- **Admin password protection** — Password-gated admin access, changeable from Settings (default: `admin123`)

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- Recharts
- SheetJS (xlsx) for Excel export

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Usage

- Open the app — it starts in **Viewer** mode (read-only)
- Click **Admin** in the top-right and enter the password (`admin123`) to unlock editing
- Use **Load sample data** on the Dashboard, Savings, and Loans tabs to explore with pre-filled data
- All data is stored in `localStorage` — nothing leaves your browser

## Notes

- No backend, no database, no authentication server — entirely client-side
- Data persists across sessions via `localStorage`. Clearing browser site data will reset everything
- The admin password is stored in `localStorage` and is intended for demo/assessment use only
