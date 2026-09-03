import { describe, expect, it } from 'vitest'
import { nextGradeMap, resolveNextGradeTarget, resolveNextTermTarget } from '../../miniprogram/pages/textbook-desk/progression'
import { TEXTBOOK_GRADE_IDS } from '../../miniprogram/pages/textbook-desk/types'

describe('textbook progression mapping', () => {
  it('defines every supported grade explicitly', () => {
    expect(Object.keys(nextGradeMap)).toEqual([...TEXTBOOK_GRADE_IDS])
  })

  it('crosses the primary-to-junior boundary explicitly', () => {
    expect(resolveNextGradeTarget('primary_6')).toBe('junior_7_upper')
  })

  it('keeps nextTerm separate from nextGrade', () => {
    expect(resolveNextTermTarget('primary_6', 'upper')).toBe('primary_6_lower')
    expect(resolveNextTermTarget('primary_6', 'lower')).toBeNull()
    expect(resolveNextGradeTarget('primary_6')).not.toBe(resolveNextTermTarget('primary_6', 'upper'))
  })

  it('ends progression safely after junior nine', () => {
    expect(resolveNextGradeTarget('junior_9')).toBeNull()
  })
})
