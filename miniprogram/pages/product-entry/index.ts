import { LOVE_ACCIDENT_PRODUCT_ID } from '../../config/products'
import { parseLovePublicPersona } from '../../config/tests/love-accident/public-persona'
import { analytics } from '../../platform/analytics'
import {
  buildProductHomePath,
  buildProductPagePath,
  normalizeProductSource,
  resolveProduct,
  type ProductRouteOptions,
} from '../../platform/product-routing'

Page({
  onLoad(options: ProductRouteOptions) {
    const source = normalizeProductSource(options.source)
    const resolution = resolveProduct(options.product_id)
    analytics.track('page_view', {
      product_id: resolution.product.product_id,
      page: 'product_entry',
      source,
      route_reason: resolution.reason,
    })
    const publicPersona = resolution.reason === 'requested'
      && resolution.product.product_id === LOVE_ACCIDENT_PRODUCT_ID
      && source === 'share'
      ? parseLovePublicPersona(options.persona)
      : null
    if (publicPersona && resolution.product.routes.result) {
      wx.reLaunch({
        url: buildProductPagePath(resolution.product.routes.result, resolution.product.product_id, source, {
          persona: publicPersona,
        }),
      })
      return
    }
    wx.reLaunch({ url: buildProductHomePath(resolution.product.product_id, source) })
  },
})
