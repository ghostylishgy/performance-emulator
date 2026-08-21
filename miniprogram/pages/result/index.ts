import { defaultTestId, getTestDefinition } from '../../config/test-registry'
import type { EvaluationResult, PairCodeResult } from '../../config/v3-types'
import { createResultViewModel, evaluateComplete } from '../../domain/v3-evaluation'
import { decodePairCode, encodePairCode, getPairRelationship, normalizePairCode, pairCodeErrorMessage } from '../../domain/v3-pairing'
import { analytics } from '../../platform/analytics'
import { createShareMessage } from '../../platform/sharing'
import { clearPendingPairCode, clearProgress, loadPendingPairCode, loadProgress } from '../../platform/storage'

const definition = getTestDefinition(defaultTestId)
let evaluation: EvaluationResult | null = null
let resultTimer: ReturnType<typeof setTimeout> | undefined

function currentPairResult(): PairCodeResult {
  if (!evaluation) throw new Error('Result is not ready')
  return {
    algorithmVersion: definition.pairing.algorithmVersion,
    persona: evaluation.primaryPersona,
    performanceScore: evaluation.finalOutcome,
    deathCause: evaluation.deathCause,
  }
}

function recoverInvalidProgress(): void {
  clearProgress(definition.id)
  wx.showModal({ title: '进度异常', content: '上次答题记录无法恢复，请重新开始。', showCancel: false, complete: () => wx.reLaunch({ url: '/pages/home/index' }) })
}

Page({
  data: {
    ready: false, loading: true, result: {}, revealStage: 1,
    resultTransition: definition.calculation, resultLineIndex: 0,
    reflection: definition.reflection, reflectionVisible: false,
    pairCode: '', pairInput: '', pairMessage: '', pairRelationship: null,
  },
  onLoad() {
    const stored = loadProgress(definition)
    if (stored.status === 'corrupt') return recoverInvalidProgress()
    if (stored.status !== 'current' || stored.progress.stage !== 'complete') {
      wx.reLaunch({ url: '/pages/home/index' })
      return
    }
    try {
      evaluation = evaluateComplete(definition, stored.progress.answers)
      const viewModel = createResultViewModel(definition, evaluation)
      const pendingPairCode = loadPendingPairCode()
      const validPendingPairCode = pendingPairCode && decodePairCode(pendingPairCode).ok ? pendingPairCode : ''
      if (pendingPairCode && !validPendingPairCode) clearPendingPairCode()
      this.setData({ result: viewModel, pairInput: validPendingPairCode })
      this.playCalculation()
    } catch {
      recoverInvalidProgress()
    }
  },
  onUnload() {
    if (resultTimer) clearTimeout(resultTimer)
    resultTimer = undefined
  },
  playCalculation() {
    let index = 0
    const advance = () => {
      if (index >= definition.calculation.lines.length - 1) {
        this.setData({ loading: false, ready: true, revealStage: 1 })
        analytics.track('final_result_view', { testId: definition.id, testVersion: definition.version, outcome: evaluation?.finalOutcome, persona: evaluation?.primaryPersona })
        return
      }
      index += 1
      this.setData({ resultLineIndex: index })
      const delay = index === definition.calculation.pauseAfterLine ? 620 : 260
      resultTimer = setTimeout(advance, delay)
    }
    this.setData({ loading: true, ready: false, resultLineIndex: 0 })
    resultTimer = setTimeout(advance, 260)
  },
  revealNext() {
    this.setData({ revealStage: Math.min(4, Number(this.data.revealStage) + 1) })
  },
  shareIntent() {
    analytics.track('share_tap', { testId: definition.id, outcome: evaluation?.finalOutcome })
    this.revealReflection()
  },
  revealReflection() {
    if (this.data.reflectionVisible) return
    this.setData({ reflectionVisible: true })
    analytics.track('reflection_view', { testId: definition.id })
  },
  closeReflection() { this.setData({ reflectionVisible: false }) },
  noop() { /* Absorb backdrop taps. */ },
  restart() {
    clearProgress(definition.id)
    analytics.track('restart', { testId: definition.id })
    wx.reLaunch({ url: '/pages/home/index' })
  },
  onPairInput(event: any) {
    this.setData({ pairInput: normalizePairCode(String(event.detail.value ?? '')), pairMessage: '', pairRelationship: null })
  },
  generatePairCode() {
    if (!evaluation) return
    try {
      const pairCode = encodePairCode(currentPairResult())
      this.setData({ pairCode, pairMessage: '对口径码已在本机生成，不会上传任何结果。' })
      analytics.track('pair_create', { testId: definition.id })
    } catch (error) {
      this.setData({ pairMessage: error instanceof Error ? error.message : '生成失败，请稍后再试。' })
    }
  },
  copyPairCode() {
    const code = String(this.data.pairCode || '')
    if (!code) return
    wx.setClipboardData({ data: code })
  },
  resolvePair() {
    if (!evaluation) return
    const code = normalizePairCode(String(this.data.pairInput ?? ''))
    const decoded = decodePairCode(code)
    if (!decoded.ok) {
      this.setData({ pairRelationship: null, pairMessage: pairCodeErrorMessage(decoded.error) })
      return
    }
    const relationship = getPairRelationship(definition, evaluation.primaryPersona, decoded.result.persona)
    clearPendingPairCode()
    this.setData({ pairRelationship: relationship, pairMessage: '' })
    analytics.track('pair_resolve', { testId: definition.id, relation: relationship.key })
  },
  onShareAppMessage() {
    this.revealReflection()
    if (!evaluation) return { title: definition.title, path: definition.share.path }
    const message = createShareMessage(definition, evaluation)
    const pairCode = String(this.data.pairCode || encodePairCode(currentPairResult()))
    if (!this.data.pairCode) this.setData({ pairCode })
    return { ...message, path: `${message.path}?pairCode=${pairCode}` }
  },
})
