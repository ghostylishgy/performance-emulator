import {
  getDefaultProduct,
  getProduct,
  type ProductDefinition,
  type ProductId,
} from '../config/products'

export type ProductSource = 'normal' | 'share'

export interface ProductRouteOptions {
  product_id?: string
  source?: string
  persona?: string
  pairCode?: string
  [key: string]: string | undefined
}

export interface ProductResolution {
  product: ProductDefinition
  requestedProductId?: string
  reason: 'requested' | 'default' | 'disabled' | 'unknown'
}

export function normalizeProductSource(source?: string): ProductSource {
  return source === 'share' ? 'share' : 'normal'
}

export function resolveProduct(requestedProductId?: string): ProductResolution {
  if (!requestedProductId) return { product: getDefaultProduct(), reason: 'default' }
  const requested = getProduct(requestedProductId)
  if (!requested) return { product: getDefaultProduct(), requestedProductId, reason: 'unknown' }
  if (!requested.enabled) return { product: getDefaultProduct(), requestedProductId, reason: 'disabled' }
  return { product: requested, requestedProductId, reason: 'requested' }
}

export function appendRouteQuery(path: string, query: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(query).filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
  if (!entries.length) return path
  const separator = path.includes('?') ? '&' : '?'
  const serialized = serializeRouteQuery(Object.fromEntries(entries))
  return `${path}${separator}${serialized}`
}

export function serializeRouteQuery(query: Record<string, string | number | boolean | undefined>): string {
  return Object.entries(query)
    .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
}

export function buildProductPagePath(
  path: string,
  productId: ProductId,
  source: ProductSource = 'normal',
  extra: Record<string, string | number | boolean | undefined> = {},
): string {
  return appendRouteQuery(path, { ...extra, product_id: productId, source })
}

export function buildProductHomePath(productId: ProductId, source: ProductSource = 'normal'): string {
  const product = getProduct(productId)
  if (!product) throw new Error(`Unknown product: ${productId}`)
  return buildProductPagePath(product.routes.home, product.product_id, source)
}

export function buildProductSharePath(
  productId: ProductId,
  extra: Record<string, string | number | boolean | undefined> = {},
): string {
  const product = getProduct(productId)
  if (!product) throw new Error(`Unknown product: ${productId}`)
  const { product_id: _ignoredProductId, source: _ignoredSource, ...safeExtra } = extra
  return appendRouteQuery(product.routes.shareEntry, { product_id: product.product_id, source: 'share', ...safeExtra })
}

export function buildProductShareQuery(
  productId: ProductId,
  extra: Record<string, string | number | boolean | undefined> = {},
): string {
  const product = getProduct(productId)
  if (!product) throw new Error(`Unknown product: ${productId}`)
  const { product_id: _ignoredProductId, source: _ignoredSource, ...safeExtra } = extra
  return serializeRouteQuery({ product_id: product.product_id, source: 'share', ...safeExtra })
}

export function guardProductAccess(productId: ProductId, options: ProductRouteOptions = {}): boolean {
  const requested = getProduct(productId)
  if (requested?.enabled) return true
  const fallback = getDefaultProduct()
  wx.reLaunch({ url: buildProductHomePath(fallback.product_id, normalizeProductSource(options.source)) })
  return false
}
