import { useT } from './i18n.jsx'
import { fmtTime, describeNote } from './ui.jsx'
import TaskCard from './TaskCard.jsx'

export default function TasksNotifications({ tasks, notes, setTaskStatus }) {
  const { t, lang } = useT()

  return (
    <>
      <div className="card">
        <h2>{t('tasks.title')}</h2>
        {tasks.length === 0 && <p className="muted">{t('tasks.none')}</p>}
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} setTaskStatus={setTaskStatus} />
        ))}
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