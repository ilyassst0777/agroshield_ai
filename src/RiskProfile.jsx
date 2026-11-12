import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, ResponsiveContainer, Cell,
} from 'recharts'

const BASE_START = 1991
const BASE_END = 2020

function readRules() {
  try {
    const v = localStorage.getItem('agro_rules')
    return v ? JSON.parse(v) : null
  } catch {
    return null
  }
}

// Percentile with linear interpolation (sorted ascending)
function percentile(sorted, p) {
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

export default function RiskProfile({ summary }) {
  const base = summary.filter((s) => s.year >= BASE_START && s.year <= BASE_END)
  if (base.length < 25) return null

  const meanP = base.reduce((a, s) => a + s.precip, 0) / base.length
  const meanT = base.reduce((a, s) => a + s.temp, 0) / base.length

  const rules = readRules()
  const dryRule = rules ? rules.find((r) => r.id === 'dry-season') : null
  const hotRule = rules ? rules.find((r) => r.id === 'hot-season') : null
  const dryT = dryRule ? Number(dryRule.threshold) : -15
  const hotT = hotRule ? Number(hotRule.threshold) : 1.5

  const rows = summary.map((s) => {
    const precipPct = +(((s.precip - meanP) / meanP) * 100).toFixed(1)
    const tempDiff = +(s.temp - meanT).toFixed(2)
    return { year: s.year, precipPct, tempDiff, dry: precipPct <= dryT, hot: tempDiff >= hotT }
  })

  const dryCount = rows.filter((r) => r.dry).length
  const hotCount = rows.filter((r) => r.hot).length
  const bothCount = rows.filter((r) => r.dry && r.hot).length

  const sortedP = base.map((s) => ((s.precip - meanP) / meanP) * 100).sort((a, b) => a - b)
  const sortedT = base.map((s) => s.temp - meanT).sort((a, b) => a - b)
  const dry1in5 = +percentile(sortedP, 0.2).toFixed(1)
  const hot1in5 = +percentile(sortedT, 0.8).toFixed(2)

  const color = (r) => (r.dry && r.hot ? '#c92a2a' : r.dry ? '#e67700' : r.hot ? '#e03131' : '#2f9e44')
  const label = (r) =>
    r.dry && r.hot ? 'dry and hot' : r.dry ? 'dry' : r.hot ? 'hot' : 'no flag'

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Local climate risk profile ({rows[0].year}-{rows[rows.length - 1].year})</h3>
      <p className="muted">
        Every season is compared with the {BASE_START}-{BASE_END} mean at this location, then the
        automation rules are checked against the whole history (a backtest). It shows climate
        flags only, not yield outcomes.
      </p>

      <div className="grid">
        <div className="stat">
          <div className="label">Dry flag (precip ≤ {dryT}%)</div>
          <div className="value">{dryCount} of {rows.length}</div>
          <small className="muted">seasons</small>
        </div>
        <div className="stat">
          <div className="label">Heat flag (temp ≥ +{hotT} °C)</div>
          <div className="value">{hotCount} of {rows.length}</div>
          <small className="muted">seasons</small>
        </div>
        <div className="stat">
          <div className="label">Dry and hot together</div>
          <div className="value">{bothCount} of {rows.length}</div>
          <small className="muted">seasons</small>
        </div>
      </div>

      <h4>Precipitation vs normal by season (%)</h4>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <ReferenceLine y={0} stroke="#868e96" />
          <ReferenceLine y={dryT} stroke="#e67700" strokeDasharray="4 4" label="dry threshold" />
          <Bar dataKey="precipPct" name="Precipitation vs normal (%)">
            {rows.map((r) => (
              <Cell key={r.year} fill={r.dry ? '#e67700' : '#1971c2'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <h4>Season flags</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {rows.map((r) => (
          <div
            key={r.year}
            title={`${r.year}: ${label(r)} (precip ${r.precipPct}%, temp ${r.tempDiff} °C)`}
            style={{
              width: 44, padding: '4px 0', textAlign: 'center', fontSize: 12,
              color: '#fff', background: color(r), borderRadius: 4,
            }}
          >
            {r.year}
          </div>
        ))}
      </div>
      <small className="muted">
        Green: no flag. Orange: dry. Red: hot or dry and hot. Hover a year for the numbers.
      </small>

      <div style={{ background: '#f1f3f5', padding: 12, borderRadius: 8, marginTop: 12 }}>
        <b>Thresholds grounded in this location's history</b>
        <p>
          In {BASE_START}-{BASE_END} the driest 1 season in 5 had precipitation at or below about{' '}
          <b>{dry1in5}%</b> of normal, and the warmest 1 in 5 was at least about{' '}
          <b>+{hot1in5} °C</b> above normal. You can type these values into the rules on the
          Automation tab instead of our default assumptions ({dryT}% and +{hotT} °C).
        </p>
        <small className="muted">
          Based on NASA POWER estimates for the grid cell around your point. The percentiles are
          computed from the baseline years themselves, so they describe this location's own
          variability, not an agronomic limit.
        </small>
      </div>
    </div>
  )
}