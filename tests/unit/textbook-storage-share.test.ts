import { afterEach, describe, expect, it, vi } from 'vitest'
import { textbookCatalog } from '../../miniprogram/pages/textbook-desk/catalog'
import { copyOfficialReaderUrl, isValidOfficialReaderUrl } from '../../miniprogram/pages/textbook-desk/official-reader'
import { buildTextbookSharePayload, parseTextbookShareState } from '../../miniprogram/pages/textbook-desk/share'
import {
  inspectTextbookPreference,
  loadTextbookPreference,
  saveTextbookPreference,
  TEXTBOOK_PREFERENCE_STORAGE_KEY,
} from '../../miniprogram/pages/textbook-desk/storage'
import { TEXTBOOK_OFFLINE_REASONS, TEXTBOOK_TARGET_IDS, type TextbookPreference } from '../../miniprogram/pages/textbook-desk/types'
import { resolveTextbookEntryState } from '../../miniprogram/pages/textbook-desk/view-state'

const preference: TextbookPreference = {
  schemaVersion: 1,
  homeGrade: 'primary_6',
  copyHelpSeen: false,
  selectedEnglishVariant: { primary_6: 'english_pep_start_3' },
  lastConfirmedAcademicYear: '2026-2027',
}

afterEach(() => {
  delete (globalThis as { wx?: unknown }).wx
})

describe('textbook preference storage', () => {
  it('locks smoke-test reasons to anonymous categories without free text', () => {
    expect(TEXTBOOK_OFFLINE_REASONS).toEqual(['offline', 'print', 'preview', 'emergency', 'other'])
  })

  it('validates the versioned, product-isolated preference shape', () => {
    expect(TEXTBOOK_PREFERENCE_STORAGE_KEY).toBe('assessment-lab:preference:textbook-desk:v1')
    expect(inspectTextbookPreference(preference)).toEqual({ status: 'current', preference })
    expect(inspectTextbookPreference({ ...preference, schemaVersion: 2 })).toEqual({ status: 'version-mismatch', storedVersion: 2 })
    expect(inspectTextbookPreference({ ...preference, homeGrade: 'grade_6' })).toEqual({ status: 'corrupt' })
    expect(inspectTextbookPreference({ ...preference, lastConfirmedAcademicYear: '2026' })).toEqual({ status: 'corrupt' })
  })

  it('fails closed on corrupt reads and storage write failures', () => {
    ;(globalThis as { wx?: unknown }).wx = {
      getStorageSync: vi.fn(() => '{bad-json'),
      setStorageSync: vi.fn(() => { throw new Error('quota') }),
    }
    expect(loadTextbookPreference()).toEqual({ status: 'corrupt' })
    expect(saveTextbookPreference(preference)).toBe(false)
  })
})

describe('textbook share target boundary', () => {
  it('accepts every locked target and rejects arbitrary or case-shifted values', () => {
    for (const target of TEXTBOOK_TARGET_IDS) {
      expect(parseTextbookShareState({ source: 'share', mode: 'preview', target })).toEqual({ source: 'share', mode: 'preview', target })
    }
    expect(parseTextbookShareState({ source: 'share', mode: 'preview', target: 'JUNIOR_7_UPPER' })).toBeNull()
    expect(parseTextbookShareState({ source: 'share', mode: 'preview', target: '../../secret' })).toBeNull()
    expect(parseTextbookShareState({ source: 'normal', mode: 'preview', target: 'junior_7_upper' })).toBeNull()
  })

  it('builds controlled current and preview share routes', () => {
    expect(buildTextbookSharePayload('preview', 'junior_7_upper')).toEqual({
      title: '提前看看 · 七年级上册人教社电子教材',
      path: '/pages/textbook-desk/index?product_id=textbook_desk&source=share&mode=preview&target=junior_7_upper',
      query: 'product_id=textbook_desk&source=share&mode=preview&target=junior_7_upper',
    })
  })

  it('treats a valid shared target as transient and leaves receiver preference unchanged', () => {
    const before = JSON.stringify(preference)
    const state = resolveTextbookEntryState(
      { source: 'share', mode: 'preview', target: 'junior_7_upper' },
      preference,
      new Date(2026, 8, 3, 12),
    )
    expect(state).toEqual({
      screen: 'semester_desk',
      source: 'share',
      mode: 'preview',
      target: 'junior_7_upper',
      transientShareView: true,
    })
    expect(JSON.stringify(preference)).toBe(before)
  })

  it('falls back safely for an invalid share target', () => {
    expect(resolveTextbookEntryState(
      { source: 'share', mode: 'preview', target: 'unknown' },
      preference,
      new Date(2026, 8, 3, 12),
    )).toMatchObject({
      screen: 'semester_desk',
      source: 'share',
      target: 'primary_6_upper',
      transientShareView: false,
      homeGrade: 'primary_6',
    })
  })
})

describe('official reader clipboard action', () => {
  it('copies only the exact numeric book.pep.com.cn reader URL', async () => {
    const book = textbookCatalog[0]!
    const setClipboardData = vi.fn((options: { success(): void }) => options.success())
    expect(isValidOfficialReaderUrl(book)).toBe(true)
    await expect(copyOfficialReaderUrl(book, {
      mode: 'current', viewerGrade: 'primary_6', contentStage: 'primary', contentGrade: 'primary_6',
      term: 'upper', source: 'normal', target: 'primary_6_upper',
    }, { setClipboardData })).resolves.toBe(true)
    expect(setClipboardData).toHaveBeenCalledWith(expect.objectContaining({ data: book.officialReaderUrl }))
  })

  it('rejects a mismatched URL before touching the clipboard', async () => {
    const book = { ...textbookCatalog[0]!, officialReaderUrl: 'https://example.com/1211001601261/' }
    const setClipboardData = vi.fn()
    await expect(copyOfficialReaderUrl(book, {
      mode: 'current', contentStage: 'primary', contentGrade: 'primary_6', term: 'upper',
      source: 'normal', target: 'primary_6_upper',
    }, { setClipboardData })).resolves.toBe(false)
    expect(setClipboardData).not.toHaveBeenCalled()
  })
})
