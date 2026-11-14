import { SOURCES } from './rotations.js'
import { useT } from './i18n.jsx'
import { tr } from './extraText.js'

export function SourceLinks({ ids }) {
  return ids.map((id) => (
    <a key={id} href={SOURCES[id].url} target="_blank" rel="noreferrer" style={{ marginLeft: 6 }}>
      [{SOURCES[id].label.split(',')[0]}]
    </a>
  ))
}

export function evidenceInfo(value) {
  if (value === null || value === undefined) return { key: 'ev.none', cls: 'badge muted-badge', sym: '?' }
  if (value > 0) return { key: 'ev.fav', cls: 'badge ok', sym: '+' }
  if (value < 0) return { key: 'ev.unfav', cls: 'badge bad', sym: '−' }
  return { key: 'ev.mixed', cls: 'badge warn', sym: '~' }
}

export function EvidenceBadge({ value }) {
  const { t } = useT()
  const i = evidenceInfo(value)
  return (
    <span className={i.cls}>
      {i.sym} {t(i.key)}
    </span>
  )
}

export const opSym = (op) => (op === '<=' ? '≤' : '≥')
export const signed = (n) => (n > 0 ? '+' + n : String(n))

export function fmtTime(iso, lang) {
  const loc = lang === 'kz' ? 'kk-KZ' : lang === 'ru' ? 'ru-RU' : 'en-GB'
  return new Date(iso).toLocaleString(loc)
}

export function describeTask(t, task) {
  const p = task.payload
  const list = (p.changes || [])
    .map((c) => t('task.change', { name: t('rot.' + c.id), from: c.from, to: c.to }))
    .join('; ')
  const analysis = (p.changes || []).length
    ? t('task.analysis.changed', { list })
    : t('task.analysis.same')

  if (task.kind === 'rotation-analysis') {
    return {
      title: tr(t, 'task.title.rotation-analysis'),
      body: tr(t, 'task.body.rotation-analysis', { from: t('rot.' + p.from), to: t('rot.' + p.to) }),
      analysis,
      reason: tr(t, 'task.reason.rotation-analysis'),
      next: t('task.next'),
    }
  }

  return {
    title: t('task.title.' + task.kind),
    body: t('task.body.' + task.kind, {
      year: p.year,
      value: signed(p.value),
      op: opSym(p.op),
      threshold: signed(p.threshold),
    }),
    analysis,
    reason: t('task.reason.' + task.kind),
    next: t('task.next'),
  }
}

export function describeNote(t, n) {
  if (n.kind === 'rotation-analysis') {
    return {
      message: tr(t, 'nt.rank', {
        rule: tr(t, 'rule.rotation-analysis.name'),
        from: t('rot.' + n.payload.from),
        to: t('rot.' + n.payload.to),
      }),
    }
  }
  return {
    message: t('nt.msg', {
      rule: t('rule.' + n.kind + '.name'),
      metric: t('metric.' + n.payload.metric),
      value: signed(n.payload.value),
      op: opSym(n.payload.op),
      threshold: signed(n.payload.threshold),
    }),
  }
}

export function ruleLine(t, rr) {
  const name = tr(t, 'rule.' + rr.ruleId + '.name')

  if (rr.ruleId === 'rotation-analysis') {
    const d = rr.detail || {}
    if (rr.status === 'disabled') return t('hist.disabled', { rule: name })
    if (rr.status === 'baseline') return tr(t, 'hist.baseline', { rule: name })
    if (rr.status === 'met') return tr(t, 'hist.rankChanged', { rule: name, from: t('rot.' + d.from), to: t('rot.' + d.to) })
    if (rr.status === 'duplicate') return tr(t, 'hist.rankDuplicate', { rule: name })
    return tr(t, 'hist.rankSame', { rule: name, name: t('rot.' + d.to) })
  }

  const key = { met: 'hist.met', not_met: 'hist.notMet', disabled: 'hist.disabled', duplicate: 'hist.duplicate' }[rr.status]
  return t(key, {
    rule: name,
    metric: t('metric.' + rr.metric),
    value: signed(rr.value),
    op: opSym(rr.op),
    threshold: signed(rr.threshold),
  })
}