import { trackOfficialLinkCopy, type TextbookAnalyticsContext } from './analytics'
import type { TextbookRecord } from './types'

export interface ClipboardApi {
  setClipboardData(options: { data: string; success(): void; fail(): void }): void
}

export function isValidOfficialReaderUrl(book: Pick<TextbookRecord, 'id' | 'officialReaderUrl'>): boolean {
  return /^\d+$/.test(book.id) && book.officialReaderUrl === `https://book.pep.com.cn/${book.id}/`
}

export function copyOfficialReaderUrl(
  book: TextbookRecord,
  context: TextbookAnalyticsContext,
  clipboard: ClipboardApi = wx as ClipboardApi,
): Promise<boolean> {
  if (!isValidOfficialReaderUrl(book)) {
    trackOfficialLinkCopy(book, context, 'invalid')
    return Promise.resolve(false)
  }
  return new Promise((resolve) => {
    try {
      clipboard.setClipboardData({
        data: book.officialReaderUrl,
        success: () => {
          trackOfficialLinkCopy(book, context, 'success')
          resolve(true)
        },
        fail: () => {
          trackOfficialLinkCopy(book, context, 'failure')
          resolve(false)
        },
      })
    } catch {
      trackOfficialLinkCopy(book, context, 'failure')
      resolve(false)
    }
  })
}
