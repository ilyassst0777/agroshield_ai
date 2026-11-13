export const BASE_START = 1991
export const BASE_END = 2020
export const REQUEST_END_YEAR = 2026
export const SEASON_DAYS = 123 // May-August: 31 + 30 + 31 + 31
const SEASON_MONTHS = [5, 6, 7, 8]

// May-August mean temperature and precipitation per year (complete years only)
export function seasonSummary(rows) {
  const years = {}
  for (const r of rows) {
    if (!SEASON_MONTHS.includes(r.month)) continue
    if (r.temp === null || r.precip === null) continue
    if (!years[r.year]) years[r.year] = { t: 0, p: 0, n: 0 }
    years[r.year].t += r.temp
    years[r.year].p += r.precip
    years[r.year].n += 1
  }
  return Object.entries(years)
    .filter(([, v]) => v.n === 4)
    .map(([year, v]) => ({
      year: Number(year),
      temp: +(v.t / v.n).toFixed(2),
      precip: +(v.p / v.n).toFixed(2),
    }))
}

// Deviation of the latest complete season from the baseline mean
export function anomaly(summary) {
  const base = summary.filter((s) => s.year >= BASE_START && s.year <= BASE_END)
  if (base.length < 25 || summary.length === 0) return null
  const meanP = base.reduce((a, s) => a + s.precip, 0) / base.length
  const meanT = base.reduce((a, s) => a + s.temp, 0) / base.length
  const last = summary[summary.length - 1]
  return {
    year: last.year,
    precip: last.precip,
    meanPrecip: +meanP.toFixed(2),
    precipPct: +(((last.precip - meanP) / meanP) * 100).toFixed(1),
    temp: last.temp,
    meanTemp: +meanT.toFixed(2),
    tempDiff: +(last.temp - meanT).toFixed(2),
    baseYears: base.length,
  }
}

// Completeness check of the requested season and of the baseline
export function dataCheck(rows, summary) {
  const monthsOf = (year) =>
    rows.filter(
      (r) => r.year === year && SEASON_MONTHS.includes(r.month) && r.temp !== null && r.precip !== null
    ).length
  const usedYear = summary.length ? summary[summary.length - 1].year : null
  return {
    requestedYear: REQUEST_END_YEAR,
    requestedMonths: monthsOf(REQUEST_END_YEAR),
    usedYear,
    usedMonths: usedYear ? monthsOf(usedYear) : 0,
    baselineYears: summary.filter((s) => s.year >= BASE_START && s.year <= BASE_END).length,
  }
}