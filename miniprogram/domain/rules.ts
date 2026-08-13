import type { RuleCondition } from '../config/types'

export interface RuleFacts {
  normalizedMetric: Record<string, number>
  rawMetric: Record<string, number>
  signal: Record<string, boolean>
  personaEvidence: Record<string, number>
  result: Record<string, string | number | boolean>
}

function compare(actual: unknown, op: string, expected: unknown): boolean {
  switch (op) {
    case 'eq': return actual === expected
    case 'neq': return actual !== expected
    case 'gt': return Number(actual) > Number(expected)
    case 'gte': return Number(actual) >= Number(expected)
    case 'lt': return Number(actual) < Number(expected)
    case 'lte': return Number(actual) <= Number(expected)
    case 'in': return Array.isArray(expected) && expected.includes(actual as never)
    default: return false
  }
}

export function evaluateCondition(condition: RuleCondition, facts: RuleFacts): boolean {
  if ('all' in condition) return condition.all.every((item) => evaluateCondition(item, facts))
  if ('any' in condition) return condition.any.some((item) => evaluateCondition(item, facts))
  if ('not' in condition) return !evaluateCondition(condition.not, facts)
  return compare(facts[condition.fact.namespace][condition.fact.key], condition.op, condition.value)
}

export function buildRuleFacts(input: {
  normalizedMetrics: Record<string, number>
  rawMetrics: Record<string, number>
  signals: string[]
  personaEvidence: Record<string, number>
  result: Record<string, string | number | boolean>
}): RuleFacts {
  return {
    normalizedMetric: input.normalizedMetrics,
    rawMetric: input.rawMetrics,
    signal: Object.fromEntries(input.signals.map((signal) => [signal, true])),
    personaEvidence: input.personaEvidence,
    result: input.result,
  }
}

