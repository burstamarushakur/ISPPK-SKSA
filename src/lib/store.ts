import { DEFAULT_CLASSES, DEFAULT_EVALUATORS, DEFAULT_SUBJECTS, DEFAULT_TEACHERS, SCHOOL } from './data'
import { DEFAULT_INSTRUMENTS } from '../instruments/registry'
import { isSupabaseConfigured, supabase } from './supabase'
import type { Evaluator, InstrumentVersion, Observation, SchoolClass, SchoolSettings, Subject, Teacher } from './types'
import { uid } from './utils'

const KEYS = {
  teachers: 'isppk_teachers_v2',
  classes: 'isppk_classes_v2',
  subjects: 'isppk_subjects_v2',
  settings: 'isppk_settings_v2',
  observations: 'isppk_observations_v2',
  instruments: 'isppk_instruments_v2',
  evaluators: 'isppk_evaluators_v1'
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
function mapEvaluator(row: any): Evaluator { return { id: row.id, name: row.name, position: row.position || '', active: row.active, sortOrder: row.sort_order || 0 } }
function mapInstrument(row: any): InstrumentVersion {
  const base = DEFAULT_INSTRUMENTS.find(x => x.id === row.id) || {}
  const config = row.config || {}
  const merged: any = { ...base, ...config }
  // 2026 is an official locked source version. Its rubric wording and score guide
  // always come from the bundled source-of-truth config so stale DB copies cannot
  // silently replace the official PDF wording.
  if ((base as any).code === 'ISPPK-PDP-2026-V1') {
    merged.title = (base as any).title
    merged.shortTitle = (base as any).shortTitle
    merged.description = (base as any).description
    merged.teacherRubric = (base as any).teacherRubric
    merged.studentRubric = (base as any).studentRubric
    merged.scoreLabels = (base as any).scoreLabels
    merged.studentScoreGuide = (base as any).studentScoreGuide
    merged.domains = (base as any).domains
    merged.studentMaxScore = (base as any).studentMaxScore
    merged.templatePdfPath = (base as any).templatePdfPath
    merged.studentTemplatePdfPath = (base as any).studentTemplatePdfPath
    merged.pdfLayoutKey = (base as any).pdfLayoutKey
    merged.totalMaxScore = (base as any).totalMaxScore
    merged.achievementBands = (base as any).achievementBands
    merged.studentAchievementBands = (base as any).studentAchievementBands
    merged.sourceNote = (base as any).sourceNote
  }
  return {
    ...merged,
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
    evaluatorId: row.evaluator_id || undefined,
    observerName: row.observer_name || '',
    observerPosition: row.observer_position || '',
    observationDate: row.observation_date || '',
    observationTime: row.observation_time || '',
    teacherNameSnapshot: row.teacher_name_snapshot || '',
    gender: row.gender || '',
    teacherPhone: row.teacher_phone || '',
    teacherEmail: row.teacher_email || '',
    academicQualification: row.academic_qualification || '',
    professionalQualification: row.professional_qualification || '',
    optionName: row.option_name || '',
    teachingExperienceYears: row.teaching_experience_years,
    subjectTeachingExperienceYears: row.subject_teaching_experience_years,
    specialPosition: row.special_position || '',
    subjectId: row.subject_id || '',
    subjectNameSnapshot: row.subject_name_snapshot || '',
    classId: row.class_id || '',
    classNameSnapshot: row.class_name_snapshot || '',
    classYearSnapshot: row.class_year_snapshot || undefined,
    topic: row.topic || '',
    studentsPresent: row.students_present,
    studentsTotal: row.students_total,
    studentsMale: row.students_male,
    studentsFemale: row.students_female,
    pdpTime: row.pdp_time || '',
    selfTeacherScores: row.self_teacher_scores || {},
    selfStudentScores: row.self_student_scores || {},
    finalTeacherScores: row.final_teacher_scores || {},
    finalStudentScores: row.final_student_scores || {},
    reflection1: row.reflection_1 || '',
    reflection2: row.reflection_2 || '',
    observerSummary: row.observer_summary || '',
    studentObserverSummary: row.student_observer_summary || '',
    observerSignatureDataUrl: row.observer_signature_data_url || '',
    observerSignedAt: row.observer_signed_at || '',
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
    classYearSnapshot: input.classYearSnapshot,
    evaluatorId: input.evaluatorId,
    observerName: input.observerName || '',
    observerPosition: input.observerPosition || '',
    observationDate: input.observationDate || '',
    observationTime: input.observationTime || '',
    teacherPhone: input.teacherPhone || '',
    teacherEmail: input.teacherEmail || '',
    academicQualification: input.academicQualification || '',
    professionalQualification: input.professionalQualification || '',
    teachingExperienceYears: input.teachingExperienceYears ?? null,
    subjectTeachingExperienceYears: input.subjectTeachingExperienceYears ?? null,
    specialPosition: input.specialPosition || '',
    studentsMale: input.studentsMale ?? null,
    studentsFemale: input.studentsFemale ?? null,
    studentObserverSummary: input.studentObserverSummary || '',
    observerSignatureDataUrl: input.observerSignatureDataUrl || '',
    observerSignedAt: input.observerSignedAt || ''
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

export async function getEvaluators(): Promise<Evaluator[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('evaluators').select('*').order('sort_order')
    if (error) throw error
    return (data || []).map(mapEvaluator)
  }
  const data = load<Evaluator[]>(KEYS.evaluators, DEFAULT_EVALUATORS)
  if (!localStorage.getItem(KEYS.evaluators)) save(KEYS.evaluators, data)
  return data
}

export async function saveEvaluator(item: Evaluator) {
  if (isSupabaseConfigured && supabase) {
    const row = { id: item.id.startsWith('evaluator-') ? undefined : item.id, name:item.name, position:item.position, active:item.active, sort_order:item.sortOrder }
    const { error } = item.id.startsWith('evaluator-') ? await supabase.from('evaluators').insert(row) : await supabase.from('evaluators').upsert(row)
    if (error) throw error
    return
  }
  const list = await getEvaluators(); const idx=list.findIndex(x=>x.id===item.id)
  if(idx>=0) list[idx]=item; else list.push({...item,id:uid()})
  save(KEYS.evaluators,list)
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
    if (data) return { schoolCode:data.school_code, schoolName:data.school_name, address:data.address||'', phone:data.phone||'', fax:data.fax||'', officialEmail:data.official_email||'', grade:data.grade||'', schoolType:data.school_type||'', location:data.location||'', ppd:data.ppd, state:data.state, schoolProgram:data.school_program||'' }
  }
  const data = load<SchoolSettings>(KEYS.settings, SCHOOL)
  if (!localStorage.getItem(KEYS.settings)) save(KEYS.settings, data)
  return data
}

export async function saveSchoolSettings(s: SchoolSettings) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('school_settings').upsert({ id:1, school_code:s.schoolCode, school_name:s.schoolName, address:s.address, phone:s.phone, fax:s.fax, official_email:s.officialEmail, grade:s.grade, school_type:s.schoolType, location:s.location, ppd:s.ppd, state:s.state, school_program:s.schoolProgram })
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
      evaluator_id: obs.evaluatorId || null,
      observer_name: obs.observerName,
      observer_position: obs.observerPosition,
      teacher_id: obs.teacherId,
      teacher_name_snapshot: obs.teacherNameSnapshot || '',
      gender: obs.gender || null,
      teacher_phone: obs.teacherPhone,
      teacher_email: obs.teacherEmail,
      academic_qualification: obs.academicQualification,
      professional_qualification: obs.professionalQualification,
      option_name: obs.optionName,
      teaching_experience_years: obs.teachingExperienceYears,
      subject_teaching_experience_years: obs.subjectTeachingExperienceYears,
      special_position: obs.specialPosition,
      subject_id: obs.subjectId || null,
      subject_name_snapshot: obs.subjectNameSnapshot || '',
      class_id: obs.classId || null,
      class_name_snapshot: obs.classNameSnapshot || '',
      class_year_snapshot: obs.classYearSnapshot || null,
      topic: obs.topic,
      students_present: obs.studentsPresent,
      students_total: obs.studentsTotal,
      students_male: obs.studentsMale,
      students_female: obs.studentsFemale,
      pdp_time: obs.pdpTime || null,
      observation_date: obs.observationDate || null,
      observation_time: obs.observationTime || null,
      self_teacher_scores: obs.selfTeacherScores,
      self_student_scores: obs.selfStudentScores,
      final_teacher_scores: obs.finalTeacherScores,
      final_student_scores: obs.finalStudentScores,
      reflection_1: obs.reflection1,
      reflection_2: obs.reflection2,
      observer_summary: obs.observerSummary,
      student_observer_summary: obs.studentObserverSummary,
      observer_signature_data_url: obs.observerSignatureDataUrl,
      observer_signed_at: obs.observerSignedAt || null,
      status: obs.status,
      google_form_status: obs.googleFormStatus,
      updated_at: new Date().toISOString()
    }
    // Public teacher submissions are INSERT-only by RLS. PIC sessions may update/upsert existing records.
    const { data: sessionData } = await supabase.auth.getSession()
    const query = sessionData.session
      ? supabase.from('observations').upsert(row)
      : supabase.from('observations').insert(row)
    const { error } = await query
    if (error) throw error
    return
  }
  const list = await getObservations(); const idx = list.findIndex(x => x.id === obs.id)
  if (idx >= 0) list[idx] = obs; else list.unshift(obs)
  save(KEYS.observations, list)
}

export async function deleteObservation(id: string) {
  if (isSupabaseConfigured && supabase) {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) throw new Error('Hanya PIC yang log masuk boleh memadam rekod.')
    const { error } = await supabase.from('observations').delete().eq('id', id)
    if (error) throw error
    return
  }
  const list = await getObservations()
  save(KEYS.observations, list.filter(x => x.id !== id))
}
