const BASE = 'https://power.larc.nasa.gov/api/temporal/monthly/point'

// NASA POWER monthly data: temperature (T2M, °C) and precipitation (PRECTOTCORR, mm/day)
export async function fetchClimate(lat, lon, startYear = 1991, endYear = 2026) {
  const url =
    `${BASE}?start=${startYear}&end=${endYear}` +
    `&latitude=${lat}&longitude=${lon}` +
    `&community=ag&parameters=T2M,PRECTOTCORR&format=json`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!json.properties || !json.properties.parameter) throw new Error('unexpected response')
  const p = json.properties.parameter

  const rows = []
  for (const key of Object.keys(p.T2M)) {
    const month = Number(key.slice(4))
    if (month < 1 || month > 12) continue // 13 = annual mean, skipped
    const t = p.T2M[key]
    const pr = p.PRECTOTCORR[key]
    rows.push({
      year: Number(key.slice(0, 4)),
      month,
      temp: t === -999 ? null : t, // -999 = missing value
      precip: pr === -999 ? null : pr,
    })
  }

  return {
    rows,
    source: 'NASA POWER, monthly, ag community',
    url,
    retrievedAt: new Date().toISOString(),
    lat: Number(lat),
    lon: Number(lon),
  }
}