import { useT } from './i18n.jsx'
import { EvidenceBadge, SourceLinks } from './ui.jsx'
import { CRITERIA } from './rotations.js'

export default function Agronomy({ analysis, weights, setWeights, profile, hasClimate }) {
  const { t } = useT()
  const noTill = profile.noTill === 'yes'

  return (
    <div className="card">
      <h2>{t('agro.title')}</h2>
      {!hasClimate && <div className="notice">{t('agro.noClimate')}</div>}

      <div className="panel">
        <b>{t('agro.weights')}</b>
        {CRITERIA.map((c) => (
          <div key={c} style={{ marginTop: 6 }}>
            <label>
              {t('criteria.' + c)}:{' '}
              <input
                type="number"
                min="0"
                max="3"
                value={weights[c]}
                onChange={(e) => setWeights({ ...weights, [c]: Number(e.target.value) })}
                style={{ width: 60 }}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="panel">
        <b>{t('agro.profileUsed')}</b>
        <div>{t('field.soil')}: {t('soil.' + profile.soil)}</div>
        <div>{t('field.prevCrop')}: {t('crop.' + profile.prevCrop)}</div>
        <div>{t('field.plannedCrop')}: {t('crop.' + profile.plannedCrop)}</div>
        <div>{t('agro.tillLine', { value: t('tillage.' + profile.noTill) })}</div>
        <small className="muted">
          {noTill ? t('agro.tillApplied') : profile.noTill === 'unknown' ? t('lim.till') : t('agro.tillNot')}
        </small>
        <div className="muted" style={{ marginTop: 6 }}>
          <div>• {t('lim.soil', { soil: t('soil.' + profile.soil) })}</div>
          <div>• {t('lim.prev', { crop: t('crop.' + profile.prevCrop) })}</div>
          <div>• {t('lim.planned', { crop: t('crop.' + profile.plannedCrop) })}</div>
        </div>
      </div>

      <div className="panel">
        <b>{t('agro.adjust')}</b>
        {analysis.adjust.moisture ? <div>{t('adj.dry')}</div> : null}
        {analysis.flags.hot && <div>{t('adj.hot')}</div>}
        {!analysis.adjust.moisture && !analysis.flags.hot && <div>{t('adj.none')}</div>}
      </div>

      {analysis.ranking.map((r) => (
        <div key={r.id} className={r.position === 1 ? 'rank-card first' : 'rank-card'}>
          <b>#{r.position} {t('rot.' + r.id)}</b>{' '}
          <span className="badge ok">{t('agro.scoreLabel')} {r.score}</span>
          {r.rows.map((row) => (
            <div key={row.c} className="criterion">
              <b>{t('criteria.' + row.c)}</b> <EvidenceBadge value={row.e.value} />
              <div>{t(row.e.noteKey)} <SourceLinks ids={row.e.sources} /></div>
              {row.nt && (
                <div style={{ marginLeft: 16 }}>
                  <b>{t('agro.noTillTitle')}</b> <EvidenceBadge value={row.nt.value} />
                  <div>{t(row.nt.noteKey)} <SourceLinks ids={row.nt.sources} /></div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      <p className="muted">{t('agro.scale')}</p>
    </div>
  )
}