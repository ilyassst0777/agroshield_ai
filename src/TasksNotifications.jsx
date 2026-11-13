import { useT } from './i18n.jsx'
import { fmtTime, describeTask, describeNote } from './ui.jsx'

export default function TasksNotifications({ tasks, notes, setTaskStatus }) {
  const { t, lang } = useT()

  return (
    <>
      <div className="card">
        <h2>{t('tasks.title')}</h2>
        {tasks.length === 0 && <p className="muted">{t('tasks.none')}</p>}
        {tasks.map((task) => {
          const d = describeTask(t, task)
          return (
            <div key={task.id} className="task-card">
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
                  rule: t('rule.' + task.kind + '.name'),
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
        })}
        <p className="muted">{t('tasks.safety')}</p>
      </div>

      <div className="card">
        <h2>{t('notif.title')}</h2>
        {notes.length === 0 && <p className="muted">{t('notif.none')}</p>}
        {notes.map((n) => (
          <div key={n.id} className="note-line">
            <b>{n.test ? '[' + t('common.test') + '] ' : ''}{describeNote(t, n).message}</b>
            <div>
              <small className="muted">
                {t('notif.field')}: {n.field} | {t('notif.data')}:{' '}
                {n.simulated ? t('notif.simulated') : `NASA POWER, ${fmtTime(n.retrievedAt, lang)}`} | {fmtTime(n.createdAt, lang)}
              </small>
            </div>
            <div><small className="muted">{t('notif.next')}</small></div>
          </div>
        ))}
      </div>
    </>
  )
}