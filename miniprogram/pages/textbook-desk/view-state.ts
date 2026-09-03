import type { ProductRouteOptions, ProductSource } from '../../platform/product-routing'
import { buildSemesterDeskRecommendations } from './academic-phase'
import { parseTextbookShareState } from './share'
import type { TextbookPreference, TextbookTargetId, TextbookViewMode } from './types'

export type TextbookEntryState =
  | { screen: 'first_setup'; source: ProductSource }
  | {
    screen: 'semester_desk'
    source: ProductSource
    mode: TextbookViewMode
    target: TextbookTargetId
    homeGrade?: TextbookPreference['homeGrade']
    transientShareView: boolean
  }

export function resolveTextbookEntryState(
  options: ProductRouteOptions,
  preference: TextbookPreference | null,
  now: Date,
): TextbookEntryState {
  const shared = parseTextbookShareState(options)
  if (shared) {
    return {
      screen: 'semester_desk',
      source: 'share',
      mode: shared.mode,
      target: shared.target,
      transientShareView: true,
    }
  }
  const source = options.source === 'share' ? 'share' : 'normal'
  if (!preference) return { screen: 'first_setup', source }
  const recommendation = buildSemesterDeskRecommendations(preference.homeGrade, now)[0]
  if (!recommendation) return { screen: 'first_setup', source }
  return {
    screen: 'semester_desk',
    source,
    mode: recommendation.mode,
    target: recommendation.target,
    homeGrade: preference.homeGrade,
    transientShareView: false,
  }
}
