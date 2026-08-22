import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import { createProgress } from '../../miniprogram/domain/session'
import { recoverCorruptProgress, showProgressSaveWarning } from '../../miniprogram/platform/progress-recovery'
import { inspectStoredProgress, saveProgress } from '../../miniprogram/platform/storage'

describe('local progress recovery', () => {
  afterEach(() => {
    delete (globalThis as typeof globalThis & { wx?: unknown }).wx
    vi.restoreAllMocks()
  })

  it('classifies malformed current-version data as corrupt', () => {
    expect(inspectStoredProgress('{not json', definition)).toEqual({ status: 'corrupt' })
    expect(inspectStoredProgress(JSON.stringify({ testVersion: definition.version, stage: 'complete' }), definition))
      .toEqual({ status: 'corrupt' })
  })

  it('uses the same recoverable flow on quiz and result pages', () => {
    const quiz = readFileSync('miniprogram/pages/quiz/index.ts', 'utf8')
    const result = readFileSync('miniprogram/pages/result/index.ts', 'utf8')
    expect(quiz).toContain("stored.status === 'corrupt') return recoverCorruptProgress(definition)")
    expect(result).toContain("stored.status === 'corrupt') return recoverCorruptProgress(definition)")

    const removeStorageSync = vi.fn()
    const reLaunch = vi.fn()
    ;(globalThis as typeof globalThis & { wx: unknown }).wx = {
      removeStorageSync,
      showModal: (options: any) => options.complete(),
      reLaunch,
    }
    recoverCorruptProgress(definition)
    expect(removeStorageSync).toHaveBeenCalled()
    expect(reLaunch).toHaveBeenCalledWith({ url: '/pages/home/index' })
  })

  it('surfaces a save failure but lets the answer flow continue', () => {
    const showToast = vi.fn()
    ;(globalThis as typeof globalThis & { wx: unknown }).wx = {
      setStorageSync: () => { throw new Error('disk full') },
      showToast,
    }
    expect(saveProgress(createProgress(definition))).toBe(false)
    expect(() => showProgressSaveWarning()).not.toThrow()
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'none' }))
    const quiz = readFileSync('miniprogram/pages/quiz/index.ts', 'utf8')
    expect(quiz).toContain('if (saveProgress(value) || storageWarningShown) return')
  })
})
