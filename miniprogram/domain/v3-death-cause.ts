import type { Answers, DeathCauseId, NormalOutcome, PersonaId } from '../config/v3-types'

export interface DeathCauseFacts {
  answers: Answers
  organizationSignals: DeathCauseId[]
  baseScore: number
  baseOutcome: NormalOutcome
  organizationMetrics: { L: number }
  primaryPersona: PersonaId
}

export function determineDeathCause(facts: DeathCauseFacts): DeathCauseId {
  for (const signal of ['strategy_faded', 'credit_unclear', 'quota_tight'] as DeathCauseId[]) {
    if (facts.organizationSignals.includes(signal)) return signal
  }
  const visibilityLag = ['C', 'D'].includes(facts.answers.Q13 ?? '') || ['C', 'D'].includes(facts.answers.Q16 ?? '')
  if (facts.baseScore >= 50 && visibilityLag) return 'visibility_lag'
  if (facts.primaryPersona === 'desk_firewall' && facts.organizationMetrics.L < 78) return 'civilized_boundary'
  if (facts.baseOutcome !== '3.75') return 'impact_not_enough'
  return 'none'
}
