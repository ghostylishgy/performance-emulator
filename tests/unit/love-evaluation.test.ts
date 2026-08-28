import { describe, expect, it } from 'vitest'
import { loveAccidentTest } from '../../miniprogram/config/tests/love-accident/index'
import { loveActivationGates } from '../../miniprogram/config/tests/love-accident/rules'
import { LOVE_PERSONA_IDS, type LoveAnswerId, type LoveAnswers, type LovePersonaId } from '../../miniprogram/config/tests/love-accident/types'
import {
  calculateLoveScores,
  evaluateLoveAccident,
  InvalidLoveAnswersError,
} from '../../miniprogram/domain/love-evaluation'
import { assertValidLoveTestDefinition } from '../../miniprogram/domain/love-validation'

const repeatedAnswers = (answer: LoveAnswerId): LoveAnswers => Object.fromEntries(
  loveAccidentTest.questions.map((question) => [question.id, answer]),
) as LoveAnswers

const withAnswers = (base: LoveAnswers, values: Partial<LoveAnswers>): LoveAnswers => ({ ...base, ...values }) as LoveAnswers

const reachable: Record<LovePersonaId, LoveAnswers> = {
  MOON: { Q1: 'B', Q2: 'D', Q3: 'D', Q4: 'A', Q5: 'D', Q6: 'A', Q7: 'A', Q8: 'C', Q9: 'C', Q10: 'C', Q11: 'B', Q12: 'A', Q13: 'D', Q14: 'C', Q15: 'A', Q16: 'C' },
  AUDIT: { Q1: 'B', Q2: 'C', Q3: 'B', Q4: 'D', Q5: 'C', Q6: 'D', Q7: 'C', Q8: 'A', Q9: 'B', Q10: 'C', Q11: 'A', Q12: 'B', Q13: 'A', Q14: 'A', Q15: 'C', Q16: 'C' },
  REFUND: { Q1: 'A', Q2: 'A', Q3: 'D', Q4: 'C', Q5: 'B', Q6: 'A', Q7: 'C', Q8: 'A', Q9: 'D', Q10: 'B', Q11: 'B', Q12: 'B', Q13: 'D', Q14: 'A', Q15: 'A', Q16: 'D' },
  AI: { Q1: 'C', Q2: 'C', Q3: 'D', Q4: 'B', Q5: 'D', Q6: 'B', Q7: 'D', Q8: 'C', Q9: 'A', Q10: 'A', Q11: 'D', Q12: 'C', Q13: 'C', Q14: 'C', Q15: 'C', Q16: 'C' },
  PRIVATE: { Q1: 'A', Q2: 'B', Q3: 'B', Q4: 'D', Q5: 'C', Q6: 'A', Q7: 'A', Q8: 'A', Q9: 'D', Q10: 'B', Q11: 'A', Q12: 'C', Q13: 'D', Q14: 'D', Q15: 'C', Q16: 'C' },
  EVIDENCE: { Q1: 'A', Q2: 'C', Q3: 'A', Q4: 'C', Q5: 'A', Q6: 'C', Q7: 'B', Q8: 'D', Q9: 'C', Q10: 'B', Q11: 'B', Q12: 'D', Q13: 'C', Q14: 'B', Q15: 'C', Q16: 'B' },
  DD: { Q1: 'C', Q2: 'D', Q3: 'C', Q4: 'A', Q5: 'C', Q6: 'D', Q7: 'D', Q8: 'D', Q9: 'D', Q10: 'B', Q11: 'A', Q12: 'A', Q13: 'D', Q14: 'B', Q15: 'C', Q16: 'D' },
  DOUBLE: { Q1: 'A', Q2: 'A', Q3: 'A', Q4: 'A', Q5: 'B', Q6: 'D', Q7: 'B', Q8: 'A', Q9: 'B', Q10: 'D', Q11: 'C', Q12: 'D', Q13: 'B', Q14: 'A', Q15: 'D', Q16: 'A' },
  POMP: { Q1: 'A', Q2: 'C', Q3: 'A', Q4: 'A', Q5: 'A', Q6: 'D', Q7: 'A', Q8: 'C', Q9: 'A', Q10: 'B', Q11: 'D', Q12: 'A', Q13: 'C', Q14: 'B', Q15: 'D', Q16: 'B' },
  CARD3: { Q1: 'D', Q2: 'A', Q3: 'D', Q4: 'B', Q5: 'A', Q6: 'D', Q7: 'C', Q8: 'B', Q9: 'A', Q10: 'C', Q11: 'A', Q12: 'D', Q13: 'B', Q14: 'B', Q15: 'A', Q16: 'B' },
  FUTURE: { Q1: 'D', Q2: 'B', Q3: 'D', Q4: 'D', Q5: 'D', Q6: 'A', Q7: 'C', Q8: 'B', Q9: 'C', Q10: 'C', Q11: 'B', Q12: 'B', Q13: 'D', Q14: 'C', Q15: 'B', Q16: 'A' },
  DIGNITY: { Q1: 'D', Q2: 'C', Q3: 'C', Q4: 'A', Q5: 'D', Q6: 'D', Q7: 'A', Q8: 'C', Q9: 'A', Q10: 'A', Q11: 'C', Q12: 'D', Q13: 'D', Q14: 'C', Q15: 'D', Q16: 'D' },
}

describe('love accident configuration and persona reachability', () => {
  it('validates the locked 16-question, 12-persona definition', () => {
    expect(() => assertValidLoveTestDefinition(loveAccidentTest)).not.toThrow()
    expect(loveAccidentTest.questions).toHaveLength(16)
    expect(loveAccidentTest.personas.map(({ id, name, baseline }) => ({ id, name, baseline }))).toEqual([
      { id: 'MOON', name: '白月光拨款主任', baseline: 7 },
      { id: 'AUDIT', name: '分手审计合伙人', baseline: 10 },
      { id: 'REFUND', name: '仅退款终身战神', baseline: 10 },
      { id: 'AI', name: 'AI劝退钉子户', baseline: 9 },
      { id: 'PRIVATE', name: '被窝叫妈体验官', baseline: 7 },
      { id: 'EVIDENCE', name: '宝宝变被告标兵', baseline: 10 },
      { id: 'DD', name: '四十页尽调情种', baseline: 11 },
      { id: 'DOUBLE', name: '双标套利艺术家', baseline: 12 },
      { id: 'POMP', name: '排场买单冤种王', baseline: 7 },
      { id: 'CARD3', name: '第三张卡肉痛症', baseline: 7 },
      { id: 'FUTURE', name: '过期未来守墓人', baseline: 11 },
      { id: 'DIGNITY', name: '体面破产成年人', baseline: 12 },
    ])
  })

  for (const persona of LOVE_PERSONA_IDS) {
    it(`makes ${persona} reachable`, () => {
      const result = evaluateLoveAccident(loveAccidentTest, reachable[persona])
      expect(result.final_persona).toBe(persona)
      expect(result.resolution_mode).toBe('gated')
      expect(result.fallback_reason).toBeNull()
    })
  }
})

describe('love accident mirror and combination rules', () => {
  it('activates and rewards the gift mirror', () => {
    const result = evaluateLoveAccident(loveAccidentTest, withAnswers(repeatedAnswers('A'), { Q7: 'B', Q10: 'B' }))
    expect(result.final_persona).toBe('DOUBLE')
    expect(result.mirror_double_score).toBe(6)
    expect(result.matched_combination_rules).toContain('double_gift')
  })

  it('activates and rewards the due-diligence mirror', () => {
    const result = evaluateLoveAccident(loveAccidentTest, withAnswers(repeatedAnswers('A'), { Q5: 'B', Q11: 'C' }))
    expect(result.final_persona).toBe('DOUBLE')
    expect(result.mirror_double_score).toBe(5)
    expect(result.matched_combination_rules).toContain('double_due_diligence_c')
  })

  it('does not mistake consistent risk control for DOUBLE', () => {
    const answers = withAnswers(repeatedAnswers('A'), { Q5: 'B', Q6: 'D', Q8: 'C', Q11: 'A' })
    const result = evaluateLoveAccident(loveAccidentTest, answers)
    expect(loveActivationGates.DOUBLE(answers, result.raw_scores)).toBe(false)
    expect(result.final_persona).toBe('DD')
    expect(result.matched_combination_rules).toEqual(expect.arrayContaining(['dd_consistent_risk', 'dd_consistent_risk_deep']))
  })

  it('strengthens REFUND for consistent clearance', () => {
    const result = evaluateLoveAccident(loveAccidentTest, withAnswers(repeatedAnswers('A'), { Q7: 'B', Q10: 'A', Q12: 'B' }))
    expect(result.final_persona).toBe('REFUND')
    expect(result.matched_combination_rules).toContain('refund_consistent_clearance')
    expect(result.raw_scores.REFUND).toBe(11)
  })

  it('awards the hidden DIGNITY red-light combination once', () => {
    const answers = withAnswers(repeatedAnswers('A'), { Q14: 'A', Q16: 'B' })
    const first = evaluateLoveAccident(loveAccidentTest, answers)
    const second = evaluateLoveAccident(loveAccidentTest, answers)
    expect(first.final_persona).toBe('DIGNITY')
    expect(first.hidden_badges).toEqual(['red_light_still_waiting'])
    expect(first.raw_scores.DIGNITY).toBe(second.raw_scores.DIGNITY)
    expect(first.matched_combination_rules.filter((id) => id === 'dignity_red_light')).toHaveLength(1)
  })
})

describe('love accident gates and invariants', () => {
  it('blocks DOUBLE even when base DOUBLE score is high without a mirror', () => {
    const answers = withAnswers(repeatedAnswers('A'), { Q9: 'C', Q10: 'D', Q11: 'C', Q16: 'B' })
    const result = evaluateLoveAccident(loveAccidentTest, answers)
    const double = result.candidates.find((candidate) => candidate.persona === 'DOUBLE')!
    expect(double.rawScore).toBe(10)
    expect(double.active).toBe(false)
    expect(result.final_persona).not.toBe('DOUBLE')
  })

  it('is deterministic across 100 identical evaluations', () => {
    const expected = evaluateLoveAccident(loveAccidentTest, reachable.DOUBLE)
    for (let index = 0; index < 100; index += 1) expect(evaluateLoveAccident(loveAccidentTest, reachable.DOUBLE)).toEqual(expected)
  })

  it('keeps confidence finite, uncapped, and final results inside the locked persona set', () => {
    for (const persona of LOVE_PERSONA_IDS) {
      const result = evaluateLoveAccident(loveAccidentTest, reachable[persona])
      expect(LOVE_PERSONA_IDS).toContain(result.final_persona)
      for (const confidence of Object.values(result.confidence_scores)) expect(Number.isFinite(confidence)).toBe(true)
    }
    const high = evaluateLoveAccident(loveAccidentTest, withAnswers(repeatedAnswers('A'), { Q1: 'B', Q4: 'A' }))
    expect(high.confidence_scores.MOON).toBeGreaterThan(1)
  })

  it('rejects missing or invalid answers without filling defaults', () => {
    const incomplete = { ...reachable.MOON } as Partial<LoveAnswers>
    delete incomplete.Q16
    expect(() => evaluateLoveAccident(loveAccidentTest, incomplete)).toThrow(InvalidLoveAnswersError)
    expect(() => evaluateLoveAccident(loveAccidentTest, { ...reachable.MOON, Q16: 'X' as LoveAnswerId })).toThrow(InvalidLoveAnswersError)
  })

  it('resolves the neutral all-A gate gap through the deterministic safety fallback', () => {
    const result = evaluateLoveAccident(loveAccidentTest, repeatedAnswers('A'))
    expect(result.final_persona).toBe('DIGNITY')
    expect(result.resolution_mode).toBe('fallback')
    expect(result.fallback_reason).toBe('no_active_persona')
    expect(result.activated_personas).toEqual([])
  })

  it('keeps fallback completely deterministic across 100 identical evaluations', () => {
    const answers = repeatedAnswers('A')
    const expected = evaluateLoveAccident(loveAccidentTest, answers)
    for (let index = 0; index < 100; index += 1) {
      expect(evaluateLoveAccident(loveAccidentTest, answers)).toEqual(expected)
    }
  })

  it('applies every combination rule at most once per evaluation', () => {
    const answers = repeatedAnswers('D')
    const scored = calculateLoveScores(loveAccidentTest, answers)
    expect(new Set(scored.matchedRules.map((rule) => rule.id)).size).toBe(scored.matchedRules.length)
  })
})
