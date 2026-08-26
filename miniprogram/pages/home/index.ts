import { defaultTestId, getTestDefinition } from '../../config/test-registry'
import { createProgress } from '../../domain/session'
import { analytics } from '../../platform/analytics'
import { pairCodeFromShareOptions } from '../../domain/v3-pairing'
import { showProgressSaveWarning } from '../../platform/progress-recovery'
import { clearProgress, loadProgress, savePendingPairCode, saveProgress } from '../../platform/storage'

const definition = getTestDefinition(defaultTestId)
const OPENING_DURATION_MS = 1050
const OPENING_EXIT_MS = 180
let openingShown = false
let openingTimer: ReturnType<typeof setTimeout> | undefined

Page({
  data: {
    openingVisible: true,
    openingLeaving: false,
    introVisible: false,
    title: definition.title,
    subtitle: definition.subtitle,
    description: definition.description,
    disclaimer: definition.disclaimer,
    hasResume: false,
    resumeLabel: '',
    resumeActionLabel: '接着打',
    versionNotice: '',
    pairInviteVisible: false,
  },
  onLoad(options: { pairCode?: string }) {
    const pairCode = pairCodeFromShareOptions(options)
    if (pairCode) {
      if (savePendingPairCode(pairCode)) this.setData({ pairInviteVisible: true })
      else wx.showToast({ title: '对口径邀请暂存失败，可稍后手动输码', icon: 'none' })
    }
    if (openingShown) {
      this.setData({ openingVisible: false, openingLeaving: false })
      return
    }
    openingShown = true
    openingTimer = setTimeout(() => this.dismissOpening(), OPENING_DURATION_MS)
  },
  onUnload() {
    if (openingTimer) clearTimeout(openingTimer)
    openingTimer = undefined
  },
  onShow() {
    analytics.track('test_view', { testId: definition.id, testVersion: definition.version })
    const stored = loadProgress(definition)
    if (stored.status === 'current') {
      const answered = Object.keys(stored.progress.answers).length
      this.setData({
        hasResume: true,
        resumeLabel: stored.progress.stage === 'complete'
          ? '上次结果已经算完'
          : `上次打分进行到 ${answered} / ${definition.questions.length}`,
        resumeActionLabel: stored.progress.stage === 'complete' ? '查看绩效' : '接着打',
        versionNotice: '',
      })
      return
    }
    this.setData({
      hasResume: false,
      resumeLabel: '',
      resumeActionLabel: '接着打',
      versionNotice: stored.status === 'version-mismatch' ? '测试版本已经更新，请重新开始。' : '',
    })
  },
  dismissOpening() {
    if (!this.data.openingVisible || this.data.openingLeaving) return
    if (openingTimer) clearTimeout(openingTimer)
    this.setData({ openingLeaving: true })
    openingTimer = setTimeout(() => {
      openingTimer = undefined
      this.setData({ openingVisible: false, openingLeaving: false })
    }, OPENING_EXIT_MS)
  },
  skipOpening() {
    this.dismissOpening()
  },
  noop() {
    // Keep taps inside the intro card from closing it.
  },
  start() {
    this.setData({ introVisible: true })
  },
  closeIntro() {
    this.setData({ introVisible: false })
  },
  beginTest() {
    clearProgress(definition.id)
    if (!saveProgress(createProgress(definition))) showProgressSaveWarning()
    analytics.track('test_start', { testId: definition.id, testVersion: definition.version })
    wx.navigateTo({ url: '/pages/quiz/index' })
  },
  resume() {
    const stored = loadProgress(definition)
    if (stored.status !== 'current') return this.start()
    analytics.track('resume_test', { testId: definition.id, stage: stored.progress.stage })
    const url = stored.progress.stage === 'complete'
      ? '/pages/result/index'
      : '/pages/quiz/index'
    wx.navigateTo({ url })
  },
  restart() {
    analytics.track('restart', { testId: definition.id })
    this.start()
  },
})
