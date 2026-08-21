import { performanceSimulator as definition } from '../miniprogram/config/tests/performance-simulator'
import type { Answers } from '../miniprogram/config/v3-types'
import { evaluateComplete } from '../miniprogram/domain/v3-evaluation'

function repeated(option: 'A' | 'B' | 'C' | 'D'): Answers {
  return Object.fromEntries(definition.questions.map((question) => [question.id, option]))
}

for (const option of ['A', 'B', 'C', 'D'] as const) {
  const result = evaluateComplete(definition, repeated(option))
  console.log(`all${option}`, { baseScore: result.baseScore, base: result.baseOutcome, org: result.organizationScore, delta: result.calibrationDelta, final: result.finalOutcome, persona: result.primaryPersona, deathCause: result.deathCause })
}
