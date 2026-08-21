import { defaultTestId, getTestDefinition } from '../../config/test-registry'
import type { EvaluationResult, PairResultSnapshot } from '../../config/v3-types'
import { createResultViewModel, evaluateComplete } from '../../domain/v3-evaluation'
import { getPairRelationship, normalizePairCode } from '../../domain/v3-pairing'
import { analytics } from '../../platform/analytics'
import { createPairCode, resolvePairCode } from '../../platform/pairing'
import { createShareMessage } from '../../platform/sharing'
import { clearPendingPairCode, clearProgress, loadPendingPairCode, loadProgress } from '../../platform/storage'

const definition = getTestDefinition(defaultTestId)
let evaluation: EvaluationResult | null = null
let resultTimer: ReturnType<typeof setTimeout> | undefined

function recoverInvalidProgress(): void {
  clearProgress(definition.id)
  wx.showModal({ title: '进度异常', content: '上次答题记录无法恢复，请重新开始。', showCancel: false, complete: () => wx.reLaunch({ url: '/pages/home/index' }) })
}

Page({
  data: {
    ready: false, loading: true, result: {}, revealStage: 1,
    resultTransition: definition.calculation, resultLineIndex: 0,
    reflection: definition.reflection, reflectionVisible: false,
    pairCode: '', pairInput: '', pairLoading: false, pairMessage: '', pairRelationship: null,
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
      this.setData({ result: viewModel, pairInput: loadPendingPairCode() })
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
  async generatePairCode() {
    if (!evaluation || this.data.pairLoading) return
    this.setData({ pairLoading: true, pairMessage: '' })
    const snapshot: PairResultSnapshot = {
      persona: evaluation.primaryPersona, score: evaluation.finalOutcome,
      deathCause: evaluation.deathCause, evaluationVersion: evaluation.evaluationVersion,
    }
    try {
      const created = await createPairCode(snapshot)
      this.setData({ pairCode: created.code, pairLoading: false, pairMessage: '对口径码已生成，7天内有效。' })
      analytics.track('pair_create', { testId: definition.id })
    } catch (error) {
      this.setData({ pairLoading: false, pairMessage: error instanceof Error ? error.message : '生成失败，请稍后再试。' })
    }
  },
  async resolvePair() {
    if (!evaluation || this.data.pairLoading) return
    const code = normalizePairCode(String(this.data.pairInput ?? ''))
    if (code.length !== definition.pairing.codeLength) {
      this.setData({ pairMessage: '请输入6位对口径码。', pairRelationship: null })
      return
    }
    this.setData({ pairLoading: true, pairMessage: '' })
    try {
      const peer = await resolvePairCode(code)
      const relationship = getPairRelationship(definition, evaluation.primaryPersona, peer.persona)
      clearPendingPairCode()
      this.setData({ pairLoading: false, pairRelationship: relationship, pairMessage: '' })
      analytics.track('pair_resolve', { testId: definition.id, relation: relationship.key })
    } catch (error) {
      this.setData({ pairLoading: false, pairRelationship: null, pairMessage: error instanceof Error ? error.message : '查询失败，请稍后再试。' })
    }
  },
  onShareAppMessage() {
    this.revealReflection()
    if (!evaluation) return { title: definition.title, path: definition.share.path }
    const message = createShareMessage(definition, evaluation)
    return this.data.pairCode ? { ...message, path: `${message.path}?pairCode=${this.data.pairCode}` } : message
  },
})
