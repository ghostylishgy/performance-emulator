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
    expect(result).toContain('已有对口径码？手动输入')
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
    const leadBlock = (result.match(/<view wx:if="\{\{!pairRelationship\}\}" class="result-actions lead-actions">[\s\S]*?<\/view>/) ?? [''])[0]
    expect(leadBlock).toContain('bindtap="saveSinglePoster"')
    expect(leadBlock).toContain('bindtap="shareIntent"')
    expect(leadBlock).toContain('找个人来对一下口径')
    expect(leadBlock).toContain('pair-privacy')
    expect(result.slice(0, result.indexOf('<view wx:if="{{!pairRelationship}}" class="result-actions lead-actions">')))
      .not.toContain('保存我的结果卡')
  })

  it('hides the solo-stage action stack once a relationship result exists', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const leadActions = result.indexOf('class="result-actions lead-actions"')
    const relationshipElse = result.indexOf('<block wx:else>')
    expect(leadActions).toBeGreaterThan(-1)
    expect(result.slice(leadActions - 60, leadActions)).toContain('wx:if="{{!pairRelationship}}"')
    expect(relationshipElse).toBeGreaterThan(leadActions)
    const takeover = result.slice(relationshipElse)
    expect(takeover).not.toContain('lead-actions')
    expect(takeover).not.toContain('保存我的结果卡')
    expect(takeover).not.toContain('找个人来对一下口径')
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

  it('keeps invite buttons on the single-invite message while menu shares may carry the relationship', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const logic = read('miniprogram/pages/result/index.ts')
    const shareButtons = [...result.matchAll(/<button[^>]*bindtap="shareIntent"[^>]*>/g)].map((match) => match[0])
    expect(shareButtons.length).toBeGreaterThanOrEqual(2)
    for (const button of shareButtons) expect(button).toContain('data-share-mode="invite"')
    expect(logic).toContain("options?.target?.dataset?.shareMode === 'invite'")
    const compactLogic = logic.replace(/\s/g, '')
    expect(compactLogic).toContain('constinviteFromButton=options?.target?.dataset?.shareMode===\'invite\'')
    expect(compactLogic).toContain('!inviteFromButton&&relationship?createRelationshipShareMessage(definition,relationship):createShareMessage(definition,evaluation)')
    expect(logic).not.toMatch(/let\s+shareMode|this\.setData\(\{\s*shareMode/)
  })

  it('renders pair input error state beyond color alone and never greens the peer input', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const resultCss = read('miniprogram/pages/result/index.wxss')
    const logic = read('miniprogram/pages/result/index.ts')
    const inputTag = (result.match(/<input class="pair-input[^>]*>/) ?? [''])[0]
    expect(inputTag).toContain("pairMessageTone === 'error'")
    expect(inputTag).not.toContain('success')
    expect(resultCss).toContain('.pair-input.error')
    expect(resultCss).not.toContain('.pair-input.success')
    expect(result).toContain('⚠')
    expect(resultCss).toContain('.pair-message.error')
    expect(resultCss).toContain('.pair-message.success')
    expect(logic.replace(/\s/g, '')).toContain("pairMessage:pairCodeErrorMessage(resolved.error),pairMessageTone:'error'")
    expect(logic.replace(/\s/g, '')).toMatch(/generatePairCode[\s\S]*?pairMessageTone:'success'/)
  })

  it('gives key lightweight controls a reliable ~44px touch height', () => {
    const homeCss = read('miniprogram/pages/home/index.wxss')
    const quizCss = read('miniprogram/pages/quiz/index.wxss')
    const resultCss = read('miniprogram/pages/result/index.wxss')
    for (const [css, selector] of [
      [homeCss, '.opening-skip'],
      [quizCss, '.back'],
      [resultCss, '.pair-toggle'],
      [resultCss, '.pair-copy'],
    ] as Array<[string, string]>) {
      const rule = (css.match(new RegExp(`${selector.replace('.', '\\.')} \\{[^}]+\\}`)) ?? [''])[0]
      expect(rule, `${selector} should keep a 44px touch target`).toContain('min-height:44px')
    }
  })

  it('keeps action labels on one line and trims repeated explanatory copy', () => {
    const appCss = read('miniprogram/app.wxss')
    const home = read('miniprogram/pages/home/index.wxml')
    const quiz = read('miniprogram/pages/quiz/index.wxml')
    const result = read('miniprogram/pages/result/index.wxml')
    expect((appCss.match(/button \{[^}]+\}/) ?? [''])[0]).toContain('white-space: nowrap')
    expect(home).not.toContain('class="light-tip"')
    expect(home).not.toContain('一些很严谨的职场玄学')
    expect(home.match(/class="intro-copy/g)).toHaveLength(2)
    expect(quiz).not.toContain('class="chapter"')
    expect(quiz).not.toContain('想太久也没什么用')
    expect(quiz).toContain('答案仅保存在本机')
    expect(result).toContain('已有对口径码？手动输入')
    expect(result).toContain('生成我的匿名码')
    expect(result).toContain('鉴定你们的关系')
  })

  it('balances short mobile copy instead of leaving punctuation widows', () => {
    const styles = [
      read('miniprogram/pages/home/index.wxss'),
      read('miniprogram/pages/result/index.wxss'),
      read('miniprogram/components/question-card/index.wxss'),
      read('miniprogram/components/option-card/index.wxss'),
      read('miniprogram/components/reflection-card/index.wxss'),
    ].join('\n')
    for (const selector of [
      '.intro-copy',
      '.loading-active-copy',
      '.evidence-text',
      '.relationship-copy',
      '.question',
      '.text',
      '.paragraph',
      '.footer',
    ]) {
      const rule = (styles.match(new RegExp(`(?:^|\\n)${selector.replace('.', '\\.')} \\{[^}]+\\}`)) ?? [''])[0]
      expect(rule, `${selector} should opt into balanced wrapping`).toContain('text-wrap:balance')
    }
  })

  it('keeps entertainment disclaimers concise on home and result pages', () => {
    expect(definition.disclaimer).toBe('仅供职场娱乐，请勿过度认真。')
    expect(definition.resultDisclaimer).toBe('仅供娱乐，不代表真实绩效或职业建议。')
    expect([...definition.disclaimer]).toHaveLength(14)
    expect([...definition.resultDisclaimer]).toHaveLength(18)
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
    expect(homeCss).toMatch(/min-height:44px/)
    expect(logic).toContain('skipOpening()')
    expect(logic).toContain('1050')
  })
})
