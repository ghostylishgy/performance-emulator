import { describe, expect, it } from 'vitest'
import {
  finishQuestionDuration,
  pauseQuestionDuration,
  resumeQuestionDuration,
  startQuestionDuration,
} from '../../miniprogram/domain/love-duration'

describe('love question foreground duration', () => {
  it('measures shown-to-committed foreground time in milliseconds', () => {
    expect(finishQuestionDuration(startQuestionDuration(1_000), 4_250)).toBe(3_250)
  })

  it('excludes time spent in the background', () => {
    const paused = pauseQuestionDuration(startQuestionDuration(1_000), 2_000)
    const resumed = resumeQuestionDuration(paused, 8_000)
    expect(finishQuestionDuration(resumed, 9_500)).toBe(2_500)
  })

  it('never returns a negative, NaN, or infinite duration', () => {
    expect(finishQuestionDuration(startQuestionDuration(5_000), 4_000)).toBe(0)
    expect(finishQuestionDuration({ accumulatedMs: Number.NaN, runningSince: Number.NaN }, Number.POSITIVE_INFINITY)).toBe(0)
  })
})
