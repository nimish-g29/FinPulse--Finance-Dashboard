import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import Sidebar from "./components/Sidebar";
import FormModal from "./components/FormModal";
import StatCard from "./components/StatCard";
import SavingsTab from "./components/SavingsTab";
import LoansTab from "./components/LoansTab";
import {
  IconWallet,
  IconSun,
  IconMoon,
  IconMenu,
  IconPlus,
  IconSpark,
  IconTrendUp,
  IconTrendDown,
} from "./components/Icons";
import { formatInr, formatShortDate } from "./lib/format";
import * as XLSX from "xlsx";


// Fixed colors for known expense/income categories. Anything not in this map is "custom".
const KNOWN_CATEGORY_COLORS = {
  Food: "#f59e0b",
  Shopping: "#ec4899",
  Transport: "#10b981",
  Medical: "#f43f5e",
  Utilities: "#3b82f6",
  Entertainment: "#a855f7",
  Salary: "#10b981",
  Freelance: "#6366f1",
  Investments: "#14b8a6",
  Other: "#94a3b8",
};
const CUSTOM_CATEGORY_COLOR = "#64748b"; // single color for all custom labels

/** Given a list of {name, value} pieData items, merge all unknown categories into one "Custom" slice. */
function mergeCustomSlices(items) {
  const known = [];
  const customItems = [];
  let customTotal = 0;
  items.forEach((item) => {
    if (KNOWN_CATEGORY_COLORS[item.name] !== undefined) {
      known.push({ ...item, color: KNOWN_CATEGORY_COLORS[item.name] });
    } else {
      customItems.push(item);
      customTotal += item.value;
    }
  });
  if (customItems.length > 0) {
    known.push({ name: "Custom", value: customTotal, color: CUSTOM_CATEGORY_COLOR, customItems });
  }
  return known;
}

function normalizeSipRecord(raw, fallbackId) {
  return {
    id: raw.id != null ? Number(raw.id) || fallbackId : fallbackId,
    label: String(raw.label ?? "SIP"),
    monthlyAmount: Number(raw.monthlyAmount) || 0,
    expectedAnnualReturn: Number(raw.expectedAnnualReturn) || 0,
    tenureYears: Number(raw.tenureYears) || 0,
    startDate: raw.startDate || new Date().toISOString().slice(0, 10),
  };
}

function loadSips() {
  try {
    const multi = localStorage.getItem("finpulse-sips");
    if (multi) {
      const arr = JSON.parse(multi);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map((raw, i) => normalizeSipRecord(raw, Date.now() + i));
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const legacy = localStorage.getItem("finpulse-sip");
    if (legacy) {
      const p = JSON.parse(legacy);
      const one = normalizeSipRecord({ ...p, id: Date.now() }, Date.now());
      localStorage.setItem("finpulse-sips", JSON.stringify([one]));
      localStorage.removeItem("finpulse-sip");
      return [one];
    }
  } catch {
    /* ignore */
  }
  return [];
}

function normalizeLoanRecord(raw, fallbackId) {
  return {
    id: raw.id != null ? Number(raw.id) || fallbackId : fallbackId,
    label: String(raw.label ?? "Loan"),
    principal: Number(raw.principal) || 0,
    annualInterestRate: Number(raw.annualInterestRate) || 0,
    tenureYears: Number(raw.tenureYears) || 0,
    startDate: raw.startDate || new Date().toISOString().slice(0, 10),
    loanType: String(raw.loanType ?? "Home"),
    lender: String(raw.lender ?? ""),
  };
}

function loadLoans() {
  try {
    const raw = localStorage.getItem("finpulse-loans");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map((x, i) => normalizeLoanRecord(x, Date.now() + i));
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

const SAMPLE_TRANSACTIONS = [
  { id: "demo-1", date: "2026-03-28", amount: 92000, category: "Salary", type: "income" },
  { id: "demo-2", date: "2026-03-30", amount: 2800, category: "Food", type: "expense" },
  { id: "demo-3", date: "2026-04-01", amount: 4500, category: "Shopping", type: "expense" },
  { id: "demo-4", date: "2026-04-02", amount: 1200, category: "Transport", type: "expense" },
  { id: "demo-5", date: "2026-04-03", amount: 650, category: "Food", type: "expense" },
  { id: "demo-6", date: "2026-04-04", amount: 18000, category: "Freelance", type: "income" },
];

function EmptyChart({ message = "Add transactions to see this chart" }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-surface-muted/50 text-center dark:border-white/10">
      <IconSpark className="h-8 w-8 text-accent/60" />
      <p className="max-w-[14rem] text-sm text-ink-muted">{message}</p>
    </div>
  );
}

function ChartShell({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-surface p-5 shadow-card transition hover:shadow-lg dark:border-white/10 dark:bg-surface-muted/80 dark:shadow-card-dark">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function PieCategoryLegend({ items, onCustomClick }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2" role="list" aria-label="Category legend">
      {items.map((entry, i) => {
        const isCustom = entry.name === "Custom" && entry.customItems?.length > 0;
        return (
          <div
            key={`${entry.name}-${i}`}
            role="listitem"
            onClick={isCustom ? onCustomClick : undefined}
            className={`flex items-center gap-2 rounded-lg border border-slate-200/80 bg-surface-muted/60 px-2.5 py-1.5 text-xs dark:border-white/10 dark:bg-white/5 ${isCustom ? "cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition" : ""}`}
            title={isCustom ? `Click to see ${entry.customItems.length} custom categories` : entry.name}
          >
            <span
              className="h-3 w-3 shrink-0 rounded-sm ring-1 ring-black/10 dark:ring-white/15"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span className="max-w-[10rem] truncate font-medium text-ink">
              {entry.name}
            </span>
            {isCustom && (
              <span className="ml-0.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {entry.customItems.length}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DateRangeFilter({ dateRange, setDateRange, selectClass, inputClass }) {
  const modes = [
    { value: "all", label: "All time" },
    { value: "month", label: "Month" },
    { value: "range", label: "Date range" },
  ];

  const currentMonth = new Date().toISOString().slice(0, 7);

  const handleModeChange = (mode) => {
    if (mode === "month") {
      setDateRange({ mode, month: currentMonth, startDate: "", endDate: "" });
    } else if (mode === "range") {
      setDateRange({ mode, month: "", startDate: "", endDate: "" });
    } else {
      setDateRange({ mode: "all", month: "", startDate: "", endDate: "" });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={dateRange.mode}
        onChange={(e) => handleModeChange(e.target.value)}
        className={selectClass}
        aria-label="Filter period"
      >
        {modes.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      {dateRange.mode === "month" && (
        <input
          type="month"
          value={dateRange.month}
          onChange={(e) => setDateRange((r) => ({ ...r, month: e.target.value }))}
          className={inputClass}
          style={{ minWidth: "9rem", flex: "none" }}
          aria-label="Select month"
        />
      )}

      {dateRange.mode === "range" && (
        <>
          <input
            type="date"
            value={dateRange.startDate}
            max={dateRange.endDate || undefined}
            onChange={(e) => setDateRange((r) => ({ ...r, startDate: e.target.value }))}
            className={inputClass}
            style={{ minWidth: "8.5rem", flex: "none" }}
            aria-label="Start date"
            placeholder="From"
          />
          <span className="text-xs font-medium text-ink-muted">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            min={dateRange.startDate || undefined}
            onChange={(e) => setDateRange((r) => ({ ...r, endDate: e.target.value }))}
            className={inputClass}
            style={{ minWidth: "8.5rem", flex: "none" }}
            aria-label="End date"
            placeholder="To"
          />
        </>
      )}

      {dateRange.mode !== "all" && (
        <button
          type="button"
          onClick={() => setDateRange({ mode: "all", month: "", startDate: "", endDate: "" })}
          className="rounded-xl border border-slate-200 bg-surface px-2.5 py-2 text-xs font-semibold text-ink-muted shadow-sm transition hover:bg-surface-muted dark:border-white/10 dark:bg-surface-muted"
          aria-label="Clear filter"
          title="Clear date filter"
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : [];
  });
  const [role, setRole] = useState("viewer");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPwInput, setAdminPwInput] = useState("");
  const [adminPwError, setAdminPwError] = useState("");
  const [showChangePw, setShowChangePw] = useState(false);
  const [changePwDraft, setChangePwDraft] = useState({ current: "", next: "", confirm: "" });
  const [changePwError, setChangePwError] = useState("");
  const [changePwSuccess, setChangePwSuccess] = useState(false);

  const ADMIN_PW_KEY = "finpulse-admin-pw";
  const DEFAULT_PW = "admin123";
  const getAdminPw = () => localStorage.getItem(ADMIN_PW_KEY) || DEFAULT_PW;
  const checkAdminPw = (input) => input === getAdminPw();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dark, setDark] = useState(() => localStorage.getItem("finpulse-dark") === "1");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", category: "", type: "expense" });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sortType, setSortType] = useState("date-desc");
  const [selectedTx, setSelectedTx] = useState(null);
  const [txDetailEditing, setTxDetailEditing] = useState(false);
  const [txEditDraft, setTxEditDraft] = useState(null);
  const [txEditError, setTxEditError] = useState("");
  const [showWallet, setShowWallet] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [sips, setSips] = useState(loadSips);
  const [loans, setLoans] = useState(loadLoans);
  const [dateRange, setDateRange] = useState({ mode: "all", month: "", startDate: "", endDate: "" });
  const [customBreakdown, setCustomBreakdown] = useState(null); // { items: [{name, value}] } or null

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("finpulse-sips", JSON.stringify(sips));
  }, [sips]);

  useEffect(() => {
    localStorage.setItem("finpulse-loans", JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem("finpulse-dark", dark ? "1" : "0");
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const dateFilteredTransactions = useMemo(() => {
    if (dateRange.mode === "all") return transactions;
    if (dateRange.mode === "month" && dateRange.month) {
      return transactions.filter((t) => t.date.slice(0, 7) === dateRange.month);
    }
    if (dateRange.mode === "range") {
      const from = dateRange.startDate;
      const to = dateRange.endDate;
      if (!from && !to) return transactions;
      return transactions.filter((t) => {
        if (from && t.date < from) return false;
        if (to && t.date > to) return false;
        return true;
      });
    }
    return transactions;
  }, [transactions, dateRange]);

  const income = dateFilteredTransactions.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const expense = dateFilteredTransactions.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);
  const balance = income - expense;

  let filtered = dateFilteredTransactions.filter(
    (t) => t.category.toLowerCase().includes(search.toLowerCase()) && (typeFilter === "all" || t.type === typeFilter)
  );
  filtered = [...filtered].sort((a, b) => {
    if (sortType === "date-asc") return new Date(a.date) - new Date(b.date);
    if (sortType === "date-desc") return new Date(b.date) - new Date(a.date);
    if (sortType === "amount-asc") return a.amount - b.amount;
    if (sortType === "amount-desc") return b.amount - a.amount;
    return 0;
  });

  const chartData = (() => {
    const dates = [...new Set(dateFilteredTransactions.map((t) => t.date))].sort((a, b) => a.localeCompare(b));
    let cumIncome = 0;
    let cumExpense = 0;
    return dates.map((date) => {
      dateFilteredTransactions
        .filter((t) => t.date === date)
        .forEach((t) => {
          if (t.type === "income") cumIncome += t.amount;
          else cumExpense += t.amount;
        });
      return { name: date, value: cumIncome - cumExpense };
    });
  })();

  const categoryMap = {};
  dateFilteredTransactions.forEach((t) => {
    if (t.type === "expense") {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    }
  });

  const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const rawPieData = Object.keys(categoryMap).map((key) => ({
    name: key,
    value: categoryMap[key],
  }));
  const pieData = mergeCustomSlices(rawPieData);

  const analyticsMonthly = useMemo(() => {
    const buckets = {};
    dateFilteredTransactions.forEach((t) => {
      const key = t.date.slice(0, 7);
      if (!buckets[key]) buckets[key] = { income: 0, expense: 0 };
      if (t.type === "income") buckets[key].income += t.amount;
      else buckets[key].expense += t.amount;
    });
    return Object.keys(buckets)
      .sort()
      .map((k) => {
        const [y, m] = k.split("-").map(Number);
        const d = new Date(y, m - 1, 1);
        return {
          key: k,
          label: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
          income: buckets[k].income,
          expense: buckets[k].expense,
          net: buckets[k].income - buckets[k].expense,
        };
      });
  }, [dateFilteredTransactions]);

  const expenseRanked = useMemo(() => {
    const map = {};
    dateFilteredTransactions.forEach((t) => {
      if (t.type === "expense") map[t.category] = (map[t.category] || 0) + t.amount;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [dateFilteredTransactions]);

  const incomeRanked = useMemo(() => {
    const map = {};
    dateFilteredTransactions.forEach((t) => {
      if (t.type === "income") map[t.category] = (map[t.category] || 0) + t.amount;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [dateFilteredTransactions]);

  const analyticsSummary = useMemo(() => {
    if (!dateFilteredTransactions.length) return null;
    const dates = [...new Set(dateFilteredTransactions.map((t) => t.date))].sort();
    const expenseTxs = dateFilteredTransactions.filter((t) => t.type === "expense");
    const incomeTxs = dateFilteredTransactions.filter((t) => t.type === "income");
    const totExp = expenseTxs.reduce((s, t) => s + t.amount, 0);
    const totInc = incomeTxs.reduce((s, t) => s + t.amount, 0);
    return {
      from: dates[0],
      to: dates[dates.length - 1],
      count: dateFilteredTransactions.length,
      expenseCount: expenseTxs.length,
      incomeCount: incomeTxs.length,
      avgExpense: expenseTxs.length ? totExp / expenseTxs.length : 0,
      avgIncome: incomeTxs.length ? totInc / incomeTxs.length : 0,
      maxExpense: expenseTxs.reduce((m, t) => Math.max(m, t.amount), 0),
      maxIncome: incomeTxs.reduce((m, t) => Math.max(m, t.amount), 0),
    };
  }, [dateFilteredTransactions]);

  const tooltipStyle = useMemo(
    () => ({
      contentStyle: dark
        ? {
            background: "rgb(30 41 59)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
          }
        : {
            background: "#fff",
            border: "1px solid rgb(226 232 240)",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(15,23,42,0.08)",
          },
      labelStyle: { color: dark ? "#e2e8f0" : "#334155", fontWeight: 600 },
      itemStyle: { color: dark ? "#cbd5e1" : "#475569" },
    }),
    [dark]
  );

  const axisColor = dark ? "#64748b" : "#94a3b8";
  const gridColor = dark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";

  const exportCSV = () => {
    const rows = [["Date", "Amount", "Category", "Type"], ...transactions.map((t) => [t.date, t.amount, t.category, t.type])];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "finpulse-transactions.csv";
    link.click();
  };

  const exportExcel = () => {
    const rows = [["Date", "Amount", "Category", "Type"], ...transactions.map((t) => [t.date, t.amount, t.category, t.type])];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "finpulse-transactions.xlsx");
  };

  const loadSample = () =>
    setTransactions(SAMPLE_TRANSACTIONS.map((t, i) => ({ ...t, id: Date.now() + i })));

  const headerDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const pageTitle =
    activeTab === "dashboard"
      ? "Dashboard"
      : activeTab === "transactions"
        ? "Transactions"
        : activeTab === "analytics"
          ? "Analytics"
          : activeTab === "savings"
            ? "Savings"
            : activeTab === "loans"
              ? "Loans"
              : "Settings";

  const selectClass =
    "rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-surface-muted dark:text-ink";

  const inputClass =
    "min-w-[10rem] flex-1 rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm text-ink shadow-sm placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-surface-muted dark:text-ink";

  const openTxDetail = (t) => {
    setTxDetailEditing(false);
    setTxEditDraft(null);
    setTxEditError("");
    setSelectedTx(t);
  };

  const closeTxDetail = () => {
    setTxDetailEditing(false);
    setTxEditDraft(null);
    setTxEditError("");
    setSelectedTx(null);
  };

  const txFieldClass = `${selectClass} w-full py-2.5`;

  return (
    <div className="min-h-screen bg-mesh-light dark:bg-mesh-dark">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} mobileOpen={mobileNav} onMobileClose={() => setMobileNav(false)} />

      <div className="lg:pl-64">
        <div className="min-h-screen px-4 pb-10 pt-4 sm:px-6 lg:px-10 lg:pt-8">
          {/* Top bar */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setMobileNav(true)}
                className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-surface text-ink shadow-sm transition hover:bg-surface-muted lg:hidden dark:border-white/10 dark:bg-surface-muted"
                aria-label="Open menu"
              >
                <IconMenu className="h-5 w-5" />
              </button>
              <div>
  <div className="flex items-center gap-3">
    <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{pageTitle}</h1>
    {(activeTab === "dashboard" || activeTab === "transactions" || activeTab === "analytics") && (
      <DateRangeFilter
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectClass={selectClass}
        inputClass={inputClass}
      />
    )}
  </div>
  <p className="text-sm text-ink-muted">{headerDate}</p>
</div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowWallet(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-accent/30 hover:shadow-md dark:border-white/10 dark:bg-surface-muted"
              >
                <IconWallet className="h-4 w-4 text-accent" />
                <span className="tabular-nums">{formatInr(balance)}</span>
              </button>

              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-surface p-1 shadow-sm dark:border-white/10 dark:bg-surface-muted">
                <button
                  type="button"
                  onClick={() => setRole("viewer")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${role === "viewer" ? "bg-accent text-white shadow" : "text-ink-muted hover:text-ink"}`}
                >
                  Viewer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (role === "admin") return;
                    setAdminPwInput("");
                    setAdminPwError("");
                    setShowAdminModal(true);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${role === "admin" ? "bg-accent text-white shadow" : "text-ink-muted hover:text-ink"}`}
                >
                  Admin
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDark(!dark)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-surface text-ink shadow-sm transition hover:bg-surface-muted dark:border-white/10 dark:bg-surface-muted"
                aria-label={dark ? "Light mode" : "Dark mode"}
              >
                {dark ? <IconSun className="h-5 w-5 text-amber-300" /> : <IconMoon className="h-5 w-5 text-slate-600" />}
              </button>

              {role === "admin" && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
                >
                  <IconPlus className="h-4 w-4" />
                  Add
                </button>
              )}
            </div>
          </header>

          {role === "admin" && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-950/50 dark:text-indigo-200">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Admin mode — add, edit, delete, and reset data (CSV/Excel download is available to all roles on Transactions)
            </div>
          )}

          

          {transactions.length === 0 && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-indigo-50/90 via-surface to-violet-50/50 p-8 shadow-card dark:border-white/10 dark:from-indigo-950/40 dark:via-surface-muted dark:to-violet-950/20 dark:shadow-card-dark">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">Welcome to FinPulse</h2>
                  <p className="mt-2 max-w-xl text-sm text-ink-muted">
                    Track income and expenses, see trends, and keep everything in your browser. Switch to{" "}
                    <strong className="font-medium text-ink">Admin</strong> to add entries, or load sample data to explore the UI.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadSample}
                  className="shrink-0 rounded-xl border border-indigo-200 bg-surface px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:border-indigo-500/40 dark:bg-surface-muted dark:text-indigo-200 dark:hover:bg-indigo-950/50"
                >
                  Load sample data
                </button>
              </div>
            </div>
          )}

          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div className="mt-8 space-y-8">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard
                  title="Net balance"
                  value={balance}
                  subtitle={balance >= 0 ? "You are in the green" : "Spending exceeds income"}
                  tone={balance >= 0 ? "balance" : "negative"}
                  icon={IconWallet}
                />
                <StatCard title="Total income" value={income} subtitle={dateRange.mode === "all" ? "All credited amounts" : "Credits in selected period"} tone="positive" icon={IconTrendUp} />
                <StatCard title="Total expenses" value={expense} subtitle={dateRange.mode === "all" ? "All debited amounts" : "Debits in selected period"} tone="negative" icon={IconTrendDown} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <ChartShell title="Balance Overview" subtitle="Running balance — total income minus total expenses through each date">
                  {chartData.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke={gridColor} vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: axisColor, fontSize: 11 }}
                          tickFormatter={(v) => formatShortDate(v)}
                          axisLine={{ stroke: gridColor }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: axisColor, fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                        />
                        <ReferenceLine y={0} stroke={axisColor} strokeDasharray="4 4" />
                        <Tooltip
                          {...tooltipStyle}
                          formatter={(v) => [formatInr(v), "Balance"]}
                          labelFormatter={(l) => formatShortDate(l)}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                          activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </ChartShell>

                <ChartShell title="Spending by category" subtitle="Expense breakdown">
                  {pieData.length === 0 ? (
                    <EmptyChart message="Log expenses with categories to populate this chart" />
                  ) : (
                    <div>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={2}
                            onClick={(entry) => { if (entry.name === "Custom" && entry.customItems) setCustomBreakdown(entry); }}
                            style={{ cursor: "pointer" }}>
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip {...tooltipStyle} formatter={(v) => formatInr(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <PieCategoryLegend items={pieData} onCustomClick={() => setCustomBreakdown(pieData.find(d => d.name === "Custom") || null)} />
                    </div>
                  )}
                </ChartShell>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-surface p-5 shadow-card dark:border-white/10 dark:bg-surface-muted/80 dark:shadow-card-dark">
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink">Recent activity</h2>
                    <p className="text-sm text-ink-muted">Search and sort your ledger</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select value={sortType} onChange={(e) => setSortType(e.target.value)} className={selectClass}>
                      <option value="date-desc">Newest first</option>
                      <option value="date-asc">Oldest first</option>
                      <option value="amount-desc">Amount high → low</option>
                      <option value="amount-asc">Amount low → high</option>
                    </select>
                    <input
                      type="search"
                      placeholder="Search category"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={inputClass}
                    />
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
                      <option value="all">All types</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-surface-muted/80 text-xs font-semibold uppercase tracking-wider text-ink-muted dark:border-white/5 dark:bg-white/5">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center text-ink-muted">
                            No rows match your filters.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((t) => (
                          <tr
                            key={t.id}
                            onClick={() => openTxDetail(t)}
                            className="cursor-pointer transition hover:bg-surface-muted/80 dark:hover:bg-white/5"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{formatShortDate(t.date)}</td>
                            <td className="px-4 py-3 font-semibold tabular-nums text-ink">{formatInr(t.amount)}</td>
                            <td className="px-4 py-3 text-ink">{t.category}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  t.type === "income"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200"
                                }`}
                              >
                                {t.type}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 bg-surface p-5 shadow-sm dark:border-white/10 dark:bg-surface-muted/80">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Top spend category</p>
                  <p className="mt-2 font-display text-xl font-semibold text-ink">{topCategory}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-surface p-5 shadow-sm dark:border-white/10 dark:bg-surface-muted/80">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Transactions</p>
                  <p className="mt-2 font-display text-xl font-semibold text-ink">{dateFilteredTransactions.length}</p>
                  {dateRange.mode !== "all" && (
                    <p className="mt-1 text-xs text-ink-muted">{transactions.length} total</p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-surface p-5 shadow-sm dark:border-white/10 dark:bg-surface-muted/80">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Savings rate</p>
                  <p className="mt-2 font-display text-xl font-semibold text-ink">
                    {income > 0 ? `${Math.round(((income - expense) / income) * 100)}%` : "—"}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {dateRange.mode !== "all" ? "Period net ÷ income" : "Net ÷ income (when income > 0)"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Transactions */}
          {activeTab === "transactions" && (
            <div className="mt-8 rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-card dark:border-white/10 dark:bg-surface-muted/80 dark:shadow-card-dark">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">All transactions</h2>
                  <p className="text-sm text-ink-muted">
                    {dateRange.mode !== "all"
                      ? `${dateFilteredTransactions.length} of ${transactions.length} records`
                      : `${transactions.length} records`}
                  </p>
                </div>
                {role === "admin" && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25"
                    >
                      <IconPlus className="h-4 w-4" />
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Delete all transactions? This cannot be undone.")) {
                          setTransactions([]);
                          localStorage.removeItem("transactions");
                        }
                      }}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200"
                    >
                      Reset all
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-surface-muted/80 text-xs font-semibold uppercase tracking-wider text-ink-muted dark:border-white/5 dark:bg-white/5">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-16 text-center text-ink-muted">
                          No transactions yet. {role === "admin" ? "Add one or load sample data from the overview." : "Ask an admin to add data."}
                        </td>
                      </tr>
                    ) : dateFilteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-16 text-center text-ink-muted">
                          No transactions in this period. Try a different date range.
                        </td>
                      </tr>
                    ) : (
                      dateFilteredTransactions.map((t) => (
                        <tr
                          key={t.id}
                          onClick={() => openTxDetail(t)}
                          className="cursor-pointer transition hover:bg-surface-muted/80 dark:hover:bg-white/5"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{formatShortDate(t.date)}</td>
                          <td className="px-4 py-3 font-semibold tabular-nums text-ink">{formatInr(t.amount)}</td>
                          <td className="px-4 py-3 text-ink">{t.category}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                t.type === "income"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200"
                              }`}
                            >
                              {t.type}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {transactions.length > 0 && (
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={exportCSV}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-200"
                  >
                    Download CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportExcel}
                    className="rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-2.5 text-sm font-semibold text-indigo-900 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-950/50 dark:text-indigo-200"
                  >
                    Download Excel (.xlsx)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Analytics */}
          {activeTab === "analytics" && (
            <div className="mt-8 space-y-8">
              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-indigo-50/90 via-surface to-violet-50/40 p-6 shadow-card dark:border-white/10 dark:from-indigo-950/25 dark:via-surface-muted dark:to-violet-950/20 dark:shadow-card-dark sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">Analytics hub</p>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Financial intelligence</h2>
                <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                  Deep view of cash flow, spending mix, and behaviour across your full ledger. Charts and tables below stay in sync with every transaction you record.
                </p>
                {analyticsSummary && (
                  <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                    <div>
                      <dt className="text-ink-muted">Data window</dt>
                      <dd className="font-semibold text-ink">
                        {formatShortDate(analyticsSummary.from)} → {formatShortDate(analyticsSummary.to)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Transactions</dt>
                      <dd className="font-semibold text-ink">
                        {analyticsSummary.count} total · {analyticsSummary.incomeCount} income · {analyticsSummary.expenseCount} expense
                      </dd>
                    </div>
                  </dl>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Net balance"
                  value={balance}
                  subtitle={balance >= 0 ? "Income ahead of spending" : "Spending exceeds income"}
                  tone={balance >= 0 ? "balance" : "negative"}
                  icon={IconWallet}
                />
                <StatCard title="Total income" value={income} subtitle={dateRange.mode === "all" ? "All credits in ledger" : "Credits in selected period"} tone="positive" icon={IconTrendUp} />
                <StatCard title="Total expenses" value={expense} subtitle={dateRange.mode === "all" ? "All debits in ledger" : "Debits in selected period"} tone="negative" icon={IconTrendDown} />
                
                <StatCard
                  title="Savings rate"
                  value={income > 0 ? `${Math.round(((income - expense) / income) * 100)}%` : "—"}
                  subtitle={income > 0 ? "Net ÷ total income" : "Add income to compute"}
                  tone="neutral"
                  icon={IconSpark}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <ChartShell title="Expense distribution" subtitle="Share of total spending">
                  {pieData.length === 0 ? (
                    <EmptyChart message="No expense categories to chart yet" />
                  ) : (
                    <div>
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            onClick={(entry) => { if (entry.name === "Custom" && entry.customItems) setCustomBreakdown(entry); }}
                            style={{ cursor: "pointer" }}>
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip {...tooltipStyle} formatter={(v) => formatInr(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <PieCategoryLegend items={pieData} onCustomClick={() => setCustomBreakdown(pieData.find(d => d.name === "Custom") || null)} />
                    </div>
                  )}
                </ChartShell>
                <ChartShell title="Balance Overview" subtitle="Cumulative net balance (income to date − expenses to date)">
                  {chartData.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke={gridColor} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: axisColor, fontSize: 11 }}
                          tickFormatter={(v) => formatShortDate(v)}
                          axisLine={{ stroke: gridColor }}
                          tickLine={false}
                        />
                        <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <ReferenceLine y={0} stroke={axisColor} strokeDasharray="4 4" />
                        <Tooltip {...tooltipStyle} formatter={(v) => [formatInr(v), "Balance"]} labelFormatter={(l) => formatShortDate(l)} />
                        <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </ChartShell>

                
              </div>

              <ChartShell title="Monthly income vs expenses" subtitle="Compare what came in and what went out each calendar month">
                {analyticsMonthly.length === 0 ? (
                  <EmptyChart message="Add dated transactions to see monthly breakdown" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsMonthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
                      <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${(v / 1000).toFixed(0)}k`)} />
                      <Tooltip {...tooltipStyle} formatter={(v) => formatInr(v)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartShell>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-surface p-5 shadow-card dark:border-white/10 dark:bg-surface-muted/80 dark:shadow-card-dark">
                  <h3 className="font-display text-lg font-semibold text-ink">Top expense categories</h3>
                  <p className="text-sm text-ink-muted">Ranked by amount · % of total spend</p>
                  {expenseRanked.length === 0 ? (
                    <p className="mt-6 text-sm text-ink-muted">No expenses yet.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {expenseRanked.slice(0, 8).map((row, i) => (
                        <li key={row.name} className="flex items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-xs font-bold text-ink-muted dark:bg-white/10">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between gap-2 text-sm">
                              <span className="truncate font-medium text-ink">{row.name}</span>
                              <span className="shrink-0 tabular-nums font-semibold text-ink">{formatInr(row.amount)}</span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-muted dark:bg-white/10">
                              <div className="h-full rounded-full bg-rose-500/80" style={{ width: `${Math.min(100, row.pct)}%` }} />
                            </div>
                            <p className="mt-0.5 text-xs text-ink-muted">{row.pct.toFixed(1)}% of expenses</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-surface p-5 shadow-card dark:border-white/10 dark:bg-surface-muted/80 dark:shadow-card-dark">
                  <h3 className="font-display text-lg font-semibold text-ink">Income sources</h3>
                  <p className="text-sm text-ink-muted">By category label · % of total income</p>
                  {incomeRanked.length === 0 ? (
                    <p className="mt-6 text-sm text-ink-muted">No income entries yet.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {incomeRanked.slice(0, 8).map((row, i) => (
                        <li key={row.name} className="flex items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-xs font-bold text-ink-muted dark:bg-white/10">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between gap-2 text-sm">
                              <span className="truncate font-medium text-ink">{row.name}</span>
                              <span className="shrink-0 tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">{formatInr(row.amount)}</span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-muted dark:bg-white/10">
                              <div className="h-full rounded-full bg-emerald-500/80" style={{ width: `${Math.min(100, row.pct)}%` }} />
                            </div>
                            <p className="mt-0.5 text-xs text-ink-muted">{row.pct.toFixed(1)}% of income</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Savings / SIP */}
          {activeTab === "savings" && (
            <SavingsTab sips={sips} setSips={setSips} role={role} chartTooltip={tooltipStyle} axisColor={axisColor} gridColor={gridColor} />
          )}

          {activeTab === "loans" && (
            <LoansTab loans={loans} setLoans={setLoans} role={role} chartTooltip={tooltipStyle} axisColor={axisColor} gridColor={gridColor} />
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="mt-8 max-w-lg space-y-6">
              <div className="rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-card dark:border-white/10 dark:bg-surface-muted/80">
                <h2 className="font-display text-xl font-semibold text-ink">Appearance</h2>
                <p className="mt-1 text-sm text-ink-muted">Theme is saved on this device.</p>
                <button
                  type="button"
                  onClick={() => setDark(!dark)}
                  className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-surface-muted/50 px-4 py-3 text-left text-sm font-medium text-ink dark:border-white/10 dark:bg-white/5"
                >
                  <span>Dark mode</span>
                  <span className="text-ink-muted">{dark ? "On" : "Off"}</span>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-card dark:border-white/10 dark:bg-surface-muted/80">
                <h2 className="font-display text-xl font-semibold text-ink">Access</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Use the role switcher in the header.                   <strong className="font-medium text-ink">Viewer</strong> is read-only for edits but can download transactions (CSV/Excel) from the Transactions tab.{" "}
                  <strong className="font-medium text-ink">Admin</strong> can add, edit, or delete transactions, manage SIPs and loans, and reset data.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-card dark:border-white/10 dark:bg-surface-muted/80">
                <h2 className="font-display text-xl font-semibold text-ink">Admin password</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Change the password required to switch into Admin mode. Default is <code className="rounded bg-surface-muted px-1 py-0.5 text-xs dark:bg-white/10">admin123</code>.
                </p>
                {!showChangePw ? (
                  <button
                    type="button"
                    onClick={() => { setShowChangePw(true); setChangePwDraft({ current: "", next: "", confirm: "" }); setChangePwError(""); setChangePwSuccess(false); }}
                    className="mt-4 rounded-xl border border-slate-200 bg-surface-muted/50 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-muted dark:border-white/10 dark:bg-white/5"
                  >
                    Change password
                  </button>
                ) : (
                  <div className="mt-4 space-y-3">
                    {[
                      { label: "Current password", key: "current" },
                      { label: "New password", key: "next" },
                      { label: "Confirm new password", key: "confirm" },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</label>
                        <input
                          type="password"
                          value={changePwDraft[key]}
                          onChange={(e) => setChangePwDraft((d) => ({ ...d, [key]: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-surface-muted dark:text-ink"
                          placeholder={key === "current" ? "Enter current password" : key === "next" ? "Min 4 characters" : "Repeat new password"}
                        />
                      </div>
                    ))}
                    {changePwError && <p className="text-sm font-medium text-danger">{changePwError}</p>}
                    {changePwSuccess && <p className="text-sm font-medium text-success">Password changed successfully.</p>}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const { current, next, confirm } = changePwDraft;
                          if (!checkAdminPw(current)) { setChangePwError("Current password is incorrect."); return; }
                          if (next.length < 4) { setChangePwError("New password must be at least 4 characters."); return; }
                          if (next !== confirm) { setChangePwError("Passwords do not match."); return; }
                          localStorage.setItem(ADMIN_PW_KEY, next);
                          setChangePwError("");
                          setChangePwSuccess(true);
                          setChangePwDraft({ current: "", next: "", confirm: "" });
                          setTimeout(() => { setShowChangePw(false); setChangePwSuccess(false); }, 1500);
                        }}
                        className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25"
                      >
                        Save password
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowChangePw(false); setChangePwError(""); setChangePwSuccess(false); }}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-ink-muted dark:border-white/15"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-card dark:border-white/10 dark:bg-surface-muted/80">
                <h2 className="font-display text-xl font-semibold text-ink">Data</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Transactions, SIPs (<code className="rounded bg-surface-muted px-1 py-0.5 text-xs dark:bg-white/10">finpulse-sips</code>), and loans (
                  <code className="rounded bg-surface-muted px-1 py-0.5 text-xs dark:bg-white/10">finpulse-loans</code>) live in{" "}
                  <code className="rounded bg-surface-muted px-1 py-0.5 text-xs dark:bg-white/10">localStorage</code> for this site. Clearing site data removes them.
                </p>
              </div>
            </div>
          )}

          {showForm && <FormModal {...{ form, setForm, setShowForm, transactions, setTransactions }} />}
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm dark:bg-black/50"
            onClick={closeTxDetail}
            aria-label="Close"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-2xl dark:border-white/10 dark:bg-surface-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg font-semibold text-ink">{txDetailEditing ? "Edit transaction" : "Transaction"}</h2>

            {role === "admin" && !txDetailEditing && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTxEditDraft({
                      date: selectedTx.date,
                      amount: String(selectedTx.amount),
                      category: selectedTx.category,
                      type: selectedTx.type,
                    });
                    setTxEditError("");
                    setTxDetailEditing(true);
                  }}
                  className="rounded-lg border border-slate-200 bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface-muted dark:border-white/15"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Delete this transaction permanently?")) {
                      setTransactions((prev) => prev.filter((t) => t.id !== selectedTx.id));
                      closeTxDetail();
                    }
                  }}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200"
                >
                  Delete
                </button>
              </div>
            )}

            {!txDetailEditing && (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Date</dt>
                  <dd className="font-medium text-ink">{formatShortDate(selectedTx.date)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Amount</dt>
                  <dd className={`font-semibold tabular-nums ${selectedTx.type === "income" ? "text-success" : "text-danger"}`}>
                    {formatInr(selectedTx.amount)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Category</dt>
                  <dd className="font-medium text-ink">{selectedTx.category}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Type</dt>
                  <dd className="font-medium capitalize text-ink">{selectedTx.type}</dd>
                </div>
              </dl>
            )}

            {txDetailEditing && txEditDraft && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">Date</label>
                  <input
                    type="date"
                    value={txEditDraft.date}
                    onChange={(e) => setTxEditDraft((d) => ({ ...d, date: e.target.value }))}
                    className={txFieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={txEditDraft.amount}
                    onChange={(e) => setTxEditDraft((d) => ({ ...d, amount: e.target.value }))}
                    className={txFieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">Category</label>
                  <input
                    type="text"
                    value={txEditDraft.category}
                    onChange={(e) => setTxEditDraft((d) => ({ ...d, category: e.target.value }))}
                    className={txFieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">Type</label>
                  <select
                    value={txEditDraft.type}
                    onChange={(e) => setTxEditDraft((d) => ({ ...d, type: e.target.value }))}
                    className={txFieldClass}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                {txEditError && <p className="text-sm font-medium text-danger">{txEditError}</p>}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const amt = Number(txEditDraft.amount);
                      if (!txEditDraft.category.trim()) {
                        setTxEditError("Category is required.");
                        return;
                      }
                      if (Number.isNaN(amt) || amt <= 0) {
                        setTxEditError("Enter a valid amount greater than zero.");
                        return;
                      }
                      if (!txEditDraft.date) {
                        setTxEditError("Choose a date.");
                        return;
                      }
                      const updated = {
                        ...selectedTx,
                        date: txEditDraft.date,
                        amount: amt,
                        category: txEditDraft.category.trim(),
                        type: txEditDraft.type,
                      };
                      setTransactions((prev) => prev.map((t) => (t.id === selectedTx.id ? updated : t)));
                      setSelectedTx(updated);
                      setTxDetailEditing(false);
                      setTxEditDraft(null);
                      setTxEditError("");
                    }}
                    className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25"
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxDetailEditing(false);
                      setTxEditDraft(null);
                      setTxEditError("");
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-ink-muted dark:border-white/15"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!txDetailEditing && (
              <button
                type="button"
                onClick={closeTxDetail}
                className="mt-6 w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {customBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm dark:bg-black/50"
            onClick={() => setCustomBreakdown(null)}
            aria-label="Close"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-2xl dark:border-white/10 dark:bg-surface-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCustomBreakdown(null)}
              className="absolute right-3 top-3 rounded-lg p-1 text-ink-muted hover:bg-surface-muted dark:hover:bg-white/10"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: CUSTOM_CATEGORY_COLOR + "22" }}>
                <span className="h-3.5 w-3.5 rounded-sm" style={{ backgroundColor: CUSTOM_CATEGORY_COLOR }} />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Custom categories</h2>
                <p className="text-xs text-ink-muted">{customBreakdown.customItems.length} unique label{customBreakdown.customItems.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2">
              {[...customBreakdown.customItems]
                .sort((a, b) => b.value - a.value)
                .map((item) => {
                  const pct = customBreakdown.value > 0 ? (item.value / customBreakdown.value) * 100 : 0;
                  return (
                    <li key={item.name} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-surface-muted/40 px-3 py-2.5 dark:border-white/5 dark:bg-white/5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: CUSTOM_CATEGORY_COLOR, opacity: 0.6 + 0.4 * (pct / 100) }}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink" title={item.name}>{item.name}</span>
                      <span className="shrink-0 tabular-nums text-sm font-semibold text-ink">{formatInr(item.value)}</span>
                      <span className="shrink-0 text-xs text-ink-muted">{pct.toFixed(1)}%</span>
                    </li>
                  );
                })}
            </ul>
            <div className="mt-4 flex justify-between rounded-xl bg-surface-muted/60 px-3 py-2 text-xs dark:bg-white/5">
              <span className="font-medium text-ink-muted">Total (custom)</span>
              <span className="font-bold tabular-nums text-ink">{formatInr(customBreakdown.value)}</span>
            </div>
          </div>
        </div>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm dark:bg-black/50"
            onClick={() => { setShowAdminModal(false); setAdminPwInput(""); setAdminPwError(""); }}
            aria-label="Close"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-2xl dark:border-white/10 dark:bg-surface-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Admin access</h2>
                <p className="text-xs text-ink-muted">Enter the admin password to continue</p>
              </div>
            </div>
            <div className="mt-5">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Password</label>
              <input
                type="password"
                value={adminPwInput}
                onChange={(e) => { setAdminPwInput(e.target.value); setAdminPwError(""); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (checkAdminPw(adminPwInput)) {
                      setRole("admin");
                      setShowAdminModal(false);
                      setAdminPwInput("");
                      setAdminPwError("");
                    } else {
                      setAdminPwError("Incorrect password. Try again.");
                    }
                  }
                }}
                autoFocus
                placeholder="Enter password"
                className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-surface-muted dark:text-ink"
              />
              {adminPwError && (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-danger">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                  </svg>
                  {adminPwError}
                </p>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (checkAdminPw(adminPwInput)) {
                    setRole("admin");
                    setShowAdminModal(false);
                    setAdminPwInput("");
                    setAdminPwError("");
                  } else {
                    setAdminPwError("Incorrect password. Try again.");
                  }
                }}
                className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
              >
                Unlock Admin
              </button>
              <button
                type="button"
                onClick={() => { setShowAdminModal(false); setAdminPwInput(""); setAdminPwError(""); }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-ink-muted transition hover:bg-surface-muted dark:border-white/15"
              >
                Cancel
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-ink-muted">
              Default password: <code className="rounded bg-surface-muted px-1 py-0.5 dark:bg-white/10">admin123</code> · Change it in Settings
            </p>
          </div>
        </div>
      )}

      {showWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-ink/40 backdrop-blur-sm dark:bg-black/50" onClick={() => setShowWallet(false)} aria-label="Close" />
          <div
            className="relative w-full max-w-sm rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-2xl dark:border-white/10 dark:bg-surface-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowWallet(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-ink-muted hover:bg-surface-muted dark:hover:bg-white/10"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <IconWallet className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Wallet summary</h2>
                <p className="text-xs text-ink-muted">At a glance</p>
              </div>
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex justify-between rounded-xl bg-surface-muted/80 px-3 py-2.5 dark:bg-white/5">
                <span className="text-ink-muted">Balance</span>
                <span className="font-semibold tabular-nums text-ink">{formatInr(balance)}</span>
              </li>
              <li className="flex justify-between rounded-xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-500/10">
                <span className="text-emerald-800 dark:text-emerald-200">Income</span>
                <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{formatInr(income)}</span>
              </li>
              <li className="flex justify-between rounded-xl bg-rose-50 px-3 py-2.5 dark:bg-rose-500/10">
                <span className="text-rose-800 dark:text-rose-200">Expenses</span>
                <span className="font-semibold tabular-nums text-rose-700 dark:text-rose-300">{formatInr(expense)}</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
