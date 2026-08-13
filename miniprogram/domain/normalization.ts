import type { MetricRange, QuestionDefinition, TestDefinition } from '../config/types'

export function deriveTheoreticalRanges(
  definition: TestDefinition,
  questions: QuestionDefinition[],
): Record<string, MetricRange> {
  const sections = new Set(questions.map((question) => question.section))
  const ranges: Record<string, MetricRange> = {}

  for (const metric of definition.metrics) {
    if (!metric.collectFrom.some((section) => sections.has(section))) continue
    let min = 0
    let max = 0
    for (const question of questions) {
      if (!metric.collectFrom.includes(question.section)) continue
      const values = question.options.map((option) => option.effects[metric.id] ?? 0)
      min += Math.min(...values)
      max += Math.max(...values)
    }
    ranges[metric.id] = { min, max }
  }
  return ranges
}

export function normalizeValue(raw: number, range: MetricRange): number {
  if (range.max === range.min) return 50
  const normalized = ((raw - range.min) / (range.max - range.min)) * 100
  return Math.round(Math.max(0, Math.min(100, normalized)) * 100) / 100
}

export function normalizeMetrics(
  rawMetrics: Record<string, number>,
  ranges: Record<string, MetricRange>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(ranges).map(([metric, range]) => [metric, normalizeValue(rawMetrics[metric] ?? 0, range)]),
  )
}

