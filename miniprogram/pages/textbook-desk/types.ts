export const TEXTBOOK_SCHOOL_SYSTEM = 'compulsory_6_3' as const
export type TextbookSchoolSystem = typeof TEXTBOOK_SCHOOL_SYSTEM

export const TEXTBOOK_GRADE_IDS = [
  'primary_1', 'primary_2', 'primary_3', 'primary_4', 'primary_5', 'primary_6',
  'junior_7', 'junior_8', 'junior_9',
] as const

export type TextbookGradeId = typeof TEXTBOOK_GRADE_IDS[number]
export type TextbookStage = 'primary' | 'junior'
export type TextbookTerm = 'upper' | 'lower'
export type TextbookViewMode = 'current' | 'preview'
export const TEXTBOOK_OFFLINE_REASONS = ['offline', 'print', 'preview', 'emergency', 'other'] as const
export type TextbookOfflineReason = typeof TEXTBOOK_OFFLINE_REASONS[number]

export type TextbookSubjectId =
  | 'chinese' | 'mathematics' | 'english'
  | 'morality_law' | 'history' | 'geography' | 'biology'
  | 'science' | 'art' | 'music' | 'physical_education'
  | 'japanese' | 'russian' | 'other'

export interface TextbookVariant {
  id: string
  label: string
}

export interface TextbookRecord {
  id: string
  title: string
  stage: TextbookStage
  grade: TextbookGradeId
  term: TextbookTerm
  subject: TextbookSubjectId
  schoolSystem: TextbookSchoolSystem
  variant?: TextbookVariant
  officialReaderUrl: string
  verifiedAt: string
  editionNote?: string
}

export interface TextbookTarget {
  id: TextbookTargetId
  stage: TextbookStage
  grade: TextbookGradeId
  term: TextbookTerm
}

export const TEXTBOOK_TARGET_IDS = [
  'primary_1_upper', 'primary_1_lower',
  'primary_2_upper', 'primary_2_lower',
  'primary_3_upper', 'primary_3_lower',
  'primary_4_upper', 'primary_4_lower',
  'primary_5_upper', 'primary_5_lower',
  'primary_6_upper', 'primary_6_lower',
  'junior_7_upper', 'junior_7_lower',
  'junior_8_upper', 'junior_8_lower',
  'junior_9_upper', 'junior_9_lower',
] as const

export type TextbookTargetId = typeof TEXTBOOK_TARGET_IDS[number]

export interface TextbookPreference {
  schemaVersion: 1
  homeGrade: TextbookGradeId
  copyHelpSeen: boolean
  selectedEnglishVariant?: Partial<Record<TextbookGradeId, string>>
  lastConfirmedAcademicYear?: string
}

export type TextbookRecommendationKind = 'current' | 'next_term' | 'next_grade' | 'history'

export interface TextbookRecommendation {
  kind: TextbookRecommendationKind
  mode: TextbookViewMode
  target: TextbookTargetId
  priority: number
}
