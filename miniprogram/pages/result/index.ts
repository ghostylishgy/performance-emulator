import { defaultTestId, getTestDefinition } from '../../config/test-registry'
import { createResultViewModel, evaluateFromFrozen } from '../../domain/evaluation-pipeline'
import type { EvaluationResult } from '../../config/types'
import { analytics } from '../../platform/analytics'
import { createShareMessage } from '../../platform/sharing'
import { clearProgress, loadProgress } from '../../platform/storage'

const definition = getTestDefinition(defaultTestId)
let evaluation: EvaluationResult | null = null
let personaName = ''

Page({
  data: {
    ready: false,
    result: {},
    reflection: definition.reflectionConfig,
    resultAfterPrimaryAd: definition.adSlots.find((slot) => slot.key === 'result_after_primary'),
    resultBottomAd: definition.adSlots.find((slot) => slot.key === 'result_bottom'),
  },
  onLoad() {
    const stored = loadProgress(definition)
    if (stored.status !== 'current' || !stored.progress.baseOutcomeFrozen || !stored.progress.frozenPersonalAnswers) {
      wx.reLaunch({ url: '/pages/home/index' })
      return
    }
    try {
      evaluation = evaluateFromFrozen(definition, stored.progress.frozenPersonalAnswers, stored.progress.answers)
      const viewModel = createResultViewModel(definition, evaluation)
      personaName = viewModel.personaName
      this.setData({ ready: true, result: viewModel })
      analytics.track('final_result_view', {
        testId: definition.id,
        testVersion: definition.version,
        outcome: evaluation.finalOutcome,
        persona: evaluation.primaryPersona,
      })
      analytics.track('reflection_view', { testId: definition.id })
    } catch {
      wx.showToast({ title: '结果计算失败，请返回检查答题进度', icon: 'none' })
      wx.redirectTo({ url: `/pages/quiz/index?testId=${definition.id}` })
    }
  },
  shareIntent() {
    analytics.track('share_tap', { testId: definition.id, outcome: evaluation?.finalOutcome })
  },
  restart() {
    clearProgress(definition.id)
    analytics.track('restart', { testId: definition.id })
    wx.reLaunch({ url: '/pages/home/index' })
  },
  onShareAppMessage() {
    if (!evaluation) return { title: definition.title, path: definition.shareConfig.path }
    return createShareMessage(definition, evaluation, personaName)
  },
})

