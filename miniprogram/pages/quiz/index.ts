import { defaultTestId, getTestDefinition } from '../../config/test-registry'
import { advanceProgress, createProgress, moveBack, setAnswer, type QuizProgress } from '../../domain/session'
import { analytics } from '../../platform/analytics'
import { recoverCorruptProgress, showProgressSaveWarning } from '../../platform/progress-recovery'
import { loadProgress, saveProgress } from '../../platform/storage'

const definition = getTestDefinition(defaultTestId)
let progress: QuizProgress | null = null
let transitionTimer: ReturnType<typeof setTimeout> | undefined
let actionLocked = false
let storageWarningShown = false

function persistProgress(value: QuizProgress): void {
  if (saveProgress(value) || storageWarningShown) return
  storageWarningShown = true
  showProgressSaveWarning()
}

Page({
  data: { question: {}, questionNumber: 1, total: definition.questions.length, selectedId: '', interactionLocked: false, canGoBack: false, leavingQuiz: false },
  onLoad() {
    const stored = loadProgress(definition)
    if (stored.status === 'corrupt') return recoverCorruptProgress(definition)
    if (stored.status === 'version-mismatch') {
      wx.showToast({ title: '测试版本已经更新，请重新开始', icon: 'none' })
      wx.reLaunch({ url: '/pages/home/index' })
      return
    }
    progress = stored.status === 'current' ? stored.progress : createProgress(definition)
    if (stored.status !== 'current') persistProgress(progress)
    if (progress.stage === 'complete') wx.redirectTo({ url: '/pages/result/index' })
    else this.renderQuestion()
  },
  onUnload() {
    if (transitionTimer) clearTimeout(transitionTimer)
    transitionTimer = undefined
    actionLocked = false
    storageWarningShown = false
  },
  renderQuestion() {
    if (!progress) return
    const question = definition.questions[progress.currentQuestionIndex]
    if (!question) return
    actionLocked = false
    this.setData({ question, questionNumber: progress.currentQuestionIndex + 1, selectedId: progress.answers[question.id] ?? '', interactionLocked: false, canGoBack: progress.currentQuestionIndex > 0, leavingQuiz: false })
    analytics.track('question_view', { testId: definition.id, questionId: question.id, stage: 'continuous' })
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
    analytics.track(previous ? 'answer_change' : 'answer_select', { testId: definition.id, questionId: question.id, optionId, stage: 'continuous' })
    transitionTimer = setTimeout(() => {
      if (!progress) return
      progress = advanceProgress(progress, definition)
      persistProgress(progress)
      if (progress.stage === 'complete') wx.redirectTo({ url: '/pages/result/index' })
      else this.renderQuestion()
    }, 260)
  },
  goBack() {
    if (!progress || actionLocked) return
    progress = moveBack(progress)
    persistProgress(progress)
    analytics.track('back', { testId: definition.id, stage: 'continuous' })
    this.renderQuestion()
  },
})
