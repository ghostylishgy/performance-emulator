export type AnalyticsEvent =
  | 'test_view' | 'test_start' | 'resume_test' | 'question_view'
  | 'answer_select' | 'answer_change' | 'back' | 'chapter_transition'
  | 'personal_result_view' | 'organization_enter' | 'final_result_view'
  | 'share_tap' | 'reflection_view' | 'restart'
  | 'ad_request' | 'ad_impression' | 'ad_error' | 'ad_close'

export type AnalyticsProperties = Record<string, string | number | boolean | undefined>

export interface AnalyticsAdapter {
  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void
}

export class NoopAnalyticsAdapter implements AnalyticsAdapter {
  track(_event: AnalyticsEvent, _properties: AnalyticsProperties = {}): void {
    // V1 deliberately keeps analytics local and side-effect free.
  }
}

export const analytics: AnalyticsAdapter = new NoopAnalyticsAdapter()

