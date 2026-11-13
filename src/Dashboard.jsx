import { useT } from './i18n.jsx'
import { SourceLinks, evidenceInfo, fmtTime, describeTask, describeNote, opSym, signed } from './ui.jsx'
import { BASE_START, BASE_END } from './climate.js'

function Info({ label, value }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value small">{value}</div>
    </div>
  )
}

export default function Dashboard({
  profile, an, data, analysis, rules, tasks, notes, executions, mismatch, onGoto, onReload,
}) {
  const { t, lang } = useT()

  const dryRule = rules.find((r) => r.id === 'dry-season')
  const hotRule = rules.find((r) => r.id === 'hot-season')
  const pending = tasks.filter((x) => x.status === 'pending').length
  const okRuns = executions.filter((e) => e.status !== 'failed')
  const realRuns = okRuns.filter((e) => !e.test).length
  const testRuns = okRuns.filter((e) => e.test).length
  const activeRules = rules.filter((r) => r.enabled).length

  // Decision summary pieces
  const top = analysis.ranking[0]
  const situation = []
  if (an) {
    if (analysis.flags.hot) {
      situation.push(t('sum.sitHeat', { value: signed(an.tempDiff), op: opSym(hotRule.op), threshold: signed(Number(hotRule.threshold)) }))
    }
    if (analysis.flags.dry) {
      situation.push(t('sum.sitDry', { value: signed(an.precipPct), op: opSym(dryRule.op), threshold: signed(Number(dryRule.threshold)) }))
    }
    if (!analysis.flags.hot && !analysis.flags.dry) {
      situation.push(t('sum.sitNone', { year: an.year, p: signed(an.precipPct), tt: signed(an.tempDiff) }))
    }
  }
  const why = top.rows
    .filter((r) => r.w > 0 && r.sum > 0)
    .map((r) => t('sum.whyLine', { criterion: t('criteria.' + r.c), w: r.w, label: t(evidenceInfo(r.sum).key) }))
  const gaps = top.rows
    .filter((r) => r.e.value === 0 || r.e.value === null)
    .map((r) => t('lim.gap', { criterion: t('criteria.' + r.c), label: t(evidenceInfo(r.e.value).key) }))
  const sourceIds = [...new Set(top.rows.flatMap((r) => [...r.e.sources, ...(r.nt ? r.nt.sources : [])]))]

  let next = t('sum.nextReview')
  if (!an) next = t('sum.nextLoad')
  else if (pending > 0) next = t('sum.nextPending', { n: pending })
  else if ((analysis.flags.hot || analysis.flags.dry) && executions.filter((e) => !e.test).length === 0) next = t('sum.nextRun')

  // Recent activity
  const activity = [
    ...executions.slice(0, 5).map((e) => ({
      at: e.at,
      text: (e.test ? '[' + t('common.test') + '] ' : '') + t('act.exec', { id: e.id.slice(-6), status: t('hist.status.' + e.status) }),
    })),
    ...tasks.slice(0, 5).map((x) => ({
      at: x.createdAt,
      text: (x.test ? '[' + t('common.test') + '] ' : '') + t('act.task', { title: describeTask(t, x).title }),
    })),
    ...notes.slice(0, 5).map((n) => ({
      at: n.createdAt,
      text: (n.test ? '[' + t('common.test') + '] ' : '') + t('act.note', { msg: describeNote(t, n).message }),
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 8)

  return (
    <>
      {/* A. Field overview */}
      <div className="card">
        <h2>{t('dash.field')}</h2>
        <div className="grid">
          <Info label={t('field.name')} value={profile.name || t('field.defaultName')} />
          <Info label={t('dash.coords')} value={`${profile.lat}, ${profile.lon}`} />
          <Info label={t('field.soil')} value={t('soil.' + profile.soil)} />
          <Info label={t('field.prevCrop')} value={t('crop.' + profile.prevCrop)} />
          <Info label={t('field.plannedCrop')} value={t('crop.' + profile.plannedCrop)} />
          <Info label={t('field.noTill')} value={t('tillage.' + profile.noTill)} />
        </div>
      </div>

      {/* B. Climate status */}
      <div className="card">
        <h2>{t('dash.climate')}</h2>
        {mismatch && (
          <div className="notice">
            {t('dash.mismatch')}{' '}
            <button className="secondary" onClick={onReload}>
              {t('field.load')}
            </button>
          </div>
        )}
        {!an && (
          <p>
            {t('dash.noData')}{' '}
            <button onClick={onReload}>{t('field.load')}</button>
          </p>
        )}
        {an && (
          <>
            <p className="muted">{t('dash.season', { year: an.year })}</p>
            <div className="grid">
              <div className="stat">
                <div className="label">{t('dash.temp')}</div>
                <div className="value">{signed(an.tempDiff)} °C</div>
                <span className={analysis.flags.hot ? 'badge bad' : 'badge ok'}>
                  {analysis.flags.hot ? t('dash.flagHeat') : t('dash.flagNone')}
                </span>
              </div>
              <div className="stat">
                <div className="label">{t('dash.precip')}</div>
                <div className="value">{signed(an.precipPct)}%</div>
                <span className={analysis.flags.dry ? 'badge warn' : 'badge ok'}>
                  {analysis.flags.dry ? t('dash.flagDry') : t('dash.flagNone')}
                </span>
              </div>
              <Info label={t('dash.baseline')} value={t('dash.baselineValue', { start: BASE_START, end: BASE_END, n: an.baseYears })} />
              <Info label={t('dash.retrieved')} value={fmtTime(data.retrievedAt, lang)} />
            </div>
            <p className="muted">{t('dash.historical')}</p>
          </>
        )}
      </div>

      {/* C. Decision summary */}
      <div className="card highlight">
        <h2>{t('sum.title')}</h2>
        <h3>{t('sum.situation')}</h3>
        {an ? situation.map((s, i) => <div key={i}>{s}</div>) : <div>{t('sum.nextLoad')}</div>}

        <h3>{t('sum.best')}</h3>
        <div>
          <b>{t('rot.' + top.id)}</b> <span className="badge ok">{t('sum.score', { score: top.score })}</span>
        </div>

        <h3>{t('sum.why')}</h3>
        {why.length ? why.map((w, i) => <div key={i}>{w}</div>) : <div>{t('sum.whyNone')}</div>}

        <h3>{t('sum.limits')}</h3>
        {gaps.map((g, i) => <div key={'g' + i}>• {g}</div>)}
        <div>• {t('lim.region')}</div>
        <div>• {t('lim.soil', { soil: t('soil.' + profile.soil) })}</div>
        <div>• {t('lim.prev', { crop: t('crop.' + profile.prevCrop) })}</div>
        <div>• {t('lim.planned', { crop: t('crop.' + profile.plannedCrop) })}</div>
        {profile.noTill === 'unknown' && <div>• {t('lim.till')}</div>}

        <h3>{t('sum.evidence')}</h3>
        <div><SourceLinks ids={sourceIds} /></div>

        <h3>{t('sum.next')}</h3>
        <div>{next}</div>
        <div className="row">
          <button className="secondary" onClick={() => onGoto('agronomy')}>{t('nav.agronomy')}</button>
          <button className="secondary" onClick={() => onGoto('tasks')}>{t('nav.tasks')}</button>
        </div>
        <p className="muted">{t('sum.note')}</p>
      </div>

      {/* D. Automation status */}
      <div className="card">
        <h2>{t('dash.auto')}</h2>
        <div className="grid">
          <Info label={t('dash.activeRules')} value={`${activeRules} / ${rules.length}`} />
          <Info label={t('dash.lastRun')} value={executions[0] ? fmtTime(executions[0].at, lang) : t('dash.neverRun')} />
          <Info label={t('dash.completedRuns')} value={`${realRuns} / ${testRuns}`} />
          <Info label={t('dash.pendingTasks')} value={pending} />
        </div>
        <div className="row">
          <button className="secondary" onClick={() => onGoto('automation')}>{t('nav.automation')}</button>
        </div>
      </div>

      {/* E. Recent activity */}
      <div className="card">
        <h2>{t('dash.activity')}</h2>
        {activity.length === 0 && <p className="muted">{t('dash.noActivity')}</p>}
        {activity.map((a, i) => (
          <div key={i} className="note-line">
            {a.text}
            <div><small className="muted">{fmtTime(a.at, lang)}</small></div>
          </div>
        ))}
      </div>
    </>
  )
}