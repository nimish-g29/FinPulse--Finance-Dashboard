import { useState, useMemo, useRef, useEffect } from "react";
import {
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
} from "recharts";
import { formatInr, formatShortDate } from "../lib/format";
import { computeLoanSnapshot, yearlyOutstandingSeries } from "../lib/loan";

const SAMPLE_LOANS = [
  {
    id: 1,
    label: "Home Loan – SBI",
    principal: 5000000,
    annualInterestRate: 8.5,
    tenureYears: 20,
    startDate: "2021-07-01",
    loanType: "Home",
    lender: "SBI",
  },
  {
    id: 2,
    label: "Car Loan – HDFC",
    principal: 800000,
    annualInterestRate: 9.25,
    tenureYears: 5,
    startDate: "2023-03-01",
    loanType: "Vehicle",
    lender: "HDFC Bank",
  },
  {
    id: 3,
    label: "Personal Loan",
    principal: 200000,
    annualInterestRate: 13.5,
    tenureYears: 3,
    startDate: "2024-09-01",
    loanType: "Personal",
    lender: "ICICI Bank",
  },
];



const LOAN_TYPES = ["Home", "Personal", "Vehicle", "Education", "Other"];
const PIE_COLORS = ["#6366f1", "#f43f5e"];

function Shell({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-surface p-5 shadow-card dark:border-white/10 dark:bg-surface-muted/80 dark:shadow-card-dark">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function emptyDraft() {
  return {
    label: "",
    principal: "",
    annualInterestRate: 9.5,
    tenureYears: 15,
    startDate: new Date().toISOString().slice(0, 10),
    loanType: "Home",
    lender: "",
  };
}

function loanToDraft(l) {
  return {
    label: l.label ?? "",
    principal: l.principal === 0 ? "" : l.principal,
    annualInterestRate: l.annualInterestRate ?? 9.5,
    tenureYears: l.tenureYears ?? 15,
    startDate: l.startDate ?? new Date().toISOString().slice(0, 10),
    loanType: l.loanType ?? "Home",
    lender: l.lender ?? "",
  };
}

function LoanDetail({ loan, chartTooltip, axisColor, gridColor }) {
  const scheduleRef = useRef(null);


  const snap = computeLoanSnapshot(loan);
  useEffect(() => {
  if (!scheduleRef.current || snap.monthsPaid === 0) return;
  const rows = scheduleRef.current.querySelectorAll("tbody tr");
  const targetRow = rows[Math.max(0, snap.monthsPaid - 1)];
  if (targetRow) targetRow.scrollIntoView({ block: "center" });
}, [snap.monthsPaid]);
  const pieData = [
    { name: "Principal", value: snap.principal },
    { name: "Total interest", value: Math.max(0, snap.totalInterest) },
  ];
  const yearSeries = yearlyOutstandingSeries(snap.principal, snap.annual, snap.tenureMonths);

  return (
    <>
      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-violet-500 transition-all duration-500"
          style={{ width: `${snap.progressPct}%` }}
        />
      </div>
      <p className="mb-6 text-xs text-ink-muted">
        {snap.isClosed ? "Loan closed (all EMIs counted)." : `${snap.progressPct.toFixed(0)}% of EMIs elapsed`}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-surface p-4 dark:border-white/10 dark:bg-surface-muted/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Monthly EMI</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink">{formatInr(snap.emi)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-surface p-4 dark:border-white/10 dark:bg-surface-muted/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Outstanding principal</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{formatInr(snap.outstanding)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-surface p-4 dark:border-white/10 dark:bg-surface-muted/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">EMIs paid</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">
            {snap.monthsPaid} <span className="text-lg font-medium text-ink-muted">/ {snap.tenureMonths}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-surface p-4 dark:border-white/10 dark:bg-surface-muted/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Total repayment</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink">{formatInr(snap.totalPayable)}</p>
          <p className="mt-1 text-xs text-ink-muted">Principal + interest</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-surface p-5 dark:border-white/10 dark:bg-surface-muted/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Key dates</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">First EMI</dt>
              <dd className="font-semibold">{formatShortDate(snap.start)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Next EMI due</dt>
              <dd className="font-semibold">{snap.nextEmiDate ? formatShortDate(snap.nextEmiDate) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Maturity</dt>
              <dd className="font-semibold">{formatShortDate(snap.maturityDate)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">EMIs remaining</dt>
              <dd className="font-semibold">{snap.isClosed ? 0 : snap.monthsLeft}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-surface p-5 dark:border-white/10 dark:bg-surface-muted/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Paid to date</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Principal repaid</dt>
              <dd className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{formatInr(snap.paidPrincipal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Interest paid</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatInr(snap.paidInterest)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-2 dark:border-white/10">
              <dt className="font-medium text-ink">Total paid</dt>
              <dd className="font-bold tabular-nums text-ink">{formatInr(snap.paidTotal)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
  <Shell title="Principal vs interest" subtitle="What you borrow vs total interest over full tenure">
    {snap.tenureMonths === 0 ? (
      <p className="py-12 text-center text-sm text-ink-muted">Add tenure to see the split.</p>
    ) : (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
            {pieData.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...chartTooltip} formatter={(v) => formatInr(v)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    )}
  </Shell>

  <Shell title="Outstanding over time" subtitle="Principal balance at each year-end (model)">
    {yearSeries.length === 0 ? (
      <p className="py-12 text-center text-sm text-ink-muted">No data.</p>
    ) : (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={yearSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke={gridColor} />
          <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
          <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1e7 ? `${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `${(v / 1e5).toFixed(1)}L` : `${(v / 1e3).toFixed(0)}k`)} />
          <Tooltip {...chartTooltip} formatter={(v) => formatInr(v)} labelFormatter={(l) => `End of ${l}`} />
          <Line type="monotone" dataKey="outstanding" name="Outstanding" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    )}
  </Shell>
</div>

      <Shell title="Amortization schedule" subtitle="Month-by-month break-up (reducing balance)">
        {snap.schedule.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">Enter principal and tenure to generate the schedule.</p>
        ) : (
<div className="max-h-72 overflow-auto rounded-xl border border-slate-100 dark:border-white/5" ref={scheduleRef}>            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-surface-muted/95 text-xs font-semibold uppercase tracking-wider text-ink-muted backdrop-blur dark:bg-surface-muted/95">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">EMI</th>
                  <th className="px-3 py-2">Principal</th>
                  <th className="px-3 py-2">Interest</th>
                  <th className="px-3 py-2">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {snap.schedule.map((row) => (
                  <tr key={row.month} className={row.month <= snap.monthsPaid ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""}>
                    <td className="whitespace-nowrap px-3 py-2 text-ink-muted">{row.month}</td>
                    <td className="px-3 py-2 font-medium tabular-nums">{formatInr(row.payment)}</td>
                    <td className="px-3 py-2 tabular-nums">{formatInr(row.principal)}</td>
                    <td className="px-3 py-2 tabular-nums text-ink-muted">{formatInr(row.interest)}</td>
                    <td className="px-3 py-2 tabular-nums">{formatInr(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Shell>
    </>
  );
}

export default function LoansTab({ loans, setLoans, role, chartTooltip, axisColor, gridColor }) {
  const isAdmin = role === "admin";
  const [activeLoanId, setActiveLoanId] = useState(() => loans[0]?.id ?? null);
  const [editor, setEditor] = useState(null);
  const [saveError, setSaveError] = useState("");

  const effectiveSelectedId = useMemo(() => {
    if (loans.length === 0) return null;
    if (activeLoanId != null && loans.some((l) => l.id === activeLoanId)) return activeLoanId;
    return loans[0].id;
  }, [loans, activeLoanId]);

  const activeLoan = useMemo(
    () => (effectiveSelectedId == null ? null : loans.find((l) => l.id === effectiveSelectedId) ?? null),
    [loans, effectiveSelectedId]
  );

  const field =
    "w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-surface-muted dark:text-ink";

  const updateDraft = (patch) => {
    if (!editor) return;
    setEditor((e) => ({ ...e, draft: { ...e.draft, ...patch } }));
    setSaveError("");
  };

  const openNew = () => {
    setEditor({ mode: "new", draft: emptyDraft() });
    setSaveError("");
  };

  const openEdit = (loan) => {
    setEditor({ mode: "edit", id: loan.id, draft: loanToDraft(loan) });
    setSaveError("");
  };

  const cancelEditor = () => {
    setEditor(null);
    setSaveError("");
  };

  const saveLoan = () => {
    if (!editor) return;
    const d = editor.draft;
    const principal = Number(d.principal);
    if (!d.principal && d.principal !== 0) {
      setSaveError("Enter loan principal.");
      return;
    }
    if (Number.isNaN(principal) || principal <= 0) {
      setSaveError("Principal must be greater than zero.");
      return;
    }
    const tenureYears = Number(d.tenureYears);
    if (Number.isNaN(tenureYears) || tenureYears <= 0) {
      setSaveError("Tenure must be greater than zero.");
      return;
    }
    if (!d.startDate) {
      setSaveError("Choose the first EMI date.");
      return;
    }
    const record = {
      label: (d.label || "Loan").trim(),
      principal,
      annualInterestRate: Number(d.annualInterestRate) || 0,
      tenureYears,
      startDate: d.startDate,
      loanType: d.loanType || "Other",
      lender: (d.lender || "").trim(),
    };

    if (editor.mode === "new") {
      const id = Date.now();
      setLoans((prev) => [...prev, { id, ...record }]);
      setActiveLoanId(id);
    } else {
      const id = editor.id;
      setLoans((prev) => prev.map((l) => (l.id === id ? { id, ...record } : l)));
    }
    setEditor(null);
    setSaveError("");
  };

  return (
    <div className="mt-8 space-y-8">
      {isAdmin && (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
          Admin: use <strong className="font-semibold">Save loan</strong> to store. Reducing-balance EMI; first EMI date = due date of installment #1.
        </p>
      )}
      {!isAdmin && (
        <p className="rounded-xl border border-slate-200 bg-surface-muted/80 px-3 py-2 text-xs text-ink-muted dark:border-white/10">
          <strong className="text-ink">Viewer</strong> — loans are read-only. Switch to Admin to add or edit.
        </p>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-card dark:border-white/10 dark:bg-surface-muted/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Your loans</h2>
            <p className="mt-1 text-sm text-ink-muted">{loans.length === 0 ? "No loans saved." : `${loans.length} on this device`}</p>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openNew}
                className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
              >
                Add loan
              </button>
              {loans.length === 0 && (
                <button
                  type="button"
                  onClick={() => setLoans(SAMPLE_LOANS)}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/40 dark:bg-surface-muted dark:text-amber-200"
                >
                  Load samples
                </button>
              )}
              {loans.length > 0 && (
                <button
                  type="button"
                  onClick={() => { if (confirm("Clear all loans?")) setLoans([]); }}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200"
                >
                  Reset all
                </button>
              )}
            </div>
          )}
        </div>

        {loans.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {loans.map((l) => {
              const snap = computeLoanSnapshot(l);
              const selected = l.id === effectiveSelectedId;
              return (
                <li
                  key={l.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
                    selected ? "border-accent/40 bg-accent/5 ring-1 ring-accent/20" : "border-slate-200 dark:border-white/10"
                  }`}
                >
                  <button type="button" onClick={() => setActiveLoanId(l.id)} className="min-w-0 flex-1 text-left">
                    <p className="font-semibold text-ink">{l.label || "Loan"}</p>
                    <p className="text-sm text-ink-muted">
                      {l.loanType} · {formatInr(l.principal)} @ {l.annualInterestRate}% · EMI {formatInr(snap.emi)}
                    </p>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLoanId(l.id);
                        openEdit(l);
                      }}
                      className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface-muted dark:border-white/15"
                    >
                      Edit
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isAdmin && editor && (
        <div className="rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-card dark:border-white/10 dark:bg-surface-muted/80">
          <h2 className="font-display text-xl font-semibold text-ink">{editor.mode === "new" ? "New loan" : "Edit loan"}</h2>
          <p className="mt-1 text-sm text-ink-muted">Details are saved only after you click Save loan.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Label</label>
              <input type="text" value={editor.draft.label} onChange={(e) => updateDraft({ label: e.target.value })} className={field} placeholder="e.g. Home loan" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Type</label>
              <select value={editor.draft.loanType} onChange={(e) => updateDraft({ loanType: e.target.value })} className={field}>
                {LOAN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Lender (optional)</label>
              <input type="text" value={editor.draft.lender} onChange={(e) => updateDraft({ lender: e.target.value })} className={field} placeholder="Bank name" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Principal (₹)</label>
              <input
                type="number"
                min={0}
                step={10000}
                value={editor.draft.principal}
                onChange={(e) => updateDraft({ principal: e.target.value === "" ? "" : e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Interest (% p.a.)</label>
              <input
                type="number"
                min={0}
                max={30}
                step={0.05}
                value={editor.draft.annualInterestRate}
                onChange={(e) => updateDraft({ annualInterestRate: e.target.value === "" ? "" : Number(e.target.value) })}
                className={field}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Tenure (years)</label>
              <input
                type="number"
                min={0}
                max={40}
                step={1}
                value={editor.draft.tenureYears}
                onChange={(e) => updateDraft({ tenureYears: e.target.value === "" ? "" : Number(e.target.value) })}
                className={field}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">First EMI date</label>
              <input type="date" value={editor.draft.startDate} onChange={(e) => updateDraft({ startDate: e.target.value })} className={field} />
            </div>
          </div>

          {saveError && <p className="mt-3 text-sm font-medium text-danger">{saveError}</p>}
          <p className="mt-4 text-xs text-ink-muted">Reducing balance, monthly rest. For illustration only — confirm with your lender.</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={saveLoan} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110">
              Save loan
            </button>
            <button type="button" onClick={cancelEditor} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-ink-muted transition hover:bg-surface-muted dark:border-white/10">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!editor && activeLoan && (
        <div className="rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-card dark:border-white/10 dark:bg-surface-muted/80">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">{activeLoan.label || "Loan"}</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {activeLoan.loanType}
                {activeLoan.lender ? ` · ${activeLoan.lender}` : ""} · {activeLoan.annualInterestRate}% p.a. · {activeLoan.tenureYears} years
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="text-ink-muted">Original principal</p>
              <p className="font-display text-lg font-bold tabular-nums text-ink">{formatInr(activeLoan.principal)}</p>
            </div>
          </div>
        </div>
      )}

      {!activeLoan && loans.length === 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-amber-50/80 via-surface to-orange-50/40 p-8 shadow-card dark:border-white/10 dark:from-amber-950/30 dark:via-surface-muted dark:to-orange-950/20 dark:shadow-card-dark">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">No loans saved yet</h2>
              <p className="mt-2 max-w-xl text-sm text-ink-muted">
                Track EMIs, see outstanding balance, amortization schedule, and principal vs interest breakdown.{" "}
                {isAdmin ? "Add a loan above, or load sample data to explore." : "Switch to Admin to add loans, or load sample data to explore."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLoans(SAMPLE_LOANS)}
              className="shrink-0 rounded-xl border border-amber-200 bg-surface px-5 py-3 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50 dark:border-amber-500/40 dark:bg-surface-muted dark:text-amber-200 dark:hover:bg-amber-950/50"
            >
              Load sample loans
            </button>
          </div>
        </div>
      )}

      {activeLoan && !editor && (
        <LoanDetail loan={activeLoan} chartTooltip={chartTooltip} axisColor={axisColor} gridColor={gridColor} />
      )}
    </div>
  );
}
