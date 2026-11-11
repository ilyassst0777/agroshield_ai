export const METRICS = {
  precipPct: { label: 'Precipitation vs normal (%)' },
  tempDiff: { label: 'Temperature vs normal (°C)' },
}

// Thresholds are our assumptions, not values from the sources
export const DEFAULT_RULES = [
  {
    id: 'dry-season',
    name: 'Dry season',
    enabled: true,
    metric: 'precipPct',
    op: '<=',
    threshold: -15,
    taskTitle: 'Review water-saving rotation options',
    taskText:
      'Last season was drier than normal. Check the rotation options and think about water conservation before planning the next season.',
  },
  {
    id: 'hot-season',
    name: 'Hot season',
    enabled: true,
    metric: 'tempDiff',
    op: '>=',
    threshold: 1.5,
    taskTitle: 'Review heat and moisture risk',
    taskText:
      'Last season was warmer than normal. Check soil moisture reserves and the rotation options.',
  },
]

function check(value, op, threshold) {
  return op === '<=' ? value <= threshold : value >= threshold
}

// No side effects: returns what should be added. existingKeys prevents duplicate tasks.
export function runRules({ rules, anomaly, fieldKey, source, test, existingKeys }) {
  const now = new Date().toISOString()
  const tasks = []
  const notifications = []
  const log = []
  const data = test ? { ...anomaly, precipPct: -30, tempDiff: 2.5 } : anomaly
  const tag = test ? ' [TEST scenario]' : ''

  for (const rule of rules) {
    if (!rule.enabled) {
      log.push({ at: now, rule: rule.name, result: 'skipped: rule disabled' + tag })
      continue
    }
    const value = data[rule.metric]
    const threshold = Number(rule.threshold)
    if (!check(value, rule.op, threshold)) {
      log.push({
        at: now,
        rule: rule.name,
        result: `condition not met (value ${value}, threshold ${rule.op} ${threshold})` + tag,
      })
      continue
    }
    const key = `${rule.id}|${fieldKey}|${data.year}|${test ? 'test' : 'real'}`
    if (existingKeys.includes(key)) {
      log.push({
        at: now,
        rule: rule.name,
        result: 'skipped: task for this rule, field and season already exists' + tag,
      })
      continue
    }
    tasks.push({
      id: key,
      key,
      title: rule.taskTitle,
      text: rule.taskText,
      status: 'pending',
      test,
      createdAt: now,
      ruleName: rule.name,
    })
    notifications.push({
      id: 'n|' + key,
      createdAt: now,
      test,
      message: `${rule.name}: ${METRICS[rule.metric].label} = ${value}, condition ${rule.op} ${threshold}.`,
      field: fieldKey,
      source,
      nextStep: 'Open the task below and approve or reject it.',
    })
    log.push({
      at: now,
      rule: rule.name,
      result: `condition met (value ${value}); task created, waiting for farmer approval` + tag,
    })
  }
  return { tasks, notifications, log }
}