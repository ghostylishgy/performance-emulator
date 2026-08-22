import type {
  Answers, DeathCauseId, EvidenceCategory, EvidenceSynthesisRule, PersonaId, SelectedEvidence, V3TestDefinition,
} from '../config/v3-types'
import { personaRelevance } from './v3-persona'

interface RankedEvidence extends SelectedEvidence {
  rank: number
  deathMatch: boolean
  questionSignature: string
}

const selectedKeys = (answers: Answers): Set<string> => new Set(
  Object.entries(answers).map(([questionId, optionId]) => `${questionId}${optionId}`),
)

const questionIdFromAnswer = (answerKey: string): string => answerKey.slice(0, -1)
const questionNumber = (questionId: string): number => Number(questionId.slice(1))
const questionBand = (questionId: string): number => Math.floor((questionNumber(questionId) - 1) / 8)

export function synthesisRuleMatches(rule: EvidenceSynthesisRule, answers: Answers, persona: PersonaId): boolean {
  const selected = selectedKeys(answers)
  return rule.personaTags.includes(persona)
    && rule.requiredAnswers.every((answer) => selected.has(answer))
    && !rule.excludedAnswers.some((answer) => selected.has(answer))
}

function deathMatchForAnswers(definition: V3TestDefinition, answerKeys: string[], deathCause: DeathCauseId): boolean {
  if (deathCause === 'none') return false
  return answerKeys.some((answerKey) => {
    const questionId = questionIdFromAnswer(answerKey)
    const optionId = answerKey.slice(-1)
    const option = definition.questions.find((question) => question.id === questionId)?.options.find((item) => item.id === optionId)
    return option?.evidence.deathTags.includes(deathCause) ?? false
  })
}

export function rankSynthesisEvidence(
  definition: V3TestDefinition,
  answers: Answers,
  persona: PersonaId,
  deathCause: DeathCauseId,
): RankedEvidence[] {
  const selected = selectedKeys(answers)
  return definition.evidenceSynthesisRules
    .filter((rule) => synthesisRuleMatches(rule, answers, persona))
    .map((rule) => {
      const optionalMatches = rule.optionalAnswers.filter((answer) => selected.has(answer))
      const answerKeys = [...rule.requiredAnswers, ...optionalMatches]
      const questionIds = [...new Set(answerKeys.map(questionIdFromAnswer))]
      return {
        id: rule.id,
        source: 'synthesis' as const,
        questionIds,
        answerKeys,
        text: rule.text,
        category: rule.category,
        rank: 100000 + rule.priority * 100 + answerKeys.length * 10 + optionalMatches.length * 8,
        deathMatch: deathMatchForAnswers(definition, answerKeys, deathCause),
        questionSignature: [...questionIds].sort().join('+'),
      }
    })
    .sort((left, right) => right.rank - left.rank || left.id.localeCompare(right.id))
}

function rankSingleEvidence(
  definition: V3TestDefinition,
  answers: Answers,
  persona: PersonaId,
  deathCause: DeathCauseId,
): RankedEvidence[] {
  return definition.questions.map((question) => {
    const optionId = answers[question.id]
    const option = question.options.find((item) => item.id === optionId)
    if (!option || !optionId) throw new Error(`Missing selected option for ${question.id}`)
    const answerKey = `${question.id}${optionId}`
    const relevance = personaRelevance(definition, persona, answerKey)
    const tagged = option.evidence.personaTags.includes(persona) ? 2 : 0
    const deathMatch = option.evidence.deathTags.includes(deathCause)
    return {
      id: `single-${answerKey}`,
      source: 'single' as const,
      questionIds: [question.id],
      answerKeys: [answerKey],
      text: option.evidence.text,
      category: option.evidence.category,
      rank: relevance * 100 + tagged * 50 + option.evidence.priority - (deathMatch ? 3 : 0),
      deathMatch,
      questionSignature: question.id,
    }
  }).sort((left, right) => right.rank - left.rank || questionNumber(left.questionIds[0]!) - questionNumber(right.questionIds[0]!))
}

export function selectEvidence(definition: V3TestDefinition, answers: Answers, persona: PersonaId, deathCause: DeathCauseId): SelectedEvidence[] {
  const candidates = [
    ...rankSynthesisEvidence(definition, answers, persona, deathCause),
    ...rankSingleEvidence(definition, answers, persona, deathCause),
  ]
  const chosen: RankedEvidence[] = []

  const choose = (category?: EvidenceCategory): void => {
    const usedBands = new Set(chosen.flatMap((item) => item.questionIds.map(questionBand)))
    const ranked = candidates
      .filter((candidate) => !chosen.some((item) => item.id === candidate.id)
        && !chosen.some((item) => item.questionSignature === candidate.questionSignature)
        && (!category || candidate.category === category)
        && !(candidate.deathMatch && chosen.some((item) => item.deathMatch)))
      .map((candidate) => ({
        candidate,
        adjustedRank: candidate.rank
          + candidate.questionIds.filter((id) => !chosen.some((item) => item.questionIds.includes(id))).length * 4
          + candidate.questionIds.filter((id) => !usedBands.has(questionBand(id))).length * 6
          - candidate.questionIds.filter((id) => chosen.some((item) => item.questionIds.includes(id))).length * 8,
      }))
      .sort((left, right) => right.adjustedRank - left.adjustedRank || left.candidate.id.localeCompare(right.candidate.id))
    if (ranked[0]) chosen.push(ranked[0].candidate)
  }

  choose('work_behavior')
  choose('expression_org')
  choose('human_moment')
  while (chosen.length < 3) {
    const before = chosen.length
    choose()
    if (chosen.length === before) break
  }

  return chosen.slice(0, 3).map(({ id, source, questionIds, answerKeys, text, category }) => ({
    id, source, questionIds, answerKeys, text, category,
  }))
}
