import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { fetchClimate } from './nasa.js'
import Recommendations from './Recommendations.jsx'
import Automation from './Automation.jsx'
import RiskProfile from './RiskProfile.jsx'

const BASE_START = 1991
const BASE_END = 2020
const SEASON_DAYS = 123 // май-август: 31 + 30 + 31 + 31
const TABS = ['Dashboard', 'Climate', 'Agronomy', 'Automation']

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Средние температура и осадки за май-август по годам (только полные годы)
function seasonSummary(rows) {
  const years = {}
  for (const r of rows) {
    if (r.month < 5 || r.month > 8) continue
    if (r.temp === null || r.precip === null) continue
    if (!years[r.year]) years[r.year] = { t: 0, p: 0, n: 0 }
    years[r.year].t += r.temp
    years[r.year].p += r.precip
    years[r.year].n += 1
  }
  return Object.entries(years)
    .filter(([, v]) => v.n === 4)
    .map(([year, v]) => ({
      year: Number(year),
      temp: +(v.t / v.n).toFixed(2),
      precip: +(v.p / v.n).toFixed(2),
    }))
}

// Отклонение последнего сезона от нормы за базовый период
function anomaly(summary) {
  const base = summary.filter((s) => s.year >= BASE_START && s.year <= BASE_END)
  if (base.length < 25 || summary.length === 0) return null
  const meanP = base.reduce((a, s) => a + s.precip, 0) / base.length
  const meanT = base.reduce((a, s) => a + s.temp, 0) / base.length
  const last = summary[summary.length - 1]
  return {
    year: last.year,
    precip: last.precip,
    meanPrecip: +meanP.toFixed(2),
    precipPct: +(((last.precip - meanP) / meanP) * 100).toFixed(1),
    temp: last.temp,
    meanTemp: +meanT.toFixed(2),
    tempDiff: +(last.temp - meanT).toFixed(2),
    baseYears: base.length,
  }
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

const signed = (n) => (n > 0 ? '+' + n : String(n))

function SeasonStats({ an, data }) {
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
  const testChecks = log.filter((l) => l.test === true || l.result.includes('[TEST scenario]')).length
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

function NoData() {
  return (
    <div className="card">
      <p>
        Load NASA data first: open the Dashboard tab, choose your field and press
        "Load NASA POWER data".
      </p>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('Dashboard')
  const [lat, setLat] = useState(() => readLS('agro_lat', ''))
  const [lon, setLon] = useState(() => readLS('agro_lon', ''))
  const [data, setData] = useState(() => readLS('agro_data', null))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { writeLS('agro_lat', lat) }, [lat])
  useEffect(() => { writeLS('agro_lon', lon) }, [lon])
  useEffect(() => { if (data) writeLS('agro_data', data) }, [data])

  const valid =
    lat !== '' &&
    lon !== '' &&
    !isNaN(Number(lat)) &&
    !isNaN(Number(lon)) &&
    Math.abs(Number(lat)) <= 90 &&
    Math.abs(Number(lon)) <= 180

  const pick = (la, lo) => {
    setLat(la.toFixed(4))
    setLon(lo.toFixed(4))
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not available in this browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => pick(pos.coords.latitude, pos.coords.longitude),
      () => setError('Could not get your location. Enter coordinates manually.')
    )
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const d = await fetchClimate(Number(lat).toFixed(4), Number(lon).toFixed(4), 1991, 2026)
      setData(d)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const summary = data ? seasonSummary(data.rows) : []
  const an = data ? anomaly(summary) : null

  return (
    <div className="app">
      <header className="header">
        <h1>AgroShield AI</h1>
        <p>Climate-based crop rotation decision support using NASA POWER data</p>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t} className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>

      {tab === 'Dashboard' && (
        <>
          <div className="card">
            <h2>1. Choose your field</h2>
            <p className="muted">Click the map or enter GPS coordinates, then load NASA climate data.</p>

            <MapContainer center={[54.87, 69.15]} zoom={6} style={{ height: 340 }}>
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickHandler onPick={pick} />
              {valid && <CircleMarker center={[Number(lat), Number(lon)]} radius={8} />}
            </MapContainer>

            <div className="row">
              <label>
                Latitude{' '}
                <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="54.8700" style={{ width: 110 }} />
              </label>
              <label>
                Longitude{' '}
                <input value={lon} onChange={(e) => setLon(e.target.value)} placeholder="69.1500" style={{ width: 110 }} />
              </label>
              <button onClick={useMyLocation}>Use my location</button>
              <button onClick={load} disabled={!valid || loading}>
                {loading ? 'Loading...' : 'Load NASA POWER data'}
              </button>
            </div>
            {error && <p className="error">{error}</p>}
            {data && (
              <p className="muted">
                Saved data in this browser was loaded at {new Date(data.retrievedAt).toLocaleString()}.
                Press "Load NASA POWER data" to refresh it.
              </p>
            )}
          </div>

          {data && an && <SeasonStats an={an} data={data} />}
          {data && !an && (
            <div className="card">
              <p>Not enough complete years to compute the anomaly.</p>
            </div>
          )}
        </>
      )}

      {tab === 'Climate' &&
        (data ? (
          <div className="card">
            <h2>Climate intelligence</h2>
            <h3>May-August averages by year (assumed growing season)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={summary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="temp" name="Temperature (°C)" stroke="#d9480f" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="precip" name="Precipitation (mm/day)" stroke="#1971c2" dot={false} />
              </LineChart>
            </ResponsiveContainer>

            {an ? (
              <div style={{ background: '#f1f3f5', padding: 12, borderRadius: 8, marginTop: 12 }}>
                <b>Season {an.year} vs normal ({BASE_START}-{BASE_END}, {an.baseYears} years)</b>
                <p>
                  Precipitation: {an.precip} mm/day (about {(an.precip * SEASON_DAYS).toFixed(0)} mm over the season)
                  vs normal {an.meanPrecip} mm/day:{' '}
                  <b>{an.precipPct > 0 ? '+' : ''}{an.precipPct}%</b>
                </p>
                <p>
                  Temperature: {an.temp} °C vs normal {an.meanTemp} °C:{' '}
                  <b>{an.tempDiff > 0 ? '+' : ''}{an.tempDiff} °C</b>
                </p>
                <small>
                  Simple anomaly = (season value - mean of baseline years) / mean. This describes the
                  climate of the NASA grid cell around your point, not your exact field.
                </small>
              </div>
            ) : (
              <p>Not enough data to compute the anomaly.</p>
            )}

            <RiskProfile summary={summary} />

            <p className="muted">
              Source: {data.source}. Retrieved: {data.retrievedAt}
            </p>
          </div>
        ) : (
          <NoData />
        ))}

      {tab === 'Agronomy' &&
        (data ? (
          <div className="card">
            <Recommendations an={an} />
          </div>
        ) : (
          <NoData />
        ))}

      {tab === 'Automation' && (
        <div className="card">
          <Automation
            an={an}
            fieldKey={`${lat},${lon}`}
            source={data ? `NASA POWER, retrieved ${data.retrievedAt}` : ''}
          />
        </div>
      )}

      <div className="footer">
        AgroShield AI is a decision-support prototype, not a yield forecast. Data: NASA POWER.
      </div>
    </div>
  )
}