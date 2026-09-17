import { DEFAULT_CLASSES, DEFAULT_SUBJECTS, DEFAULT_TEACHERS, SCHOOL } from './data'
import { DEFAULT_INSTRUMENTS } from '../instruments/registry'
import { isSupabaseConfigured, supabase } from './supabase'
import type { InstrumentVersion, Observation, SchoolClass, SchoolSettings, Subject, Teacher } from './types'
import { uid } from './utils'

const KEYS = {
  teachers: 'isppk_teachers_v2',
  classes: 'isppk_classes_v2',
  subjects: 'isppk_subjects_v2',
  settings: 'isppk_settings_v2',
  observations: 'isppk_observations_v2',
  instruments: 'isppk_instruments_v2'
}

const LEGACY_KEYS = { observations: 'isppk_observations_v1' }

function load<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}
function save<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)) }

function mapTeacher(row: any): Teacher {
  return { id: row.id, name: row.name, gender: row.gender || '', optionName: row.option_name || '', active: row.active, sortOrder: row.sort_order || 0 }
}
function mapClass(row: any): SchoolClass { return { id: row.id, year: row.year, name: row.name, active: row.active } }
function mapSubject(row: any): Subject { return { id: row.id, name: row.name, active: row.active } }
function mapInstrument(row: any): InstrumentVersion {
  const base = DEFAULT_INSTRUMENTS.find(x => x.id === row.id) || {}
  const config = row.config || {}
  return {
    ...base,
    ...config,
    id: row.id,
    year: row.year,
    code: row.code,
    active: row.active,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  } as InstrumentVersion
}
function mapObservation(row: any): Observation {
  const fallbackInstrument = DEFAULT_INSTRUMENTS[0]
  return {
    id: row.id,
    instrumentVersionId: row.instrument_version_id || fallbackInstrument.id,
    instrumentYearSnapshot: row.instrument_year_snapshot || fallbackInstrument.year,
    instrumentTitleSnapshot: row.instrument_title_snapshot || fallbackInstrument.shortTitle,
    teacherId: row.teacher_id,
    teacherNameSnapshot: row.teacher_name_snapshot || '',
    gender: row.gender || '',
    optionName: row.option_name || '',
    subjectId: row.subject_id || '',
    subjectNameSnapshot: row.subject_name_snapshot || '',
    classId: row.class_id || '',
    classNameSnapshot: row.class_name_snapshot || '',
    classYearSnapshot: row.class_year_snapshot || undefined,
    topic: row.topic || '',
    studentsPresent: row.students_present,
    studentsTotal: row.students_total,
    pdpTime: row.pdp_time || '',
    observationDate: row.observation_date || '',
    observationTime: row.observation_time || '',
    selfTeacherScores: row.self_teacher_scores || {},
    selfStudentScores: row.self_student_scores || {},
    finalTeacherScores: row.final_teacher_scores || {},
    finalStudentScores: row.final_student_scores || {},
    reflection1: row.reflection_1 || '',
    reflection2: row.reflection_2 || '',
    observerName: row.observer_name || '',
    observerPosition: row.observer_position || '',
    observerSummary: row.observer_summary || '',
    status: row.status || 'submitted',
    googleFormStatus: row.google_form_status || 'pending',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  }
}

function normalizeLocalObservation(input: any): Observation {
  const fallback = DEFAULT_INSTRUMENTS[0]
  return {
    ...input,
    instrumentVersionId: input.instrumentVersionId || fallback.id,
    instrumentYearSnapshot: input.instrumentYearSnapshot || fallback.year,
    instrumentTitleSnapshot: input.instrumentTitleSnapshot || fallback.shortTitle,
    teacherNameSnapshot: input.teacherNameSnapshot || '',
    subjectNameSnapshot: input.subjectNameSnapshot || '',
    classNameSnapshot: input.classNameSnapshot || '',
    classYearSnapshot: input.classYearSnapshot
  }
}

export async function getInstrumentVersions(): Promise<InstrumentVersion[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('instrument_versions').select('*').order('year', { ascending: false })
    if (error) throw error
    return (data || []).map(mapInstrument)
  }
  const data = load<InstrumentVersion[]>(KEYS.instruments, DEFAULT_INSTRUMENTS)
  if (!localStorage.getItem(KEYS.instruments)) save(KEYS.instruments, data)
  return data
}

export async function saveInstrumentVersion(item: InstrumentVersion) {
  if (isSupabaseConfigured && supabase) {
    const { id, year, code, active, isDefault, createdAt: _created, updatedAt: _updated, ...config } = item
    if (isDefault) {
      const { error: resetError } = await supabase.from('instrument_versions').update({ is_default: false }).neq('id', id)
      if (resetError) throw resetError
    }
    const { error } = await supabase.from('instrument_versions').upsert({ id, year, code, active, is_default: isDefault, config, updated_at: new Date().toISOString() })
    if (error) throw error
    return
  }
  let list = await getInstrumentVersions()
  if (item.isDefault) list = list.map(x => ({ ...x, isDefault: x.id === item.id }))
  const idx = list.findIndex(x => x.id === item.id)
  if (idx >= 0) list[idx] = item; else list.push(item)
  save(KEYS.instruments, list)
}

export async function getTeachers(): Promise<Teacher[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('teachers').select('*').order('sort_order')
    if (error) throw error
    return (data || []).map(mapTeacher)
  }
  const data = load<Teacher[]>(KEYS.teachers, DEFAULT_TEACHERS)
  if (!localStorage.getItem(KEYS.teachers)) save(KEYS.teachers, data)
  return data
}

export async function saveTeacher(teacher: Teacher) {
  if (isSupabaseConfigured && supabase) {
    const row = { id: teacher.id.startsWith('teacher-') ? undefined : teacher.id, name: teacher.name, gender: teacher.gender || null, option_name: teacher.optionName, active: teacher.active, sort_order: teacher.sortOrder }
    const { error } = teacher.id.startsWith('teacher-') ? await supabase.from('teachers').insert(row) : await supabase.from('teachers').upsert(row)
    if (error) throw error
    return
  }
  const list = await getTeachers(); const idx = list.findIndex(x => x.id === teacher.id)
  if (idx >= 0) list[idx] = teacher; else list.push({ ...teacher, id: uid() })
  save(KEYS.teachers, list)
}

export async function getClasses(): Promise<SchoolClass[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('classes').select('*').order('year').order('name')
    if (error) throw error
    return (data || []).map(mapClass)
  }
  const data = load<SchoolClass[]>(KEYS.classes, DEFAULT_CLASSES)
  if (!localStorage.getItem(KEYS.classes)) save(KEYS.classes, data)
  return data
}

export async function saveClass(item: SchoolClass) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('classes').upsert({ id: item.id.startsWith('class-') ? undefined : item.id, year: item.year, name: item.name, active: item.active })
    if (error) throw error
    return
  }
  const list = await getClasses(); const idx = list.findIndex(x => x.id === item.id)
  if (idx >= 0) list[idx] = item; else list.push({ ...item, id: uid() })
  save(KEYS.classes, list)
}

export async function getSubjects(): Promise<Subject[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('subjects').select('*').order('name')
    if (error) throw error
    return (data || []).map(mapSubject)
  }
  const data = load<Subject[]>(KEYS.subjects, DEFAULT_SUBJECTS)
  if (!localStorage.getItem(KEYS.subjects)) save(KEYS.subjects, data)
  return data
}

export async function saveSubject(item: Subject) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('subjects').upsert({ id: item.id.startsWith('subject-') ? undefined : item.id, name: item.name, active: item.active })
    if (error) throw error
    return
  }
  const list = await getSubjects(); const idx = list.findIndex(x => x.id === item.id)
  if (idx >= 0) list[idx] = item; else list.push({ ...item, id: uid() })
  save(KEYS.subjects, list)
}

export async function getSchoolSettings(): Promise<SchoolSettings> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('school_settings').select('*').limit(1).maybeSingle()
    if (error) throw error
    if (data) return { schoolCode: data.school_code, schoolName: data.school_name, ppd: data.ppd, state: data.state, officialEmail: data.official_email || '' }
  }
  const data = load<SchoolSettings>(KEYS.settings, SCHOOL)
  if (!localStorage.getItem(KEYS.settings)) save(KEYS.settings, data)
  return data
}

export async function saveSchoolSettings(s: SchoolSettings) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('school_settings').upsert({ id: 1, school_code: s.schoolCode, school_name: s.schoolName, ppd: s.ppd, state: s.state, official_email: s.officialEmail })
    if (error) throw error
    return
  }
  save(KEYS.settings, s)
}

export async function getObservations(): Promise<Observation[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('observations').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(mapObservation)
  }
  if (!localStorage.getItem(KEYS.observations) && localStorage.getItem(LEGACY_KEYS.observations)) {
    const legacy = load<any[]>(LEGACY_KEYS.observations, []).map(normalizeLocalObservation)
    save(KEYS.observations, legacy)
  }
  return load<any[]>(KEYS.observations, []).map(normalizeLocalObservation)
}

export async function getObservation(id: string): Promise<Observation | null> {
  return (await getObservations()).find(x => x.id === id) || null
}

export async function saveObservation(obs: Observation) {
  if (isSupabaseConfigured && supabase) {
    const row = {
      id: obs.id,
      instrument_version_id: obs.instrumentVersionId,
      instrument_year_snapshot: obs.instrumentYearSnapshot,
      instrument_title_snapshot: obs.instrumentTitleSnapshot,
      teacher_id: obs.teacherId,
      teacher_name_snapshot: obs.teacherNameSnapshot || '',
      gender: obs.gender || null,
      option_name: obs.optionName,
      subject_id: obs.subjectId || null,
      subject_name_snapshot: obs.subjectNameSnapshot || '',
      class_id: obs.classId || null,
      class_name_snapshot: obs.classNameSnapshot || '',
      class_year_snapshot: obs.classYearSnapshot || null,
      topic: obs.topic,
      students_present: obs.studentsPresent,
      students_total: obs.studentsTotal,
      pdp_time: obs.pdpTime || null,
      observation_date: obs.observationDate || null,
      observation_time: obs.observationTime || null,
      self_teacher_scores: obs.selfTeacherScores,
      self_student_scores: obs.selfStudentScores,
      final_teacher_scores: obs.finalTeacherScores,
      final_student_scores: obs.finalStudentScores,
      reflection_1: obs.reflection1,
      reflection_2: obs.reflection2,
      observer_name: obs.observerName,
      observer_position: obs.observerPosition,
      observer_summary: obs.observerSummary,
      status: obs.status,
      google_form_status: obs.googleFormStatus,
      updated_at: new Date().toISOString()
    }
    const { error } = await supabase.from('observations').upsert(row)
    if (error) throw error
    return
  }
  const list = await getObservations(); const idx = list.findIndex(x => x.id === obs.id)
  if (idx >= 0) list[idx] = obs; else list.unshift(obs)
  save(KEYS.observations, list)
}
