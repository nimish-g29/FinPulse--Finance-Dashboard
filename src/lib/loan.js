import { monthsElapsedSince, addMonthsToDateString } from "./sip";

export function monthlyRateLoan(annualPercent) {
  return annualPercent / 100 / 12;
}

/** Reducing-balance EMI (monthly rest, payment at end of period). */
export function computeEMI(principal, annualPercent, months) {
  const P = Number(principal) || 0;
  const n = Math.max(0, Math.floor(months));
  if (n === 0 || P === 0) return 0;
  const r = monthlyRateLoan(annualPercent);
  if (r === 0) return P / n;
  const pow = Math.pow(1 + r, n);
  return (P * r * pow) / (pow - 1);
}

/**
 * Full amortization schedule. Each row is one EMI.
 */
export function buildSchedule(principal, annualPercent, months) {
  const P = Number(principal) || 0;
  const n = Math.max(0, Math.floor(months));
  if (n === 0 || P === 0) return [];

  const emi = computeEMI(P, annualPercent, n);
  const r = monthlyRateLoan(annualPercent);
  let balance = P;
  const rows = [];

  for (let i = 1; i <= n; i++) {
    const interestPart = r === 0 ? 0 : balance * r;
    let principalPart = emi - interestPart;
    if (i === n) {
      principalPart = balance;
    }
    const payment = principalPart + interestPart;
    balance = Math.max(0, balance - principalPart);
    rows.push({
      month: i,
      payment,
      principal: principalPart,
      interest: interestPart,
      balance,
    });
  }

  return rows;
}

export function computeLoanSnapshot(loan, asOf = new Date()) {
  const principal = Number(loan.principal) || 0;
  const annual = Number(loan.annualInterestRate) || 0;
  const tenureMonths = Math.max(0, Math.round((Number(loan.tenureYears) || 0) * 12));
  const start = loan.startDate || asOf.toISOString().slice(0, 10);

  const schedule = buildSchedule(principal, annual, tenureMonths);
  const emi = tenureMonths > 0 ? schedule[0]?.payment ?? computeEMI(principal, annual, tenureMonths) : 0;
  const monthsPaid = monthsElapsedSince(start, asOf, tenureMonths);

  let paidPrincipal = 0;
  let paidInterest = 0;
  const k = Math.min(monthsPaid, tenureMonths, schedule.length);
  for (let i = 0; i < k; i++) {
    paidPrincipal += schedule[i].principal;
    paidInterest += schedule[i].interest;
  }

  let outstanding = principal;
  if (k > 0 && schedule.length > 0) {
    outstanding = k >= schedule.length ? 0 : schedule[k - 1].balance;
  }

  const totalPayable = schedule.reduce((s, r) => s + r.payment, 0);
  const totalInterest = totalPayable - principal;
  const maturityDate = tenureMonths > 0 ? addMonthsToDateString(start, tenureMonths) : start;
  const monthsLeft = Math.max(0, tenureMonths - monthsPaid);
  const progressPct = tenureMonths > 0 ? Math.min(100, (monthsPaid / tenureMonths) * 100) : 0;
  const nextEmiDate =
    monthsPaid < tenureMonths && tenureMonths > 0 ? addMonthsToDateString(start, monthsPaid) : null;

  return {
    principal,
    annual,
    tenureMonths,
    start,
    emi,
    monthsPaid,
    monthsLeft,
    outstanding,
    totalPayable,
    totalInterest,
    paidPrincipal,
    paidInterest,
    paidTotal: paidPrincipal + paidInterest,
    maturityDate,
    nextEmiDate,
    progressPct,
    isClosed: monthsPaid >= tenureMonths && tenureMonths > 0,
    schedule,
  };
}

/** Year-end outstanding for chart (after min(12*y, tenure) EMIs). */
export function yearlyOutstandingSeries(principal, annualPercent, tenureMonths) {
  if (tenureMonths === 0) return [];
  const schedule = buildSchedule(principal, annualPercent, tenureMonths);
  const years = Math.ceil(tenureMonths / 12);
  const points = [];
  for (let y = 1; y <= years; y++) {
    const m = Math.min(y * 12, tenureMonths);
    const bal = m === 0 ? principal : m >= schedule.length ? 0 : schedule[m - 1].balance;
    points.push({ year: y, label: `Y${y}`, outstanding: bal });
  }
  return points;
}
