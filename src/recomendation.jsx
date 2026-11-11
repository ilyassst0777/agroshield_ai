import { useState } from 'react'
import { SOURCES, CRITERIA, ROTATIONS, NO_TILL } from './rotations.js'

const symbol = (v) => (v === null ? '?' : v > 0 ? '+' : v < 0 ? '-' : '~')

function SourceLinks({ ids }) {
  return ids.map((id) => (
    <a key={id} href={SOURCES[id].url} target="_blank" rel="noreferrer" style={{ marginLeft: 6 }}>
      [{SOURCES[id].label.split(',')[0]}]
    </a>
  ))
}

export default function Recommendations({ an }) {
  const [weights, setWeights] = useState({ moisture: 2, soil: 2, quality: 1 })
  const [noTill, setNoTill] = useState(false)
  const [dryThreshold, setDryThreshold] = useState(-15)

  const dry = an && an.precipPct <= Number(dryThreshold)
  const eff = { ...weights, moisture: weights.moisture + (dry ? 1 : 0) }

  const results = ROTATIONS.map((r) => {
    let score = 0
    const rows = CRITERIA.map((c) => {
      const e = r.effects[c.id]
      const t = noTill ? NO_TILL.effects[c.id] : null
      const sum = (e.value ?? 0) + (t ? (t.value ?? 0) : 0)
      score += eff[c.id] * sum
      return { c, e, t, sum }
    })
    return { r, score, rows }
  }).sort((a, b) => b.score - a.score)

  return (
    <div style={{ marginTop: 24 }}>
      <h2>Rotation options</h2>

      <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 6 }}>
        <b>What matters to the farmer (0 = not important, 3 = very important)</b>
        {CRITERIA.map((c) => (
          <div key={c.id}>
            <label>
              {c.label}:{' '}
              <input
                type="number" min="0" max="3"
                value={weights[c.id]}
                onChange={(e) => setWeights({ ...weights, [c.id]: Number(e.target.value) })}
                style={{ width: 50 }}
              />
            </label>
          </div>
        ))}
        <div>
          <label>
            <input type="checkbox" checked={noTill} onChange={(e) => setNoTill(e.target.checked)} />{' '}
            Farmer uses (or plans) no-till
          </label>
        </div>
        <div>
          <label>
            Dry-season threshold, precipitation vs normal (%):{' '}
            <input
              type="number"
              value={dryThreshold}
              onChange={(e) => setDryThreshold(e.target.value)}
              style={{ width: 70 }}
            />
          </label>{' '}
          <small>(our assumption, not from the sources)</small>
        </div>
        {an && (
          <p>
            Last season precipitation: {an.precipPct > 0 ? '+' : ''}{an.precipPct}% vs normal.{' '}
            {dry ? 'Dry season: weight of water conservation +1.' : 'Not below the dry threshold.'}
          </p>
        )}
      </div>

      {results.map(({ r, score, rows }, i) => (
        <div key={r.id} style={{ border: '1px solid #ccc', borderRadius: 6, padding: 12, marginTop: 12 }}>
          <b>#{i + 1} {r.name}</b> (score {score})
          {rows.map(({ c, e, t }) => (
            <div key={c.id} style={{ marginTop: 6 }}>
              <b>{symbol(e.value)} {c.label}</b>: {e.note} <SourceLinks ids={e.sources} />
              {t && (
                <div style={{ marginLeft: 16 }}>
                  <b>{symbol(t.value)} No-till:</b> {t.note} <SourceLinks ids={t.sources} />
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      <p>
        <small>
          + favorable, - unfavorable, ~ mixed evidence, ? no evidence in our sources. This is a
          qualitative summary of published research from northern Kazakhstan steppe (mostly chernozem
          soils), not a yield forecast. It may not apply to other soils or regions.
        </small>
      </p>
    </div>
  )
}