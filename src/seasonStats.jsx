function readLS(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

const signed = (n) => (n > 0 ? '+' + n : String(n))

export default function Stats({ an, data }) {
  const rules = readLS('agro_rules', null)
  const tasks = readLS('agro_tasks', [])
  const log = readLS('agro_log', [])

  const dryRule = rules ? rules.find((r) => r.id === 'dry-season') : null
  const hotRule = rules ? rules.find((r) => r.id === 'hot-season') : null
  const dryThreshold = dryRule ? Number(dryRule.threshold) : -15
  const hotThreshold = hotRule ? Number(hotRule.threshold) : 1.5

  const activeRules = rules ? rules.filter((r) => r.enabled).length : 2
  const totalRules = rules ? rules.length : 2
  const pending = tasks.filter((t) => t.status === 'pending').length
  const testChecks = log.filter((l) => l.result.includes('[TEST scenario]')).length
  const realChecks = log.length - testChecks

  const dry = an.precipPct <= dryThreshold
  const hot = an.tempDiff >= hotThreshold

  return (
    <div className="card">
      <h2>2. Season overview ({an.year})</h2>
      <div className="grid">
        <div className="stat">
          <div className="label">Precipitation vs normal</div>
          <div className="value">{signed(an.precipPct)}%</div>
          <span className={dry ? 'badge warn' : 'badge ok'}>
            {dry ? 'Below dry threshold' : 'Not below dry threshold'}
          </span>
        </div>
        <div className="stat">
          <div className="label">Temperature vs normal</div>
          <div className="value">{signed(an.tempDiff)} °C</div>
          <span className={hot ? 'badge warn' : 'badge ok'}>
            {hot ? 'Above heat threshold' : 'Not above heat threshold'}
          </span>
        </div>
        <div className="stat">
          <div className="label">Active rules</div>
          <div className="value">{activeRules} of {totalRules}</div>
        </div>
        <div className="stat">
          <div className="label">Pending tasks</div>
          <div className="value">{pending}</div>
        </div>
        <div className="stat">
          <div className="label">Rule checks (real / test)</div>
          <div className="value">{realChecks} / {testChecks}</div>
        </div>
        <div className="stat">
          <div className="label">Last NASA retrieval</div>
          <div className="value" style={{ fontSize: 16 }}>
            {new Date(data.retrievedAt).toLocaleString()}
          </div>
        </div>
      </div>
      <p className="muted">
        Data: {data.source}. These are satellite and model estimates for the grid cell around your
        point, compared with the {an.baseYears}-year mean (1991-2020). Thresholds are our
        assumptions and can be changed in the Automation tab.
      </p>
    </div>
  )
}