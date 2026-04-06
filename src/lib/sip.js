/** Monthly rate from nominal annual % (simple /12, common in SIP calculators). */
export function monthlyRateFromAnnual(annualPercent) {
  return annualPercent / 100 / 12;
}

/**
 * Future value of monthly SIP (payment at end of each month).
 * FV = P * [((1+r)^n - 1) / r]
 */
export function futureValueSip(monthlyAmount, annualPercent, months) {
  const n = Math.max(0, Math.floor(months));
  if (n === 0) return 0;
  const r = monthlyRateFromAnnual(annualPercent);
  if (r === 0) return monthlyAmount * n;
  return monthlyAmount * ((Math.pow(1 + r, n) - 1) / r);
}

export function addMonthsToDateString(isoDate, monthsToAdd) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1 + monthsToAdd, d);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Whole calendar months elapsed from start (inclusive of start month after full month), capped. */
export function monthsElapsedSince(startIso, asOf = new Date(), capMonths = Infinity) {
  const [y, m, d] = startIso.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  if (asOf < start) return 0;
  let months = (asOf.getFullYear() - start.getFullYear()) * 12 + (asOf.getMonth() - start.getMonth());
  if (asOf.getDate() < start.getDate()) months -= 1;
  const raw = Math.max(0, months);
  return Math.min(raw, capMonths);
}

export function computeSipSnapshot(sip, asOf = new Date()) {
  const monthly = Number(sip.monthlyAmount) || 0;
  const annual = Number(sip.expectedAnnualReturn) || 0;
  const tenureMonths = Math.max(0, Math.floor((Number(sip.tenureYears) || 0) * 12));
  const start = sip.startDate || asOf.toISOString().slice(0, 10);

  const monthsDone = monthsElapsedSince(start, asOf, tenureMonths);
  const investedSoFar = monthly * monthsDone;
  const corpusNow = futureValueSip(monthly, annual, monthsDone);
  const returnsSoFar = corpusNow - investedSoFar;

  const totalInvestedAtMaturity = monthly * tenureMonths;
  const corpusAtMaturity = futureValueSip(monthly, annual, tenureMonths);
  const returnsAtMaturity = corpusAtMaturity - totalInvestedAtMaturity;

  const maturityDate = tenureMonths > 0 ? addMonthsToDateString(start, tenureMonths) : start;
  const monthsLeft = Math.max(0, tenureMonths - monthsDone);

  return {
    monthly,
    annual,
    tenureMonths,
    start,
    monthsDone,
    investedSoFar,
    corpusNow,
    returnsSoFar,
    totalInvestedAtMaturity,
    corpusAtMaturity,
    returnsAtMaturity,
    maturityDate,
    monthsLeft,
    isMatured: monthsDone >= tenureMonths && tenureMonths > 0,
  };
}

/** Year-end points for charts: year index 1..lastYear */
export function yearlyProjection(monthly, annualPercent, tenureMonths) {
  const totalYears = Math.ceil(tenureMonths / 12) || 0;
  const points = [];
  for (let y = 1; y <= totalYears; y++) {
    const months = Math.min(y * 12, tenureMonths);
    const invested = monthly * months;
    const corpus = futureValueSip(monthly, annualPercent, months);
    points.push({
      year: y,
      label: `Y${y}`,
      invested,
      corpus,
      returns: corpus - invested,
    });
  }
  return points;
}
