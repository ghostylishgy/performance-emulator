import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'

const read = (path: string): string => readFileSync(path, 'utf8')

describe('V3 presentation flow', () => {
  it('contains the locked start copy and no old checkpoint flow', () => {
    const home = read('miniprogram/pages/home/index.wxml')
    const quiz = read('miniprogram/pages/quiz/index.wxml')
    expect(home).toContain('开始之前')
    expect(home).toContain('来吧，算算看')
    expect(quiz).not.toContain('personal-checkpoint')
    expect(quiz).not.toContain('organization-transition')
    expect(quiz).not.toContain('chapter-transition')
  })

  it('keeps persona-first reveal order: persona, death cause, evidence, then score', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const stages = [...result.matchAll(/revealStage >= (\d)/g)].map((match) => Number(match[1]))
    expect(stages).toEqual([1, 2, 3, 4])
    expect(result.indexOf('RESULT CONFIRMED')).toBeLessThan(result.indexOf('主要绩效死因'))
    expect(result.indexOf('主要绩效死因')).toBeLessThan(result.indexOf('系统抓包'))
    expect(result.indexOf('系统抓包')).toBeLessThan(result.indexOf('最终绩效'))
    expect(result.indexOf('revealStage === 3')).toBeLessThan(result.indexOf('最终绩效'))
    expect(result.indexOf('{{result.personaName}}')).toBeLessThan(result.indexOf('{{result.outcome}}'))
  })

  it('makes persona the dominant visual anchor and demotes the final score', () => {
    const resultCss = read('miniprogram/pages/result/index.wxss')
    const tokens = read('miniprogram/styles/tokens.wxss')
    const displaySize = Number((tokens.match(/--text-display:\s*(\d+)rpx/) ?? ['0', '0'])[1] ?? 0)
    const headlineSize = Number((tokens.match(/--text-headline:\s*(\d+)rpx/) ?? ['0', '0'])[1] ?? 0)
    expect(displaySize).toBeGreaterThan(headlineSize)
    expect(resultCss.replace(/\s/g, '')).toContain('.persona-name{position:relative;z-index:1;margin-top:var(--space-md);color:var(--color-primary-ink);font-size:var(--text-display)')
    expect(resultCss.replace(/\s/g, '')).toContain('.final-score{position:relative;z-index:1;margin-top:18rpx;color:var(--color-primary-ink);font-size:var(--text-headline)')
    for (const match of resultCss.matchAll(/font-size:(\d{2,4})rpx/g)) {
      expect(Number(match[1])).toBeLessThanOrEqual(headlineSize)
    }
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

  it('flattens Reflection into a single paper layer without card-in-card', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const resultCss = read('miniprogram/pages/result/index.wxss')
    const cardCss = read('miniprogram/components/reflection-card/index.wxss')
    const modalRule = resultCss.match(/\.reflection-modal \{[^}]+\}/)![0]
    expect(modalRule).toContain('border:')
    expect(modalRule).toContain('border-radius:')
    expect(modalRule).toContain('background:var(--color-card)')
    expect(modalRule).toContain('box-shadow:')
    expect(cardCss).not.toMatch(/\.card\s*\{/)
    expect(cardCss).not.toContain('box-shadow')
    expect(cardCss).not.toMatch(/background:/)
    expect(result).toContain('<reflection-card content="{{reflection}}" />')
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
    const logic = read('miniprogram/pages/result/index.ts')
    expect(logic).toContain('const pendingPairCode = loadPendingPairCode()')
    expect(logic).toContain('resolvePairRelationship(definition, evaluation.primaryPersona, pendingPairCode)')
    expect(logic).toContain('clearPendingPairCode()')
    const result = read('miniprogram/pages/result/index.wxml')
    expect(result).toContain('bindtap="saveSinglePoster"')
    expect(result).toContain('bindtap="saveRelationshipPoster"')
  })

  it('collapses the manual pair toolbox by default and expands it on demand', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const logic = read('miniprogram/pages/result/index.ts')
    expect(logic).toMatch(/manualPairExpanded:\s*false/)
    expect(logic).toContain('toggleManualPair()')
    expect(logic).toContain('manualPairExpanded: !this.data.manualPairExpanded')
    expect(result).toContain('已有对口径码？展开手动对口径')
    expect(result).toContain('wx:if="{{!manualPairExpanded}}"')
    expect(result).toContain('wx:if="{{manualPairExpanded}}"')
    const manualBlock = result.slice(result.indexOf('wx:if="{{manualPairExpanded}}"'))
    expect(manualBlock).toContain('bindtap="generatePairCode"')
    expect(manualBlock).toContain('bindtap="copyPairCode"')
    expect(manualBlock).toContain('bindinput="onPairInput"')
    expect(manualBlock).toContain('bindtap="resolvePair"')
    expect(logic.replace(/\s/g, '')).toContain('manualPairExpanded:false,')
  })

  it('keeps every pairing capability after the progressive disclosure regroup', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const logic = read('miniprogram/pages/result/index.ts')
    for (const handler of ['generatePairCode', 'copyPairCode', 'resolvePair']) {
      expect(logic).toContain(`${handler}(`)
      expect(result).toContain(`bindtap="${handler}"`)
    }
    expect(result).toContain('bindinput="onPairInput"')
  })

  it('promotes saving the personal card plus inviting a peer as the solo-stage main actions', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const saveIndex = result.indexOf('bindtap="saveSinglePoster"')
    const shareIndex = result.indexOf('bindtap="shareIntent"')
    expect(saveIndex).toBeGreaterThan(-1)
    expect(saveIndex).toBeLessThan(shareIndex)
    expect(result.slice(saveIndex - 120, saveIndex)).toContain('primary-button')
    expect(result.slice(shareIndex - 140, shareIndex)).toContain('secondary-button')
    expect(result).toContain('找个人来对一下口径')
  })

  it('hands the pairing panel over to the relationship result with its own main actions', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const resultCss = read('miniprogram/pages/result/index.wxss')
    expect(result).not.toContain('class="relationship"')
    expect(resultCss).not.toContain('border-left')
    const takeover = result.slice(result.indexOf('wx:else'))
    const saveIndex = takeover.indexOf('bindtap="saveRelationshipPoster"')
    const shareIndex = takeover.indexOf('bindtap="shareIntent"')
    expect(saveIndex).toBeGreaterThan(-1)
    expect(saveIndex).toBeLessThan(shareIndex)
    expect(takeover.slice(saveIndex - 120, saveIndex)).toContain('primary-button')
    expect(takeover.slice(shareIndex - 140, shareIndex)).toContain('secondary-button')
    expect(takeover).toContain('保存关系卡')
    expect(takeover).toContain('再找一个人对口径')
  })

  it('renders pair input error and success states beyond color alone', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const resultCss = read('miniprogram/pages/result/index.wxss')
    expect(result).toContain('pairMessageTone === \'error\'')
    expect(result).toContain('⚠')
    expect(resultCss).toContain('.pair-message.error')
    expect(resultCss).toContain('.pair-message.success')
    expect(resultCss).toContain('.pair-input.error')
    expect(resultCss).toContain('.pair-input.success')
  })

  it('animates quiz progress with transforms instead of width transitions', () => {
    const progressWxml = read('miniprogram/components/progress/index.wxml')
    const progressCss = read('miniprogram/components/progress/index.wxss')
    expect(progressWxml).toContain('scaleX(')
    expect(progressCss).toContain('transform-origin:0')
    expect(progressCss).toMatch(/transition:transform/)
    expect(progressCss).not.toMatch(/transition:\s*width/)
    expect(progressCss).not.toContain('.glow')
  })

  it('drops the full-screen opening tap target in favor of an explicit skip control', () => {
    const home = read('miniprogram/pages/home/index.wxml')
    const homeCss = read('miniprogram/pages/home/index.wxss')
    const logic = read('miniprogram/pages/home/index.ts')
    expect(home).toMatch(/class="opening"\s*>/)
    expect(home).toContain('bindtap="skipOpening"')
    expect(home).toContain('跳过开场')
    expect(homeCss).toContain('.opening-skip')
    expect(homeCss).toMatch(/min-height:76rpx/)
    expect(logic).toContain('skipOpening()')
    expect(logic).toContain('1050')
  })
})
