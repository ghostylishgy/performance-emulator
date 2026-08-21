import type { DeathCauseId, Outcome, PairCodeResult, PairRelationship, PersonaId, V3TestDefinition } from '../config/v3-types'

export const PAIR_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
export const PAIR_CODE_LENGTH = 5
export const SUPPORTED_PAIR_ALGORITHM_VERSION = 3

export const PAIR_CODE_PERSONAS: PersonaId[] = [
  'single_point_failure', 'invisible_contributor', 'result_captioner', 'wild_middleware',
  'reality_patcher', 'desk_firewall', 'org_weather_station', 'stable_worker',
]
export const PAIR_CODE_SCORES: Outcome[] = ['3.25', '3.5-', '3.5', '3.5+', '3.75', '4.0']
export const PAIR_CODE_DEATH_CAUSES: DeathCauseId[] = [
  'strategy_faded', 'credit_unclear', 'quota_tight', 'visibility_lag',
  'civilized_boundary', 'impact_not_enough', 'none',
]

export type PairCodeError =
  | 'invalid_format'
  | 'invalid_character'
  | 'checksum_mismatch'
  | 'unsupported_version'
  | 'invalid_persona'
  | 'invalid_score'
  | 'invalid_death_cause'

export type PairCodeDecodeResult =
  | { ok: true; result: PairCodeResult }
  | { ok: false; error: PairCodeError }

export const pairKey = (left: PersonaId, right: PersonaId): string => [left, right].sort().join('+')

export function getPairRelationship(definition: V3TestDefinition, left: PersonaId, right: PersonaId): PairRelationship {
  const key = pairKey(left, right)
  const relationship = definition.pairRelationships.find((item) => item.key === key)
  if (!relationship) throw new Error(`Missing pair relationship: ${key}`)
  return relationship
}

export function normalizePairCode(value: string): string {
  return value.trim().toUpperCase()
}

function checksumFor(payload: number): number {
  let checksum = 0x1f
  for (let bit = 18; bit >= 0; bit -= 1) {
    const feedback = ((checksum >>> 4) & 1) ^ ((payload >>> bit) & 1)
    checksum = (checksum << 1) & 0x1f
    if (feedback) checksum ^= 0x05
  }
  return checksum ^ 0x1f
}

function encodeBase31(value: number): string {
  const chars = Array<string>(PAIR_CODE_LENGTH)
  for (let index = PAIR_CODE_LENGTH - 1; index >= 0; index -= 1) {
    chars[index] = PAIR_CODE_ALPHABET[value % PAIR_CODE_ALPHABET.length]!
    value = Math.floor(value / PAIR_CODE_ALPHABET.length)
  }
  return chars.join('')
}

export function encodePairCode(result: PairCodeResult): string {
  if (result.algorithmVersion !== SUPPORTED_PAIR_ALGORITHM_VERSION) throw new Error('Unsupported pair-code algorithm version')
  const persona = PAIR_CODE_PERSONAS.indexOf(result.persona)
  const score = PAIR_CODE_SCORES.indexOf(result.performanceScore)
  const deathCause = PAIR_CODE_DEATH_CAUSES.indexOf(result.deathCause)
  if (persona < 0) throw new Error('Invalid persona')
  if (score < 0) throw new Error('Invalid performance score')
  if (deathCause < 0) throw new Error('Invalid death cause')

  // 19-bit payload: version(3), persona(4), score(3), deathCause(3), reserved(6).
  const payload = (result.algorithmVersion << 16) | (persona << 12) | (score << 9) | (deathCause << 6)
  return encodeBase31((payload << 5) | checksumFor(payload))
}

export function decodePairCode(value: string): PairCodeDecodeResult {
  const code = normalizePairCode(value)
  if (code.length !== PAIR_CODE_LENGTH) return { ok: false, error: 'invalid_format' }

  let packed = 0
  for (const char of code) {
    const digit = PAIR_CODE_ALPHABET.indexOf(char)
    if (digit < 0) return { ok: false, error: 'invalid_character' }
    packed = packed * PAIR_CODE_ALPHABET.length + digit
  }
  if (packed > 0xffffff) return { ok: false, error: 'invalid_format' }

  const payload = packed >>> 5
  if ((packed & 0x1f) !== checksumFor(payload)) return { ok: false, error: 'checksum_mismatch' }

  const algorithmVersion = (payload >>> 16) & 0x07
  const personaIndex = (payload >>> 12) & 0x0f
  const scoreIndex = (payload >>> 9) & 0x07
  const deathCauseIndex = (payload >>> 6) & 0x07
  if (algorithmVersion !== SUPPORTED_PAIR_ALGORITHM_VERSION) return { ok: false, error: 'unsupported_version' }
  if ((payload & 0x3f) !== 0) return { ok: false, error: 'invalid_format' }
  const persona = PAIR_CODE_PERSONAS[personaIndex]
  if (!persona) return { ok: false, error: 'invalid_persona' }
  const performanceScore = PAIR_CODE_SCORES[scoreIndex]
  if (!performanceScore) return { ok: false, error: 'invalid_score' }
  const deathCause = PAIR_CODE_DEATH_CAUSES[deathCauseIndex]
  if (!deathCause) return { ok: false, error: 'invalid_death_cause' }
  return { ok: true, result: { algorithmVersion, persona, performanceScore, deathCause } }
}

export function pairCodeFromShareOptions(options: { pairCode?: string } | undefined): string | null {
  const code = normalizePairCode(options?.pairCode ?? '')
  return decodePairCode(code).ok ? code : null
}

export function pairCodeErrorMessage(error: PairCodeError): string {
  if (error === 'checksum_mismatch') return '对口径码校验失败，请检查是否输错。'
  if (error === 'unsupported_version') return '这个对口径码来自暂不支持的版本。'
  if (error === 'invalid_character') return '对口径码包含无效字符。'
  return '对口径码格式无效。'
}
