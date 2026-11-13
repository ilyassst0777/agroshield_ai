import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useT } from './i18n.jsx'

const SOILS = ['chernozem', 'kastanozem', 'other', 'unknown']
const CROPS = ['wheat', 'barley', 'dryPea', 'legumes', 'fallow', 'other', 'unknown']
const TILL = ['yes', 'no', 'unknown']

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function FieldProfile({ profile, setProfile, valid, loading, error, setError, onLoad }) {
  const { t } = useT()

  const set = (key, value) => setProfile({ ...profile, [key]: value })
  const pick = (la, lo) => setProfile({ ...profile, lat: la.toFixed(4), lon: lo.toFixed(4) })

  const locate = () => {
    if (!navigator.geolocation) {
      setError({ key: 'err.geo' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => pick(pos.coords.latitude, pos.coords.longitude),
      () => setError({ key: 'err.geoDenied' })
    )
  }

  const select = (value, options, prefix, onChange) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o} value={o}>
          {t(prefix + o)}
        </option>
      ))}
    </select>
  )

  return (
    <div className="card">
      <h2>{t('field.title')}</h2>
      <p className="muted">{t('field.hint')}</p>

      <MapContainer center={[54.87, 69.15]} zoom={6} style={{ height: 320 }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={pick} />
        {valid && <CircleMarker center={[Number(profile.lat), Number(profile.lon)]} radius={8} />}
      </MapContainer>

      <div className="form-grid">
        <label>
          {t('field.name')}
          <input value={profile.name} placeholder={t('field.defaultName')} onChange={(e) => set('name', e.target.value)} />
        </label>
        <label>
          {t('field.lat')}
          <input value={profile.lat} onChange={(e) => set('lat', e.target.value)} placeholder="54.8700" />
        </label>
        <label>
          {t('field.lon')}
          <input value={profile.lon} onChange={(e) => set('lon', e.target.value)} placeholder="69.1500" />
        </label>
        <label>
          {t('field.soil')}
          {select(profile.soil, SOILS, 'soil.', (v) => set('soil', v))}
        </label>
        <label>
          {t('field.prevCrop')}
          {select(profile.prevCrop, CROPS, 'crop.', (v) => set('prevCrop', v))}
        </label>
        <label>
          {t('field.plannedCrop')}
          {select(profile.plannedCrop, CROPS, 'crop.', (v) => set('plannedCrop', v))}
        </label>
        <label>
          {t('field.noTill')}
          {select(profile.noTill, TILL, 'tillage.', (v) => set('noTill', v))}
        </label>
      </div>
      <p className="muted">{t('field.hint2')}</p>

      <div className="row">
        <button className="secondary" onClick={locate}>
          {t('field.useLocation')}
        </button>
        <button onClick={onLoad} disabled={!valid || loading}>
          {loading ? t('common.loading') : t('field.load')}
        </button>
      </div>
      {error && <p className="error">{t(error.key, error.params)}</p>}
    </div>
  )
}