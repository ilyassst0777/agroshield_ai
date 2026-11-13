import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { useT } from './i18n.jsx'
import { fmtTime, opSym, signed } from './ui.jsx'
import { BASE_START, BASE_END, SEASON_DAYS } from './climate.js'

function percentile(sorted, p) {
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

export default function Climate({ summary, an, data, check, rules, profile }) {
  const { t, lang } = useT()

  const dryRule = rules.find((r) => r.id === 'dry-season')
  const hotRule = rules.find((r) => r.id === 'hot-season')
  const dryT = Number(dryRule.threshold)
  const hotT = Number(hotRule.threshold)

  // Risk profile (backtest over the whole history)
  const base = summary.filter((s) => s.year >= BASE_START && s.year <= BASE_END)
  let risk = null
  if (base.length >= 25) {
    const meanP = base.reduce((a, s) => a + s.precip, 0) / base.length
    const meanT = base.reduce((a, s) => a + s.temp, 0) / base.length
    const rows = summary.map((s) => {
      const precipPct = +(((s.precip - meanP) / meanP) * 100).toFixed(1)
      const tempDiff = +(s.temp - meanT).toFixed(2)
      return { year: s.year, precipPct, tempDiff, dry: precipPct <= dryT, hot: tempDiff >= hotT }
    })
    const sortedP = base.map((s) => ((s.precip - meanP) / meanP) * 100).sort((a, b) => a - b)
    const sortedT = base.map((s) => s.temp - meanT).sort((a, b) => a - b)
    risk = {
      rows,
      dryCount: rows.filter((r) => r.dry).length,
      hotCount: rows.filter((r) => r.hot).length,
      bothCount: rows.filter((r) => r.dry && r.hot).length,
      dry1in5: +percentile(sortedP, 0.2).toFixed(1),
      hot1in5: +percentile(sortedT, 0.8).toFixed(2),
    }
  }

  const color = (r) => (r.dry && r.hot ? '#b3261e' : r.dry ? '#e08a00' : r.hot ? '#d6453d' : '#2f9e44')
  const label = (r) => (r.dry && r.hot ? t('risk.lblBoth') : r.dry ? t('risk.lblDry') : r.hot ? t('risk.lblHot') : t('risk.lblNone'))

  const coordsUsed = data.lat !== undefined ? `${data.lat}, ${data.lon}` : `${profile.lat}, ${profile.lon}`

  return (
    <>
      <h2>{t('clim.title')}</h2>

      {/* Data provenance and quality */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{t('clim.dq')}</h3>
        <div className="grid">
          <div className="stat"><div className="label">{t('clim.dqCoords')}</div><div className="value small">{coordsUsed}</div></div>
          <div className="stat">
            <div className="label">{t('clim.dqSeason')}</div>
            <div className="value small">{check.usedYear || '-'}</div>
            <small>{t('clim.dqMonths', { n: check.usedMonths })}</small>
          </div>
          <div className="stat">
            <div className="label">{t('clim.dqBaseline')}</div>
            <div className="value small">{t('clim.dqBaselineValue', { n: check.baselineYears })}</div>
          </div>
          <div className="stat"><div className="label">{t('clim.dqUnits')}</div><div className="value small">{t('clim.dqUnitsValue')}</div></div>
          <div className="stat"><div className="label">{t('clim.dqRetrieved')}</div><div className="value small">{fmtTime(data.retrievedAt, lang)}</div></div>
        </div>
        {check.requestedMonths === 4 ? (
          <p><span className="badge ok">{t('clim.dqReqOk', { year: check.requestedYear })}</span></p>
        ) : (
          <div className="notice">{t('clim.dqReqBad', { year: check.requestedYear, n: check.requestedMonths })}</div>
        )}
        <p className="muted">
          {t('clim.dqSource')}: <a href={data.url} target="_blank" rel="noreferrer">{data.source}</a>. {t('clim.dqNote')}
        </p>
      </div>

      {/* Indicators */}
      {an ? (
        <div className="grid" style={{ marginBottom: 16 }}>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="label muted">{t('clim.tempCard')}</div>
            <div className="stat" style={{ border: 'none', padding: 0, background: 'none' }}>
              <div className="value">{signed(an.tempDiff)} °C</div>
            </div>
            <div>{t('clim.vsNormal', { value: an.temp + ' °C', mean: an.meanTemp + ' °C' })}</div>
          </div>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="label muted">{t('clim.precipCard')}</div>
            <div className="stat" style={{ border: 'none', padding: 0, background: 'none' }}>
              <div className="value">{signed(an.precipPct)}%</div>
            </div>
            <div>{t('clim.vsNormal', { value: an.precip + ' mm/day', mean: an.meanPrecip + ' mm/day' })}</div>
            <small className="muted">{t('clim.mmSeason', { mm: (an.precip * SEASON_DAYS).toFixed(0) })}</small>
          </div>
        </div>
      ) : (
        <div className="notice">{t('clim.notEnough')}</div>
      )}

      {/* Historical chart */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{t('clim.chart')}</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={summary} margin={{ left: 8, right: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis yAxisId="left" label={{ value: t('clim.axisTemp'), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: t('clim.axisPrecip'), angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="temp" name={t('clim.axisTemp')} stroke="#d9480f" dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="precip" name={t('clim.axisPrecip')} stroke="#1971c2" dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <p className="muted">{t('clim.method')}</p>
      </div>

      {/* Risk profile */}
      {risk && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t('risk.title')} ({risk.rows[0].year}–{risk.rows[risk.rows.length - 1].year})</h3>
          <p className="muted">{t('risk.intro', { start: BASE_START, end: BASE_END })}</p>
          <div className="grid">
            <div className="stat">
              <div className="label">{t('risk.dry', { op: opSym(dryRule.op), t: signed(dryT) })}</div>
              <div className="value small">{t('risk.of', { n: risk.dryCount, total: risk.rows.length })}</div>
            </div>
            <div className="stat">
              <div className="label">{t('risk.hot', { op: opSym(hotRule.op), t: signed(hotT) })}</div>
              <div className="value small">{t('risk.of', { n: risk.hotCount, total: risk.rows.length })}</div>
            </div>
            <div className="stat">
              <div className="label">{t('risk.both')}</div>
              <div className="value small">{t('risk.of', { n: risk.bothCount, total: risk.rows.length })}</div>
            </div>
          </div>

          <h4 style={{ marginTop: 16 }}>{t('risk.chart')}</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={risk.rows} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <ReferenceLine y={0} stroke="#868e96" />
              <ReferenceLine y={dryT} stroke="#e08a00" strokeDasharray="4 4" label={t('risk.dryLine')} />
              <Bar dataKey="precipPct" name={t('risk.seriesPrecip')}>
                {risk.rows.map((r) => (
                  <Cell key={r.year} fill={r.dry ? '#e08a00' : '#1971c2'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <h4>{t('risk.flags')}</h4>
          <div className="chips">
            {risk.rows.map((r) => (
              <div
                key={r.year}
                className="chip"
                style={{ background: color(r) }}
                title={`${r.year}: ${label(r)} (${signed(r.precipPct)}%, ${signed(r.tempDiff)} °C)`}
              >
                {r.year}
              </div>
            ))}
          </div>
          <small className="muted">{t('risk.legend')}</small>

          <div className="panel">
            <b>{t('risk.thresholds')}</b>
            <p>
              {t('risk.thresholdsText', {
                start: BASE_START,
                end: BASE_END,
                dry: signed(risk.dry1in5),
                hot: signed(risk.hot1in5),
                dryT: signed(dryT),
                hotT: signed(hotT),
              })}
            </p>
            <small className="muted">{t('risk.thresholdsNote')}</small>
          </div>
        </div>
      )}
    </>
  )
}