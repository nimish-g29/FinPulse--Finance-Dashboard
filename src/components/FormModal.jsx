import { useState } from "react";

export default function FormModal({ form, setForm, setShowForm, transactions, setTransactions }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState("");
  const [custom, setCustom] = useState(false);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [error, setError] = useState("");

  const incomeOptions = ["Salary", "Freelance", "Investments", "Other"];
  const expenseOptions = ["Food", "Shopping", "Medical", "Transport", "Utilities", "Entertainment"];

  const options = type === "income" ? incomeOptions : expenseOptions;
  const today = new Date().toISOString().split("T")[0];

  const resetFlow = () => {
    setStep(1);
    setCustom(false);
    setType("");
    setUseCustomDate(false);
    setError("");
  };

  const close = () => {
    setShowForm(false);
    resetFlow();
    setForm({ amount: "", category: "", type: "expense" });
  };

  const submit = () => {
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!form.category?.trim()) {
      setError("Choose or enter a category.");
      return;
    }
    setError("");
    const newTx = {
      id: Date.now(),
      date: form.date || today,
      amount,
      category: form.category.trim(),
      type: form.type,
    };
    setTransactions([...transactions, newTx]);
    close();
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink shadow-sm transition placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-surface-muted dark:text-ink";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm dark:bg-black/50"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-2xl dark:border-white/10 dark:bg-surface-muted"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 rounded-lg p-1 text-ink-muted transition hover:bg-surface-muted hover:text-ink dark:hover:bg-white/10"
        >
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 id="form-modal-title" className="font-display text-xl font-semibold text-ink">
          New transaction
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Log income or spending in a few steps.</p>

        {step === 1 && (
          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setType("income");
                setForm({ ...form, type: "income" });
                setStep(2);
              }}
              className="rounded-xl border-2 border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white py-4 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-emerald-500/30 dark:from-emerald-950/40 dark:to-surface-muted dark:text-emerald-200"
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => {
                setType("expense");
                setForm({ ...form, type: "expense" });
                setStep(2);
              }}
              className="rounded-xl border-2 border-rose-200/80 bg-gradient-to-br from-rose-50 to-white py-4 text-sm font-semibold text-rose-800 shadow-sm transition hover:border-rose-400 hover:shadow-md dark:border-rose-500/30 dark:from-rose-950/40 dark:to-surface-muted dark:text-rose-200"
            >
              Expense
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Date</label>
              <select
                className={inputClass}
                value={useCustomDate ? "custom" : "today"}
                onChange={(e) => {
                  if (e.target.value === "today") {
                    setUseCustomDate(false);
                    setForm({ ...form, date: today });
                  } else {
                    setUseCustomDate(true);
                  }
                }}
              >
                <option value="today">Today</option>
                <option value="custom">Pick a date</option>
              </select>
              {useCustomDate && (
                <input
                  type="date"
                  value={form.date || ""}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={`${inputClass} mt-2`}
                />
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Amount (INR)</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
                {type === "income" ? "Source" : "Category"}
              </label>
              {!custom ? (
                <select
                  value={form.category}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setCustom(true);
                      setForm({ ...form, category: "" });
                    } else {
                      setForm({ ...form, category: e.target.value });
                    }
                  }}
                  className={inputClass}
                >
                  <option value="">Select…</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="custom">Custom…</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Type a label"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputClass}
                />
              )}
            </div>

            {error && <p className="text-sm font-medium text-danger">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetFlow();
                }}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-ink-muted transition hover:bg-surface-muted dark:border-white/10"
              >
                Back
              </button>
              <button
                type="button"
                onClick={submit}
                className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
