import type {
  Answers,
  EvaluationResult,
  NormalOutcome,
  PersonalEvaluation,
  ResultViewModel,
  TestDefinition,
} from '../config/types'
import { calibrate, weightedScore } from './calibration'
import { deriveTheoreticalRanges, normalizeMetrics } from './normalization'
import { matchPersonas } from './persona'
import { buildRuleFacts, evaluateCondition } from './rules'
import { aggregateAnswers, assertCompleteAnswers, questionsForSections, selectAnswers } from './scoring'

export function outcomeForScore(definition: TestDefinition, score: number): NormalOutcome {
  let selected = definition.outcomeConfig.thresholds[0]?.outcome
  if (!selected) throw new Error('Outcome thresholds cannot be empty')
  for (const band of definition.outcomeConfig.thresholds) {
    if (score >= band.min) selected = band.outcome
  }
  return selected
}

export function evaluatePersonal(definition: TestDefinition, answers: Answers): PersonalEvaluation {
  const questions = questionsForSections(definition, ['personal'])
  assertCompleteAnswers(questions, answers)
  const personalAnswers = selectAnswers(questions, answers)
  const aggregate = aggregateAnswers(questions, personalAnswers)
  const ranges = deriveTheoreticalRanges(definition, questions)
  const normalizedMetrics = normalizeMetrics(aggregate.rawMetrics, ranges)
  const performanceIndex = weightedScore(normalizedMetrics, definition.performanceWeights)
  return {
    answers: personalAnswers,
    rawMetrics: aggregate.rawMetrics,
    normalizedMetrics,
    ranges,
    signals: aggregate.signals,
    personaEvidence: aggregate.personaEvidence,
    performanceIndex,
    baseOutcome: outcomeForScore(definition, performanceIndex),
  }
}

export function evaluateFromFrozen(
  definition: TestDefinition,
  frozenPersonalAnswers: Answers,
  organizationAnswers: Answers,
): EvaluationResult {
  const personal = evaluatePersonal(definition, frozenPersonalAnswers)
  const organizationQuestions = questionsForSections(definition, ['organization'])
  assertCompleteAnswers(organizationQuestions, organizationAnswers)
  const cleanOrganizationAnswers = selectAnswers(organizationQuestions, organizationAnswers)
  const answers = { ...personal.answers, ...cleanOrganizationAnswers }
  const allQuestions = questionsForSections(definition, ['personal', 'organization'])
  const aggregate = aggregateAnswers(allQuestions, answers)
  const ranges = deriveTheoreticalRanges(definition, allQuestions)
  const normalizedMetrics = normalizeMetrics(aggregate.rawMetrics, ranges)
  const calibration = calibrate(definition, personal.baseOutcome, normalizedMetrics, aggregate.signals)

  const baseFacts = buildRuleFacts({
    normalizedMetrics,
    rawMetrics: aggregate.rawMetrics,
    signals: aggregate.signals,
    personaEvidence: aggregate.personaEvidence,
    result: {
      baseOutcome: personal.baseOutcome,
      performanceIndex: personal.performanceIndex,
      organizationScore: calibration.organizationScore,
      calibrationDelta: calibration.delta,
      genericOutcome: calibration.genericOutcome,
    },
  })
  const specialHit = evaluateCondition(definition.specialOutcomeConfig.condition, baseFacts)
  const finalOutcome = specialHit ? definition.specialOutcomeConfig.outcome : calibration.genericOutcome
  const facts = buildRuleFacts({
    normalizedMetrics,
    rawMetrics: aggregate.rawMetrics,
    signals: aggregate.signals,
    personaEvidence: aggregate.personaEvidence,
    result: {
      ...baseFacts.result,
      finalOutcome,
    },
  })
  const personas = matchPersonas(definition, facts)

  return {
    testId: definition.id,
    testVersion: definition.version,
    evaluationVersion: definition.evaluationVersion,
    answers,
    personalAnswersSnapshot: { ...personal.answers },
    rawMetrics: aggregate.rawMetrics,
    normalizedMetrics,
    signals: aggregate.signals,
    personaEvidence: aggregate.personaEvidence,
    performanceIndex: personal.performanceIndex,
    baseOutcome: personal.baseOutcome,
    organizationScore: calibration.organizationScore,
    calibrationDelta: calibration.delta,
    calibrationReason: calibration.reason,
    finalOutcome,
    matchedPersonas: personas.matched,
    primaryPersona: personas.primary,
    hiddenResults: specialHit ? [definition.specialOutcomeConfig.hiddenResultId] : [],
  }
}

export function evaluateComplete(definition: TestDefinition, answers: Answers): EvaluationResult {
  const personalQuestions = questionsForSections(definition, ['personal'])
  const organizationQuestions = questionsForSections(definition, ['organization'])
  return evaluateFromFrozen(
    definition,
    selectAnswers(personalQuestions, answers),
    selectAnswers(organizationQuestions, answers),
  )
}

export function createResultViewModel(definition: TestDefinition, result: EvaluationResult): ResultViewModel {
  const persona = definition.personas.find((item) => item.id === result.primaryPersona)
  if (!persona) throw new Error(`Missing persona: ${result.primaryPersona}`)
  const metricBars = ['P', 'V', 'I', 'K', 'F'].map((id) => {
    const metric = definition.metrics.find((item) => item.id === id)
    if (!metric) throw new Error(`Missing metric: ${id}`)
    return { id, label: metric.name, value: Math.round(result.normalizedMetrics[id] ?? 0) }
  })
  return {
    outcome: result.finalOutcome,
    outcomeSubtitle: definition.outcomeConfig.subtitles[result.finalOutcome],
    personaName: persona.name,
    personaCopy: persona.copy,
    baseOutcome: result.baseOutcome,
    calibrationReason: result.calibrationReason,
    metricBars,
    hiddenResults: result.hiddenResults.map((id) => {
      const hidden = definition.hiddenResults.find((item) => item.id === id)
      if (!hidden) throw new Error(`Missing hidden result: ${id}`)
      return hidden
    }),
    resultDisclaimer: definition.resultDisclaimer,
  }
}
