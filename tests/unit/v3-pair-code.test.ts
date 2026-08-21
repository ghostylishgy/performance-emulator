import { afterEach, describe, expect, it } from 'vitest'
import type { PairCodeResult } from '../../miniprogram/config/v3-types'
import {
  decodePairCode, encodePairCode, PAIR_CODE_ALPHABET, PAIR_CODE_DEATH_CAUSES,
  PAIR_CODE_PERSONAS, PAIR_CODE_SCORES, pairCodeFromShareOptions,
  SUPPORTED_PAIR_ALGORITHM_VERSION,
} from '../../miniprogram/domain/v3-pairing'
import { clearPendingPairCode, loadPendingPairCode, savePendingPairCode } from '../../miniprogram/platform/storage'

function checksumFor(payload: number): number {
  let checksum = 0x1f
  for (let bit = 18; bit >= 0; bit -= 1) {
    const feedback = ((checksum >>> 4) & 1) ^ ((payload >>> bit) & 1)
    checksum = (checksum << 1) & 0x1f
    if (feedback) checksum ^= 0x05
  }
  return checksum ^ 0x1f
}

function rawCode(version: number, persona: number, score: number, deathCause: number, reserved = 0): string {
  const payload = (version << 16) | (persona << 12) | (score << 9) | (deathCause << 6) | reserved
  let packed = (payload << 5) | checksumFor(payload)
  const chars = Array<string>(5)
  for (let index = 4; index >= 0; index -= 1) {
    chars[index] = PAIR_CODE_ALPHABET[packed % PAIR_CODE_ALPHABET.length]!
    packed = Math.floor(packed / PAIR_CODE_ALPHABET.length)
  }
  return chars.join('')
}

const sample: PairCodeResult = {
  algorithmVersion: SUPPORTED_PAIR_ALGORITHM_VERSION,
  persona: 'reality_patcher', performanceScore: '4.0', deathCause: 'none',
}

describe('self-contained local pair code', () => {
  it('round-trips every persona, score and death-cause combination', () => {
    for (const persona of PAIR_CODE_PERSONAS) {
      for (const performanceScore of PAIR_CODE_SCORES) {
        for (const deathCause of PAIR_CODE_DEATH_CAUSES) {
          const result = { algorithmVersion: SUPPORTED_PAIR_ALGORITHM_VERSION, persona, performanceScore, deathCause }
          const code = encodePairCode(result)
          expect(code).toHaveLength(5)
          expect(decodePairCode(code)).toEqual({ ok: true, result })
        }
      }
    }
  })

  it('is case-insensitive and parses a valid share parameter', () => {
    const code = encodePairCode(sample)
    expect(decodePairCode(code.toLowerCase())).toEqual({ ok: true, result: sample })
    expect(pairCodeFromShareOptions({ pairCode: code.toLowerCase() })).toBe(code)
    expect(pairCodeFromShareOptions({ pairCode: 'BAD' })).toBeNull()
  })

  it('rejects checksum errors, illegal characters and truncation', () => {
    const code = encodePairCode(sample)
    const replacement = PAIR_CODE_ALPHABET[(PAIR_CODE_ALPHABET.indexOf(code[4]!) + 1) % PAIR_CODE_ALPHABET.length]!
    expect(decodePairCode(`${code.slice(0, 4)}${replacement}`)).toEqual({ ok: false, error: 'checksum_mismatch' })
    expect(decodePairCode('23O45')).toEqual({ ok: false, error: 'invalid_character' })
    expect(decodePairCode(code.slice(0, 4))).toEqual({ ok: false, error: 'invalid_format' })
  })

  it('rejects unsupported versions and invalid encoded enum indexes', () => {
    expect(decodePairCode(rawCode(2, 0, 0, 0))).toEqual({ ok: false, error: 'unsupported_version' })
    expect(decodePairCode(rawCode(3, 8, 0, 0))).toEqual({ ok: false, error: 'invalid_persona' })
    expect(decodePairCode(rawCode(3, 0, 6, 0))).toEqual({ ok: false, error: 'invalid_score' })
    expect(decodePairCode(rawCode(3, 0, 0, 7))).toEqual({ ok: false, error: 'invalid_death_cause' })
  })
})

describe('pending pair code local storage', () => {
  const memory = new Map<string, unknown>()

  afterEach(() => {
    memory.clear()
    delete (globalThis as typeof globalThis & { wx?: unknown }).wx
  })

  it('stores and clears pendingPairCode without a remote dependency', () => {
    ;(globalThis as typeof globalThis & { wx: unknown }).wx = {
      getStorageSync: (key: string) => memory.get(key),
      setStorageSync: (key: string, value: unknown) => memory.set(key, value),
      removeStorageSync: (key: string) => memory.delete(key),
    }
    const code = encodePairCode(sample)
    savePendingPairCode(code)
    expect(loadPendingPairCode()).toBe(code)
    clearPendingPairCode()
    expect(loadPendingPairCode()).toBe('')
  })
})
