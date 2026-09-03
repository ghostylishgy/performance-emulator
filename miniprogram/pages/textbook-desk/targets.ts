import {
  TEXTBOOK_GRADE_IDS,
  TEXTBOOK_TARGET_IDS,
  type TextbookGradeId,
  type TextbookStage,
  type TextbookTarget,
  type TextbookTargetId,
  type TextbookTerm,
} from './types'

const gradeStage: Record<TextbookGradeId, TextbookStage> = {
  primary_1: 'primary',
  primary_2: 'primary',
  primary_3: 'primary',
  primary_4: 'primary',
  primary_5: 'primary',
  primary_6: 'primary',
  junior_7: 'junior',
  junior_8: 'junior',
  junior_9: 'junior',
}

const targetById = new Map<TextbookTargetId, TextbookTarget>(
  TEXTBOOK_TARGET_IDS.map((id) => {
    const match = /^(primary_[1-6]|junior_[7-9])_(upper|lower)$/.exec(id)
    if (!match) throw new Error(`Invalid locked textbook target: ${id}`)
    const grade = match[1] as TextbookGradeId
    const term = match[2] as TextbookTerm
    return [id, { id, stage: gradeStage[grade], grade, term }]
  }),
)

export function isTextbookGradeId(value: unknown): value is TextbookGradeId {
  return typeof value === 'string' && (TEXTBOOK_GRADE_IDS as readonly string[]).includes(value)
}

export function isTextbookTargetId(value: unknown): value is TextbookTargetId {
  return typeof value === 'string' && (TEXTBOOK_TARGET_IDS as readonly string[]).includes(value)
}

export function getTextbookTarget(id: TextbookTargetId): TextbookTarget {
  const target = targetById.get(id)
  if (!target) throw new Error(`Unknown textbook target: ${id}`)
  return target
}

export function buildTextbookTargetId(grade: TextbookGradeId, term: TextbookTerm): TextbookTargetId {
  const id = `${grade}_${term}`
  if (!isTextbookTargetId(id)) throw new Error(`Unsupported textbook target: ${id}`)
  return id
}
