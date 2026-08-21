import type { Answers, DeathCauseId, EvidenceCategory, PersonaId, SelectedEvidence, V3TestDefinition } from '../config/v3-types'
import { personaRelevance } from './v3-persona'

interface RankedEvidence extends SelectedEvidence { rank: number; deathMatch: boolean }

export function selectEvidence(definition: V3TestDefinition, answers: Answers, persona: PersonaId, deathCause: DeathCauseId): SelectedEvidence[] {
  const ranked: RankedEvidence[] = definition.questions.map((question) => {
    const optionId = answers[question.id]
    const option = question.options.find((item) => item.id === optionId)
    if (!option || !optionId) throw new Error(`Missing selected option for ${question.id}`)
    const answerKey = `${question.id}${optionId}`
    const relevance = personaRelevance(definition, persona, answerKey)
    const tagged = option.evidence.personaTags.includes(persona) ? 2 : 0
    const deathMatch = option.evidence.deathTags.includes(deathCause)
    return {
      questionId: question.id,
      optionId,
      text: option.evidence.text,
      category: option.evidence.category,
      rank: relevance * 100 + tagged * 50 + option.evidence.priority - (deathMatch ? 3 : 0),
      deathMatch,
    }
  }).sort((left, right) => right.rank - left.rank || Number(left.questionId.slice(1)) - Number(right.questionId.slice(1)))

  const chosen: RankedEvidence[] = []
  const take = (category?: EvidenceCategory, avoidDeathRepeat = false): void => {
    const candidate = ranked.find((item) => !chosen.some((picked) => picked.questionId === item.questionId)
      && (!category || item.category === category)
      && (!avoidDeathRepeat || !item.deathMatch || !chosen.some((picked) => picked.deathMatch)))
    if (candidate) chosen.push(candidate)
  }
  take('work_behavior')
  take('expression_org')
  take('human_moment', true)
  while (chosen.length < 3) take(undefined, true)
  return chosen.slice(0, 3).map(({ questionId, optionId, text, category }) => ({ questionId, optionId, text, category }))
}
