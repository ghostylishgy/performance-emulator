import { LOVE_ACCIDENT_PRODUCT_ID, getProduct } from '../../config/products'
import { loveAccidentTest } from '../../config/tests/love-accident/index'
import { analytics } from '../../platform/analytics'
import { clearLoveProgress, loadLoveProgress } from '../../platform/love-storage'
import { buildProductPagePath, buildProductSharePath, normalizeProductSource, type ProductRouteOptions, type ProductSource } from '../../platform/product-routing'

const product = getProduct(LOVE_ACCIDENT_PRODUCT_ID)!
let source: ProductSource = 'normal'

Page({
  data: { title: product.title, hasProgress: false, hasResult: false },
  onLoad(options: ProductRouteOptions) {
    source = normalizeProductSource(options.source)
  },
  onShow() {
    const stored = loadLoveProgress(loveAccidentTest)
    this.setData({
      hasProgress: stored.status === 'current' && stored.progress.stage === 'answering',
      hasResult: stored.status === 'current' && stored.progress.stage === 'complete',
    })
    analytics.track('page_view', { product_id: product.product_id, page: 'home', source })
  },
  onUnload() {
    source = 'normal'
  },
  startAssessment() {
    clearLoveProgress()
    analytics.track('test_start', { product_id: product.product_id, source })
    wx.navigateTo({ url: buildProductPagePath(product.routes.test!, product.product_id, source) })
  },
  resumeAssessment() {
    analytics.track('resume_test', { product_id: product.product_id, testId: loveAccidentTest.id, source })
    wx.navigateTo({ url: buildProductPagePath(product.routes.test!, product.product_id, source) })
  },
  viewResult() {
    wx.navigateTo({ url: buildProductPagePath(product.routes.result!, product.product_id, source) })
  },
  onShareAppMessage() {
    analytics.track('share_click', { product_id: product.product_id, source })
    return {
      title: '恋爱事故鉴定书｜看看这段关系算什么事故',
      path: buildProductSharePath(product.product_id),
    }
  },
})
