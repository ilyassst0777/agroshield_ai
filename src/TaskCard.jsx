import { useT } from './i18n.jsx'
import { tr } from './extraText.js'
import { fmtTime, describeTask } from './ui.jsx'

export default function TaskCard({ task, setTaskStatus }) {
  const { t, lang } = useT()
  const d = describeTask(t, task)

  return (
    <div className="task-card">
      <b>{task.test ? '[' + t('common.test') + '] ' : ''}{d.title}</b>{' '}
      <span className={task.priority === 'high' ? 'badge warn' : 'badge ok'}>
        {t('tasks.priority', { p: t('priority.' + task.priority) })}
      </span>{' '}
      <span className="badge ok">{t('status.' + task.status)}</span>
      <div>{d.body}</div>
      <div>{d.analysis}</div>
      <div className="muted">{d.reason}</div>
      <div className="muted">{d.next}</div>
      <small className="muted">
        {t('tasks.created', {
          time: fmtTime(task.createdAt, lang),
          rule: tr(t, 'rule.' + task.kind + '.name'),
          id: task.execId ? task.execId.slice(-6) : '-',
        })}
      </small>
      <div className="row" style={{ marginBottom: 0 }}>
        {task.status === 'pending' && (
          <>
            <button onClick={() => setTaskStatus(task.id, 'approved')}>{t('tasks.approve')}</button>
            <button className="danger" onClick={() => setTaskStatus(task.id, 'rejected')}>{t('tasks.reject')}</button>
          </>
        )}
        {task.status === 'approved' && (
          <button className="secondary" onClick={() => setTaskStatus(task.id, 'completed')}>{t('tasks.complete')}</button>
        )}
      </div>
    </div>
  )
}