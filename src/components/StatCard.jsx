import { formatInr } from "../lib/format";

export default function StatCard({ title, value, subtitle, tone = "neutral", icon: Icon }) {
  const tones = {
    neutral: "from-slate-500/10 to-slate-500/5 border-slate-200/80 dark:border-white/10 text-ink",
    positive: "from-emerald-500/12 to-emerald-500/5 border-emerald-200/60 dark:border-emerald-500/20 text-success",
    negative: "from-rose-500/12 to-rose-500/5 border-rose-200/60 dark:border-rose-500/20 text-danger",
    balance: "from-indigo-500/15 to-violet-500/8 border-indigo-200/70 dark:border-indigo-400/25 text-accent",
  };
  const iconWrap = {
    neutral: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    negative: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    balance: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/25 dark:text-indigo-200",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-card transition duration-300 hover:shadow-glow dark:shadow-card-dark ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</p>
          <p className="font-display mt-2 text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {typeof value === "number" ? formatInr(value) : value}
          </p>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {Icon && (
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconWrap[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}
