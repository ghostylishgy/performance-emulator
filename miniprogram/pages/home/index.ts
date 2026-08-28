import { defaultTestId, getTestDefinition } from '../../config/test-registry'
import { getProduct, PERFORMANCE_PRODUCT_ID } from '../../config/products'
import { createProgress } from '../../domain/session'
import { analytics } from '../../platform/analytics'
import { pairCodeFromShareOptions } from '../../domain/v3-pairing'
import { showProgressSaveWarning } from '../../platform/progress-recovery'
import { buildProductPagePath, guardProductAccess, normalizeProductSource, type ProductRouteOptions, type ProductSource } from '../../platform/product-routing'
import { clearProgress, loadProgress, savePendingPairCode, saveProgress } from '../../platform/storage'

const definition = getTestDefinition(defaultTestId)
const product = getProduct(PERFORMANCE_PRODUCT_ID)!
const OPENING_DURATION_MS = 1050
const OPENING_EXIT_MS = 180
let openingShown = false
let openingTimer: ReturnType<typeof setTimeout> | undefined
let pageSource: ProductSource = 'normal'
let accessAllowed = false

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
  onLoad(options: ProductRouteOptions) {
    pageSource = normalizeProductSource(options.source)
    accessAllowed = guardProductAccess(product.product_id, options)
    if (!accessAllowed) return
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
    accessAllowed = false
    pageSource = 'normal'
  },
  onShow() {
    if (!accessAllowed) return
    analytics.track('page_view', { product_id: product.product_id, testId: definition.id, testVersion: definition.version, page: 'home', source: pageSource })
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
    analytics.track('test_start', { product_id: product.product_id, testId: definition.id, testVersion: definition.version, source: pageSource })
    wx.navigateTo({ url: buildProductPagePath(product.routes.test!, product.product_id, pageSource) })
  },
  resume() {
    const stored = loadProgress(definition)
    if (stored.status !== 'current') return this.start()
    analytics.track('resume_test', { product_id: product.product_id, testId: definition.id, stage: stored.progress.stage, source: pageSource })
    const route = stored.progress.stage === 'complete' ? product.routes.result! : product.routes.test!
    const url = buildProductPagePath(route, product.product_id, pageSource)
    wx.navigateTo({ url })
  },
  restart() {
    analytics.track('retry_click', { product_id: product.product_id, testId: definition.id, source: pageSource })
    this.start()
  },
})
