import { TEXTBOOK_DESK_PRODUCT_ID } from '../../config/products'
import { analytics } from '../../platform/analytics'
import type {
  TextbookGradeId,
  TextbookOfflineReason,
  TextbookRecord,
  TextbookStage,
  TextbookTargetId,
  TextbookTerm,
  TextbookViewMode,
} from './types'

export interface TextbookAnalyticsContext {
  mode: TextbookViewMode
  viewerGrade?: TextbookGradeId
  contentStage: TextbookStage
  contentGrade: TextbookGradeId
  term: TextbookTerm
  source: 'normal' | 'share'
  target: TextbookTargetId
}

export function trackBookSetOpen(context: TextbookAnalyticsContext): void {
  analytics.track('book_set_open', {
    product_id: TEXTBOOK_DESK_PRODUCT_ID,
    mode: context.mode,
    viewer_grade: context.viewerGrade,
    content_stage: context.contentStage,
    content_grade: context.contentGrade,
    term: context.term,
    source: context.source,
    target: context.target,
  })
}

export function trackOfficialLinkCopy(book: TextbookRecord, context: TextbookAnalyticsContext, actionResult: 'success' | 'failure' | 'invalid'): void {
  analytics.track('official_link_copy', {
    product_id: TEXTBOOK_DESK_PRODUCT_ID,
    mode: context.mode,
    content_grade: context.contentGrade,
    term: context.term,
    subject: book.subject,
    book_id: book.id,
    source: context.source,
    target: context.target,
    action_result: actionResult,
  })
}

export function trackTextbookShare(context: TextbookAnalyticsContext): void {
  analytics.track('share_click', {
    product_id: TEXTBOOK_DESK_PRODUCT_ID,
    mode: context.mode,
    source: context.source,
    target: context.target,
  })
}

export function trackOfflineInterest(context: TextbookAnalyticsContext, reason: TextbookOfflineReason): void {
  analytics.track('offline_interest', {
    product_id: TEXTBOOK_DESK_PRODUCT_ID,
    mode: context.mode,
    content_grade: context.contentGrade,
    term: context.term,
    source: context.source,
    reason,
  })
}
