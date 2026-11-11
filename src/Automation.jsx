import { useEffect, useState } from 'react'
import { DEFAULT_RULES, METRICS, runRules } from './automationEngine.js'

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage can be unavailable */
  }
}

export default function Automation({ an, fieldKey, source }) {
  const [rules, setRules] = useState(() => load('agro_rules', DEFAULT_RULES))
  const [tasks, setTasks] = useState(() => load('agro_tasks', []))
  const [notes, setNotes] = useState(() => load('agro_notes', []))
  const [log, setLog] = useState(() => load('agro_log', []))
  const [test, setTest] = useState(false)

  useEffect(() => { save('agro_rules', rules) }, [rules])
  useEffect(() => { save('agro_tasks', tasks) }, [tasks])
  useEffect(() => { save('agro_notes', notes) }, [notes])
  useEffect(() => { save('agro_log', log) }, [log])

  const updateRule = (id, patch) =>
    setRules(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const setStatus = (id, status) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)))

  const run = () => {
    if (!an) return
    const res = runRules({
      rules,
      anomaly: an,
      fieldKey,
      source,
      test,
      existingKeys: tasks.map((t) => t.key),
    })
    setTasks([...res.tasks, ...tasks])
    setNotes([...res.notifications, ...notes])
    setLog([...res.log, ...log].slice(0, 100))
  }

  const reset = () => {
    setTasks([])
    setNotes([])
    setLog([])
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h2>Automation</h2>

      <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 6 }}>
        <b>Rules (IF condition THEN create task and notification)</b>
        {rules.map((r) => (
          <div key={r.id} style={{ marginTop: 6 }}>
            <label>
              <input
                type="checkbox"
                checked={r.enabled}
                onChange={(e) => updateRule(r.id, { enabled: e.target.checked })}
              />{' '}
              <b>{r.name}</b>: if {METRICS[r.metric].label} {r.op}{' '}
            </label>
            <input
              type="number"
              value={r.threshold}
              onChange={(e) => updateRule(r.id, { threshold: e.target.value })}
              style={{ width: 70 }}
            />{' '}
            <small>(threshold is our assumption)</small>
          </div>
        ))}

        <div style={{ marginTop: 10 }}>
          <button onClick={run} disabled={!an}>Run automation now</button>{' '}
          <label>
            <input type="checkbox" checked={test} onChange={(e) => setTest(e.target.checked)} />{' '}
            Run as TEST scenario (simulated dry and hot season, not real data)
          </label>{' '}
          <button onClick={reset}>Clear history</button>
        </div>
        {!an && <p>Load NASA data first.</p>}
      </div>

      <h3>Tasks</h3>
      {tasks.length === 0 && <p>No tasks yet.</p>}
      {tasks.map((t) => (
        <div key={t.id} style={{ border: '1px solid #ccc', borderRadius: 6, padding: 10, marginBottom: 8 }}>
          <b>{t.test ? '[TEST] ' : ''}{t.title}</b> ({t.status})
          <div>{t.text}</div>
          <small>Created by rule "{t.ruleName}" at {t.createdAt}</small>
          {t.status === 'pending' && (
            <div style={{ marginTop: 6 }}>
              <button onClick={() => setStatus(t.id, 'approved')}>Approve</button>{' '}
              <button onClick={() => setStatus(t.id, 'rejected')}>Reject</button>
            </div>
          )}
        </div>
      ))}
      <small>
        Approving only marks the task as accepted by the farmer. The app never changes planting
        decisions or controls equipment.
      </small>

      <h3>Notifications</h3>
      {notes.length === 0 && <p>No notifications yet.</p>}
      {notes.map((n) => (
        <div key={n.id} style={{ borderLeft: '4px solid #1971c2', padding: '4px 10px', marginBottom: 8 }}>
          <b>{n.test ? '[TEST] ' : ''}{n.message}</b>
          <div><small>Field: {n.field} | Data: {n.source} | {n.createdAt}</small></div>
          <div><small>Next step: {n.nextStep}</small></div>
        </div>
      ))}

      <h3>Execution history</h3>
      {log.length === 0 && <p>Nothing has run yet.</p>}
      {log.map((l, i) => (
        <div key={i}>
          <small>{l.at} | {l.rule} | {l.result}</small>
        </div>
      ))}
    </div>
  )
}