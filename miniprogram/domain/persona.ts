import type { TestDefinition } from '../config/types'
import { evaluateCondition, type RuleFacts } from './rules'

export function matchPersonas(definition: TestDefinition, facts: RuleFacts): { matched: string[]; primary: string } {
  const matched = [...definition.personaRules]
    .sort((a, b) => b.priority - a.priority)
    .filter((rule) => evaluateCondition(rule.conditions, facts))
    .map((rule) => rule.personaId)
  return {
    matched,
    primary: matched[0] ?? definition.fallbackPersonaId,
  }
}

