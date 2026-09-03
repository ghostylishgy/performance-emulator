import { getProduct, TEXTBOOK_DESK_PRODUCT_ID } from '../../../config/products'
import type { ProductRouteOptions, ProductSource } from '../../../platform/product-routing'
import { buildSemesterDeskRecommendations, resolveAcademicPhase, type AcademicPhase } from '../academic-phase'
import { getBooksForTarget, groupBooksBySubject, type TextbookSubjectGroup } from '../catalog'
import { parseTextbookShareState } from '../share'
import { getTextbookTarget } from '../targets'
import { TEXTBOOK_GRADE_IDS, type TextbookGradeId, type TextbookPreference, type TextbookRecommendation, type TextbookRecommendationKind, type TextbookRecord, type TextbookTarget, type TextbookTargetId, type TextbookViewMode } from '../types'

const product = getProduct(TEXTBOOK_DESK_PRODUCT_ID)
if (!product) throw new Error('Missing textbook product registry entry')
const productName = product.title

const gradeLabels: Readonly<Record<TextbookGradeId, string>> = {
  primary_1: '一年级', primary_2: '二年级', primary_3: '三年级',
  primary_4: '四年级', primary_5: '五年级', primary_6: '六年级',
  junior_7: '七年级', junior_8: '八年级', junior_9: '九年级',
}

const phaseLabels: Readonly<Record<AcademicPhase, string>> = {
  upper_term: '上学期',
  winter_break: '寒假衔接',
  lower_term: '下学期',
  summer_break: '暑假衔接',
}

const recommendationLabels: Readonly<Record<TextbookRecommendationKind, string>> = {
  current: '当前课本',
  next_term: '下册预习',
  next_grade: '下一年级',
  history: '本学年课本',
}

export interface TextbookGradeOptionViewModel {
  id: TextbookGradeId
  label: string
}

export interface TextbookBookSetViewModel {
  key: TextbookTargetId
  kind: TextbookRecommendationKind
  mode: TextbookViewMode
  target: TextbookTarget
  title: string
  relationLabel: string
  available: boolean
  bookCount: number
  books: readonly TextbookRecord[]
  subjectGroups: readonly TextbookSubjectGroup[]
  priority: number
}

export interface TextbookShareViewModel {
  kind: 'normal' | 'current_share' | 'preview_share'
  source: ProductSource
  mode?: TextbookViewMode
  target?: TextbookTargetId
  showPreviewSocialHint: boolean
}

export interface TextbookDeskViewModel {
  productName: string
  screen: 'first_setup' | 'semester_desk'
  user: {
    hasHomeGrade: boolean
    homeGrade?: TextbookGradeId
  }
  academicPhase: AcademicPhase | null
  seasonalLabel: string
  gradeOptions: readonly TextbookGradeOptionViewModel[]
  current: TextbookBookSetViewModel | null
  nextTerm: TextbookBookSetViewModel | null
  nextGrade: TextbookBookSetViewModel | null
  layout: {
    hero: TextbookBookSetViewModel | null
    secondary: readonly TextbookBookSetViewModel[]
    history: readonly TextbookBookSetViewModel[]
  }
  share: TextbookShareViewModel
}

export interface BuildTextbookDeskViewModelOptions {
  route: ProductRouteOptions
  preference: TextbookPreference | null
  now: Date
}

export const textbookGradeOptions: readonly TextbookGradeOptionViewModel[] = TEXTBOOK_GRADE_IDS.map((id) => ({
  id,
  label: gradeLabels[id],
}))

function toBookSet(recommendation: TextbookRecommendation): TextbookBookSetViewModel {
  const target = getTextbookTarget(recommendation.target)
  const books = getBooksForTarget(recommendation.target)
  const termLabel = target.term === 'upper' ? '上册' : '下册'
  return {
    key: recommendation.target,
    kind: recommendation.kind,
    mode: recommendation.mode,
    target,
    title: `${gradeLabels[target.grade]}${termLabel}`,
    relationLabel: recommendationLabels[recommendation.kind],
    available: books.length > 0,
    bookCount: books.length,
    books,
    subjectGroups: groupBooksBySubject(books),
    priority: recommendation.priority,
  }
}

function shareBookSet(mode: TextbookViewMode, targetId: TextbookTargetId): TextbookBookSetViewModel {
  return toBookSet({
    kind: mode === 'current' ? 'current' : 'next_grade',
    mode,
    target: targetId,
    priority: 1,
  })
}

function emptyViewModel(source: ProductSource): TextbookDeskViewModel {
  return {
    productName,
    screen: 'first_setup',
    user: { hasHomeGrade: false },
    academicPhase: null,
    seasonalLabel: '请先选择年级',
    gradeOptions: textbookGradeOptions,
    current: null,
    nextTerm: null,
    nextGrade: null,
    layout: { hero: null, secondary: [], history: [] },
    share: { kind: 'normal', source, showPreviewSocialHint: false },
  }
}

export function buildTextbookDeskViewModel(options: BuildTextbookDeskViewModelOptions): TextbookDeskViewModel {
  const shared = parseTextbookShareState(options.route)
  if (shared) {
    const hero = shareBookSet(shared.mode, shared.target)
    return {
      ...emptyViewModel('share'),
      screen: 'semester_desk',
      seasonalLabel: '分享查看',
      layout: { hero, secondary: [], history: [] },
      current: shared.mode === 'current' ? hero : null,
      nextTerm: null,
      nextGrade: null,
      share: {
        kind: shared.mode === 'current' ? 'current_share' : 'preview_share',
        source: 'share',
        mode: shared.mode,
        target: shared.target,
        showPreviewSocialHint: shared.mode === 'preview',
      },
    }
  }

  const source: ProductSource = options.route.source === 'share' ? 'share' : 'normal'
  if (!options.preference) return emptyViewModel(source)

  const academicPhase = resolveAcademicPhase(options.now)
  const sets = buildSemesterDeskRecommendations(options.preference.homeGrade, options.now).map(toBookSet)
  const hero = sets[0] ?? null
  const current = sets.find((set) => set.kind === 'current')
    ?? sets.find((set) => set.kind === 'history')
    ?? null
  const nextTerm = sets.find((set) => set.kind === 'next_term') ?? null
  const nextGrade = sets.find((set) => set.kind === 'next_grade') ?? null

  return {
    productName,
    screen: 'semester_desk',
    user: { hasHomeGrade: true, homeGrade: options.preference.homeGrade },
    academicPhase,
    seasonalLabel: phaseLabels[academicPhase],
    gradeOptions: textbookGradeOptions,
    current,
    nextTerm,
    nextGrade,
    layout: {
      hero,
      secondary: sets.slice(1).filter((set) => set.kind !== 'history'),
      history: sets.filter((set) => set.kind === 'history' && set !== hero),
    },
    share: { kind: 'normal', source, showPreviewSocialHint: false },
  }
}
