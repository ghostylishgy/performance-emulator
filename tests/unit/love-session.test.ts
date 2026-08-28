import { describe, expect, it } from 'vitest'
import { loveAccidentTest } from '../../miniprogram/config/tests/love-accident/index'
import {
  advanceLoveProgress,
  createLoveProgress,
  parseLoveProgress,
  serializeLoveProgress,
  setLoveAnswer,
} from '../../miniprogram/domain/love-session'
import { inspectStoredLoveProgress, LOVE_PROGRESS_STORAGE_KEY } from '../../miniprogram/platform/love-storage'

describe('love accident progress storage', () => {
  it('uses an isolated versioned key and restores valid progress', () => {
    let progress = createLoveProgress(loveAccidentTest, 100)
    progress = setLoveAnswer(progress, loveAccidentTest, 'Q1', 'B', 200)
    progress = advanceLoveProgress(progress, loveAccidentTest, 300)
    expect(LOVE_PROGRESS_STORAGE_KEY).toBe('assessment-lab:progress:love-accident')
    expect(parseLoveProgress(serializeLoveProgress(progress), loveAccidentTest)).toEqual(progress)
    expect(inspectStoredLoveProgress(serializeLoveProgress(progress), loveAccidentTest)).toEqual({ status: 'current', progress })
  })

  it('requires every one of the sixteen answers before completion', () => {
    let progress = createLoveProgress(loveAccidentTest, 100)
    for (const question of loveAccidentTest.questions) {
      progress = setLoveAnswer(progress, loveAccidentTest, question.id, 'A', 200)
      progress = advanceLoveProgress(progress, loveAccidentTest, 300)
    }
    expect(progress.stage).toBe('complete')
    expect(Object.keys(progress.answers)).toHaveLength(16)
    expect(() => parseLoveProgress(serializeLoveProgress({ ...progress, answers: { ...progress.answers, Q16: undefined } }), loveAccidentTest)).toThrow()
  })

  it('rejects corrupt, future, and stale-version progress without supplying defaults', () => {
    const progress = createLoveProgress(loveAccidentTest, 100)
    expect(inspectStoredLoveProgress('{bad json', loveAccidentTest)).toEqual({ status: 'corrupt' })
    expect(inspectStoredLoveProgress(JSON.stringify({ ...progress, testVersion: 'old' }), loveAccidentTest)).toEqual({ status: 'version-mismatch', storedVersion: 'old' })
    expect(() => parseLoveProgress(JSON.stringify({ ...progress, answers: { Q2: 'A' } }), loveAccidentTest)).toThrow(/future/)
  })
})
