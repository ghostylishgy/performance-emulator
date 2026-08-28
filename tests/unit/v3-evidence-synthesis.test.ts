import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import type { Answers, PersonaId } from '../../miniprogram/config/v3-types'
import { rankSynthesisEvidence, selectEvidence, synthesisRuleMatches } from '../../miniprogram/domain/v3-evidence'
import { repeatedAnswers } from '../fixtures'

const withAnswers = (base: Answers, choices: Record<string, 'A' | 'B' | 'C' | 'D'>): Answers => ({ ...base, ...choices })

function answerHasDeathTag(answerKey: string, deathCause: string): boolean {
  const questionId = answerKey.slice(0, -1)
  const optionId = answerKey.slice(-1)
  return definition.questions.find((question) => question.id === questionId)?.options
    .find((option) => option.id === optionId)?.evidence.deathTags.includes(deathCause as any) ?? false
}

describe('cross-question evidence synthesis', () => {
  it('requires every required answer and respects exclusions', () => {
    const rule = definition.evidenceSynthesisRules.find((item) => item.id === 'invisible-front-back')!
    const matching = withAnswers(repeatedAnswers('B'), { Q2: 'A', Q13: 'D', Q21: 'C' })
    expect(synthesisRuleMatches(rule, matching, 'invisible_contributor')).toBe(true)
    expect(synthesisRuleMatches(rule, { ...matching, Q13: 'C' }, 'invisible_contributor')).toBe(false)
    expect(synthesisRuleMatches(rule, matching, 'stable_worker')).toBe(false)

    const excluded = definition.evidenceSynthesisRules.find((item) => item.id === 'spf-runtime-dependency')!
    const excludedAnswers = withAnswers(repeatedAnswers('B'), { Q4: 'A', Q22: 'A', Q18: 'C' })
    expect(synthesisRuleMatches(excluded, excludedAnswers, 'single_point_failure')).toBe(false)
  })

  it('adds selected optional answers and gives them a ranking bonus', () => {
    const base = withAnswers(repeatedAnswers('B'), { Q2: 'A', Q13: 'D', Q21: 'B' })
    const optional = { ...base, Q21: 'C' as const }
    const baseRank = rankSynthesisEvidence(definition, base, 'invisible_contributor', 'credit_unclear')
      .find((item) => item.id === 'invisible-front-back')!
    const optionalRank = rankSynthesisEvidence(definition, optional, 'invisible_contributor', 'credit_unclear')
      .find((item) => item.id === 'invisible-front-back')!
    expect(optionalRank.answerKeys).toContain('Q21C')
    expect(optionalRank.rank).toBeGreaterThan(baseRank.rank)
  })

  it('binds the scope-first evidence rule to the finalized explicit-boundary answers', () => {
    const rule = definition.evidenceSynthesisRules.find((item) => item.id === 'firewall-scope-first')!
    expect(rule.requiredAnswers).toEqual(['Q6D', 'Q7D'])
    expect(synthesisRuleMatches(rule, withAnswers(repeatedAnswers('B'), { Q6: 'D', Q7: 'D' }), 'desk_firewall')).toBe(true)
    expect(synthesisRuleMatches(rule, withAnswers(repeatedAnswers('B'), { Q6: 'C', Q7: 'D' }), 'desk_firewall')).toBe(false)
    expect(synthesisRuleMatches(rule, withAnswers(repeatedAnswers('B'), { Q6: 'D', Q7: 'A' }), 'desk_firewall')).toBe(false)
  })

  it('prefers synthesis, references only selected behavior and keeps category diversity', () => {
    const answers = withAnswers(repeatedAnswers('B'), {
      Q2: 'A', Q7: 'A', Q9: 'A', Q13: 'D', Q21: 'D',
    })
    const evidence = selectEvidence(definition, answers, 'invisible_contributor', 'credit_unclear')
    expect(evidence).toHaveLength(3)
    expect(evidence.filter((item) => item.source === 'synthesis').length).toBeGreaterThanOrEqual(2)
    expect(evidence[0]?.source).toBe('synthesis')
    for (const item of evidence) {
      for (const answerKey of item.answerKeys) expect(answers[answerKey.slice(0, -1)]).toBe(answerKey.slice(-1))
    }
    expect(new Set(evidence.map((item) => item.category)).size).toBe(3)
    expect(evidence.filter((item) => item.answerKeys.some((key) => answerHasDeathTag(key, 'credit_unclear'))).length).toBeLessThanOrEqual(1)
  })

  it('covers every special persona with 3-5 rules and keeps a natural stable-worker fallback', () => {
    const specialPersonas: PersonaId[] = [
      'single_point_failure', 'invisible_contributor', 'result_captioner', 'wild_middleware',
      'reality_patcher', 'desk_firewall', 'org_weather_station',
    ]
    for (const persona of specialPersonas) {
      const count = definition.evidenceSynthesisRules.filter((rule) => rule.personaTags.includes(persona)).length
      expect(count).toBeGreaterThanOrEqual(3)
      expect(count).toBeLessThanOrEqual(5)
    }
    const stableAnswers = withAnswers(repeatedAnswers('A'), { Q4: 'C', Q18: 'C' })
    const stable = rankSynthesisEvidence(definition, stableAnswers, 'stable_worker', 'none')
    expect(stable.some((item) => item.id === 'stable-transferable')).toBe(true)
    expect(stable.find((item) => item.id === 'stable-transferable')?.text).toContain('交接能跑')
  })

  it('keeps 28 special-persona rules plus 3 stable fallback rules and locks the approved copy', () => {
    const specialRules = definition.evidenceSynthesisRules.filter((rule) => !rule.personaTags.includes('stable_worker'))
    const stableRules = definition.evidenceSynthesisRules.filter((rule) => rule.personaTags.includes('stable_worker'))
    expect(definition.evidenceSynthesisRules).toHaveLength(31)
    expect(specialRules).toHaveLength(28)
    expect(stableRules).toHaveLength(3)
    expect(definition.evidenceSynthesisRules.find((rule) => rule.id === 'patcher-problem-to-trial')?.text)
      .toBe('群里还在争论可不可行，你已经先糊了个能跑的版本出来：“先试一下，不行再说。”')
    expect(definition.evidenceSynthesisRules.find((rule) => rule.id === 'captioner-memory-builder')?.text)
      .toBe('你很清楚组织的短期记忆只有两周，所以每次交差，都会把数据、结论和“谁干的”一起加粗。')
    expect(definition.evidenceSynthesisRules.find((rule) => rule.id === 'weather-adjust-not-panic')?.text)
      .toBe('看到群里的气压骤降，你没有跟着发“收到”，而是先私聊两个关键的人探探水温。')
  })
})
