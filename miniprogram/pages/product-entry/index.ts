import { analytics } from '../../platform/analytics'
import { buildProductHomePath, normalizeProductSource, resolveProduct, type ProductRouteOptions } from '../../platform/product-routing'

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
    wx.reLaunch({ url: buildProductHomePath(resolution.product.product_id, source) })
  },
})
