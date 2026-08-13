import { defaultTestId, getTestDefinition } from '../../config/test-registry'
import { createResultViewModel, evaluateFromFrozen } from '../../domain/evaluation-pipeline'
import type { EvaluationResult } from '../../config/types'
import { analytics } from '../../platform/analytics'
import { createShareMessage } from '../../platform/sharing'
import { clearProgress, loadProgress } from '../../platform/storage'

const definition = getTestDefinition(defaultTestId)
let evaluation: EvaluationResult | null = null
let personaName = ''
let resultTimer: ReturnType<typeof setTimeout> | undefined
let resultScanTimer: ReturnType<typeof setInterval> | undefined

function recoverInvalidProgress(): void {
  clearProgress(definition.id)
  wx.showModal({
    title: '进度异常',
    content: '上次答题记录无法恢复，请重新开始。',
    showCancel: false,
    complete: () => wx.reLaunch({ url: '/pages/home/index' }),
  })
}

Page({
  data: {
    ready: false,
    loading: true,
    result: {},
    resultTransition: definition.resultTransition,
    resultLineIndex: 0,
    reflection: definition.reflectionConfig,
    reflectionVisible: false,
    resultAfterPrimaryAd: definition.adSlots.find((slot) => slot.key === 'result_after_primary'),
    resultBottomAd: definition.adSlots.find((slot) => slot.key === 'result_bottom'),
  },
  onLoad() {
    const stored = loadProgress(definition)
    if (stored.status === 'corrupt') {
      recoverInvalidProgress()
      return
    }
    if (stored.status !== 'current' || stored.progress.stage !== 'complete') {
      wx.reLaunch({ url: '/pages/home/index' })
      return
    }
    if (!stored.progress.baseOutcomeFrozen || !stored.progress.frozenPersonalAnswers) {
      recoverInvalidProgress()
      return
    }
    try {
      evaluation = evaluateFromFrozen(definition, stored.progress.frozenPersonalAnswers, stored.progress.answers)
      const viewModel = createResultViewModel(definition, evaluation)
      personaName = viewModel.personaName
      this.playResultTransition(viewModel)
    } catch {
      recoverInvalidProgress()
    }
  },
  onUnload() {
    if (resultTimer) clearTimeout(resultTimer)
    if (resultScanTimer) clearInterval(resultScanTimer)
    resultTimer = undefined
    resultScanTimer = undefined
  },
  playResultTransition(viewModel: ReturnType<typeof createResultViewModel>) {
    let index = 0
    this.setData({ loading: true, ready: false, resultLineIndex: index })
    const duration = definition.resultTransition.durationMs
    const lineCount = definition.resultTransition.lines.length
    resultScanTimer = setInterval(() => {
      index = Math.min(index + 1, lineCount - 1)
      this.setData({ resultLineIndex: index })
    }, Math.floor(duration / lineCount))
    resultTimer = setTimeout(() => {
      if (resultScanTimer) clearInterval(resultScanTimer)
      resultScanTimer = undefined
      this.setData({ loading: false, ready: true, result: viewModel })
      analytics.track('final_result_view', {
        testId: definition.id,
        testVersion: definition.version,
        outcome: evaluation?.finalOutcome,
        persona: evaluation?.primaryPersona,
      })
    }, duration)
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
  closeReflection() {
    this.setData({ reflectionVisible: false })
  },
  noop() {
    // Deliberately absorbs backdrop taps and touch moves inside the card.
  },
  restart() {
    clearProgress(definition.id)
    analytics.track('restart', { testId: definition.id })
    wx.reLaunch({ url: '/pages/home/index' })
  },
  onShareAppMessage() {
    this.revealReflection()
    if (!evaluation) return { title: definition.title, path: definition.shareConfig.path }
    return createShareMessage(definition, evaluation, personaName)
  },
})
