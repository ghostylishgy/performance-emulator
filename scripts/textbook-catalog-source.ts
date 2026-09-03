import {
  TEXTBOOK_SCHOOL_SYSTEM,
  type TextbookGradeId,
  type TextbookRecord,
  type TextbookStage,
  type TextbookSubjectId,
  type TextbookTerm,
  type TextbookVariant,
} from '../miniprogram/pages/textbook-desk/types'

export const FREEPEP_ORDINARY_SIX_THREE = '义务教育（六三学制）' as const

export interface FreePepCatalogRecord {
  id?: unknown
  title?: unknown
  pdfurl?: unknown
  xd?: unknown
  xk?: unknown
  nj?: unknown
  cc?: unknown
  xdtype?: unknown
}

const gradeMap: Record<string, TextbookGradeId> = {
  一年级: 'primary_1', 二年级: 'primary_2', 三年级: 'primary_3',
  四年级: 'primary_4', 五年级: 'primary_5', 六年级: 'primary_6',
  七年级: 'junior_7', 八年级: 'junior_8', 九年级: 'junior_9',
}

const subjectMap: Record<string, TextbookSubjectId> = {
  语文: 'chinese', 数学: 'mathematics', 英语: 'english',
  道德与法治: 'morality_law', 历史: 'history', 地理: 'geography', 生物学: 'biology',
  科学: 'science', 美术: 'art', 音乐: 'music', 体育与健康: 'physical_education',
  日语: 'japanese', 俄语: 'russian',
}

function stageForGrade(grade: TextbookGradeId): TextbookStage {
  return grade.startsWith('primary_') ? 'primary' : 'junior'
}

function parseVariant(title: string, subject: TextbookSubjectId): TextbookVariant | undefined {
  if (subject !== 'english') return undefined
  if (title.includes('精通') && title.includes('三年级起点')) return { id: 'english_jing_tong_start_3', label: '精通（三年级起点）' }
  if (title.includes('PEP') && title.includes('三年级起点')) return { id: 'english_pep_start_3', label: 'PEP（三年级起点）' }
  if (title.includes('一年级起点')) return { id: 'english_start_1', label: '一年级起点' }
  return undefined
}

export function sanitizeFreePepRecord(raw: FreePepCatalogRecord, verifiedAt: string): TextbookRecord | null {
  if (raw.xdtype !== FREEPEP_ORDINARY_SIX_THREE) return null
  if (typeof raw.id !== 'string' || !/^\d+$/.test(raw.id)) return null
  if (typeof raw.title !== 'string' || !raw.title.trim()) return null
  if (typeof raw.nj !== 'string' || typeof raw.xk !== 'string' || typeof raw.cc !== 'string') return null
  const grade = gradeMap[raw.nj]
  const subject = subjectMap[raw.xk]
  const term = raw.cc === '上册' ? 'upper' : raw.cc === '下册' ? 'lower' : null
  if (!grade || !subject || !term) return null
  const stage = stageForGrade(grade)
  if (raw.xd !== (stage === 'primary' ? '小学' : '初中')) return null
  const officialReaderUrl = `https://book.pep.com.cn/${raw.id}/`
  if (raw.pdfurl !== officialReaderUrl) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(verifiedAt)) return null
  return {
    id: raw.id,
    title: raw.title.trim(),
    stage,
    grade,
    term,
    subject,
    schoolSystem: TEXTBOOK_SCHOOL_SYSTEM,
    variant: parseVariant(raw.title, subject),
    officialReaderUrl,
    verifiedAt,
  }
}
