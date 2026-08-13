import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import { evaluateComplete } from '../../miniprogram/domain/evaluation-pipeline'
import { answersFromLetters } from '../fixtures'

const archetypes = [
  { name: '技术大神但低可见', letters: 'AAABDCDCAABDABBB', persona: 'invisible-hard-worker', checks: { K: 80, VMax: 40 } },
  { name: 'PPT高潜', letters: 'DCCCAABDDBCCBBBB', persona: 'ppt-high-potential', checks: { V: 65, PMax: 50 } },
  { name: '组织高手', letters: 'ABCCBBBBBBBBBBBB', persona: 'organization-lubricant', checks: { I: 60, O: 60 } },
  { name: '独立单兵', letters: 'AAABBAAAAABAABBB', persona: 'technical-island', checks: { K: 70, OMax: 40 } },
  { name: '历史包袱型核心人才', letters: 'AAADAAAAAADDABBB', persona: 'legacy-core', checks: { K: 60 } },
  { name: '稳定老黄牛', letters: 'ADCADCAABCABCBBC', persona: 'steady-ox', checks: { P: 45, VMax: 60 } },
  { name: '战略项目幸运儿', letters: 'BBBBBBBBBBBBAAAA', persona: 'strategic-lucky', checks: { S: 70, L: 70 } },
  { name: '名额受害者', letters: 'AAAAAAAAABAADDDD', persona: 'quota-victim', checks: { P: 60 } },
  { name: '背锅型核心骨干', letters: 'AAABDCDCAABDDCCC', persona: 'scapegoat-backbone', checks: { P: 55, K: 60 } },
  { name: '低存在感用户', letters: 'DDDCDDDDDDCDCCCC', persona: 'steady-ox', checks: { IMax: 45 } },
] as const

describe('archetype vectors', () => {
  for (const archetype of archetypes) {
    it(archetype.name, () => {
      const result = evaluateComplete(definition, answersFromLetters(archetype.letters))
      expect(result.primaryPersona).toBe(archetype.persona)
      const checks = archetype.checks as Record<string, number>
      for (const [key, threshold] of Object.entries(checks)) {
        if (key.endsWith('Max')) expect(result.normalizedMetrics[key.replace('Max', '')]).toBeLessThanOrEqual(threshold)
        else expect(result.normalizedMetrics[key]).toBeGreaterThanOrEqual(threshold)
      }
      expect([-1, 0, 1]).toContain(result.calibrationDelta)
      expect(result.personalAnswersSnapshot).toEqual(Object.fromEntries(Object.entries(result.answers).slice(0, 12)))
    })
  }
})
