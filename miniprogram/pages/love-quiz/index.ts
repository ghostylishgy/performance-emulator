import { getProduct, LOVE_ACCIDENT_PRODUCT_ID } from '../../config/products'
import { loveAccidentTest } from '../../config/tests/love-accident/index'
import type { LoveAnswerId } from '../../config/tests/love-accident/types'
import {
  advanceLoveProgress,
  createLoveProgress,
  moveBackLoveProgress,
  setLoveAnswer,
  type LoveQuizProgress,
} from '../../domain/love-session'
import {
  finishQuestionDuration,
  pauseQuestionDuration,
  resumeQuestionDuration,
  startQuestionDuration,
  type QuestionDurationState,
} from '../../domain/love-duration'
import { evaluateLoveAccident } from '../../domain/love-evaluation'
import { analytics } from '../../platform/analytics'
import { clearLoveProgress, loadLoveProgress, saveLoveProgress } from '../../platform/love-storage'
import {
  buildProductPagePath,
  guardProductAccess,
  normalizeProductSource,
  type ProductRouteOptions,
  type ProductSource,
} from '../../platform/product-routing'

const definition = loveAccidentTest
const product = getProduct(LOVE_ACCIDENT_PRODUCT_ID)!
let progress: LoveQuizProgress | null = null
let durationState: QuestionDurationState | null = null
let transitionTimer: ReturnType<typeof setTimeout> | undefined
let actionLocked = false
let source: ProductSource = 'normal'
let accessAllowed = false
let storageWarningShown = false

function persist(value: LoveQuizProgress): void {
  if (saveLoveProgress(value) || storageWarningShown) return
  storageWarningShown = true
  wx.showToast({ title: '进度暂时无法保存，请勿退出', icon: 'none' })
}

function restartAfterInvalidStorage(message: string): void {
  clearLoveProgress()
  wx.showToast({ title: message, icon: 'none' })
  wx.reLaunch({ url: buildProductPagePath(product.routes.home, product.product_id, source) })
}

Page({
  data: {
    question: {},
    questionNumber: 1,
    total: definition.questions.length,
    progressPercent: 6.25,
    selectedId: '',
    interactionLocked: false,
    canGoBack: false,
  },
  onLoad(options: ProductRouteOptions) {
    source = normalizeProductSource(options.source)
    accessAllowed = guardProductAccess(product.product_id, options)
    if (!accessAllowed) return
    analytics.track('page_view', {
      product_id: product.product_id,
      page: 'quiz',
      testId: definition.id,
      testVersion: definition.version,
      source,
    })
    const stored = loadLoveProgress(definition)
    if (stored.status === 'corrupt') return restartAfterInvalidStorage('进度损坏，请重新开始')
    if (stored.status === 'version-mismatch') return restartAfterInvalidStorage('测试版本已更新，请重新开始')
    progress = stored.status === 'current' ? stored.progress : createLoveProgress(definition)
    if (stored.status !== 'current') persist(progress)
    if (progress.stage === 'complete') {
      wx.redirectTo({ url: buildProductPagePath(product.routes.result!, product.product_id, source) })
      return
    }
    this.renderQuestion()
  },
  onShow() {
    if (durationState) durationState = resumeQuestionDuration(durationState)
  },
  onHide() {
    if (durationState) durationState = pauseQuestionDuration(durationState)
  },
  onUnload() {
    if (transitionTimer) clearTimeout(transitionTimer)
    transitionTimer = undefined
    progress = null
    durationState = null
    actionLocked = false
    source = 'normal'
    accessAllowed = false
    storageWarningShown = false
  },
  renderQuestion() {
    if (!progress) return
    const question = definition.questions[progress.currentQuestionIndex]
    if (!question) return
    actionLocked = false
    durationState = startQuestionDuration()
    this.setData({
      question,
      questionNumber: progress.currentQuestionIndex + 1,
      total: definition.questions.length,
      progressPercent: (progress.currentQuestionIndex + 1) / definition.questions.length * 100,
      selectedId: progress.answers[question.id] ?? '',
      interactionLocked: false,
      canGoBack: progress.currentQuestionIndex > 0,
    })
    analytics.track('question_view', {
      product_id: product.product_id,
      testId: definition.id,
      testVersion: definition.version,
      question_id: question.id,
      source,
    })
  },
  selectOption(event: any) {
    if (!progress || !durationState || actionLocked) return
    const question = definition.questions[progress.currentQuestionIndex]
    if (!question) return
    const optionId = String(event.currentTarget?.dataset?.optionId ?? '') as LoveAnswerId
    if (!question.options.some((option) => option.id === optionId)) return
    const duration = finishQuestionDuration(durationState)
    const isFinalQuestion = progress.currentQuestionIndex === definition.questions.length - 1
    actionLocked = true
    progress = setLoveAnswer(progress, definition, question.id, optionId)
    persist(progress)
    this.setData({ selectedId: optionId, interactionLocked: true })
    analytics.track('question_answer', {
      product_id: product.product_id,
      testId: definition.id,
      testVersion: definition.version,
      question_id: question.id,
      option_id: optionId,
      duration,
      source,
    })
    transitionTimer = setTimeout(() => {
      if (!progress) return
      progress = advanceLoveProgress(progress, definition)
      persist(progress)
      if (isFinalQuestion) {
        const result = evaluateLoveAccident(definition, progress.answers)
        analytics.track('test_complete', {
          product_id: product.product_id,
          testId: definition.id,
          testVersion: definition.version,
          finalPersona: result.final_persona,
          resolutionMode: result.resolution_mode,
          fallbackReason: result.fallback_reason ?? undefined,
          source,
        })
        wx.redirectTo({ url: buildProductPagePath(product.routes.result!, product.product_id, source) })
      } else {
        this.renderQuestion()
      }
    }, 260)
  },
  goBack() {
    if (!progress || actionLocked) return
    progress = moveBackLoveProgress(progress)
    persist(progress)
    this.renderQuestion()
  },
})
