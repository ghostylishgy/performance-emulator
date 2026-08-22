import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'

const read = (path: string): string => readFileSync(path, 'utf8')

describe('V3 presentation flow', () => {
  it('contains the locked start copy and no old checkpoint flow', () => {
    const home = read('miniprogram/pages/home/index.wxml')
    const quiz = read('miniprogram/pages/quiz/index.wxml')
    expect(home).toContain('BEFORE WE START')
    expect(home).toContain('来吧，算算看')
    expect(quiz).not.toContain('personal-checkpoint')
    expect(quiz).not.toContain('organization-transition')
    expect(quiz).not.toContain('chapter-transition')
  })

  it('reveals persona, death cause, evidence and score in order', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    expect(result.indexOf('01 / 职场本体')).toBeLessThan(result.indexOf('02 / 主要绩效死因'))
    expect(result.indexOf('02 / 主要绩效死因')).toBeLessThan(result.indexOf('03 / 系统抓包'))
    expect(result.indexOf('03 / 系统抓包')).toBeLessThan(result.indexOf('04 / 最终绩效'))
  })

  it('shows Reflection only behind explicit state and keeps the locked acknowledgement button', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const logic = read('miniprogram/pages/result/index.ts')
    expect(result).toContain('wx:if="{{reflectionVisible}}"')
    expect(result).toContain('{{reflection.button}}')
    expect(definition.reflection.button).toBe('我知道了')
    expect(logic).toContain('shareIntent()')
    expect(logic).toContain('this.revealReflection()')
  })

  it('keeps the requested 3-4 second readable calculation window', () => {
    expect(definition.calculation.durationMs).toBeGreaterThanOrEqual(3000)
    expect(definition.calculation.durationMs).toBeLessThanOrEqual(4000)
    const lineCount = definition.calculation.materialLineCount + definition.calculation.endingLines.length
    expect(lineCount).toBeGreaterThanOrEqual(4)
    expect(lineCount).toBeLessThanOrEqual(5)
    expect(definition.calculation.materialPool).toHaveLength(6)
  })

  it('requires at most one click to reveal the final score and clears all timers', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const logic = read('miniprogram/pages/result/index.ts')
    expect(result.match(/bindtap="revealScore"/g)).toHaveLength(1)
    expect(result).not.toContain('revealNext')
    expect(logic).toContain('clearResultTimers()')
    expect(logic).toContain('onHide()')
    expect(logic).toContain('onUnload()')
    expect(logic).toContain('activeCalculationLine')
  })

  it('automatically consumes a pending pair code and exposes both local poster actions', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const logic = read('miniprogram/pages/result/index.ts')
    expect(logic).toContain('const pendingPairCode = loadPendingPairCode()')
    expect(logic).toContain('resolvePairRelationship(definition, evaluation.primaryPersona, pendingPairCode)')
    expect(logic).toContain('clearPendingPairCode()')
    expect(result).toContain('bindtap="saveSinglePoster"')
    expect(result).toContain('bindtap="saveRelationshipPoster"')
    expect(result).toContain('把这段关系发出去')
  })
})
