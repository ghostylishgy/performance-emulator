import type { LoveTestDefinition } from '../config/tests/love-accident/types'
import { parseLoveProgress, serializeLoveProgress, type LoveQuizProgress } from '../domain/love-session'

export const LOVE_PROGRESS_STORAGE_KEY = 'assessment-lab:progress:love-accident'

export type LoveProgressLoadResult =
  | { status: 'none' }
  | { status: 'current'; progress: LoveQuizProgress }
  | { status: 'version-mismatch'; storedVersion?: string }
  | { status: 'corrupt' }

export function inspectStoredLoveProgress(raw: unknown, definition: LoveTestDefinition): LoveProgressLoadResult {
  if (raw === undefined || raw === null || raw === '') return { status: 'none' }
  try {
    const serialized = typeof raw === 'string' ? raw : JSON.stringify(raw)
    const loose = JSON.parse(serialized) as { testVersion?: string }
    if (loose.testVersion !== definition.version) return { status: 'version-mismatch', storedVersion: loose.testVersion }
    return { status: 'current', progress: parseLoveProgress(serialized, definition) }
  } catch {
    return { status: 'corrupt' }
  }
}

export function loadLoveProgress(definition: LoveTestDefinition): LoveProgressLoadResult {
  try { return inspectStoredLoveProgress(wx.getStorageSync(LOVE_PROGRESS_STORAGE_KEY), definition) } catch { return { status: 'corrupt' } }
}

export function saveLoveProgress(progress: LoveQuizProgress): boolean {
  try { wx.setStorageSync(LOVE_PROGRESS_STORAGE_KEY, serializeLoveProgress(progress)); return true } catch { return false }
}

export function clearLoveProgress(): boolean {
  try { wx.removeStorageSync(LOVE_PROGRESS_STORAGE_KEY); return true } catch { return false }
}
