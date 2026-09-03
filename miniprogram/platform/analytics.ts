export type AnalyticsEvent =
  | 'page_view' | 'test_start' | 'question_view' | 'question_answer'
  | 'test_complete' | 'result_view' | 'share_click' | 'retry_click'
  | 'test_view' | 'resume_test' | 'answer_select' | 'answer_change'
  | 'back' | 'chapter_transition' | 'personal_result_view'
  | 'organization_enter' | 'final_result_view' | 'share_tap'
  | 'reflection_view' | 'restart'
  | 'pair_create' | 'pair_resolve'
  | 'ad_request' | 'ad_impression' | 'ad_error' | 'ad_close'
  | 'book_set_open' | 'official_link_copy' | 'offline_interest'

export type AnalyticsProperties = {
  product_id: string
  question_id?: string
  option_id?: string
  timestamp?: number
  duration?: number
  source?: 'normal' | 'share'
} & Record<string, string | number | boolean | undefined>

export type WechatAnalyticsValue = string | number
export type WechatAnalyticsPayload = Record<string, WechatAnalyticsValue>

export interface WechatAnalyticsApi {
  reportEvent?: (eventId: string, data?: WechatAnalyticsPayload) => void
  reportAnalytics?: (eventName: string, data: WechatAnalyticsPayload) => void
}

export interface AnalyticsAdapter {
  track(event: AnalyticsEvent, properties: AnalyticsProperties): void
}

export class NoopAnalyticsAdapter implements AnalyticsAdapter {
  track(_event: AnalyticsEvent, _properties: AnalyticsProperties): void {
    // Explicit fallback for runtimes where no reporting API is available.
  }
}

export class DevelopmentConsoleAnalyticsAdapter implements AnalyticsAdapter {
  track(event: AnalyticsEvent, properties: AnalyticsProperties): void {
    console.info('[analytics]', event, properties)
  }
}

const WECHAT_FIELD_NAMES: Record<string, string> = {
  testId: 'test_id',
  testVersion: 'test_version',
  resolutionMode: 'resolution_mode',
  fallbackReason: 'fallback_reason',
  finalPersona: 'final_persona',
}

const WECHAT_ALLOWED_FIELDS = new Set([
  'product_id', 'event', 'question_id', 'option_id', 'duration', 'source', 'timestamp',
  'page', 'test_id', 'test_version', 'stage', 'route_reason', 'answer_action',
  'outcome', 'persona', 'relation', 'pair_source',
  'resolution_mode', 'fallback_reason', 'final_persona',
  'mode', 'viewer_grade', 'content_stage', 'content_grade', 'term',
  'subject', 'book_id', 'target', 'reason', 'action_result',
])

function normalizeWechatValue(value: string | number | boolean | undefined): WechatAnalyticsValue | undefined {
  if (typeof value === 'string') return value.slice(0, 128)
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'boolean') return value ? 1 : 0
  return undefined
}

export function createWechatAnalyticsPayload(event: AnalyticsEvent, properties: AnalyticsProperties): WechatAnalyticsPayload {
  const payload: WechatAnalyticsPayload = { event }
  for (const [sourceKey, sourceValue] of Object.entries(properties)) {
    const key = WECHAT_FIELD_NAMES[sourceKey] ?? sourceKey
    if (!WECHAT_ALLOWED_FIELDS.has(key) || key === 'event') continue
    const value = normalizeWechatValue(sourceValue)
    if (value !== undefined) payload[key] = value
  }
  return payload
}

export class WechatAnalyticsAdapter implements AnalyticsAdapter {
  constructor(private readonly api: WechatAnalyticsApi) {}

  track(event: AnalyticsEvent, properties: AnalyticsProperties): void {
    const payload = createWechatAnalyticsPayload(event, properties)
    if (typeof this.api.reportEvent === 'function') {
      try {
        this.api.reportEvent(event, payload)
        return
      } catch {
        // Older or partially available runtimes may expose the API but reject the call.
      }
    }
    if (typeof this.api.reportAnalytics === 'function') {
      try {
        this.api.reportAnalytics(event, payload)
      } catch {
        // Analytics must never interrupt the assessment flow.
      }
    }
  }
}

function isLocalDevelopment(): boolean {
  try {
    return typeof wx !== 'undefined' && wx.getSystemInfoSync?.().platform === 'devtools'
  } catch {
    return false
  }
}

export class AnalyticsClient implements AnalyticsAdapter {
  constructor(private readonly adapter: AnalyticsAdapter) {}

  track(event: AnalyticsEvent, properties: AnalyticsProperties): void {
    if (!properties.product_id) throw new Error(`analytics event ${event} requires product_id`)
    this.adapter.track(event, { ...properties, timestamp: properties.timestamp ?? Date.now() })
  }
}

function wechatAnalyticsApi(): WechatAnalyticsApi {
  return typeof wx === 'undefined' ? {} : wx
}

export const analytics: AnalyticsAdapter = new AnalyticsClient(
  isLocalDevelopment()
    ? new DevelopmentConsoleAnalyticsAdapter()
    : new WechatAnalyticsAdapter(wechatAnalyticsApi()),
)

