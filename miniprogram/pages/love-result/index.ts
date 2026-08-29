import { getProduct, LOVE_ACCIDENT_PRODUCT_ID } from '../../config/products'
import { loveAccidentTest } from '../../config/tests/love-accident/index'
import { parseLovePublicPersona } from '../../config/tests/love-accident/public-persona'
import { loveShareAssets } from './share-assets'
import type { LoveEvaluationResult, LovePersonaId } from '../../config/tests/love-accident/types'
import { evaluateLoveAccident } from '../../domain/love-evaluation'
import { analytics } from '../../platform/analytics'
import { clearLoveProgress, loadLoveProgress } from '../../platform/love-storage'
import {
  buildProductPagePath,
  buildProductShareQuery,
  buildProductSharePath,
  guardProductAccess,
  normalizeProductSource,
  type ProductRouteOptions,
  type ProductSource,
} from '../../platform/product-routing'
import { getLovePublicResultData } from './public-result'

const definition = loveAccidentTest
const product = getProduct(LOVE_ACCIDENT_PRODUCT_ID)!
let evaluation: LoveEvaluationResult | null = null
let activePersona: LovePersonaId | null = null
let isPublicMode = false
let source: ProductSource = 'normal'
let accessAllowed = false

Page({
  data: { ready: false, personaName: '', resultCard: null, shareImageUrl: '', isPublicResult: false },
  onLoad(options: ProductRouteOptions) {
    evaluation = null
    activePersona = null
    isPublicMode = false
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
    if (source === 'share' && options.persona !== undefined) {
      const publicPersona = parseLovePublicPersona(options.persona)
      const publicResult = publicPersona ? getLovePublicResultData(publicPersona) : null
      if (!publicResult) {
        wx.reLaunch({ url: buildProductPagePath(product.routes.home, product.product_id, source) })
        return
      }
      activePersona = publicResult.personaId
      isPublicMode = true
      this.setData({
        ready: true,
        personaName: publicResult.personaName,
        resultCard: publicResult.resultCard,
        shareImageUrl: publicResult.shareImageUrl,
        isPublicResult: true,
      })
      analytics.track('result_view', {
        product_id: product.product_id,
        testId: definition.id,
        testVersion: definition.version,
        finalPersona: publicResult.personaId,
        source,
      })
      return
    }
    const stored = loadLoveProgress(definition)
    if (stored.status !== 'current' || stored.progress.stage !== 'complete') {
      wx.reLaunch({ url: buildProductPagePath(product.routes.home, product.product_id, source) })
      return
    }
    try {
      evaluation = evaluateLoveAccident(definition, stored.progress.answers)
      activePersona = evaluation.final_persona
      isPublicMode = false
      const persona = definition.personas.find((item) => item.id === evaluation?.final_persona)
      if (!persona?.resultCard) throw new Error(`Missing result card for ${evaluation.final_persona}`)
      this.setData({
        ready: true,
        personaName: persona.resultCard.personaName,
        resultCard: persona.resultCard,
        shareImageUrl: loveShareAssets[evaluation.final_persona].friend,
        isPublicResult: false,
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
    activePersona = null
    isPublicMode = false
    source = 'normal'
    accessAllowed = false
  },
  retry() {
    if (!isPublicMode && !this?.data?.isPublicResult) {
      clearLoveProgress()
    }
    analytics.track('retry_click', {
      product_id: product.product_id,
      testId: definition.id,
      finalPersona: activePersona ?? undefined,
      resolutionMode: evaluation?.resolution_mode,
      source,
    })
    wx.reLaunch({ url: buildProductPagePath(product.routes.home, product.product_id, source) })
  },
  onShareAppMessage() {
    analytics.track('share_click', {
      product_id: product.product_id,
      testId: definition.id,
      finalPersona: activePersona ?? undefined,
      resolutionMode: evaluation?.resolution_mode,
      source,
    })
    const resolvedPersonaName = this?.data?.personaName
      || (activePersona ? definition.personas.find((item) => item.id === activePersona)?.resultCard?.personaName : '')
    const personaTitle = resolvedPersonaName
      ? `我被鉴定成「${resolvedPersonaName}」，你呢？`
      : '恋爱事故鉴定书｜看看这段关系算什么事故'
    return {
      title: personaTitle,
      path: buildProductSharePath(product.product_id, { persona: activePersona ?? undefined }),
      ...(activePersona ? { imageUrl: loveShareAssets[activePersona].friend } : {}),
    }
  },
  onShareTimeline() {
    analytics.track('share_click', {
      product_id: product.product_id,
      testId: definition.id,
      finalPersona: activePersona ?? undefined,
      resolutionMode: evaluation?.resolution_mode,
      source,
    })
    const resolvedPersonaName = this?.data?.personaName
      || (activePersona ? definition.personas.find((item) => item.id === activePersona)?.resultCard?.personaName : '')
    const personaTitle = resolvedPersonaName
      ? `我被鉴定成「${resolvedPersonaName}」，你呢？`
      : '恋爱事故鉴定书｜看看这段关系算什么事故'
    return {
      title: personaTitle,
      query: buildProductShareQuery(product.product_id, { persona: activePersona ?? undefined }),
      ...(activePersona ? { imageUrl: loveShareAssets[activePersona].timeline } : {}),
    }
  },
})
