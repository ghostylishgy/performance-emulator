import { describe, expect, it, vi } from 'vitest'
import {
  AnalyticsClient,
  createWechatAnalyticsPayload,
  WechatAnalyticsAdapter,
  type AnalyticsProperties,
  type WechatAnalyticsApi,
} from '../../miniprogram/platform/analytics'

const properties = (extra: Partial<AnalyticsProperties> = {}): AnalyticsProperties => ({
  product_id: 'love_accident',
  timestamp: 1_788_000_000_000,
  source: 'share',
  ...extra,
})

describe('WeChat analytics adapter', () => {
  it('uses reportEvent as the primary production API', () => {
    const reportEvent = vi.fn()
    const reportAnalytics = vi.fn()
    new WechatAnalyticsAdapter({ reportEvent, reportAnalytics }).track('question_answer', properties({ question_id: 'Q4', option_id: 'B', duration: 3200 }))

    expect(reportEvent).toHaveBeenCalledWith('question_answer', {
      event: 'question_answer',
      product_id: 'love_accident',
      timestamp: 1_788_000_000_000,
      source: 'share',
      question_id: 'Q4',
      option_id: 'B',
      duration: 3200,
    })
    expect(reportAnalytics).not.toHaveBeenCalled()
  })

  it('falls back to reportAnalytics when reportEvent is unavailable or throws', () => {
    const unavailableFallback = vi.fn()
    new WechatAnalyticsAdapter({ reportAnalytics: unavailableFallback }).track('page_view', properties())
    expect(unavailableFallback).toHaveBeenCalledOnce()

    const throwingFallback = vi.fn()
    const api: WechatAnalyticsApi = {
      reportEvent: () => { throw new Error('unsupported') },
      reportAnalytics: throwingFallback,
    }
    new WechatAnalyticsAdapter(api).track('test_start', properties())
    expect(throwingFallback).toHaveBeenCalledOnce()
  })

  it('becomes a safe no-op when both native APIs fail', () => {
    const adapter = new WechatAnalyticsAdapter({
      reportEvent: () => { throw new Error('reportEvent failed') },
      reportAnalytics: () => { throw new Error('reportAnalytics failed') },
    })
    expect(() => adapter.track('test_complete', properties())).not.toThrow()
    expect(() => new WechatAnalyticsAdapter({}).track('test_complete', properties())).not.toThrow()
  })

  it('maps legacy field names and only sends anonymous allowlisted fields', () => {
    const payload = createWechatAnalyticsPayload('result_view', properties({
      testId: 'performance-simulator',
      testVersion: 'v3',
      outcome: '3.5',
      openid: 'must-not-leave-device',
      nickname: 'must-not-leave-device',
      phone: 'must-not-leave-device',
      user_input: 'must-not-leave-device',
    }))
    expect(payload).toMatchObject({
      event: 'result_view',
      product_id: 'love_accident',
      test_id: 'performance-simulator',
      test_version: 'v3',
      outcome: '3.5',
    })
    expect(payload).not.toHaveProperty('openid')
    expect(payload).not.toHaveProperty('nickname')
    expect(payload).not.toHaveProperty('phone')
    expect(payload).not.toHaveProperty('user_input')
  })

  it('maps deterministic love resolution metadata for production reporting', () => {
    expect(createWechatAnalyticsPayload('test_complete', properties({
      testId: 'love-accident',
      testVersion: 'v1',
      finalPersona: 'DIGNITY',
      resolutionMode: 'fallback',
      fallbackReason: 'no_active_persona',
    }))).toMatchObject({
      test_id: 'love-accident',
      test_version: 'v1',
      final_persona: 'DIGNITY',
      resolution_mode: 'fallback',
      fallback_reason: 'no_active_persona',
    })
  })

  it('allows only the anonymous textbook analytics contract', () => {
    expect(createWechatAnalyticsPayload('official_link_copy', {
      product_id: 'textbook_desk',
      source: 'share',
      mode: 'preview',
      viewer_grade: 'primary_6',
      content_stage: 'junior',
      content_grade: 'junior_7',
      term: 'upper',
      subject: 'english',
      book_id: '1312001101241',
      target: 'junior_7_upper',
      action_result: 'success',
      school: 'must-not-leave-device',
      child_name: 'must-not-leave-device',
      clipboard: 'must-not-leave-device',
    })).toEqual({
      event: 'official_link_copy',
      product_id: 'textbook_desk',
      source: 'share',
      mode: 'preview',
      viewer_grade: 'primary_6',
      content_stage: 'junior',
      content_grade: 'junior_7',
      term: 'upper',
      subject: 'english',
      book_id: '1312001101241',
      target: 'junior_7_upper',
      action_result: 'success',
    })
  })

  it('adds timestamp before dispatch and still enforces product_id', () => {
    const adapter = { track: vi.fn() }
    const client = new AnalyticsClient(adapter)
    client.track('page_view', { product_id: 'love_accident', source: 'normal' })
    expect(adapter.track.mock.calls[0]?.[1].timestamp).toEqual(expect.any(Number))
    expect(() => client.track('page_view', { product_id: '' })).toThrow(/requires product_id/)
  })
})
