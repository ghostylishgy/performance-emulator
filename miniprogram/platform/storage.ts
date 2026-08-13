import type { TestDefinition } from '../config/types'
import { parseProgress, serializeProgress, type QuizProgress } from '../domain/session'

const keyFor = (testId: string) => `assessment-lab:progress:${testId}`

export type ProgressLoadResult =
  | { status: 'none' }
  | { status: 'current'; progress: QuizProgress }
  | { status: 'version-mismatch'; storedVersion?: string }
  | { status: 'corrupt' }

export function inspectStoredProgress(raw: unknown, definition: TestDefinition): ProgressLoadResult {
  if (raw === undefined || raw === null || raw === '') return { status: 'none' }
  try {
    const serialized = typeof raw === 'string' ? raw : JSON.stringify(raw)
    const loose = JSON.parse(serialized) as { testVersion?: string }
    if (loose.testVersion !== definition.version) return { status: 'version-mismatch', storedVersion: loose.testVersion }
    return { status: 'current', progress: parseProgress(serialized, definition) }
  } catch {
    return { status: 'corrupt' }
  }
}

export function loadProgress(definition: TestDefinition): ProgressLoadResult {
  try {
    return inspectStoredProgress(wx.getStorageSync(keyFor(definition.id)), definition)
  } catch {
    return { status: 'corrupt' }
  }
}

export function saveProgress(progress: QuizProgress): boolean {
  try {
    wx.setStorageSync(keyFor(progress.testId), serializeProgress(progress))
    return true
  } catch {
    return false
  }
}

export function clearProgress(testId: string): boolean {
  try {
    wx.removeStorageSync(keyFor(testId))
    return true
  } catch {
    return false
  }
}

