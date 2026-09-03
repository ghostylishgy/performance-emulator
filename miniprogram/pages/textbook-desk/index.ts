import { getProduct, TEXTBOOK_DESK_PRODUCT_ID } from '../../config/products'
import { buildProductSharePath, buildProductShareQuery, guardProductAccess, type ProductRouteOptions } from '../../platform/product-routing'
import { getBooksForTarget } from './catalog'
import { loadTextbookPreference } from './storage'
import { buildTextbookSharePayload } from './share'
import { getTextbookTarget } from './targets'
import { trackBookSetOpen, trackTextbookShare, type TextbookAnalyticsContext } from './analytics'
import { resolveTextbookEntryState } from './view-state'
import type { TextbookTargetId, TextbookViewMode } from './types'

const product = getProduct(TEXTBOOK_DESK_PRODUCT_ID)!
let activeContext: TextbookAnalyticsContext | null = null

Page({
  data: {
    ready: false,
    productTitle: product.title,
    screen: 'first_setup',
    mode: 'current' as TextbookViewMode,
    target: '' as TextbookTargetId | '',
    bookCount: 0,
  },
  onLoad(options: ProductRouteOptions) {
    activeContext = null
    if (!guardProductAccess(product.product_id, options)) return

    // A validated share is resolved before storage is read, so a receiver's
    // saved grade cannot affect or be changed by the transient shared view.
    const sharedState = resolveTextbookEntryState(options, null, new Date())
    let state = sharedState
    if (sharedState.screen !== 'semester_desk' || !sharedState.transientShareView) {
      const stored = loadTextbookPreference()
      state = resolveTextbookEntryState(options, stored.status === 'current' ? stored.preference : null, new Date())
    }

    if (state.screen === 'first_setup') {
      this.setData({ ready: true, screen: state.screen })
      return
    }

    const target = getTextbookTarget(state.target)
    activeContext = {
      mode: state.mode,
      viewerGrade: state.homeGrade,
      contentStage: target.stage,
      contentGrade: target.grade,
      term: target.term,
      source: state.source,
      target: state.target,
    }
    this.setData({
      ready: true,
      screen: state.screen,
      mode: state.mode,
      target: state.target,
      bookCount: getBooksForTarget(state.target).length,
    })
    trackBookSetOpen(activeContext)
  },
  onUnload() {
    activeContext = null
  },
  onShareAppMessage() {
    if (!activeContext) return { title: product.title, path: buildProductSharePath(product.product_id) }
    trackTextbookShare(activeContext)
    const share = buildTextbookSharePayload(activeContext.mode, activeContext.target)
    return { title: share.title, path: share.path }
  },
  onShareTimeline() {
    if (!activeContext) return { title: product.title, query: buildProductShareQuery(product.product_id) }
    trackTextbookShare(activeContext)
    const share = buildTextbookSharePayload(activeContext.mode, activeContext.target)
    return { title: share.title, query: share.query }
  },
})
