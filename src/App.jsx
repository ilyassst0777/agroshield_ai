import { useState, useEffect, useRef } from 'react'
import { LangProvider, useT } from './i18n.jsx'
import { setExtraLang } from './extraText.js'
import { fetchClimate } from './nasa.js'
import { seasonSummary, anomaly, dataCheck, REQUEST_END_YEAR } from './climate.js'
import { DEFAULT_WEIGHTS, currentAnalysis } from './scoring.js'
import { DEFAULT_RULES, runAutomation } from './automationEngine.js'
import Dashboard from './Dashboard.jsx'
import FieldProfile from './FieldProfile.jsx'
import Climate from './Climate.jsx'
import Agronomy from './Agronomy.jsx'
import Automation from './Automation.jsx'
import TasksNotifications from './TasksNotifications.jsx'

const TABS = [
  { id: 'dashboard', icon: '🏠' },
  { id: 'climate', icon: '🌡️' },
  { id: 'agronomy', icon: '🌾' },
  { id: 'automation', icon: '⚙️' },
  { id: 'tasks', icon: '✅' },
]
const LANGS = [
  { id: 'en', label: 'EN' },
  { id: 'ru', label: 'RU' },
  { id: 'kz', label: 'KZ' },
]
const DEFAULT_PROFILE = {
  name: '',
  lat: '54.8700', // Petropavlovsk
  lon: '69.1500',
  soil: 'unknown',
  prevCrop: 'unknown',
  plannedCrop: 'unknown',
  noTill: 'unknown',
}

function readLS(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage can be unavailable */
  }
}

function loadProfile() {
  const saved = readLS('agro2_profile', null)
  if (saved) return { ...DEFAULT_PROFILE, ...saved }
  return {
    ...DEFAULT_PROFILE,
    lat: readLS('agro_lat', '') || DEFAULT_PROFILE.lat,
    lon: readLS('agro_lon', '') || DEFAULT_PROFILE.lon,
  }
}

function loadRules() {
  const saved = readLS('agro2_rules', [])
  return DEFAULT_RULES.map((d) => {
    const s = saved.find((x) => x.id === d.id)
    if (!s) return d
    return d.type === 'ranking' ? { ...d, enabled: s.enabled } : { ...d, enabled: s.enabled, threshold: s.threshold }
  })
}

function Shell() {
  const { t, lang, setLang } = useT()
  setExtraLang(lang)

  const [tab, setTab] = useState('dashboard')
  const [profile, setProfile] = useState(loadProfile)
  const [data, setData] = useState(() => readLS('agro_data', null))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rules, setRules] = useState(loadRules)
  const [weights, setWeights] = useState(() => readLS('agro2_weights', DEFAULT_WEIGHTS))
  const [tasks, setTasks] = useState(() => readLS('agro2_tasks', []))
  const [notes, setNotes] = useState(() => readLS('agro2_notes', []))
  const [executions, setExecutions] = useState(() => readLS('agro2_execs', []))
  const autoLoaded = useRef(false)

  useEffect(() => { writeLS('agro2_profile', profile) }, [profile])
  useEffect(() => { if (data) writeLS('agro_data', data) }, [data])
  useEffect(() => { writeLS('agro2_rules', rules) }, [rules])
  useEffect(() => { writeLS('agro2_weights', weights) }, [weights])
  useEffect(() => { writeLS('agro2_tasks', tasks) }, [tasks])
  useEffect(() => { writeLS('agro2_notes', notes) }, [notes])
  useEffect(() => { writeLS('agro2_execs', executions) }, [executions])
  useEffect(() => { document.documentElement.lang = lang === 'kz' ? 'kk' : lang }, [lang])

  const valid =
    profile.lat !== '' &&
    profile.lon !== '' &&
    !isNaN(Number(profile.lat)) &&
    !isNaN(Number(profile.lon)) &&
    Math.abs(Number(profile.lat)) <= 90 &&
    Math.abs(Number(profile.lon)) <= 180

  const load = async () => {
    if (!valid) {
      setError({ key: 'err.coords' })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const d = await fetchClimate(Number(profile.lat).toFixed(4), Number(profile.lon).toFixed(4), 1991, REQUEST_END_YEAR)
      setData(d)
    } catch (e) {
      setError({ key: 'err.nasa', params: { msg: e.message } })
    }
    setLoading(false)
  }

  // First visit: load NASA data automatically if none is saved
  useEffect(() => {
    if (autoLoaded.current) return
    autoLoaded.current = true
    if (!data && valid) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const summary = data ? seasonSummary(data.rows) : []
  const an = data ? anomaly(summary) : null
  const check = data ? dataCheck(data.rows, summary) : null
  const noTill = profile.noTill === 'yes'
  const analysis = currentAnalysis({ an, rules, weights, noTill })
  const mismatch =
    !!data &&
    data.lat !== undefined &&
    valid &&
    (Math.abs(data.lat - Number(profile.lat)) > 0.0001 || Math.abs(data.lon - Number(profile.lon)) > 0.0001)
  const fieldKey = `${profile.lat},${profile.lon}`
  const lastExec = executions.find((e) => e.status !== 'failed') || null

  const runNow = (test) => {
    try {
      if (!test && !an) throw new Error(t('err.noData'))
      const prev = executions.find(
        (e) => e.test === test && e.status !== 'failed' && e.ranking && e.ranking.after && e.ranking.after.length
      )
      const res = runAutomation({
        rules,
        an,
        weights,
        noTill,
        test,
        existingKeys: tasks.map((x) => x.key),
        fieldKey,
        retrievedAt: data ? data.retrievedAt : null,
        previous: prev ? prev.ranking.after : null,
      })
      setTasks([...res.tasks, ...tasks])
      setNotes([...res.notifications, ...notes])
      setExecutions([res.execution, ...executions].slice(0, 50))
    } catch (e) {
      const failed = {
        id: 'ex-' + Date.now().toString(36),
        at: new Date().toISOString(),
        trigger: 'manual',
        test,
        status: 'failed',
        field: fieldKey,
        inputs: null,
        ruleResults: [],
        assumptions: { weights, noTill, adjustments: {} },
        ranking: { before: [], after: [], changes: [] },
        taskIds: [],
        notificationIds: [],
        error: e.message,
      }
      setExecutions([failed, ...executions].slice(0, 50))
    }
  }

  const clearHistory = () => {
    setTasks([])
    setNotes([])
    setExecutions([])
  }

  const setTaskStatus = (id, status) => setTasks(tasks.map((x) => (x.id === id ? { ...x, status } : x)))

  const loadPrompt = (
    <div className="card">
      <p>{loading ? t('common.loading') : t('dash.noData')}</p>
      {error && <p className="error">{t(error.key, error.params)}</p>}
      <button onClick={load} disabled={!valid || loading}>{t('field.load')}</button>
    </div>
  )

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>AgroShield AI</h1>
          <p>{t('app.tagline')}</p>
        </div>
        <div className="langs" aria-label={t('lang.label')}>
          {LANGS.map((l) => (
            <button key={l.id} className={l.id === lang ? 'active' : ''} onClick={() => setLang(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((x) => (
          <button key={x.id} className={x.id === tab ? 'active' : ''} onClick={() => setTab(x.id)}>
            {x.icon} {t('nav.' + x.id)}
          </button>
        ))}
      </nav>

      {tab === 'dashboard' && (
        <>
          <Dashboard
            profile={profile}
            an={an}
            data={data}
            analysis={analysis}
            rules={rules}
            tasks={tasks}
            notes={notes}
            executions={executions}
            mismatch={mismatch}
            onGoto={setTab}
            onReload={load}
          />
          <FieldProfile
            profile={profile}
            setProfile={setProfile}
            valid={valid}
            loading={loading}
            error={error}
            setError={setError}
            onLoad={load}
          />
        </>
      )}

      {tab === 'climate' &&
        (data ? <Climate summary={summary} an={an} data={data} check={check} rules={rules} profile={profile} /> : loadPrompt)}

      {tab === 'agronomy' && (
        <Agronomy
          analysis={analysis}
          weights={weights}
          setWeights={setWeights}
          profile={profile}
          hasClimate={!!an}
          lastExec={lastExec}
        />
      )}

      {tab === 'automation' && (
        <Automation
          rules={rules}
          setRules={setRules}
          an={an}
          hasData={!!data}
          executions={executions}
          tasks={tasks}
          setTaskStatus={setTaskStatus}
          onRun={runNow}
          onClear={clearHistory}
        />
      )}

      {tab === 'tasks' && <TasksNotifications tasks={tasks} notes={notes} setTaskStatus={setTaskStatus} />}

      <div className="footer">{t('app.footer')}</div>
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <Shell />
    </LangProvider>
  )
}