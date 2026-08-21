import type { Answers, PersonaCandidate, PersonaCriterion, PersonaDefinition, PersonaId, V3TestDefinition } from '../config/v3-types'

const selectedKeys = (answers: Answers): Set<string> => new Set(Object.entries(answers).map(([questionId, optionId]) => `${questionId}${optionId}`))
const axisValue = (scores: Record<string, number>, axis: string): number => scores[axis] ?? 0

export function criterionMatches(criterion: PersonaCriterion, scores: Record<string, number>, selected: Set<string>): boolean {
  if (criterion.kind === 'axisMin') return axisValue(scores, criterion.axis) >= criterion.min
  if (criterion.kind === 'maxAxisMin') return Math.max(...criterion.axes.map((axis) => axisValue(scores, axis))) >= criterion.min
  if (criterion.kind === 'axisSumMin') return criterion.axes.reduce((sum, axis) => sum + axisValue(scores, axis), 0) >= criterion.min
  if (criterion.kind === 'selectedCountMin') return criterion.answers.filter((answer) => selected.has(answer)).length >= criterion.min
  if (criterion.kind === 'axisDifferenceMin') {
    const left = criterion.leftAxes.reduce((sum, axis) => sum + axisValue(scores, axis), 0)
    const right = criterion.rightAxes.reduce((sum, axis) => sum + axisValue(scores, axis), 0)
    return left - right >= criterion.min
  }
  return criterion.criteria.some((item) => criterionMatches(item, scores, selected))
}

export function theoreticalMaximum(persona: PersonaDefinition): number {
  const byQuestion = new Map<string, Map<string, number>>()
  for (const axis of Object.values(persona.signals)) {
    for (const [answerKey, points] of Object.entries(axis)) {
      const questionId = answerKey.slice(0, -1)
      const optionId = answerKey.slice(-1)
      const options = byQuestion.get(questionId) ?? new Map<string, number>()
      options.set(optionId, (options.get(optionId) ?? 0) + points)
      byQuestion.set(questionId, options)
    }
  }
  return [...byQuestion.values()].reduce((total, options) => total + Math.max(0, ...options.values()), 0)
}

export function evaluatePersona(persona: PersonaDefinition, answers: Answers): PersonaCandidate | null {
  const selected = selectedKeys(answers)
  const scores: Record<string, number> = {}
  for (const [axis, signals] of Object.entries(persona.signals)) {
    scores[axis] = [...selected].reduce((sum, answerKey) => sum + (signals[answerKey] ?? 0), 0)
  }
  if (!persona.criteria.every((criterion) => criterionMatches(criterion, scores, selected))) return null
  const evidenceScore = Object.values(scores).reduce((sum, value) => sum + value, 0)
  const theoreticalMax = theoreticalMaximum(persona)
  return {
    id: persona.id,
    scores,
    evidenceScore,
    theoreticalMax,
    confidence: theoreticalMax > 0 ? Math.max(0, evidenceScore) / theoreticalMax : 0,
    coreEvidenceCount: persona.coreEvidenceAnswers.filter((answer) => selected.has(answer)).length,
  }
}

export function selectPersona(definition: V3TestDefinition, answers: Answers): { candidates: PersonaCandidate[]; primary: PersonaId } {
  const candidates = definition.personas.map((persona) => evaluatePersona(persona, answers)).filter((item): item is PersonaCandidate => item !== null)
  if (candidates.length === 0) return { candidates: [], primary: definition.fallbackPersonaId }
  const tieIndex = (id: PersonaId) => definition.personaTieBreak.indexOf(id)
  const byConfidence = [...candidates].sort((left, right) => right.confidence - left.confidence || tieIndex(left.id) - tieIndex(right.id))
  const bestConfidence = byConfidence[0]!.confidence
  const close = byConfidence.filter((candidate) => bestConfidence - candidate.confidence < .05)
  const maxCore = Math.max(...close.map((candidate) => candidate.coreEvidenceCount))
  const finalists = close.filter((candidate) => candidate.coreEvidenceCount === maxCore)
    .sort((left, right) => tieIndex(left.id) - tieIndex(right.id))
  return { candidates: byConfidence, primary: finalists[0]!.id }
}

export function personaRelevance(definition: V3TestDefinition, personaId: PersonaId, answerKey: string): number {
  const persona = definition.personas.find((item) => item.id === personaId)
  if (!persona) return 0
  return Object.values(persona.signals).reduce((sum, axis) => sum + Math.max(0, axis[answerKey] ?? 0), 0)
}
