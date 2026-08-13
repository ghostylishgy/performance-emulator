import { defaultTestId, getTestDefinition } from '../../config/test-registry'
import { createProgress } from '../../domain/session'
import { analytics } from '../../platform/analytics'
import { clearProgress, loadProgress, saveProgress } from '../../platform/storage'

const definition = getTestDefinition(defaultTestId)

Page({
  data: {
    title: definition.title,
    subtitle: definition.subtitle,
    description: definition.description,
    disclaimer: definition.disclaimer,
    hasResume: false,
    resumeLabel: '',
    versionNotice: '',
    homeAdSlot: definition.adSlots.find((slot) => slot.key === 'home_bottom'),
  },
  onShow() {
    analytics.track('test_view', { testId: definition.id, testVersion: definition.version })
    const stored = loadProgress(definition)
    if (stored.status === 'current') {
      const answered = Object.keys(stored.progress.answers).length
      this.setData({
        hasResume: true,
        resumeLabel: stored.progress.stage === 'complete'
          ? '上次绩效校准已完成'
          : `上次绩效校准进行到 ${answered} / ${definition.questions.length}`,
        versionNotice: '',
      })
      return
    }
    this.setData({
      hasResume: false,
      resumeLabel: '',
      versionNotice: stored.status === 'version-mismatch' ? '测试版本已经更新，请重新开始。' : '',
    })
  },
  start() {
    clearProgress(definition.id)
    saveProgress(createProgress(definition))
    analytics.track('test_start', { testId: definition.id, testVersion: definition.version })
    wx.navigateTo({ url: `/pages/quiz/index?testId=${definition.id}` })
  },
  resume() {
    const stored = loadProgress(definition)
    if (stored.status !== 'current') return this.start()
    analytics.track('resume_test', { testId: definition.id, stage: stored.progress.stage })
    const url = stored.progress.stage === 'complete'
      ? `/pages/result/index?testId=${definition.id}`
      : `/pages/quiz/index?testId=${definition.id}`
    wx.navigateTo({ url })
  },
  restart() {
    analytics.track('restart', { testId: definition.id })
    this.start()
  },
})

