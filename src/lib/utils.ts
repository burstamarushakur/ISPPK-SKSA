import type { InstrumentVersion, Observation, ScoreMap } from './types'

export const uid = () => crypto.randomUUID()
export const upper = (v: string) => v.toLocaleUpperCase('ms-MY')

export function formatDateMY(isoDate: string) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

export function formatTime(time: string) {
  if (!time) return ''
  return time.slice(0, 5)
}

export function sumScores(scores: ScoreMap, ids: string[]) {
  return ids.reduce((sum, id) => sum + (Number(scores[id]) || 0), 0)
}

export function scoreSummary(obs: Observation, instrument: InstrumentVersion) {
  // Teacher-submitted scores are immutable source-of-truth. PIC may not override them.
  const sourceTeacher = obs.selfTeacherScores
  const sourceStudent = obs.selfStudentScores
  const domains = Object.fromEntries(instrument.domains.map(domain => [domain.id, sumScores(sourceTeacher, domain.itemIds)])) as Record<string, number>
  const teacherTotal = Object.values(domains).reduce((sum, value) => sum + value, 0)
  const teacherMax = instrument.domains.reduce((sum, d) => sum + d.maxScore, 0)
  const teacherPercent = teacherMax > 0 ? Math.round((teacherTotal / teacherMax) * 10000) / 100 : 0
  const student = sumScores(sourceStudent, instrument.studentRubric.map(item => item.id))
  const studentPercent = instrument.studentMaxScore > 0 ? Math.round((student / instrument.studentMaxScore) * 10000) / 100 : 0
  const total = teacherTotal + student
  const percent = instrument.totalMaxScore > 0 ? Math.round((total / instrument.totalMaxScore) * 10000) / 100 : 0
  return { domains, teacherTotal, teacherMax, teacherPercent, student, studentMax: instrument.studentMaxScore, studentPercent, total, maxTotal: instrument.totalMaxScore, percent }
}

export function achievementLabel(percent: number, instrument: InstrumentVersion) {
  return instrument.achievementBands.find(b => percent >= b.min && percent <= b.max)?.label || ''
}
export function studentAchievementLabel(percent: number, instrument: InstrumentVersion) {
  const bands = instrument.studentAchievementBands || instrument.achievementBands
  return bands.find(b => percent >= b.min && percent <= b.max)?.label || ''
}

export function attendanceBucket(n: number | null) {
  if (n == null) return ''
  if (n <= 10) return '0 - 10 orang'
  if (n <= 20) return '11 - 20 orang'
  if (n <= 30) return '21 - 30 orang'
  if (n <= 50) return '31 - 50 orang'
  return 'Lebih 50 orang'
}

export function levelBucket(year: number) {
  return year <= 3 ? 'Sekolah Rendah Tahap 1 (Tahun 1-3)' : 'Sekolah Rendah Tahap 2 (Tahun 4-6)'
}

export function instrumentLabel(instrument: InstrumentVersion) {
  return `${instrument.year} · ${instrument.shortTitle.replace(String(instrument.year), '').trim()}`
}
