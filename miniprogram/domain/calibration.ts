import type { NormalOutcome, TestDefinition } from '../config/types'

export interface CalibrationResult {
  organizationScore: number
  delta: -1 | 0 | 1
  reasonId: string
  reason: string
  genericOutcome: NormalOutcome
}

export function weightedScore(values: Record<string, number>, weights: Record<string, number>): number {
  const result = Object.entries(weights).reduce((sum, [metric, weight]) => sum + (values[metric] ?? 0) * weight, 0)
  return Math.round(result * 100) / 100
}

export function moveOutcome(
  outcome: NormalOutcome,
  delta: -1 | 0 | 1,
  scale: NormalOutcome[],
): NormalOutcome {
  const index = scale.indexOf(outcome)
  if (index < 0) throw new Error(`Outcome ${outcome} is not in the normal scale`)
  const next = Math.max(0, Math.min(scale.length - 1, index + delta))
  const value = scale[next]
  if (!value) throw new Error('Outcome scale cannot be empty')
  return value
}

export function calibrate(
  definition: TestDefinition,
  baseOutcome: NormalOutcome,
  normalizedMetrics: Record<string, number>,
  signals: string[],
): CalibrationResult {
  const config = definition.calibrationConfig
  const organizationScore = weightedScore(normalizedMetrics, config.weights)
  let delta: -1 | 0 | 1 = organizationScore >= config.upThreshold ? 1 : organizationScore <= config.downThreshold ? -1 : 0
  const prioritySignal = config.reasonPriority.find((signal) => signals.includes(signal))

  if (delta === 1 && prioritySignal && config.upwardBlockSignals.includes(prioritySignal)) delta = 0

  const reasonId = prioritySignal ?? (delta === 1
    ? 'organization_high'
    : delta === -1
      ? 'organization_low'
      : 'organization_balanced')
  const reason = config.reasons[reasonId]
  if (!reason) throw new Error(`Missing calibration reason: ${reasonId}`)

  return {
    organizationScore,
    delta,
    reasonId,
    reason,
    genericOutcome: moveOutcome(baseOutcome, delta, definition.outcomeConfig.scale),
  }
}

