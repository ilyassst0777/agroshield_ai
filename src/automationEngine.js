import { rank, adjustmentsFrom, compareRankings, minimal } from './scoring.js'

// Thresholds are our assumptions, not values from the sources.
export const DEFAULT_RULES = [
  { id: 'dry-season', enabled: true, metric: 'precipPct', op: '<=', threshold: -15, priority: 'high' },
  { id: 'hot-season', enabled: true, metric: 'tempDiff', op: '>=', threshold: 1.5, priority: 'medium' },
  { id: 'rotation-analysis', type: 'ranking', enabled: true, priority: 'medium' },
]

export const SIMULATED = { precipPct: -30, tempDiff: 2.5 }

const meets = (value, op, threshold) => (op === '<=' ? value <= threshold : value >= threshold)
const uid = () => 'ex-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// TRIGGER (manual) -> CONDITION (threshold / ranking change) -> ACTION (re-rank, task, notification) -> RESULT (execution record)
// previous = ranking.after of the previous execution of the same mode (or null)
export function runAutomation({ rules, an, weights, noTill, test, existingKeys, fieldKey, retrievedAt, previous }) {
  const now = new Date().toISOString()
  const input = test
    ? { year: an ? an.year : 'demo', precipPct: SIMULATED.precipPct, tempDiff: SIMULATED.tempDiff }
    : { year: an.year, precipPct: an.precipPct, tempDiff: an.tempDiff }
  const mode = test ? 'test' : 'real'
  const execId = uid()
  const before = rank({ weights, noTill })
  const ruleResults = []
  const tasks = []
  const notifications = []
  const firedIds = []

  for (const rule of rules) {
    if (rule.type === 'ranking') continue

    const value = input[rule.metric]
    const threshold = Number(rule.threshold)
    const base = { ruleId: rule.id, metric: rule.metric, op: rule.op, value, threshold }

    if (!rule.enabled) {
      ruleResults.push({ ...base, status: 'disabled' })
      continue
    }
    if (!meets(value, rule.op, threshold)) {
      ruleResults.push({ ...base, status: 'not_met' })
      continue
    }

    firedIds.push(rule.id)
    const key = `${rule.id}|${fieldKey}|${input.year}|${mode}`
    if (existingKeys.includes(key)) {
      ruleResults.push({ ...base, status: 'duplicate' })
      continue
    }

    const adjust = adjustmentsFrom([rule.id])
    const after = rank({ weights, noTill, adjust })
    const cmp = compareRankings(before, after)

    ruleResults.push({ ...base, status: 'met' })
    tasks.push({
      id: key,
      key,
      kind: rule.id,
      priority: rule.priority,
      status: 'pending',
      test,
      createdAt: now,
      execId,
      payload: {
        year: input.year,
        value,
        op: rule.op,
        threshold,
        metric: rule.metric,
        changes: cmp.changes,
        adjusted: Object.keys(adjust).length > 0,
      },
    })
    notifications.push({
      id: 'n|' + key,
      key,
      kind: rule.id,
      test,
      simulated: test,
      createdAt: now,
      execId,
      field: fieldKey,
      retrievedAt: test ? null : retrievedAt,
      payload: { metric: rule.metric, value, op: rule.op, threshold },
    })
  }

  // Ranking with all fired climate rules applied together
  const overall = adjustmentsFrom(firedIds)
  const afterAll = rank({ weights, noTill, adjust: overall })
  const cmpAll = compareRankings(before, afterAll)

  // Rule 3: crop rotation analysis (compare with the previous analysis)
  const rankRule = rules.find((r) => r.type === 'ranking')
  if (rankRule) {
    const rb = { ruleId: rankRule.id, metric: 'rank', op: null, value: null, threshold: null }
    const topNew = afterAll[0].id
    if (!rankRule.enabled) {
      ruleResults.push({ ...rb, status: 'disabled' })
    } else if (!previous || previous.length === 0) {
      ruleResults.push({ ...rb, status: 'baseline', detail: { to: topNew } })
    } else {
      const prevTop = previous.find((x) => x.position === 1)
      const cmpPrev = compareRankings(previous, afterAll)
      if (prevTop && prevTop.id !== topNew) {
        const key = `${rankRule.id}|${fieldKey}|${prevTop.id}->${topNew}|${mode}`
        const detail = { from: prevTop.id, to: topNew }
        if (existingKeys.includes(key)) {
          ruleResults.push({ ...rb, status: 'duplicate', detail })
        } else {
          ruleResults.push({ ...rb, status: 'met', detail })
          tasks.push({
            id: key,
            key,
            kind: rankRule.id,
            priority: rankRule.priority,
            status: 'pending',
            test,
            createdAt: now,
            execId,
            payload: { year: input.year, from: prevTop.id, to: topNew, changes: cmpPrev.changes },
          })
          notifications.push({
            id: 'n|' + key,
            key,
            kind: rankRule.id,
            test,
            simulated: test,
            createdAt: now,
            execId,
            field: fieldKey,
            retrievedAt: test ? null : retrievedAt,
            payload: { from: prevTop.id, to: topNew },
          })
        }
      } else {
        ruleResults.push({ ...rb, status: 'not_met', detail: { to: topNew, changes: cmpPrev.changes } })
      }
    }
  }

  const anyMet = ruleResults.some((r) => r.status === 'met')
  const anyDup = ruleResults.some((r) => r.status === 'duplicate')

  const execution = {
    id: execId,
    at: now,
    trigger: 'manual',
    test,
    status: anyMet ? 'completed' : anyDup ? 'skipped_duplicates' : 'no_condition_met',
    field: fieldKey,
    inputs: input,
    ruleResults,
    assumptions: { weights, noTill, adjustments: overall },
    ranking: { before: minimal(before), after: minimal(afterAll), changes: cmpAll.changes },
    taskIds: tasks.map((x) => x.id),
    notificationIds: notifications.map((x) => x.id),
    error: null,
  }
  return { execution, tasks, notifications }
}