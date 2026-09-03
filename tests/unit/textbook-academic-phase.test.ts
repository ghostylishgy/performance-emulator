import { describe, expect, it } from 'vitest'
import { buildSemesterDeskRecommendations, resolveAcademicPhase, resolveAcademicPhaseFromMonth } from '../../miniprogram/pages/textbook-desk/academic-phase'

const localDate = (month: number, day = 15) => new Date(2026, month - 1, day, 12, 0, 0)

describe('textbook academic phase', () => {
  it.each([
    [1, 'winter_break'], [2, 'winter_break'],
    [3, 'lower_term'], [6, 'lower_term'],
    [7, 'summer_break'], [8, 'summer_break'],
    [9, 'upper_term'], [12, 'upper_term'],
  ] as const)('maps month %i to %s', (month, phase) => {
    expect(resolveAcademicPhaseFromMonth(month)).toBe(phase)
    expect(resolveAcademicPhase(localDate(month))).toBe(phase)
  })

  it('rejects invalid calendar input', () => {
    expect(() => resolveAcademicPhaseFromMonth(0)).toThrow()
    expect(() => resolveAcademicPhaseFromMonth(13)).toThrow()
    expect(() => resolveAcademicPhase(new Date('invalid'))).toThrow()
  })

  it('uses time only to rank current, next-term, and next-grade targets', () => {
    expect(buildSemesterDeskRecommendations('primary_6', localDate(9))).toEqual([
      { kind: 'current', mode: 'current', target: 'primary_6_upper', priority: 1 },
      { kind: 'next_term', mode: 'preview', target: 'primary_6_lower', priority: 2 },
      { kind: 'next_grade', mode: 'preview', target: 'junior_7_upper', priority: 3 },
    ])
    expect(buildSemesterDeskRecommendations('primary_6', localDate(1))[0]).toEqual({
      kind: 'next_term', mode: 'preview', target: 'primary_6_lower', priority: 1,
    })
    expect(buildSemesterDeskRecommendations('primary_6', localDate(3))[0]).toEqual({
      kind: 'current', mode: 'current', target: 'primary_6_lower', priority: 1,
    })
    expect(buildSemesterDeskRecommendations('primary_6', localDate(7))[0]).toEqual({
      kind: 'next_grade', mode: 'preview', target: 'junior_7_upper', priority: 1,
    })
  })

  it('does not invent a next grade after junior nine', () => {
    expect(buildSemesterDeskRecommendations('junior_9', localDate(7)).map((item) => item.target))
      .toEqual(['junior_9_lower', 'junior_9_upper'])
  })
})
