import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TextbookPreference } from '../../miniprogram/pages/textbook-desk/types'
import { buildTextbookDeskViewModel } from '../../miniprogram/pages/textbook-desk/ui/state-adapter'
import { setTextbookHomeGrade } from '../../miniprogram/pages/textbook-desk/ui/actions'

const preference: TextbookPreference = {
  schemaVersion: 1,
  homeGrade: 'primary_6',
  copyHelpSeen: false,
}

afterEach(() => {
  delete (globalThis as { wx?: unknown }).wx
})

describe('textbook UI state adapter', () => {
  it('returns a setup-only model without a saved grade', () => {
    const viewModel = buildTextbookDeskViewModel({ route: {}, preference: null, now: new Date(2026, 8, 3) })
    expect(viewModel).toMatchObject({
      productName: '第二书包',
      screen: 'first_setup',
      user: { hasHomeGrade: false },
      academicPhase: null,
      share: { kind: 'normal', showPreviewSocialHint: false },
    })
    expect(viewModel.gradeOptions).toHaveLength(9)
  })

  it('derives current, next-term, next-grade and layout roles for upper term', () => {
    const viewModel = buildTextbookDeskViewModel({ route: {}, preference, now: new Date(2026, 8, 3) })
    expect(viewModel.academicPhase).toBe('upper_term')
    expect(viewModel.seasonalLabel).toBe('上学期')
    expect(viewModel.current?.target.id).toBe('primary_6_upper')
    expect(viewModel.nextTerm?.target.id).toBe('primary_6_lower')
    expect(viewModel.nextGrade?.target.id).toBe('junior_7_upper')
    expect(viewModel.layout.hero?.target.id).toBe('primary_6_upper')
    expect(viewModel.layout.secondary.map((set) => set.target.id)).toEqual(['primary_6_lower', 'junior_7_upper'])
  })

  it('lets the academic model change hero priority without page month rules', () => {
    const winter = buildTextbookDeskViewModel({ route: {}, preference, now: new Date(2026, 0, 15) })
    expect(winter.academicPhase).toBe('winter_break')
    expect(winter.layout.hero?.target.id).toBe('primary_6_lower')
    expect(winter.current?.target.id).toBe('primary_6_upper')
    expect(winter.layout.history.map((set) => set.target.id)).toEqual(['primary_6_upper'])

    const summer = buildTextbookDeskViewModel({ route: {}, preference, now: new Date(2026, 6, 15) })
    expect(summer.academicPhase).toBe('summer_break')
    expect(summer.layout.hero?.target.id).toBe('junior_7_upper')
    expect(summer.layout.history.map((set) => set.target.id)).toEqual(['primary_6_lower', 'primary_6_upper'])
  })

  it('creates a cache-independent transient preview share model', () => {
    const before = JSON.stringify(preference)
    const viewModel = buildTextbookDeskViewModel({
      route: { source: 'share', mode: 'preview', target: 'junior_7_upper' },
      preference,
      now: new Date(2026, 8, 3),
    })
    expect(viewModel).toMatchObject({
      screen: 'semester_desk',
      user: { hasHomeGrade: false },
      academicPhase: null,
      share: {
        kind: 'preview_share',
        source: 'share',
        mode: 'preview',
        target: 'junior_7_upper',
        showPreviewSocialHint: true,
      },
    })
    expect(viewModel.layout.hero?.target.id).toBe('junior_7_upper')
    expect(viewModel.nextGrade).toBeNull()
    expect(viewModel.share.target).toBe('junior_7_upper')
    expect(JSON.stringify(preference)).toBe(before)
  })

  it('rejects invalid share targets and accepts explicit grade changes only', () => {
    const invalid = buildTextbookDeskViewModel({
      route: { source: 'share', mode: 'preview', target: '../../secret' },
      preference: null,
      now: new Date(2026, 8, 3),
    })
    expect(invalid.screen).toBe('first_setup')
    expect(invalid.share.kind).toBe('normal')

    const setStorageSync = vi.fn()
    ;(globalThis as { wx?: unknown }).wx = { setStorageSync }
    expect(setTextbookHomeGrade('PRIMARY_6', null)).toBeNull()
    expect(setTextbookHomeGrade('primary_6', null)).toMatchObject({ homeGrade: 'primary_6' })
    expect(setStorageSync).toHaveBeenCalledTimes(1)
  })
})
