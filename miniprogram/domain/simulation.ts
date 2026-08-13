import type { Answers, TestDefinition } from '../config/types'
import { evaluateComplete } from './evaluation-pipeline'

export type SimulationDistribution = 'uniform' | 'weighted'

export interface SummaryStats {
  mean: number
  std: number
  min: number
  max: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

export interface SimulationReport {
  metadata: {
    testId: string
    testVersion: string
    evaluationVersion: string
    runs: number
    distribution: SimulationDistribution
    seed: number
    optionWeights: number[]
  }
  metricCoverage: Record<string, { questions: number; theoreticalMin: number; theoreticalMax: number }>
  metricStats: Record<string, SummaryStats>
  correlationMatrix: Record<string, Record<string, number>>
  focusCorrelations: Record<string, number>
  performanceIndexStats: SummaryStats
  organizationScoreStats: SummaryStats
  baseOutcomeDistribution: Record<string, { count: number; percent: number }>
  finalOutcomeDistribution: Record<string, { count: number; percent: number }>
  calibrationDistribution: Record<string, { count: number; percent: number }>
  personaDistribution: Record<string, { count: number; percent: number }>
  quadrantDistribution: Record<string, { count: number; percent: number }>
  signalHitRates: Record<string, { count: number; percent: number }>
  fourPointZeroHitRate: number
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0 || 0x9e3779b9
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 0x1_0000_0000
  }
}

function round(value: number, digits = 4): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function percentile(sorted: number[], percentileValue: number): number {
  if (!sorted.length) return 0
  const position = (sorted.length - 1) * percentileValue
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  const low = sorted[lower] ?? 0
  const high = sorted[upper] ?? low
  return low + (high - low) * (position - lower)
}

export function summarize(values: number[]): SummaryStats {
  if (!values.length) return { mean: 0, std: 0, min: 0, max: 0, p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  const sorted = [...values].sort((a, b) => a - b)
  return {
    mean: round(mean),
    std: round(Math.sqrt(variance)),
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    p10: round(percentile(sorted, 0.10)),
    p25: round(percentile(sorted, 0.25)),
    p50: round(percentile(sorted, 0.50)),
    p75: round(percentile(sorted, 0.75)),
    p90: round(percentile(sorted, 0.90)),
  }
}

function correlation(left: number[], right: number[]): number {
  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length
  let numerator = 0
  let leftSquares = 0
  let rightSquares = 0
  for (let index = 0; index < left.length; index += 1) {
    const leftDelta = (left[index] ?? 0) - leftMean
    const rightDelta = (right[index] ?? 0) - rightMean
    numerator += leftDelta * rightDelta
    leftSquares += leftDelta ** 2
    rightSquares += rightDelta ** 2
  }
  const denominator = Math.sqrt(leftSquares * rightSquares)
  return denominator === 0 ? 0 : round(numerator / denominator)
}

function increment(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1
}

function formatDistribution(counts: Record<string, number>, runs: number): Record<string, { count: number; percent: number }> {
  return Object.fromEntries(Object.entries(counts).map(([key, count]) => [key, { count, percent: round((count / runs) * 100) }]))
}

function pickOption(random: () => number, weights: number[]): number {
  const value = random()
  let cumulative = 0
  for (let index = 0; index < weights.length; index += 1) {
    cumulative += weights[index] ?? 0
    if (value < cumulative) return index
  }
  return weights.length - 1
}

export function runSimulation(input: {
  definition: TestDefinition
  runs: number
  distribution: SimulationDistribution
  seed: number
  weightedOptionProbabilities?: number[]
}): SimulationReport {
  const { definition, runs, distribution, seed } = input
  if (!Number.isInteger(runs) || runs <= 0) throw new Error('runs must be a positive integer')
  const configuredWeights = input.weightedOptionProbabilities ?? [0.35, 0.32, 0.20, 0.13]
  const weights = distribution === 'uniform' ? [0.25, 0.25, 0.25, 0.25] : configuredWeights
  if (weights.length !== 4 || Math.abs(weights.reduce((sum, value) => sum + value, 0) - 1) > 1e-9) throw new Error('option weights must contain four values that sum to 1')

  const random = createRandom(seed)
  const metricIds = definition.metrics.map((metric) => metric.id)
  const valuesByMetric = Object.fromEntries(metricIds.map((metric) => [metric, [] as number[]]))
  const performanceValues: number[] = []
  const organizationValues: number[] = []
  const baseCounts: Record<string, number> = {}
  const finalCounts: Record<string, number> = {}
  const calibrationCounts: Record<string, number> = {}
  const personaCounts: Record<string, number> = {}
  const quadrantCounts: Record<string, number> = {}
  const signalCounts: Record<string, number> = Object.fromEntries(definition.signalIds.map((signal) => [signal, 0]))

  for (let run = 0; run < runs; run += 1) {
    const answers: Answers = {}
    for (const question of definition.questions) {
      const option = question.options[pickOption(random, weights)]
      if (!option) throw new Error(`${question.id} has no selectable option`)
      answers[question.id] = option.id
    }
    const result = evaluateComplete(definition, answers)
    for (const metric of metricIds) valuesByMetric[metric]!.push(result.normalizedMetrics[metric] ?? 0)
    performanceValues.push(result.performanceIndex)
    organizationValues.push(result.organizationScore)
    increment(baseCounts, result.baseOutcome)
    increment(finalCounts, result.finalOutcome)
    increment(calibrationCounts, String(result.calibrationDelta))
    increment(personaCounts, result.primaryPersona)
    const highA = (result.normalizedMetrics.A ?? 0) >= 50
    const highO = (result.normalizedMetrics.O ?? 0) >= 50
    increment(quadrantCounts, `${highA ? 'highA' : 'lowA'}_${highO ? 'highO' : 'lowO'}`)
    for (const signal of result.signals) increment(signalCounts, signal)
  }

  const metricStats = Object.fromEntries(metricIds.map((metric) => [metric, summarize(valuesByMetric[metric] ?? [])]))
  const correlationMatrix = Object.fromEntries(metricIds.map((left) => [left, Object.fromEntries(metricIds.map((right) => [right, correlation(valuesByMetric[left]!, valuesByMetric[right]!)]))]))
  const metricCoverage = Object.fromEntries(definition.metrics.map((metric) => {
    const relevant = definition.questions.filter((question) => metric.collectFrom.includes(question.section))
    const contributions = relevant.filter((question) => question.options.some((option) => option.effects[metric.id] !== undefined))
    const theoreticalMin = relevant.reduce((sum, question) => sum + Math.min(...question.options.map((option) => option.effects[metric.id] ?? 0)), 0)
    const theoreticalMax = relevant.reduce((sum, question) => sum + Math.max(...question.options.map((option) => option.effects[metric.id] ?? 0)), 0)
    return [metric.id, { questions: contributions.length, theoreticalMin, theoreticalMax }]
  }))

  return {
    metadata: { testId: definition.id, testVersion: definition.version, evaluationVersion: definition.evaluationVersion, runs, distribution, seed, optionWeights: weights },
    metricCoverage,
    metricStats,
    correlationMatrix,
    focusCorrelations: {
      'V:F': correlation(valuesByMetric.V!, valuesByMetric.F!),
      'V:R': correlation(valuesByMetric.V!, valuesByMetric.R!),
      'P:A': correlation(valuesByMetric.P!, valuesByMetric.A!),
      'K:O': correlation(valuesByMetric.K!, valuesByMetric.O!),
    },
    performanceIndexStats: summarize(performanceValues),
    organizationScoreStats: summarize(organizationValues),
    baseOutcomeDistribution: formatDistribution(baseCounts, runs),
    finalOutcomeDistribution: formatDistribution(finalCounts, runs),
    calibrationDistribution: formatDistribution(calibrationCounts, runs),
    personaDistribution: formatDistribution(personaCounts, runs),
    quadrantDistribution: formatDistribution(quadrantCounts, runs),
    signalHitRates: formatDistribution(signalCounts, runs),
    fourPointZeroHitRate: round(((finalCounts['4.0'] ?? 0) / runs) * 100),
  }
}
