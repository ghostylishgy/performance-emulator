import type { TextbookGradeId, TextbookTargetId, TextbookTerm } from './types'
import { buildTextbookTargetId } from './targets'

export const nextGradeMap: Readonly<Record<TextbookGradeId, TextbookGradeId | null>> = {
  primary_1: 'primary_2',
  primary_2: 'primary_3',
  primary_3: 'primary_4',
  primary_4: 'primary_5',
  primary_5: 'primary_6',
  primary_6: 'junior_7',
  junior_7: 'junior_8',
  junior_8: 'junior_9',
  junior_9: null,
}

export function resolveNextTermTarget(grade: TextbookGradeId, term: TextbookTerm): TextbookTargetId | null {
  return term === 'upper' ? buildTextbookTargetId(grade, 'lower') : null
}

export function resolveNextGradeTarget(grade: TextbookGradeId): TextbookTargetId | null {
  const nextGrade = nextGradeMap[grade]
  return nextGrade ? buildTextbookTargetId(nextGrade, 'upper') : null
}
