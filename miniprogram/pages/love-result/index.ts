import { getProduct, LOVE_ACCIDENT_PRODUCT_ID } from '../../config/products'
import { loveAccidentTest } from '../../config/tests/love-accident/index'
import type { LoveEvaluationResult } from '../../config/tests/love-accident/types'
import { evaluateLoveAccident, personaName } from '../../domain/love-evaluation'
import { analytics } from '../../platform/analytics'
import { clearLoveProgress, loadLoveProgress } from '../../platform/love-storage'
import {
  buildProductPagePath,
  buildProductSharePath,
  guardProductAccess,
  normalizeProductSource,
  type ProductRouteOptions,
  type ProductSource,
} from '../../platform/product-routing'

const definition = loveAccidentTest
const product = getProduct(LOVE_ACCIDENT_PRODUCT_ID)!
let evaluation: LoveEvaluationResult | null = null
let source: ProductSource = 'normal'
let accessAllowed = false

Page({
  data: { ready: false, personaName: '', resultCard: null },
  onLoad(options: ProductRouteOptions) {
    source = normalizeProductSource(options.source)
    accessAllowed = guardProductAccess(product.product_id, options)
    if (!accessAllowed) return
    analytics.track('page_view', {
      product_id: product.product_id,
      page: 'result',
      testId: definition.id,
      testVersion: definition.version,
      source,
    })
    const stored = loadLoveProgress(definition)
    if (stored.status !== 'current' || stored.progress.stage !== 'complete') {
      wx.reLaunch({ url: buildProductPagePath(product.routes.home, product.product_id, source) })
      return
    }
    try {
      evaluation = evaluateLoveAccident(definition, stored.progress.answers)
      const persona = definition.personas.find((item) => item.id === evaluation?.final_persona)
      this.setData({
        ready: true,
        personaName: personaName(definition, evaluation.final_persona),
        resultCard: persona?.resultCard ?? null,
      })
      analytics.track('result_view', {
        product_id: product.product_id,
        testId: definition.id,
        testVersion: definition.version,
        finalPersona: evaluation.final_persona,
        resolutionMode: evaluation.resolution_mode,
        fallbackReason: evaluation.fallback_reason ?? undefined,
        source,
      })
    } catch {
      clearLoveProgress()
      wx.reLaunch({ url: buildProductPagePath(product.routes.home, product.product_id, source) })
    }
  },
  onUnload() {
    evaluation = null
    source = 'normal'
    accessAllowed = false
  },
  retry() {
    clearLoveProgress()
    analytics.track('retry_click', {
      product_id: product.product_id,
      testId: definition.id,
      finalPersona: evaluation?.final_persona,
      resolutionMode: evaluation?.resolution_mode,
      source,
    })
    wx.reLaunch({ url: buildProductPagePath(product.routes.home, product.product_id, source) })
  },
  onShareAppMessage() {
    analytics.track('share_click', {
      product_id: product.product_id,
      testId: definition.id,
      finalPersona: evaluation?.final_persona,
      resolutionMode: evaluation?.resolution_mode,
      source,
    })
    return {
      title: '恋爱事故鉴定书｜看看这段关系算什么事故',
      path: buildProductSharePath(product.product_id),
    }
  },
})
