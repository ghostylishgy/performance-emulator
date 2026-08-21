import type { Answers, DeathCauseId, EvaluationResult, NormalOutcome, Outcome, ResultViewModel, V3TestDefinition } from '../config/v3-types'
import { determineDeathCause } from './v3-death-cause'
import { selectEvidence } from './v3-evidence'
import { selectPersona } from './v3-persona'

const round = (value: number): number => Math.round((value + 1e-9) * 100) / 100

function selectedKey(answers: Answers, questionId: string): string {
  const optionId = answers[questionId]
  if (!optionId) throw new Error(`Missing answer for ${questionId}`)
  return `${questionId}${optionId}`
}

export function assertCompleteAnswers(definition: V3TestDefinition, answers: Answers): void {
  for (const question of definition.questions) {
    const optionId = answers[question.id]
    if (!optionId || !question.options.some((option) => option.id === optionId)) throw new Error(`Missing or invalid answer for ${question.id}`)
  }
}

export function outcomeForBaseScore(definition: V3TestDefinition, score: number): NormalOutcome {
  let outcome = definition.outcomeThresholds[0]?.outcome
  if (!outcome) throw new Error('Outcome thresholds cannot be empty')
  for (const threshold of definition.outcomeThresholds) if (score >= threshold.min) outcome = threshold.outcome
  return outcome
}

export function calculateBaseScore(definition: V3TestDefinition, answers: Answers): number {
  return round(definition.questions.reduce((sum, question) => {
    const option = question.options.find((item) => item.id === answers[question.id])
    if (!option) throw new Error(`Missing or invalid answer for ${question.id}`)
    return sum + question.weight * option.coefficient
  }, 0))
}

export function calculateDimensions(definition: V3TestDefinition, answers: Answers): Record<'P' | 'V' | 'I' | 'J' | 'A', number> {
  const totals = { P: 0, V: 0, I: 0, J: 0, A: 0 }
  const counts = { P: 0, V: 0, I: 0, J: 0, A: 0 }
  for (const question of definition.questions) {
    const option = question.options.find((item) => item.id === answers[question.id])
    if (!option) throw new Error(`Missing or invalid answer for ${question.id}`)
    for (const dimension of definition.dimensions) {
      const value = option.dimensionEffects[dimension.id]
      if (value !== undefined) {
        totals[dimension.id] += value
        counts[dimension.id] += 1
      }
    }
  }
  return Object.fromEntries(definition.dimensions.map(({ id }) => [id, counts[id] ? Math.round(totals[id] / counts[id]) : 0])) as Record<'P' | 'V' | 'I' | 'J' | 'A', number>
}

export function calculateOrganization(definition: V3TestDefinition, answers: Answers): {
  metrics: Record<'L' | 'S' | 'R' | 'N', number>
  score: number
  signals: DeathCauseId[]
} {
  const values = definition.organization.values
  const lookup = (metric: keyof typeof values, questionId: string): number => {
    const value = values[metric][selectedKey(answers, questionId)]
    if (value === undefined) throw new Error(`Missing organization value for ${metric}.${questionId}`)
    return value
  }
  const metrics = {
    L: round(lookup('L', 'Q22') * .7 + lookup('L', 'Q24') * .3),
    S: lookup('S', 'Q19'),
    R: round(lookup('R', 'Q14') * .3 + lookup('R', 'Q21') * .7),
    N: lookup('N', 'Q24'),
  }
  const score = round(Object.entries(definition.organization.weights)
    .reduce((sum, [metric, weight]) => sum + metrics[metric as keyof typeof metrics] * weight, 0))
  const signals: DeathCauseId[] = []
  if (answers.Q19 === 'D') signals.push('strategy_faded')
  if (answers.Q21 === 'C' || answers.Q21 === 'D') signals.push('credit_unclear')
  if (answers.Q24 === 'C' || answers.Q24 === 'D') signals.push('quota_tight')
  return { metrics, score, signals }
}

export function moveOutcome(outcome: NormalOutcome, delta: -1 | 0 | 1, scale: NormalOutcome[]): NormalOutcome {
  const index = scale.indexOf(outcome)
  if (index < 0) throw new Error(`Unknown outcome ${outcome}`)
  return scale[Math.max(0, Math.min(scale.length - 1, index + delta))]!
}

export function evaluateComplete(definition: V3TestDefinition, answers: Answers): EvaluationResult {
  assertCompleteAnswers(definition, answers)
  const baseScore = calculateBaseScore(definition, answers)
  const baseOutcome = outcomeForBaseScore(definition, baseScore)
  const dimensions = calculateDimensions(definition, answers)
  const organization = calculateOrganization(definition, answers)
  let calibrationDelta: -1 | 0 | 1 = organization.score >= definition.organization.upThreshold ? 1
    : organization.score <= definition.organization.downThreshold ? -1 : 0
  if (calibrationDelta === 1 && organization.signals.some((signal) => definition.organization.upwardBlockSignals.includes(signal))) calibrationDelta = 0
  const genericOutcome = moveOutcome(baseOutcome, calibrationDelta, definition.outcomeScale)
  const specialHit = baseScore >= 86 && organization.score >= 88 && organization.metrics.L >= 85
    && organization.metrics.S >= 80 && organization.metrics.R >= 80 && organization.signals.length === 0
  const finalOutcome: Outcome = specialHit ? '4.0' : genericOutcome
  const persona = selectPersona(definition, answers)
  const deathCause = determineDeathCause({
    answers, organizationSignals: organization.signals, baseScore, baseOutcome,
    organizationMetrics: { L: organization.metrics.L }, primaryPersona: persona.primary,
  })
  const evidence = selectEvidence(definition, answers, persona.primary, deathCause)
  return {
    testId: definition.id, testVersion: definition.version, evaluationVersion: definition.evaluationVersion,
    answers: { ...answers }, baseScore, baseOutcome, dimensions,
    organizationMetrics: organization.metrics, organizationScore: organization.score,
    organizationSignals: organization.signals, calibrationDelta, finalOutcome,
    candidates: persona.candidates, primaryPersona: persona.primary, deathCause, evidence,
  }
}

export function createResultViewModel(definition: V3TestDefinition, result: EvaluationResult): ResultViewModel {
  const persona = definition.personas.find((item) => item.id === result.primaryPersona)
  if (!persona) throw new Error(`Missing persona ${result.primaryPersona}`)
  return {
    personaId: persona.id, personaName: persona.name, personaCopy: persona.copy,
    deathCause: result.deathCause, deathCauseLabel: definition.deathCauseLabels[result.deathCause],
    evidence: result.evidence, outcome: result.finalOutcome, outcomeSubtitle: definition.outcomeSubtitles[result.finalOutcome],
    baseOutcome: result.baseOutcome, baseScore: result.baseScore, organizationScore: result.organizationScore,
    calibrationDelta: result.calibrationDelta,
    metricBars: definition.dimensions.map((dimension) => ({ id: dimension.id, label: dimension.name, value: result.dimensions[dimension.id] })),
    resultDisclaimer: definition.resultDisclaimer,
  }
}
