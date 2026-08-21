import type { PairRelationship, PairResultSnapshot, PersonaId, V3TestDefinition } from '../config/v3-types'

export const pairKey = (left: PersonaId, right: PersonaId): string => [left, right].sort().join('+')

export function getPairRelationship(definition: V3TestDefinition, left: PersonaId, right: PersonaId): PairRelationship {
  const key = pairKey(left, right)
  const relationship = definition.pairRelationships.find((item) => item.key === key)
  if (!relationship) throw new Error(`Missing pair relationship: ${key}`)
  return relationship
}

export interface PairCodeRecord extends PairResultSnapshot {
  resultId: string
  code: string
  createdAt: number
  expiresAt: number
}

export type PairRecordResolution =
  | { status: 'success'; result: PairResultSnapshot }
  | { status: 'invalid' }
  | { status: 'expired' }

export function normalizePairCode(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toUpperCase()
}

export function resolvePairRecord(record: PairCodeRecord | null, now: number): PairRecordResolution {
  if (!record) return { status: 'invalid' }
  if (record.expiresAt <= now) return { status: 'expired' }
  return {
    status: 'success',
    result: {
      resultId: record.resultId,
      persona: record.persona,
      score: record.score,
      deathCause: record.deathCause,
      evaluationVersion: record.evaluationVersion,
    },
  }
}
