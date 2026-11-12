const BASE = 'https://power.larc.nasa.gov/api/temporal/monthly/point'

// Месячные данные NASA POWER: температура (T2M, °C) и осадки (PRECTOTCORR, мм/день)
export async function fetchClimate(lat, lon, startYear = 1991, endYear = 2025) {
  const url =
    `${BASE}?start=${startYear}&end=${endYear}` +
    `&latitude=${lat}&longitude=${lon}` +
    `&community=ag&parameters=T2M,PRECTOTCORR&format=json`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`NASA POWER error: ${res.status}`)
  const json = await res.json()
  const p = json.properties.parameter

  const rows = []
  for (const key of Object.keys(p.T2M)) {
    const month = Number(key.slice(4))
    if (month < 1 || month > 12) continue // 13 = годовое среднее, пропускаем
    const t = p.T2M[key]
    const pr = p.PRECTOTCORR[key]
    rows.push({
      year: Number(key.slice(0, 4)),
      month,
      temp: t === -999 ? null : t, // -999 = нет данных
      precip: pr === -999 ? null : pr,
    })
  }

  return {
    rows,
    source: 'NASA POWER, monthly, ag community',
    url,
    retrievedAt: new Date().toISOString(),
  }
}