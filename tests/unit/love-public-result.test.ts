import { afterEach, describe, expect, it, vi } from 'vitest'
import { LOVE_ACCIDENT_PRODUCT_ID } from '../../miniprogram/config/products'
import { parseLovePublicPersona } from '../../miniprogram/config/tests/love-accident/public-persona'
import { LOVE_PERSONA_IDS } from '../../miniprogram/config/tests/love-accident/types'
import { getLovePublicResultData } from '../../miniprogram/pages/love-result/public-result'
import { loveShareAssets } from '../../miniprogram/pages/love-result/share-assets'
import { buildProductSharePath, buildProductShareQuery } from '../../miniprogram/platform/product-routing'

type ResultPageDefinition = {
  onLoad(this: { setData: (data: Record<string, unknown>) => void }, options: Record<string, string>): void
  onUnload(): void
  onShareAppMessage(): { title: string; path: string; imageUrl?: string }
  onShareTimeline(): { title: string; query: string; imageUrl?: string }
}

type EntryPageDefinition = {
  onLoad(options: Record<string, string>): void
}

async function loadResultPage(storageValue: unknown = 'receiver-private-progress') {
  vi.resetModules()
  let definition: ResultPageDefinition | undefined
  const getStorageSync = vi.fn(() => storageValue)
  const removeStorageSync = vi.fn()
  const reLaunch = vi.fn()
  const reportEvent = vi.fn()
  vi.stubGlobal('wx', {
    getSystemInfoSync: () => ({ platform: 'runtime' }),
    getStorageSync,
    removeStorageSync,
    reLaunch,
    reportEvent,
  })
  vi.stubGlobal('Page', (value: ResultPageDefinition) => { definition = value })
  await import('../../miniprogram/pages/love-result/index')
  if (!definition) throw new Error('love-result page was not registered')
  return { definition, getStorageSync, removeStorageSync, reLaunch, reportEvent }
}

async function loadEntryPage() {
  vi.resetModules()
  let definition: EntryPageDefinition | undefined
  const reLaunch = vi.fn()
  vi.stubGlobal('wx', {
    getSystemInfoSync: () => ({ platform: 'runtime' }),
    reLaunch,
    reportEvent: vi.fn(),
  })
  vi.stubGlobal('Page', (value: EntryPageDefinition) => { definition = value })
  await import('../../miniprogram/pages/product-entry/index')
  if (!definition) throw new Error('product-entry page was not registered')
  return { definition, reLaunch }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('love public persona result contract', () => {
  it('accepts only exact locked persona ids and resolves all twelve public cards', () => {
    for (const persona of LOVE_PERSONA_IDS) {
      expect(parseLovePublicPersona(persona)).toBe(persona)
      expect(getLovePublicResultData(persona)).toMatchObject({
        personaId: persona,
        shareImageUrl: loveShareAssets[persona].friend,
        resultCard: { personaId: persona },
      })
    }
    for (const invalid of [undefined, '', 'audit', 'Audit', 'UNKNOWN', '../AUDIT', 'AUDIT?answers=secret']) {
      expect(parseLovePublicPersona(invalid)).toBeNull()
    }
  })

  it('builds anonymous persona-only sharing URLs for both channels', () => {
    const path = buildProductSharePath(LOVE_ACCIDENT_PRODUCT_ID, { persona: 'AUDIT' })
    const query = buildProductShareQuery(LOVE_ACCIDENT_PRODUCT_ID, { persona: 'AUDIT' })
    expect(path).toBe('/pages/product-entry/index?product_id=love_accident&source=share&persona=AUDIT')
    expect(query).toBe('product_id=love_accident&source=share&persona=AUDIT')
    for (const value of [path, query]) {
      expect(value).not.toMatch(/answers|answerIds|progress|assessment-lab%3Aprogress/i)
    }
  })

  it('routes a valid shared persona through product-entry and falls back for invalid values', async () => {
    const valid = await loadEntryPage()
    valid.definition.onLoad({ product_id: 'love_accident', source: 'share', persona: 'AUDIT' })
    expect(valid.reLaunch).toHaveBeenCalledWith({
      url: '/pages/love-result/index?persona=AUDIT&product_id=love_accident&source=share',
    })

    const invalid = await loadEntryPage()
    invalid.definition.onLoad({ product_id: 'love_accident', source: 'share', persona: 'audit' })
    expect(invalid.reLaunch).toHaveBeenCalledWith({
      url: '/pages/love-accident/index?product_id=love_accident&source=share',
    })
  })

  it('enters public result mode for all twelve locked personas without receiver storage', async () => {
    const { definition, getStorageSync, removeStorageSync, reLaunch } = await loadResultPage()
    for (const persona of LOVE_PERSONA_IDS) {
      const setData = vi.fn()
      definition.onLoad.call({ setData }, {
        product_id: 'love_accident',
        source: 'share',
        persona,
      })
      expect(setData).toHaveBeenLastCalledWith(expect.objectContaining({
        resultCard: expect.objectContaining({ personaId: persona }),
        shareImageUrl: loveShareAssets[persona].friend,
      }))
    }
    expect(getStorageSync).not.toHaveBeenCalled()
    expect(removeStorageSync).not.toHaveBeenCalled()
    expect(reLaunch).not.toHaveBeenCalled()
    definition.onUnload()
  })

  it('renders shared AUDIT without reading, evaluating, clearing, or replacing receiver progress', async () => {
    const { definition, getStorageSync, removeStorageSync, reLaunch, reportEvent } = await loadResultPage()
    const setData = vi.fn()
    definition.onLoad.call({ setData }, {
      product_id: 'love_accident',
      source: 'share',
      persona: 'AUDIT',
    })

    expect(getStorageSync).not.toHaveBeenCalled()
    expect(removeStorageSync).not.toHaveBeenCalled()
    expect(reLaunch).not.toHaveBeenCalled()
    expect(setData).toHaveBeenCalledWith(expect.objectContaining({
      ready: true,
      personaName: getLovePublicResultData('AUDIT')?.personaName,
      resultCard: expect.objectContaining({ personaId: 'AUDIT' }),
      shareImageUrl: loveShareAssets.AUDIT.friend,
    }))

    expect(definition.onShareAppMessage()).toMatchObject({
      title: '我被鉴定成「分手审计合伙人」，你呢？',
      path: '/pages/product-entry/index?product_id=love_accident&source=share&persona=AUDIT',
      imageUrl: loveShareAssets.AUDIT.friend,
    })
    expect(definition.onShareTimeline()).toMatchObject({
      title: '我被鉴定成「分手审计合伙人」，你呢？',
      query: 'product_id=love_accident&source=share&persona=AUDIT',
      imageUrl: loveShareAssets.AUDIT.timeline,
    })
    const resultViewEvent = reportEvent.mock.calls.find(([event]) => event === 'result_view')
    expect(resultViewEvent?.[1]).toMatchObject({ final_persona: 'AUDIT', source: 'share' })
    expect(resultViewEvent?.[1]).not.toHaveProperty('resolution_mode')
    definition.onUnload()
  })

  it('falls back safely for missing or invalid public persona without touching storage', async () => {
    for (const persona of ['', 'audit', 'UNKNOWN']) {
      const { definition, getStorageSync, removeStorageSync, reLaunch } = await loadResultPage()
      definition.onLoad.call({ setData: vi.fn() }, {
        product_id: 'love_accident',
        source: 'share',
        persona,
      })
      expect(getStorageSync).not.toHaveBeenCalled()
      expect(removeStorageSync).not.toHaveBeenCalled()
      expect(reLaunch).toHaveBeenCalledWith({
        url: '/pages/love-accident/index?product_id=love_accident&source=share',
      })
      definition.onUnload()
    }
  })

  it('allows receiver to take test and view own result with source=share attribution retained', async () => {
    const { serializeLoveProgress } = await import('../../miniprogram/domain/love-session')
    // 1. Receiver has a local completed MOON result
    const localMoonAnswers: Record<`Q${number}`, 'A' | 'B' | 'C' | 'D'> = {
      Q1: 'B', Q2: 'B', Q3: 'B', Q4: 'B', Q5: 'B', Q6: 'B', Q7: 'B', Q8: 'B',
      Q9: 'B', Q10: 'B', Q11: 'B', Q12: 'B', Q13: 'B', Q14: 'B', Q15: 'B', Q16: 'B',
    }
    const localProgress = {
      productId: 'love_accident' as const,
      testId: 'love-accident' as const,
      testVersion: 'v1' as const,
      stage: 'complete' as const,
      currentQuestionIndex: 15,
      answers: localMoonAnswers,
      startedAt: Date.now() - 60000,
      updatedAt: Date.now(),
    }
    const storageValue = serializeLoveProgress(localProgress)

    const { definition, getStorageSync, reLaunch, reportEvent } = await loadResultPage(storageValue)
    const setData = vi.fn()

    // 2. Receiver views own result with source='share' (no persona parameter)
    definition.onLoad.call({ setData }, {
      product_id: 'love_accident',
      source: 'share',
    })

    expect(getStorageSync).toHaveBeenCalled()
    expect(reLaunch).not.toHaveBeenCalled()
    expect(setData).toHaveBeenCalledWith(expect.objectContaining({
      ready: true,
      isPublicResult: false,
      personaName: '被窝叫妈体验官',
    }))
    const resultViewEvent = reportEvent.mock.calls.find(([event]) => event === 'result_view')
    expect(resultViewEvent?.[1]).toMatchObject({
      final_persona: 'PRIVATE',
      source: 'share',
    })
    definition.onUnload()
  })

  it('redirects to home when source=share has no persona and no local complete progress', async () => {
    const { definition, getStorageSync, reLaunch } = await loadResultPage(null)
    const setData = vi.fn()
    definition.onLoad.call({ setData }, {
      product_id: 'love_accident',
      source: 'share',
    })

    expect(getStorageSync).toHaveBeenCalled()
    expect(reLaunch).toHaveBeenCalledWith({
      url: '/pages/love-accident/index?product_id=love_accident&source=share',
    })
    expect(setData).not.toHaveBeenCalled()
    definition.onUnload()
  })

  it('preserves source=share without persona when clicking Public Result retry CTA', async () => {
    const { definition, removeStorageSync, reLaunch, reportEvent } = await loadResultPage('receiver-private-progress')
    const setData = vi.fn()
    definition.onLoad.call({ setData }, {
      product_id: 'love_accident',
      source: 'share',
      persona: 'AUDIT',
    })
    expect(setData).toHaveBeenCalledWith(expect.objectContaining({ isPublicResult: true }))

    // Invoke retry CTA on Public Result
    ;(definition as any).retry()

    // Receiver private progress must NOT be cleared
    expect(removeStorageSync).not.toHaveBeenCalled()
    // Must navigate to home with source=share and persona omitted
    expect(reLaunch).toHaveBeenCalledWith({
      url: '/pages/love-accident/index?product_id=love_accident&source=share',
    })
    const retryEvent = reportEvent.mock.calls.find(([event]) => event === 'retry_click')
    expect(retryEvent?.[1]).toMatchObject({
      source: 'share',
      final_persona: 'AUDIT',
    })
    definition.onUnload()
  })

  it('contains no randomized or answer-bearing public fallback implementation', async () => {
    const { readFileSync } = await import('node:fs')
    const resultSource = readFileSync('miniprogram/pages/love-result/index.ts', 'utf8')
    const entrySource = readFileSync('miniprogram/pages/product-entry/index.ts', 'utf8')
    const combined = `${resultSource}\n${entrySource}`
    expect(combined).not.toMatch(/Math\.random|randomPersona|fallbackPersona/)
    expect(combined).not.toMatch(/[?&](answers|answerIds|progress)=/)
    expect(resultSource.indexOf("if (source === 'share' && options.persona !== undefined)")).toBeLessThan(resultSource.indexOf('loadLoveProgress(definition)'))
  })
})
