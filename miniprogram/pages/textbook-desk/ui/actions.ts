import type { ProductRouteOptions } from '../../../platform/product-routing'
import { getProduct, TEXTBOOK_DESK_PRODUCT_ID } from '../../../config/products'
import { buildProductSharePath, buildProductShareQuery } from '../../../platform/product-routing'
import { trackBookSetOpen, trackOfflineInterest, trackTextbookShare, type TextbookAnalyticsContext } from '../analytics'
import { copyOfficialReaderUrl } from '../official-reader'
import { buildTextbookSharePayload } from '../share'
import { saveTextbookPreference } from '../storage'
import { isTextbookGradeId } from '../targets'
import type { TextbookGradeId, TextbookOfflineReason, TextbookPreference } from '../types'
import { buildTextbookDeskViewModel, type TextbookBookSetViewModel, type TextbookDeskViewModel } from './state-adapter'

export function createTextbookPreference(homeGrade: TextbookGradeId): TextbookPreference {
  return { schemaVersion: 1, homeGrade, copyHelpSeen: false }
}

export function setTextbookHomeGrade(value: unknown, current: TextbookPreference | null): TextbookPreference | null {
  if (!isTextbookGradeId(value)) return null
  const next: TextbookPreference = current
    ? { ...current, homeGrade: value }
    : createTextbookPreference(value)
  return saveTextbookPreference(next) ? next : null
}

export function selectTextbookEnglishVariant(
  homeGrade: TextbookGradeId,
  variantId: string,
  current: TextbookPreference,
): TextbookPreference | null {
  const cleanVariantId = variantId.trim()
  if (!cleanVariantId || cleanVariantId.length > 64 || current.homeGrade !== homeGrade) return null
  const next: TextbookPreference = {
    ...current,
    selectedEnglishVariant: { ...current.selectedEnglishVariant, [homeGrade]: cleanVariantId },
  }
  return saveTextbookPreference(next) ? next : null
}

export function resolveTextbookPageState(route: ProductRouteOptions, preference: TextbookPreference | null, now: Date): TextbookDeskViewModel {
  return buildTextbookDeskViewModel({ route, preference, now })
}

export function analyticsContextForSet(set: TextbookBookSetViewModel, viewModel: TextbookDeskViewModel): TextbookAnalyticsContext {
  return {
    mode: set.mode,
    viewerGrade: viewModel.user.homeGrade,
    contentStage: set.target.stage,
    contentGrade: set.target.grade,
    term: set.target.term,
    source: viewModel.share.source,
    target: set.target.id,
  }
}

export function openTextbookBookSet(set: TextbookBookSetViewModel, viewModel: TextbookDeskViewModel): void {
  trackBookSetOpen(analyticsContextForSet(set, viewModel))
}

export function copyTextbookOfficialUrl(bookId: string, set: TextbookBookSetViewModel, viewModel: TextbookDeskViewModel): Promise<boolean> {
  const book = set.books.find((item) => item.id === bookId)
  if (!book) return Promise.resolve(false)
  return copyOfficialReaderUrl(book, analyticsContextForSet(set, viewModel))
}

export function shareTextbookBookSet(set: TextbookBookSetViewModel, viewModel: TextbookDeskViewModel) {
  trackTextbookShare(analyticsContextForSet(set, viewModel))
  return buildTextbookSharePayload(set.mode, set.target.id)
}

export function defaultTextbookSharePayload(): { title: string; path: string; query: string } {
  const product = getProduct(TEXTBOOK_DESK_PRODUCT_ID)
  if (!product) throw new Error('Missing textbook product registry entry')
  return {
    title: product.title,
    path: buildProductSharePath(product.product_id),
    query: buildProductShareQuery(product.product_id),
  }
}

export function recordTextbookOfflineInterest(reason: TextbookOfflineReason, set: TextbookBookSetViewModel, viewModel: TextbookDeskViewModel): void {
  trackOfflineInterest(analyticsContextForSet(set, viewModel), reason)
}
