import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { formatInr, formatShortDate } from "../lib/format";
import { computeSipSnapshot, yearlyProjection } from "../lib/sip";

const SAMPLE_SIPS = [
  {
    id: 1,
    label: "Nifty 50 Index Fund",
    monthlyAmount: 10000,
    expectedAnnualReturn: 12,
    tenureYears: 15,
    startDate: "2022-04-01",
  },
  {
    id: 2,
    label: "Mid-cap Growth Fund",
    monthlyAmount: 5000,
    expectedAnnualReturn: 14,
    tenureYears: 10,
    startDate: "2023-01-01",
  },
  {
    id: 3,
    label: "Debt / Liquid Fund",
    monthlyAmount: 3000,
    expectedAnnualReturn: 7,
    tenureYears: 5,
    startDate: "2024-06-01",
  },
];



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
    monthlyAmount: "",
    expectedAnnualReturn: 12,
    tenureYears: 10,
    startDate: new Date().toISOString().slice(0, 10),
  };
}

function sipToDraft(s) {
  return {
    label: s.label ?? "",
    monthlyAmount: s.monthlyAmount === 0 ? "" : s.monthlyAmount,
    expectedAnnualReturn: s.expectedAnnualReturn ?? 12,
    tenureYears: s.tenureYears ?? 10,
    startDate: s.startDate ?? new Date().toISOString().slice(0, 10),
  };
}

function SipCharts({ sip, chartTooltip, axisColor, gridColor }) {
  const snap = computeSipSnapshot(sip);
  const projection = yearlyProjection(snap.monthly, snap.annual, snap.tenureMonths);

  const barData = [
    { name: "Total invested", value: snap.totalInvestedAtMaturity, fill: "#6366f1" },
    { name: "Est. returns", value: Math.max(0, snap.returnsAtMaturity), fill: "#10b981" },
  ];

  return (
    <>
      <div>
        <h3 className="font-display text-lg font-semibold text-ink">Current SIP</h3>
        <p className="text-sm text-ink-muted">Progress as of today</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-surface p-4 dark:border-white/10 dark:bg-surface-muted/80">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Months completed</p>
            <p className="mt-2 font-display text-2xl font-bold text-ink">{snap.monthsDone}</p>
            <p className="mt-1 text-xs text-ink-muted">of {snap.tenureMonths} total</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-surface p-4 dark:border-white/10 dark:bg-surface-muted/80">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Invested so far</p>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink">{formatInr(snap.investedSoFar)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-surface p-4 dark:border-white/10 dark:bg-surface-muted/80">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Est. corpus now</p>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-accent">{formatInr(snap.corpusNow)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-surface p-4 dark:border-white/10 dark:bg-surface-muted/80">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Est. returns so far</p>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-success">{formatInr(snap.returnsSoFar)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-surface p-5 dark:border-indigo-500/20 dark:from-indigo-950/30 dark:to-surface-muted">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800 dark:text-indigo-200">Maturity</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{formatShortDate(snap.maturityDate)}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Months remaining</dt>
              <dd className="font-semibold text-ink">{snap.isMatured ? "0 (completed)" : snap.monthsLeft}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Corpus at maturity (est.)</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatInr(snap.corpusAtMaturity)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Total invested at maturity</dt>
              <dd className="font-semibold tabular-nums text-ink">{formatInr(snap.totalInvestedAtMaturity)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-surface p-5 dark:border-white/10 dark:bg-surface-muted/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">At maturity</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-success">{formatInr(snap.returnsAtMaturity)}</p>
          <p className="mt-1 text-sm text-ink-muted">Estimated wealth gain over your total contribution</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        

        <Shell title="Growth path" subtitle="Cumulative invested vs estimated corpus each year">
          {projection.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink-muted">Add tenure to see yearly projection.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={projection} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
                <YAxis
                  tick={{ fill: axisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${(v / 1000).toFixed(0)}k`)}
                />
                <Tooltip {...chartTooltip} formatter={(v) => formatInr(v)} labelFormatter={(l) => `End of ${l}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="invested" name="Invested" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="corpus" name="Est. corpus" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Shell>
      </div>
    </>
  );
}

export default function SavingsTab({ sips, setSips, role, chartTooltip, axisColor, gridColor }) {
  const isAdmin = role === "admin";
  const [activeSipId, setActiveSipId] = useState(() => sips[0]?.id ?? null);
  const [editor, setEditor] = useState(null);
  const [saveError, setSaveError] = useState("");

  const effectiveSelectedId = useMemo(() => {
    if (sips.length === 0) return null;
    if (activeSipId != null && sips.some((s) => s.id === activeSipId)) return activeSipId;
    return sips[0].id;
  }, [sips, activeSipId]);

  const activeSip = useMemo(
    () => (effectiveSelectedId == null ? null : sips.find((s) => s.id === effectiveSelectedId) ?? null),
    [sips, effectiveSelectedId]
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

  const openEdit = (sip) => {
    setEditor({ mode: "edit", id: sip.id, draft: sipToDraft(sip) });
    setSaveError("");
  };

  const cancelEditor = () => {
    setEditor(null);
    setSaveError("");
  };

  const saveSip = () => {
    if (!editor) return;
    const d = editor.draft;
    const monthly = Number(d.monthlyAmount);
    if (!d.monthlyAmount && d.monthlyAmount !== 0) {
      setSaveError("Enter a monthly amount.");
      return;
    }
    if (Number.isNaN(monthly) || monthly <= 0) {
      setSaveError("Monthly amount must be greater than zero.");
      return;
    }
    if (!d.startDate) {
      setSaveError("Choose a start date.");
      return;
    }
    const record = {
      label: (d.label || "SIP").trim(),
      monthlyAmount: monthly,
      expectedAnnualReturn: Number(d.expectedAnnualReturn) || 0,
      tenureYears: Math.max(0, Number(d.tenureYears) || 0),
      startDate: d.startDate,
    };

    if (editor.mode === "new") {
      const id = Date.now();
      setSips((prev) => [...prev, { id, ...record }]);
      setActiveSipId(id);
    } else {
      const id = editor.id;
      setSips((prev) => prev.map((s) => (s.id === id ? { id, ...record } : s)));
    }
    setEditor(null);
    setSaveError("");
  };

  return (
    <div className="mt-8 space-y-8">
      {isAdmin && (
        <p className="rounded-xl border border-indigo-200/80 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-200">
          Admin: save each SIP with <strong className="font-semibold">Save SIP</strong>, then use <strong className="font-semibold">Add another SIP</strong> for more plans. Viewers only see saved plans.
        </p>
      )}
      {!isAdmin && (
        <p className="rounded-xl border border-slate-200 bg-surface-muted/80 px-3 py-2 text-xs text-ink-muted dark:border-white/10">
          You are in <strong className="text-ink">Viewer</strong> mode — SIP plans are read-only. Switch to Admin in the header to add or edit.
        </p>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-card dark:border-white/10 dark:bg-surface-muted/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Your SIPs</h2>
            <p className="mt-1 text-sm text-ink-muted">{sips.length === 0 ? "No plans saved yet." : `${sips.length} saved on this device`}</p>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openNew}
                className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
              >
                Add another SIP
              </button>
              {sips.length === 0 && (
                <button
                  type="button"
                  onClick={() => setSips(SAMPLE_SIPS)}
                  className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/40 dark:bg-surface-muted dark:text-indigo-200"
                >
                  Load samples
                </button>
              )}
              {sips.length > 0 && (
                <button
                  type="button"
                  onClick={() => { if (confirm("Clear all SIP plans?")) setSips([]); }}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200"
                >
                  Reset all
                </button>
              )}
            </div>
          )}
        </div>

        {sips.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {sips.map((s) => {
              const selected = s.id === effectiveSelectedId;
              return (
                <li
                  key={s.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
                    selected
                      ? "border-accent/40 bg-accent/5 ring-1 ring-accent/20"
                      : "border-slate-200 dark:border-white/10"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveSipId(s.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="font-semibold text-ink">{s.label || "SIP"}</p>
                    <p className="text-sm text-ink-muted">
                      {formatInr(s.monthlyAmount)}/mo · {s.tenureYears} yr · from {formatShortDate(s.startDate)}
                    </p>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSipId(s.id);
                        openEdit(s);
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
          <h2 className="font-display text-xl font-semibold text-ink">{editor.mode === "new" ? "New SIP" : "Edit SIP"}</h2>
          <p className="mt-1 text-sm text-ink-muted">Fill in the details, then save. Nothing is stored until you click Save SIP.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Label</label>
              <input
                type="text"
                value={editor.draft.label}
                onChange={(e) => updateDraft({ label: e.target.value })}
                className={field}
                placeholder="e.g. Index fund SIP"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Monthly amount (₹)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={editor.draft.monthlyAmount}
                onChange={(e) => updateDraft({ monthlyAmount: e.target.value === "" ? "" : e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Expected return (% p.a.)</label>
              <input
                type="number"
                min={0}
                max={40}
                step={0.5}
                value={editor.draft.expectedAnnualReturn}
                onChange={(e) => updateDraft({ expectedAnnualReturn: e.target.value === "" ? "" : Number(e.target.value) })}
                className={field}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Tenure (years)</label>
              <input
                type="number"
                min={0}
                max={50}
                step={1}
                value={editor.draft.tenureYears}
                onChange={(e) => updateDraft({ tenureYears: e.target.value === "" ? "" : Number(e.target.value) })}
                className={field}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Start date</label>
              <input type="date" value={editor.draft.startDate} onChange={(e) => updateDraft({ startDate: e.target.value })} className={field} />
            </div>
          </div>

          {saveError && <p className="mt-3 text-sm font-medium text-danger">{saveError}</p>}

          <p className="mt-4 text-xs text-ink-muted">
            Projection uses monthly compounding with r = annual% ÷ 12 (common SIP estimate). Not financial advice.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveSip}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
            >
              Save SIP
            </button>
            <button
              type="button"
              onClick={cancelEditor}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-ink-muted transition hover:bg-surface-muted dark:border-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!editor && activeSip && (
        <div className="rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-card dark:border-white/10 dark:bg-surface-muted/80">
          <h2 className="font-display text-xl font-semibold text-ink">{activeSip.label || "SIP"}</h2>
          <p className="mt-1 text-sm text-ink-muted">Saved plan — details below are read-only here. {isAdmin ? "Use Edit to change values." : ""}</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Monthly</dt>
              <dd className="mt-1 font-semibold tabular-nums">{formatInr(activeSip.monthlyAmount)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Return % p.a.</dt>
              <dd className="mt-1 font-semibold">{activeSip.expectedAnnualReturn}%</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Tenure</dt>
              <dd className="mt-1 font-semibold">{activeSip.tenureYears} years</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Start</dt>
              <dd className="mt-1 font-semibold">{formatShortDate(activeSip.startDate)}</dd>
            </div>
          </dl>
        </div>
      )}

      {!activeSip && sips.length === 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-indigo-50/90 via-surface to-violet-50/50 p-8 shadow-card dark:border-white/10 dark:from-indigo-950/40 dark:via-surface-muted dark:to-violet-950/20 dark:shadow-card-dark">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">No SIP plans yet</h2>
              <p className="mt-2 max-w-xl text-sm text-ink-muted">
                Track multiple SIPs, see projected corpus, growth path, and maturity details.{" "}
                {isAdmin ? "Add your first plan above, or load sample data to explore." : "Switch to Admin to add plans, or load sample data to explore."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSips(SAMPLE_SIPS)}
              className="shrink-0 rounded-xl border border-indigo-200 bg-surface px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:border-indigo-500/40 dark:bg-surface-muted dark:text-indigo-200 dark:hover:bg-indigo-950/50"
            >
              Load sample SIPs
            </button>
          </div>
        </div>
      )}

      {activeSip && !editor && (
        <div className="space-y-8">
          <SipCharts sip={activeSip} chartTooltip={chartTooltip} axisColor={axisColor} gridColor={gridColor} />
        </div>
      )}
    </div>
  );
}
