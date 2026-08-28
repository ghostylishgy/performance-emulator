import { defaultTestId, getTestDefinition } from '../../config/test-registry'
import { getProduct, PERFORMANCE_PRODUCT_ID } from '../../config/products'
import { advanceProgress, createProgress, moveBack, setAnswer, type QuizProgress } from '../../domain/session'
import { analytics } from '../../platform/analytics'
import { recoverCorruptProgress, showProgressSaveWarning } from '../../platform/progress-recovery'
import { buildProductPagePath, guardProductAccess, normalizeProductSource, type ProductRouteOptions, type ProductSource } from '../../platform/product-routing'
import { loadProgress, saveProgress } from '../../platform/storage'

const definition = getTestDefinition(defaultTestId)
const product = getProduct(PERFORMANCE_PRODUCT_ID)!
let progress: QuizProgress | null = null
let transitionTimer: ReturnType<typeof setTimeout> | undefined
let actionLocked = false
let storageWarningShown = false
let pageSource: ProductSource = 'normal'
let accessAllowed = false

function persistProgress(value: QuizProgress): void {
  if (saveProgress(value) || storageWarningShown) return
  storageWarningShown = true
  showProgressSaveWarning()
}

Page({
  data: { question: {}, questionNumber: 1, total: definition.questions.length, selectedId: '', interactionLocked: false, canGoBack: false, leavingQuiz: false },
  onLoad(options: ProductRouteOptions) {
    pageSource = normalizeProductSource(options.source)
    accessAllowed = guardProductAccess(product.product_id, options)
    if (!accessAllowed) return
    const stored = loadProgress(definition)
    if (stored.status === 'corrupt') return recoverCorruptProgress(definition)
    if (stored.status === 'version-mismatch') {
      wx.showToast({ title: '测试版本已经更新，请重新开始', icon: 'none' })
      wx.reLaunch({ url: buildProductPagePath(product.routes.home, product.product_id, pageSource) })
      return
    }
    progress = stored.status === 'current' ? stored.progress : createProgress(definition)
    if (stored.status !== 'current') persistProgress(progress)
    if (progress.stage === 'complete') wx.redirectTo({ url: buildProductPagePath(product.routes.result!, product.product_id, pageSource) })
    else this.renderQuestion()
  },
  onUnload() {
    if (transitionTimer) clearTimeout(transitionTimer)
    transitionTimer = undefined
    actionLocked = false
    storageWarningShown = false
    accessAllowed = false
    pageSource = 'normal'
  },
  renderQuestion() {
    if (!progress) return
    const question = definition.questions[progress.currentQuestionIndex]
    if (!question) return
    actionLocked = false
    this.setData({ question, questionNumber: progress.currentQuestionIndex + 1, selectedId: progress.answers[question.id] ?? '', interactionLocked: false, canGoBack: progress.currentQuestionIndex > 0, leavingQuiz: false })
    analytics.track('question_view', { product_id: product.product_id, testId: definition.id, question_id: question.id, stage: 'continuous', source: pageSource })
  },
  selectOption(event: any) {
    if (!progress || actionLocked) return
    const question = definition.questions[progress.currentQuestionIndex]
    if (!question) return
    const optionId = String(event.detail.optionId)
    const previous = progress.answers[question.id]
    const isFinalQuestion = progress.currentQuestionIndex === definition.questions.length - 1
    actionLocked = true
    progress = setAnswer(progress, definition, question.id, optionId)
    persistProgress(progress)
    this.setData({ selectedId: optionId, interactionLocked: true, leavingQuiz: isFinalQuestion })
    analytics.track('question_answer', {
      product_id: product.product_id,
      testId: definition.id,
      question_id: question.id,
      option_id: optionId,
      answer_action: previous ? 'change' : 'select',
      stage: 'continuous',
      source: pageSource,
    })
    transitionTimer = setTimeout(() => {
      if (!progress) return
      progress = advanceProgress(progress, definition)
      persistProgress(progress)
      if (progress.stage === 'complete') {
        analytics.track('test_complete', { product_id: product.product_id, testId: definition.id, source: pageSource })
        wx.redirectTo({ url: buildProductPagePath(product.routes.result!, product.product_id, pageSource) })
      }
      else this.renderQuestion()
    }, 260)
  },
  goBack() {
    if (!progress || actionLocked) return
    progress = moveBack(progress)
    persistProgress(progress)
    analytics.track('back', { product_id: product.product_id, testId: definition.id, stage: 'continuous', source: pageSource })
    this.renderQuestion()
  },
})
