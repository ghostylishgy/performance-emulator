import type { TextbookGradeId, TextbookRecommendation, TextbookRecommendationKind, TextbookTargetId, TextbookViewMode } from './types'
import { buildTextbookTargetId } from './targets'
import { resolveNextGradeTarget, resolveNextTermTarget } from './progression'

export type AcademicPhase = 'upper_term' | 'winter_break' | 'lower_term' | 'summer_break'

export function resolveAcademicPhaseFromMonth(month: number): AcademicPhase {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error(`Invalid calendar month: ${month}`)
  if (month >= 9) return 'upper_term'
  if (month <= 2) return 'winter_break'
  if (month <= 6) return 'lower_term'
  return 'summer_break'
}

export function resolveAcademicPhase(date: Date): AcademicPhase {
  if (Number.isNaN(date.getTime())) throw new Error('Invalid academic phase date')
  return resolveAcademicPhaseFromMonth(date.getMonth() + 1)
}

function item(kind: TextbookRecommendationKind, mode: TextbookViewMode, target: TextbookTargetId): Omit<TextbookRecommendation, 'priority'> {
  return { kind, mode, target }
}

export function buildSemesterDeskRecommendations(homeGrade: TextbookGradeId, date: Date): readonly TextbookRecommendation[] {
  const phase = resolveAcademicPhase(date)
  const upper = buildTextbookTargetId(homeGrade, 'upper')
  const lower = buildTextbookTargetId(homeGrade, 'lower')
  const nextTerm = resolveNextTermTarget(homeGrade, 'upper')
  const nextGrade = resolveNextGradeTarget(homeGrade)
  let recommendations: Array<Omit<TextbookRecommendation, 'priority'>>

  switch (phase) {
    case 'upper_term':
      recommendations = [
        item('current', 'current', upper),
        ...(nextTerm ? [item('next_term', 'preview', nextTerm)] : []),
        ...(nextGrade ? [item('next_grade', 'preview', nextGrade)] : []),
      ]
      break
    case 'winter_break':
      recommendations = [
        item('next_term', 'preview', lower),
        ...(nextGrade ? [item('next_grade', 'preview', nextGrade)] : []),
        item('history', 'current', upper),
      ]
      break
    case 'lower_term':
      recommendations = [
        item('current', 'current', lower),
        ...(nextGrade ? [item('next_grade', 'preview', nextGrade)] : []),
        item('history', 'current', upper),
      ]
      break
    case 'summer_break':
      recommendations = [
        ...(nextGrade ? [item('next_grade', 'preview', nextGrade)] : []),
        item('history', 'current', lower),
        item('history', 'current', upper),
      ]
      break
  }

  return recommendations.map((recommendation, index) => ({ ...recommendation, priority: index + 1 }))
}
