const en = {
  'rule.rotation-analysis.name': 'Crop rotation analysis',
  'rule.rotation-analysis.desc': 'Re-ranks the rotation strategies on every run and compares the result with the previous analysis. A task is created only when the top-ranked strategy changes, for example after you change priorities, the field profile or the climate flags.',
  'rule.rotation-analysis.cond': 'The top-ranked strategy differs from the previous analysis',
  'hist.baseline': '{rule}: first analysis saved as the baseline for future comparisons (no earlier analysis to compare with).',
  'hist.rankChanged': '{rule}: the top-ranked strategy changed from "{from}" to "{to}"; task created.',
  'hist.rankSame': '{rule}: the top-ranked strategy is still "{name}" (no significant change).',
  'hist.rankDuplicate': '{rule}: the same ranking change was already reported (not duplicated).',
  'task.title.rotation-analysis': 'Review the changed rotation ranking',
  'task.body.rotation-analysis': 'Compared with the previous analysis, the top-ranked strategy changed from "{from}" to "{to}".',
  'task.reason.rotation-analysis': 'The ranking is recalculated from the documented evidence and your priorities. It is not a yield forecast.',
  'nt.rank': '{rule}: the top-ranked strategy changed from "{from}" to "{to}".',
  'agro.changesTitle': 'Ranking changes and reasons',
  'agro.liveChanged': 'With the current climate adjustments the ranking changes: {list}.',
  'agro.liveSame': 'Climate adjustments are active, but the ranking stays the same.',
  'agro.liveNone': 'No climate adjustment is active, so this is the base ranking from your priorities.',
  'agro.lastAnalysis': 'Last analysis run (Automation)',
  'agro.lastNone': 'No analysis has been run yet. Open Automation and press "Run on real NASA data".',
  'agro.lastWhen': '{mode}, {time}, execution {id}',
  'agro.reasons': 'Reasons',
  'agro.reasonDry': 'Dry flag fired: water-conservation weight +1 (app assumption, not from the sources).',
  'agro.reasonHot': 'Heat flag fired: no score adjustment, because our sources do not support one.',
  'agro.reasonNone': 'No climate rule fired, so no adjustment was applied.',
  'auto.tasks': 'Created tasks',
}

const ru = {
  'rule.rotation-analysis.name': 'Анализ севооборота',
  'rule.rotation-analysis.desc': 'При каждом запуске пересчитывает рейтинг стратегий севооборота и сравнивает результат с предыдущим анализом. Задача создаётся, только если изменился лидер рейтинга, например после смены приоритетов, профиля поля или климатических флагов.',
  'rule.rotation-analysis.cond': 'Лидер рейтинга отличается от предыдущего анализа',
  'hist.baseline': '{rule}: первый анализ сохранён как основа для будущих сравнений (раньше сравнивать было не с чем).',
  'hist.rankChanged': '{rule}: лидер рейтинга изменился с «{from}» на «{to}»; задача создана.',
  'hist.rankSame': '{rule}: лидер рейтинга по-прежнему «{name}» (значимых изменений нет).',
  'hist.rankDuplicate': '{rule}: об этом изменении рейтинга уже сообщалось (дубль не создан).',
  'task.title.rotation-analysis': 'Просмотрите изменившийся рейтинг севооборота',
  'task.body.rotation-analysis': 'По сравнению с предыдущим анализом лидер рейтинга изменился с «{from}» на «{to}».',
  'task.reason.rotation-analysis': 'Рейтинг пересчитывается по задокументированным данным и вашим приоритетам. Это не прогноз урожайности.',
  'nt.rank': '{rule}: лидер рейтинга изменился с «{from}» на «{to}».',
  'agro.changesTitle': 'Изменения рейтинга и причины',
  'agro.liveChanged': 'С текущими климатическими поправками рейтинг меняется: {list}.',
  'agro.liveSame': 'Климатические поправки активны, но рейтинг остаётся прежним.',
  'agro.liveNone': 'Климатических поправок нет, поэтому это базовый рейтинг по вашим приоритетам.',
  'agro.lastAnalysis': 'Последний запуск анализа (Автоматизация)',
  'agro.lastNone': 'Анализ ещё не запускался. Откройте «Автоматизация» и нажмите «Запустить на реальных данных NASA».',
  'agro.lastWhen': '{mode}, {time}, запуск {id}',
  'agro.reasons': 'Причины',
  'agro.reasonDry': 'Сработал флаг засухи: вес сохранения влаги +1 (допущение приложения, не из источников).',
  'agro.reasonHot': 'Сработал флаг жары: оценки не корректировались, потому что наши источники этого не подтверждают.',
  'agro.reasonNone': 'Ни одно климатическое правило не сработало, поэтому поправки не применялись.',
  'auto.tasks': 'Созданные задачи',
}

const kz = {
  'rule.rotation-analysis.name': 'Ауыспалы егісті талдау',
  'rule.rotation-analysis.desc': 'Әр іске қосуда ауыспалы егіс стратегияларын қайта бағалап, нәтижені алдыңғы талдаумен салыстырады. Тапсырма тек рейтингте бірінші стратегия өзгергенде жасалады, мысалы, басымдықтарды, алқап профилін немесе климаттық белгілерді өзгерткеннен кейін.',
  'rule.rotation-analysis.cond': 'Рейтингте бірінші стратегия алдыңғы талдаудағыдан өзгеше',
  'hist.baseline': '{rule}: бірінші талдау болашақ салыстырулар үшін негіз ретінде сақталды (салыстыратын бұрынғы талдау жоқ).',
  'hist.rankChanged': '{rule}: рейтингте бірінші стратегия «{from}» нұсқасынан «{to}» нұсқасына өзгерді; тапсырма жасалды.',
  'hist.rankSame': '{rule}: рейтингте бірінші стратегия бұрынғыша «{name}» (елеулі өзгеріс жоқ).',
  'hist.rankDuplicate': '{rule}: дәл осындай рейтинг өзгерісі бұрын хабарланған (қайталанбады).',
  'task.title.rotation-analysis': 'Өзгерген ауыспалы егіс рейтингін қарап шығыңыз',
  'task.body.rotation-analysis': 'Алдыңғы талдаумен салыстырғанда рейтингте бірінші стратегия «{from}» нұсқасынан «{to}» нұсқасына өзгерді.',
  'task.reason.rotation-analysis': 'Рейтинг құжатталған дәлелдер мен сіздің басымдықтарыңыз бойынша қайта есептеледі. Бұл өнім болжамы емес.',
  'nt.rank': '{rule}: рейтингте бірінші стратегия «{from}» нұсқасынан «{to}» нұсқасына өзгерді.',
  'agro.changesTitle': 'Рейтинг өзгерістері және себептері',
  'agro.liveChanged': 'Қазіргі климаттық түзетулермен рейтинг өзгереді: {list}.',
  'agro.liveSame': 'Климаттық түзетулер белсенді, бірақ рейтинг өзгермейді.',
  'agro.liveNone': 'Белсенді климаттық түзету жоқ, сондықтан бұл сіздің басымдықтарыңызға негізделген базалық рейтинг.',
  'agro.lastAnalysis': 'Соңғы талдау (Автоматтандыру)',
  'agro.lastNone': 'Талдау әлі іске қосылмаған. Автоматтандыру бөлімін ашып, «Нақты NASA деректерімен іске қосу» батырмасын басыңыз.',
  'agro.lastWhen': '{mode}, {time}, іске қосу {id}',
  'agro.reasons': 'Себептер',
  'agro.reasonDry': 'Құрғақшылық белгісі іске қосылды: ылғалды сақтау салмағы +1 (қолданба болжамы, дереккөздерден емес).',
  'agro.reasonHot': 'Ыстық белгісі іске қосылды: балл түзетілмеді, өйткені біздің дереккөздер оны қолдамайды.',
  'agro.reasonNone': 'Ешбір климаттық ереже іске қосылмады, сондықтан түзету қолданылмады.',
  'auto.tasks': 'Жасалған тапсырмалар',
}

const extra = { en, ru, kz }
let currentLang = 'en'

export function setExtraLang(l) {
  currentLang = l
}

function format(str, params) {
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : '{' + k + '}'))
}

// Looks in the extra dictionary first, then falls back to the main one passed as t
export function tr(t, key, params) {
  const e = extra[currentLang] && extra[currentLang][key]
  if (e !== undefined) return format(e, params)
  return t(key, params)
}