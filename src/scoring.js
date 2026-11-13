import { CRITERIA, ROTATIONS, NO_TILL } from './rotations.js'

export const DEFAULT_WEIGHTS = { moisture: 2, soil: 2, quality: 1 }

// Ranking by documented qualitative evidence, weighted by the farmer's priorities.
// adjust = extra weight added by climate rules (see adjustmentsFrom).
export function rank({ weights, noTill, adjust = {} }) {
  const w = {}
  for (const c of CRITERIA) w[c] = Number(weights[c] ?? 0) + Number(adjust[c] ?? 0)

  const list = ROTATIONS.map((r, order) => {
    let score = 0
    const rows = CRITERIA.map((c) => {
      const e = r.effects[c]
      const nt = noTill ? NO_TILL.effects[c] : null
      const sum = (e.value ?? 0) + (nt ? (nt.value ?? 0) : 0)
      score += w[c] * sum
      return { c, e, nt, sum, w: w[c] }
    })
    return { id: r.id, score, rows, order }
  })

  list.sort((a, b) => b.score - a.score || a.order - b.order)
  return list.map((x, i) => ({ ...x, position: i + 1 }))
}

// Only the dry rule has an adjustment, and it is an app assumption (documented in the UI).
// No heat-specific adjustment exists because our sources do not support one.
export function adjustmentsFrom(firedRuleIds) {
  const adjust = {}
  if (firedRuleIds.includes('dry-season')) adjust.moisture = 1
  return adjust
}

export function compareRankings(before, after) {
  const changes = []
  for (const a of after) {
    const b = before.find((x) => x.id === a.id)
    if (b && b.position !== a.position) changes.push({ id: a.id, from: b.position, to: a.position })
  }
  return { changed: changes.length > 0, changes }
}

export const minimal = (list) => list.map((x) => ({ id: x.id, position: x.position, score: x.score }))

// Live analysis from the current climate indicators and rule thresholds
export function currentAnalysis({ an, rules, weights, noTill }) {
  const dryRule = rules.find((r) => r.id === 'dry-season')
  const hotRule = rules.find((r) => r.id === 'hot-season')
  const flags = {
    dry: !!(an && dryRule && an.precipPct <= Number(dryRule.threshold)),
    hot: !!(an && hotRule && an.tempDiff >= Number(hotRule.threshold)),
  }
  const fired = []
  if (flags.dry && dryRule.enabled) fired.push('dry-season')
  if (flags.hot && hotRule.enabled) fired.push('hot-season')
  const adjust = adjustmentsFrom(fired)
  return {
    flags,
    adjust,
    base: rank({ weights, noTill }),
    ranking: rank({ weights, noTill, adjust }),
  }
}