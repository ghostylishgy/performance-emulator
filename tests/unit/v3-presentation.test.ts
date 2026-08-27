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

  it('locks the approved home, question, result and reflection copy', () => {
    const home = read('miniprogram/pages/home/index.wxml')
    const result = read('miniprogram/pages/result/index.wxml')
    const option = (questionId: string, optionId: string) => definition.questions
      .find((question) => question.id === questionId)!.options.find((item) => item.id === optionId)!.text
    expect(definition.subtitle).toBe('25题，测测你的工位物种。')
    expect(home).toContain('正在确认优秀名额是否存在……')
    expect(home).toContain('看看我是哪路牛马')
    expect(option('Q1', 'B')).toBe('团队的项目，但最难啃的那块，确实是我扛的')
    expect(option('Q3', 'C')).toBe('把领导最近半个月发过的问号翻出来，做了一次横向语气比对')
    expect(option('Q14', 'A')).toBe('笑着说“能用上挺好”，剩下的意见交给后槽牙')
    expect(option('Q24', 'A')).toBe('领导真会替我去抢，至少这次不是客套')
    expect(option('Q24', 'B')).toBe('会替我说几句，能不能抢到就看现场了')
    expect(result).toContain('组织内部校准记录')
    expect(result).toContain('保存这份校准单（留底备查）')
    expect(result).toContain('对结果存疑，申请复议')
    expect(result).toContain('同样是 3.5，死法不同。')
    expect(definition.reflection.footer).toBe('如果你笑完以后，还顺手想起了点什么，这个测试就没白做。')
  })

  it('keeps persona-first hierarchy while moving score and death ahead of evidence', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const stages = [...result.matchAll(/revealStage >= (\d)/g)].map((match) => Number(match[1]))
    expect(stages).toEqual([1, 2, 3, 4])
    const persona = result.indexOf('{{result.personaName}}')
    const quote = result.indexOf('{{result.personaCopy}}')
    const score = result.indexOf('{{result.outcome}}')
    const death = result.indexOf('{{result.deathCauseLabel}}')
    const evidence = result.indexOf('系统抓包')
    expect(result.indexOf('CONFIDENTIAL')).toBeLessThan(persona)
    expect(persona).toBeLessThan(quote)
    expect(quote).toBeLessThan(score)
    expect(score).toBeLessThan(evidence)
    expect(death).toBeLessThan(evidence)
  })

  it('makes persona the dominant visual anchor and demotes the final score', () => {
    const resultCss = read('miniprogram/pages/result/index.wxss')
    const tokens = read('miniprogram/styles/tokens.wxss')
    const displaySize = Number((tokens.match(/--text-display:\s*(\d+)rpx/) ?? ['0', '0'])[1] ?? 0)
    const headlineSize = Number((tokens.match(/--text-headline:\s*(\d+)rpx/) ?? ['0', '0'])[1] ?? 0)
    expect(displaySize).toBeGreaterThan(headlineSize)
    expect(resultCss.replace(/\s/g, '')).toContain('.persona-name{min-width:0;margin-top:var(--space-sm);overflow-wrap:anywhere;color:var(--color-primary-ink);font-size:var(--text-display)')
    expect(resultCss.replace(/\s/g, '')).toContain('.final-score{margin-top:2rpx;font-size:var(--text-headline)')
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

  it('reveals the first-screen verdict automatically after a 300ms calculation settle', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const logic = read('miniprogram/pages/result/index.ts')
    expect(result).not.toContain('bindtap="revealScore"')
    expect(logic).not.toContain('revealScore()')
    expect(result).not.toContain('revealNext')
    expect(logic).toContain('const RESULT_SETTLE_DELAY_MS = 300')
    expect(logic).toContain('definition.calculation.durationMs - RESULT_SETTLE_DELAY_MS')
    expect(logic).toContain('const SCORE_STAMP_DELAY_MS = 180')
    expect(logic).toContain('const EVIDENCE_REVEAL_DELAY_MS = 620')
    expect(logic).toContain('const ACTIONS_REVEAL_DELAY_MS = 820')
    expect(logic).toContain('this.setData({ revealStage: 4 })')
    expect(logic).toContain('clearResultTimers()')
    expect(logic).toContain('onHide()')
    expect(logic).toContain('onUnload()')
    expect(logic).toContain('activeCalculationLine')
  })

  it('keeps persona, quote, performance seal and death cause in one first-screen dossier', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    const css = read('miniprogram/pages/result/index.wxss')
    const dossier = (result.match(/<view wx:if="\{\{revealStage >= 1\}\}" class="result-dossier">[\s\S]*?<\/view>\s*<view wx:if="\{\{revealStage >= 3\}\}"/) ?? [''])[0]
    for (const field of ['{{result.personaName}}', '{{result.personaCopy}}', '{{result.outcome}}', '{{result.deathCauseLabel}}']) {
      expect(dossier).toContain(field)
    }
    expect(result.indexOf('result-dossier')).toBeLessThan(result.indexOf('evidence-reveal'))
    expect(result).not.toContain('score-reveal')
    expect(result).not.toContain('death-reveal')
    expect(result).not.toContain('persona-reveal')
    expect(result).not.toContain('kicker-index')
    expect(css).toContain('.performance-seal')
    expect(css).toContain('.death-annotation')
    expect(css).not.toContain('.score-reveal')
  })

  it('covers the final-question redirect with an opaque route-exit surface', () => {
    const quiz = read('miniprogram/pages/quiz/index.wxml')
    const logic = read('miniprogram/pages/quiz/index.ts')
    const css = read('miniprogram/pages/quiz/index.wxss')
    expect(quiz).toContain('wx:if="{{leavingQuiz}}" class="quiz-exit-mask"')
    expect(logic).toContain('leavingQuiz: false')
    expect(logic).toContain('const isFinalQuestion = progress.currentQuestionIndex === definition.questions.length - 1')
    expect(logic).toContain('leavingQuiz: isFinalQuestion')
    const maskRule = (css.match(/\.quiz-exit-mask \{[^}]+\}/) ?? [''])[0]
    expect(maskRule).toContain('position:fixed')
    expect(maskRule).toContain('inset:0')
    expect(maskRule).toContain('background:var(--color-page)')
  })

  it('crossfades the opening overlay over an already-rendered home surface', () => {
    const home = read('miniprogram/pages/home/index.wxml')
    const logic = read('miniprogram/pages/home/index.ts')
    const css = read('miniprogram/pages/home/index.wxss')
    expect(home).toContain("opening {{openingLeaving ? 'opening-leaving' : ''}}")
    expect(home).toContain('<view class="page-shell home">')
    expect(home).not.toContain('<view wx:else class="page-shell home">')
    expect(logic).toContain('const OPENING_EXIT_MS = 180')
    expect(logic).toContain('dismissOpening()')
    expect(css).toContain('.opening-leaving')
    expect(css).toContain('@keyframes opening-fade-out')
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
    expect(leadBlock).toContain('看看 TA 是哪路牛马')
    expect(leadBlock).toContain('pair-privacy')
    expect(result.slice(0, result.indexOf('<view wx:if="{{!pairRelationship}}" class="result-actions lead-actions">')))
      .not.toContain('保存这份校准单（留底备查）')
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
    expect(takeover).not.toContain('保存这份校准单（留底备查）')
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
    expect(takeover).toContain('看看 TA 是哪路牛马')
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
      '.paragraph',
      '.footer',
    ]) {
      const rule = (styles.match(new RegExp(`(?:^|\\n)${selector.replace('.', '\\.')} \\{[^}]+\\}`)) ?? [''])[0]
      expect(rule, `${selector} should opt into balanced wrapping`).toContain('text-wrap:balance')
    }
  })

  it('lets quiz questions and options wrap naturally without authored line breaks', () => {
    for (const question of definition.questions) {
      expect(question.text).not.toContain('\n')
      for (const option of question.options) expect(option.text).not.toContain('\n')
    }
    for (const [path, selector] of [
      ['miniprogram/components/question-card/index.wxss', '.question'],
      ['miniprogram/components/option-card/index.wxss', '.text'],
    ] as const) {
      const rule = (read(path).match(new RegExp(`(?:^|\\n)${selector.replace('.', '\\.')} \\{[^}]+\\}`)) ?? [''])[0]
      expect(rule).toContain('white-space:normal')
      expect(rule).not.toContain('white-space:pre-line')
      expect(rule).not.toContain('text-wrap:balance')
    }
    const optionTextRule = (read('miniprogram/components/option-card/index.wxss').match(/(?:^|\n)\.text \{[^}]+\}/) ?? [''])[0]
    expect(optionTextRule).toContain('flex:1')
    expect(optionTextRule).toContain('min-width:0')
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
    expect(home).toContain('class="opening {{openingLeaving')
    expect(home).toContain('bindtap="skipOpening"')
    expect(home).toContain('跳过开场')
    expect(homeCss).toContain('.opening-skip')
    expect(homeCss).toMatch(/min-height:44px/)
    expect(logic).toContain('skipOpening()')
    expect(logic).toContain('1050')
  })
})
