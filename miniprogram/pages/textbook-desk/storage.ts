import { isTextbookGradeId } from './targets'
import type { TextbookGradeId, TextbookPreference } from './types'

export const TEXTBOOK_PREFERENCE_STORAGE_KEY = 'assessment-lab:preference:textbook-desk:v1'

export type TextbookPreferenceLoadResult =
  | { status: 'none' }
  | { status: 'current'; preference: TextbookPreference }
  | { status: 'version-mismatch'; storedVersion?: number }
  | { status: 'corrupt' }

function parseSelectedVariants(value: unknown): Partial<Record<TextbookGradeId, string>> | undefined {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid selected English variants')
  const parsed: Partial<Record<TextbookGradeId, string>> = {}
  for (const [grade, variant] of Object.entries(value)) {
    if (!isTextbookGradeId(grade) || typeof variant !== 'string' || !variant.trim() || variant.length > 64) {
      throw new Error('Invalid selected English variant')
    }
    parsed[grade] = variant
  }
  return parsed
}

export function inspectTextbookPreference(raw: unknown): TextbookPreferenceLoadResult {
  if (raw === undefined || raw === null || raw === '') return { status: 'none' }
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) as Record<string, unknown> : raw as Record<string, unknown>
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { status: 'corrupt' }
    if (value.schemaVersion !== 1) {
      return { status: 'version-mismatch', storedVersion: typeof value.schemaVersion === 'number' ? value.schemaVersion : undefined }
    }
    if (!isTextbookGradeId(value.homeGrade) || typeof value.copyHelpSeen !== 'boolean') return { status: 'corrupt' }
    if (value.lastConfirmedAcademicYear !== undefined
      && (typeof value.lastConfirmedAcademicYear !== 'string' || !/^\d{4}-\d{4}$/.test(value.lastConfirmedAcademicYear))) {
      return { status: 'corrupt' }
    }
    return {
      status: 'current',
      preference: {
        schemaVersion: 1,
        homeGrade: value.homeGrade,
        copyHelpSeen: value.copyHelpSeen,
        selectedEnglishVariant: parseSelectedVariants(value.selectedEnglishVariant),
        lastConfirmedAcademicYear: value.lastConfirmedAcademicYear as string | undefined,
      },
    }
  } catch {
    return { status: 'corrupt' }
  }
}

export function loadTextbookPreference(): TextbookPreferenceLoadResult {
  try {
    return inspectTextbookPreference(wx.getStorageSync(TEXTBOOK_PREFERENCE_STORAGE_KEY))
  } catch {
    return { status: 'corrupt' }
  }
}

export function saveTextbookPreference(preference: TextbookPreference): boolean {
  const inspected = inspectTextbookPreference(preference)
  if (inspected.status !== 'current') return false
  try {
    wx.setStorageSync(TEXTBOOK_PREFERENCE_STORAGE_KEY, JSON.stringify(inspected.preference))
    return true
  } catch {
    return false
  }
}
