import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  getDefaultProduct,
  getProduct,
  LOVE_ACCIDENT_PRODUCT_ID,
  PERFORMANCE_PRODUCT_ID,
  TEXTBOOK_DESK_PRODUCT_ID,
  productRegistry,
  validateProductRegistry,
} from '../../miniprogram/config/products'
import { getActiveAdSlot, adSlots } from '../../miniprogram/platform/advertising'
import {
  buildProductHomePath,
  buildProductShareQuery,
  buildProductSharePath,
  normalizeProductSource,
  resolveProduct,
} from '../../miniprogram/platform/product-routing'
import { createRelationshipShareMessage } from '../../miniprogram/platform/sharing'
import { performanceSimulator } from '../../miniprogram/config/tests/performance-simulator'

describe('multi-product routing infrastructure', () => {
  it('keeps one enabled default and soft-disables performance', () => {
    expect(() => validateProductRegistry(productRegistry)).not.toThrow()
    expect(getDefaultProduct().product_id).toBe(LOVE_ACCIDENT_PRODUCT_ID)
    expect(getProduct(LOVE_ACCIDENT_PRODUCT_ID)).toMatchObject({ enabled: true, isDefault: true, featured: true })
    expect(getProduct(PERFORMANCE_PRODUCT_ID)).toMatchObject({ enabled: false, isDefault: false, featured: false })
    expect(getProduct(TEXTBOOK_DESK_PRODUCT_ID)).toMatchObject({
      enabled: false,
      isDefault: false,
      featured: false,
      routes: { home: '/pages/textbook-desk/index', test: null, result: null, shareEntry: '/pages/textbook-desk/index' },
    })
  })

  it('falls back safely for disabled, unknown, and missing product ids', () => {
    expect(resolveProduct(PERFORMANCE_PRODUCT_ID)).toMatchObject({ reason: 'disabled', product: { product_id: LOVE_ACCIDENT_PRODUCT_ID } })
    expect(resolveProduct('retired-product')).toMatchObject({ reason: 'unknown', product: { product_id: LOVE_ACCIDENT_PRODUCT_ID } })
    expect(resolveProduct()).toMatchObject({ reason: 'default', product: { product_id: LOVE_ACCIDENT_PRODUCT_ID } })
  })

  it('builds stable product-aware home and share paths', () => {
    expect(buildProductHomePath(LOVE_ACCIDENT_PRODUCT_ID)).toBe('/pages/love-accident/index?product_id=love_accident&source=normal')
    expect(buildProductSharePath(LOVE_ACCIDENT_PRODUCT_ID)).toBe('/pages/product-entry/index?product_id=love_accident&source=share')
    expect(buildProductSharePath(LOVE_ACCIDENT_PRODUCT_ID, { persona: 'AUDIT' })).toBe('/pages/product-entry/index?product_id=love_accident&source=share&persona=AUDIT')
    expect(buildProductShareQuery(LOVE_ACCIDENT_PRODUCT_ID, { persona: 'AUDIT' })).toBe('product_id=love_accident&source=share&persona=AUDIT')
    expect(buildProductSharePath(TEXTBOOK_DESK_PRODUCT_ID, { mode: 'preview', target: 'junior_7_upper' }))
      .toBe('/pages/textbook-desk/index?product_id=textbook_desk&source=share&mode=preview&target=junior_7_upper')
    expect(normalizeProductSource('share')).toBe('share')
    expect(normalizeProductSource('unexpected')).toBe('normal')
  })

  it('routes existing performance share messages through product_id', () => {
    const message = createRelationshipShareMessage(performanceSimulator, { key: 'x', title: '测试关系', copy: '测试' })
    expect(message.path).toBe('/pages/product-entry/index?product_id=performance&source=share')
  })

  it('keeps ads fully inactive without IDs or layout', () => {
    expect(adSlots).toEqual([])
    expect(getActiveAdSlot(LOVE_ACCIDENT_PRODUCT_ID, 'result')).toBeNull()
    expect(getActiveAdSlot(PERFORMANCE_PRODUCT_ID, 'result')).toBeNull()
    expect(readFileSync('miniprogram/components/ad-slot/index.wxml', 'utf8')).toContain('wx:if="{{visible}}"')
  })

  it('uses a non-visual router as the launch page and guards every legacy performance page', () => {
    const app = JSON.parse(readFileSync('miniprogram/app.json', 'utf8')) as { pages: string[] }
    expect(app.pages[0]).toBe('pages/product-entry/index')
    expect(app.pages).toContain('pages/love-accident/index')
    for (const page of ['home', 'quiz', 'result']) {
      expect(readFileSync(`miniprogram/pages/${page}/index.ts`, 'utf8')).toContain('guardProductAccess(product.product_id, options)')
    }
  })

  it('defines the required shared analytics fields and event names', () => {
    const source = readFileSync('miniprogram/platform/analytics.ts', 'utf8')
    for (const field of ['product_id', 'question_id', 'option_id', 'timestamp', 'duration', 'source']) expect(source).toContain(field)
    for (const event of ['page_view', 'test_start', 'question_view', 'question_answer', 'test_complete', 'result_view', 'share_click', 'retry_click']) {
      expect(source).toContain(`'${event}'`)
    }
  })
})
