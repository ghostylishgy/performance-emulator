import { TEXTBOOK_DESK_PRODUCT_ID, getProduct } from '../../config/products'
import { buildProductSharePath, buildProductShareQuery, normalizeProductSource, type ProductRouteOptions } from '../../platform/product-routing'
import { getTextbookTarget, isTextbookTargetId } from './targets'
import type { TextbookTargetId, TextbookViewMode } from './types'

export interface TextbookShareState {
  source: 'share'
  mode: TextbookViewMode
  target: TextbookTargetId
}

const gradeLabels: Record<string, string> = {
  primary_1: '一年级', primary_2: '二年级', primary_3: '三年级',
  primary_4: '四年级', primary_5: '五年级', primary_6: '六年级',
  junior_7: '七年级', junior_8: '八年级', junior_9: '九年级',
}

export function parseTextbookShareState(options: ProductRouteOptions): TextbookShareState | null {
  if (normalizeProductSource(options.source) !== 'share') return null
  if (options.mode !== 'current' && options.mode !== 'preview') return null
  if (!isTextbookTargetId(options.target)) return null
  return { source: 'share', mode: options.mode, target: options.target }
}

export function textbookShareTitle(mode: TextbookViewMode, targetId: TextbookTargetId): string {
  const target = getTextbookTarget(targetId)
  const grade = gradeLabels[target.grade]
  const term = target.term === 'upper' ? '上册' : '下册'
  return mode === 'preview'
    ? `提前看看 · ${grade}${term}人教社电子教材`
    : `${grade}${term} · 人教社电子教材应急入口`
}

export function buildTextbookSharePayload(mode: TextbookViewMode, target: TextbookTargetId): {
  title: string
  path: string
  query: string
} {
  const product = getProduct(TEXTBOOK_DESK_PRODUCT_ID)
  if (!product) throw new Error('Missing textbook product registry entry')
  const extra = { mode, target }
  return {
    title: textbookShareTitle(mode, target),
    path: buildProductSharePath(product.product_id, extra),
    query: buildProductShareQuery(product.product_id, extra),
  }
}
