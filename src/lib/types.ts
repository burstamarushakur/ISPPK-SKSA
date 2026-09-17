export type Gender = 'Lelaki' | 'Perempuan'
export type RecordStatus = 'draft' | 'submitted' | 'verified'
export type GoogleFormStatus = 'pending' | 'sent'

export interface Teacher {
  id: string
  name: string
  gender: Gender | ''
  optionName: string
  active: boolean
  sortOrder: number
}

export interface Evaluator {
  id: string
  name: string
  position: string
  active: boolean
  sortOrder: number
}

export interface SchoolClass {
  id: string
  year: number
  name: string
  active: boolean
}

export interface Subject {
  id: string
  name: string
  active: boolean
}

export interface SchoolSettings {
  schoolCode: string
  schoolName: string
  address: string
  phone: string
  fax: string
  officialEmail: string
  grade: string
  schoolType: string
  location: string
  ppd: string
  state: string
  schoolProgram: string
}

export type ScoreMap = Record<string, number>

export interface RubricItem {
  id: string
  domain: string
  title: string
  criteria: string[]
  skas: string
  scoreDescriptions: string[]
}

export interface StudentItem {
  id: string
  title: string
  teacherItemRef?: string
}

export interface InstrumentDomain {
  id: string
  label: string
  itemIds: string[]
  maxScore: number
}

export interface AchievementBand {
  min: number
  max: number
  label: string
}

export interface GoogleFormFieldMapping {
  entry: string
  value?: string
}

export interface GoogleFormMapping {
  formId: string
  title: string
  fixed: {
    state?: GoogleFormFieldMapping
    ppd?: GoogleFormFieldMapping
    school?: GoogleFormFieldMapping
  }
  fields: Record<string, string>
  note?: string
}

export interface InstrumentVersion {
  id: string
  year: number
  code: string
  title: string
  shortTitle: string
  description: string
  active: boolean
  isDefault: boolean
  teacherRubric: RubricItem[]
  studentRubric: StudentItem[]
  scoreLabels: string[]
  studentScoreGuide: string[]
  domains: InstrumentDomain[]
  studentMaxScore: number
  totalMaxScore: number
  achievementBands: AchievementBand[]
  studentAchievementBands?: AchievementBand[]
  templatePdfPath: string
  studentTemplatePdfPath?: string
  pdfLayoutKey: string
  googleFormMapping: GoogleFormMapping | null
  sourceNote?: string
  createdAt?: string
  updatedAt?: string
}

export interface Observation {
  id: string
  editToken?: string
  instrumentVersionId: string
  instrumentYearSnapshot: number
  instrumentTitleSnapshot: string

  evaluatorId?: string
  observerName: string
  observerPosition: string
  observationDate: string
  observationTime: string

  teacherId: string
  teacherNameSnapshot?: string
  gender: Gender | ''
  teacherPhone: string
  teacherEmail: string
  academicQualification: string
  professionalQualification: string
  optionName: string
  teachingExperienceYears: number | null
  subjectId: string
  subjectNameSnapshot?: string
  subjectTeachingExperienceYears: number | null
  specialPosition: string

  classId: string
  classNameSnapshot?: string
  classYearSnapshot?: number
  topic: string
  studentsPresent: number | null
  studentsTotal: number | null
  studentsMale: number | null
  studentsFemale: number | null
  pdpTime: string

  selfTeacherScores: ScoreMap
  selfStudentScores: ScoreMap
  finalTeacherScores: ScoreMap
  finalStudentScores: ScoreMap
  reflection1: string
  reflection2: string
  observerSummary: string
  status: RecordStatus
  googleFormStatus: GoogleFormStatus
  createdAt: string
  updatedAt: string
}
