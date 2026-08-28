import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import { calculateBaseScore, createResultViewModel, evaluateComplete, outcomeForBaseScore } from '../../miniprogram/domain/v3-evaluation'
import { allA, allB, allD, answersForCoefficient } from '../fixtures'

describe('V3 performance and organization scoring', () => {
  it('locks the finalized Q6 and Q7 copy and coefficients', () => {
    expect(definition.questions[5]?.options.map(({ id, text, coefficient }) => ({ id, text, coefficient }))).toEqual([
      { id: 'A', text: '先问清楚，到底有多简单', coefficient: 1 },
      { id: 'B', text: '嘴上说好，已经开始排时间了', coefficient: 0.7 },
      { id: 'C', text: '笑着说“我看看”，文件夹已经建好了', coefficient: 0.55 },
      { id: 'D', text: '先问一句：“这是帮一下，还是以后都归我了？”', coefficient: 0.95 },
    ])
    expect(definition.questions[6]?.options.map(({ id, text, coefficient }) => ({ id, text, coefficient }))).toEqual([
      { id: 'A', text: '先问清楚，真急就先做关键部分', coefficient: 1 },
      { id: 'B', text: '回“收到”，给自己争取三分钟', coefficient: 0.7 },
      { id: 'C', text: '看到“今天”两个字，先喝了口水', coefficient: 0.25 },
      { id: 'D', text: '把手头的活截了个图，问“今天先放弃哪个？”', coefficient: 0.95 },
    ])
  })

  it('uses the configured BaseScore lower and upper bounds', () => {
    expect(calculateBaseScore(definition, answersForCoefficient('max'))).toBe(99.6)
    const minimum = calculateBaseScore(definition, answersForCoefficient('min'))
    expect(minimum).toBeGreaterThanOrEqual(0)
    expect(minimum).toBeLessThan(42)
  })

  it.each([
    [0, '3.25'], [41.99, '3.25'], [42, '3.5-'], [49.99, '3.5-'],
    [50, '3.5'], [66.99, '3.5'], [67, '3.5+'], [76.99, '3.5+'], [77, '3.75'], [100, '3.75'],
  ] as const)('maps BaseScore %s to %s', (score, outcome) => expect(outcomeForBaseScore(definition, score)).toBe(outcome))

  it('covers organization +1, 0 and -1 calibration', () => {
    expect(evaluateComplete(definition, allA).calibrationDelta).toBe(1)
    expect(evaluateComplete(definition, allB).calibrationDelta).toBe(0)
    expect(evaluateComplete(definition, allD).calibrationDelta).toBe(-1)
    expect(evaluateComplete(definition, allB).organizationScore).toBe(72.98)
    expect(evaluateComplete(definition, allD).organizationScore).toBe(31.43)
  })

  it('blocks upward adjustment when a strong negative organization signal exists', () => {
    const result = evaluateComplete(definition, { ...allA, Q24: 'D' })
    expect(result.organizationScore).toBeGreaterThanOrEqual(78)
    expect(result.organizationSignals).toContain('quota_tight')
    expect(result.calibrationDelta).toBe(0)
  })

  it('uses the independent 4.0 gate and never promotes 3.75 mechanically', () => {
    expect(evaluateComplete(definition, allA).finalOutcome).toBe('4.0')
    const belowGate = evaluateComplete(definition, { ...allA, Q1: 'D', Q2: 'D' })
    expect(belowGate.baseScore).toBeLessThan(86)
    expect(belowGate.finalOutcome).not.toBe('4.0')
  })

  it('does not penalize Q4C or Q18C for being transferable', () => {
    const maximum = answersForCoefficient('max')
    expect(maximum.Q4).toBe('C')
    expect(maximum.Q18).toBe('C')
    expect(definition.questions[3]!.options.find((option) => option.id === 'C')!.coefficient).toBe(1)
    expect(definition.questions[17]!.options.find((option) => option.id === 'C')!.coefficient).toBe(1)
    expect(calculateBaseScore(definition, maximum)).toBe(99.6)
  })

  it('is deterministic without a user-facing dimension report', () => {
    const first = evaluateComplete(definition, allB)
    expect(first).toEqual(evaluateComplete(definition, allB))
    expect(first).not.toHaveProperty('dimensions')
  })

  it('forces the special 4.0 ending to have no death cause', () => {
    const result = evaluateComplete(definition, allA)
    expect(result.finalOutcome).toBe('4.0')
    expect(result.deathCause).toBe('none')
  })

  it('derives all four calibration explanations from the actual outcome', () => {
    const cases = [
      [{ ...allB, Q19: 'A' as const }, '原始评定 3.5+ · 经组织校准，上调至 3.75'],
      [allB, '原始评定 3.5+ · 组织校准：维持原判'],
      [{ ...allB, Q19: 'D' as const, Q21: 'D' as const, Q22: 'D' as const, Q24: 'D' as const }, '原始评定 3.5+ · 经组织校准，下调至 3.5'],
      [allA, '原始评定 3.75 · 4.0 条件核验通过'],
    ] as const
    for (const [answers, copy] of cases) {
      expect(createResultViewModel(definition, evaluateComplete(definition, answers)).calibrationSummary).toBe(copy)
    }
  })

  it('shows the mascot note only for the existing credit-unclear organization signal', () => {
    const flagged = evaluateComplete(definition, { ...allB, Q21: 'C' })
    expect(flagged.organizationSignals).toContain('credit_unclear')
    expect(createResultViewModel(definition, flagged).mascotNote).toBe('干活有你，合影没你。行，我记着了。')
    expect(createResultViewModel(definition, evaluateComplete(definition, allB)).mascotNote).toBe('')
  })

  it('maps every death cause to an approved record and changes only the visibility label', () => {
    expect(definition.deathCauseRecords).toEqual({
      strategy_faded: '判定记录：项目按原计划跑完，只是终点线昨晚被连夜拆除了。',
      credit_unclear: '判定记录：活主要由你完成，成果经各级汇报稀释后，已被划定为公摊面积。',
      quota_tight: '判定记录：未发现明显工作缺陷。优秀名额在本周期内发生了物理级收缩。',
      visibility_lag: '判定记录：事情运行得太顺，组织一度认为这件事本来就会自己发生。',
      civilized_boundary: '判定记录：不抢未认领之功，不甩无主之锅；在本周期的绩效现场里，显得过分体面。',
      impact_not_enough: '判定记录：工作密度已达 100%，距离让大领导眼前一黑又一亮，还差一次戏剧性机缘。',
      none: '判定记录：本周期未检出致命硬伤。系统建议保持当前姿态，切勿主动加戏。',
    })
    expect(definition.deathCauseLabels.visibility_lag).toBe('成果被当成自然规律')
    expect(definition.deathCauseLabels.credit_unclear).toBe('功劳进入公共区域')
    expect(definition.deathCauseRecords.none).toBe('判定记录：本周期未检出致命硬伤。系统建议保持当前姿态，切勿主动加戏。')
  })
})
