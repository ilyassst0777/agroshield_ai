import { useT } from './i18n.jsx'
import { tr } from './extraText.js'
import { fmtTime, opSym, ruleLine, signed } from './ui.jsx'
import TaskCard from './TaskCard.jsx'

export default function Automation({
  rules, setRules, an, hasData, executions, tasks, setTaskStatus, onRun, onClear,
}) {
  const { t, lang } = useT()

  const updateRule = (id, patch) => setRules(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const okRuns = executions.filter((e) => e.status !== 'failed')
  const realRuns = okRuns.filter((e) => !e.test).length
  const testRuns = okRuns.filter((e) => e.test).length

  return (
    <div className="card">
      <h2>{t('auto.title')}</h2>

      <div className="grid">
        <div className="stat">
          <div className="label">{t('auto.active')}</div>
          <div className="value">{rules.filter((r) => r.enabled).length} / {rules.length}</div>
        </div>
        <div className="stat">
          <div className="label">{t('auto.pending')}</div>
          <div className="value">{tasks.filter((x) => x.status === 'pending').length}</div>
        </div>
        <div className="stat">
          <div className="label">{t('auto.checks')}</div>
          <div className="value">{realRuns} / {testRuns}</div>
        </div>
        <div className="stat">
          <div className="label">{t('auto.data')}</div>
          <div className="value small">{hasData && an ? t('auto.dataLoaded', { year: an.year }) : t('auto.dataNone')}</div>
        </div>
      </div>
      <p className="muted">{t('auto.intro')}</p>

      <h3>{t('auto.rules')}</h3>
      {rules.map((r) => {
        const isRank = r.type === 'ranking'
        const lastExec = executions.find((e) => e.ruleResults.some((x) => x.ruleId === r.id))
        const lastRes = lastExec ? lastExec.ruleResults.find((x) => x.ruleId === r.id) : null
        return (
          <div key={r.id} className="rule-card">
            <div className="row" style={{ margin: 0 }}>
              <b>{tr(t, 'rule.' + r.id + '.name')}</b>
              <span className={r.enabled ? 'badge ok' : 'badge warn'}>
                {r.enabled ? t('auto.enabled') : t('auto.disabled')}
              </span>
              <label>
                <input type="checkbox" checked={r.enabled} onChange={(e) => updateRule(r.id, { enabled: e.target.checked })} />{' '}
                {t('auto.enable')}
              </label>
            </div>
            <div className="muted">{tr(t, 'rule.' + r.id + '.desc')}</div>
            <div>{t('auto.trigger')}</div>
            {isRank ? (
              <div>
                <b>{t('auto.condition')}:</b> {tr(t, 'rule.rotation-analysis.cond')}
              </div>
            ) : (
              <div>
                <b>{t('auto.condition')}:</b> {t('metric.' + r.metric)} {opSym(r.op)}{' '}
                <input
                  type="number"
                  step="0.1"
                  value={r.threshold}
                  onChange={(e) => updateRule(r.id, { threshold: e.target.value })}
                  style={{ width: 80 }}
                />{' '}
                <small className="muted">{t('auto.assumption')}</small>
              </div>
            )}
            <div>{t('auto.action')}</div>
            <div className="muted">
              <b>{t('auto.last')}:</b>{' '}
              {lastExec && lastRes
                ? `${fmtTime(lastExec.at, lang)} ${lastExec.test ? '[' + t('common.test') + '] ' : ''}— ${ruleLine(t, lastRes)}`
                : t('auto.never')}
            </div>
          </div>
        )
      })}

      <div className="row">
        <button onClick={() => onRun(false)} disabled={!an}>{t('auto.runReal')}</button>
        <button className="secondary" onClick={() => onRun(true)}>{t('auto.runTest')}</button>
        <button className="danger" onClick={onClear}>{t('auto.clear')}</button>
      </div>
      <small className="muted">{t('auto.testNote')}</small>

      <h3>{tr(t, 'auto.tasks')}</h3>
      {tasks.length === 0 && <p className="muted">{t('tasks.none')}</p>}
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} setTaskStatus={setTaskStatus} />
      ))}
      <p className="muted">{t('tasks.safety')}</p>

      <h3>{t('auto.history')}</h3>
      {executions.length === 0 && <p className="muted">{t('auto.noHistory')}</p>}
      {executions.map((e) => (
        <details key={e.id} className="exec">
          <summary>
            <span className={e.test ? 'badge warn' : 'badge ok'}>{e.test ? t('common.test') : t('common.real')}</span>{' '}
            <b>{t('hist.status.' + e.status)}</b>{' '}
            <small className="muted">{fmtTime(e.at, lang)} | {e.id}</small>
          </summary>
          <div className="exec-body">
            {e.status === 'failed' ? (
              <div className="error">{t('hist.error', { msg: e.error })}</div>
            ) : (
              <>
                <div>
                  <b>{t('auto.inputs')}:</b>{' '}
                  {t('auto.inputsLine', { year: e.inputs.year, p: signed(e.inputs.precipPct), tt: signed(e.inputs.tempDiff) })}
                  {e.test && <> <span className="badge warn">{t('auto.simulated')}</span></>}
                </div>
                {e.ruleResults.map((rr) => (
                  <div key={rr.ruleId}>• {ruleLine(t, rr)}</div>
                ))}
                <div>
                  <b>{t('auto.ranking')}</b>
                </div>
                <div>
                  {t('auto.before')}: {e.ranking.before.map((x) => `#${x.position} ${t('rot.' + x.id)} (${x.score})`).join('; ')}
                </div>
                <div>
                  {t('auto.after')}: {e.ranking.after.map((x) => `#${x.position} ${t('rot.' + x.id)} (${x.score})`).join('; ')}
                </div>
                <div>
                  <b>{t('auto.changes')}:</b>{' '}
                  {e.ranking.changes.length
                    ? e.ranking.changes.map((c) => t('task.change', { name: t('rot.' + c.id), from: c.from, to: c.to })).join('; ')
                    : t('auto.noChanges')}
                </div>
                <div>{t('hist.tasks', { n: e.taskIds.length })}</div>
                <div className="muted">
                  {t('auto.assump', {
                    w: `${e.assumptions.weights.moisture}/${e.assumptions.weights.soil}/${e.assumptions.weights.quality}`,
                    nt: e.assumptions.noTill ? t('tillage.yes') : t('tillage.no'),
                    adj: Object.keys(e.assumptions.adjustments).length
                      ? Object.entries(e.assumptions.adjustments).map(([k, v]) => `${t('criteria.' + k)} +${v}`).join(', ')
                      : t('auto.adjNone'),
                  })}
                </div>
              </>
            )}
          </div>
        </details>
      ))}
    </div>
  )
}