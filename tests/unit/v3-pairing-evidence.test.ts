import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import { getPairRelationship, pairKey } from '../../miniprogram/domain/v3-pairing'
import { evaluateComplete } from '../../miniprogram/domain/v3-evaluation'
import { allA } from '../fixtures'

describe('pair relationships and evidence capture', () => {
  it('contains all 36 unordered pair relationships exactly once', () => {
    expect(definition.pairRelationships).toHaveLength(36)
    expect(new Set(definition.pairRelationships.map((item) => item.key)).size).toBe(36)
  })

  it('locks the four approved relationship verdicts', () => {
    expect(getPairRelationship(definition, 'result_captioner', 'result_captioner').copy)
      .toBe('同一个项目，你俩能在各自的周报里，分别写出两个拯救大盘的主角。')
    expect(getPairRelationship(definition, 'org_weather_station', 'stable_worker').copy)
      .toBe('一个每天在工位上感知风云变幻，另一个雷打不动把手里的活干完。暴风雨来了，牛马还在帮气象台点外卖。')
    expect(getPairRelationship(definition, 'result_captioner', 'org_weather_station').copy)
      .toBe('领导还没把嘴张开，气象台已经递了眼色，字幕师的下一版战略 PPT 已经修改到了“致谢”页。')
    expect(getPairRelationship(definition, 'reality_patcher', 'reality_patcher').copy)
      .toBe('三个月前那个“先凑合一下”，现在已经成为正式流程。')
  })

  it('returns the same relationship for A+B and B+A', () => {
    for (const left of definition.personas) {
      for (const right of definition.personas) {
        expect(pairKey(left.id, right.id)).toBe(pairKey(right.id, left.id))
        expect(getPairRelationship(definition, left.id, right.id))
          .toEqual(getPairRelationship(definition, right.id, left.id))
      }
    }
  })

  it('selects only actual answers with category diversity', () => {
    const result = evaluateComplete(definition, allA)
    expect(result.evidence).toHaveLength(3)
    expect(new Set(result.evidence.flatMap((item) => item.questionIds)).size).toBeGreaterThanOrEqual(3)
    for (const item of result.evidence) {
      for (const answerKey of item.answerKeys) {
        const questionId = answerKey.slice(0, -1)
        expect(allA[questionId]).toBe(answerKey.slice(-1))
      }
    }
    expect(result.evidence.map((item) => item.category)).toContain('work_behavior')
    expect(result.evidence.map((item) => item.category)).toContain('expression_org')
    expect(new Set(result.evidence.map((item) => item.category)).size).toBeGreaterThanOrEqual(2)
  })
})
