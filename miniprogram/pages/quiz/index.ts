import { defaultTestId, getTestDefinition } from '../../config/test-registry'
import { evaluatePersonal } from '../../domain/evaluation-pipeline'
import { createProgress, freezePersonalProgress, setAnswer, type QuizProgress } from '../../domain/session'
import { analytics } from '../../platform/analytics'
import { loadProgress, saveProgress } from '../../platform/storage'

const definition = getTestDefinition(defaultTestId)
let progress: QuizProgress | null = null
let transitionTimer: ReturnType<typeof setTimeout> | undefined
let scanTimer: ReturnType<typeof setInterval> | undefined
let actionLocked = false

Page({
  data: {
    displayMode: 'question',
    question: {},
    chapterTitle: '',
    chapterSubtitle: '',
    questionNumber: 1,
    total: definition.questions.length,
    selectedId: '',
    interactionLocked: false,
    canGoBack: false,
    transition: {},
    checkpoint: definition.checkpoint,
    checkpointOutcome: '',
    scanLines: definition.organizationTransition.lines,
    scanIndex: 0,
    scanDisclaimer: definition.organizationTransition.disclaimer,
  },
  onLoad() {
    const stored = loadProgress(definition)
    if (stored.status === 'version-mismatch') {
      wx.showToast({ title: '测试版本已经更新，请重新开始', icon: 'none' })
      wx.reLaunch({ url: '/pages/home/index' })
      return
    }
    progress = stored.status === 'current' ? stored.progress : createProgress(definition)
    if (stored.status !== 'current') saveProgress(progress)
    if (progress.stage === 'complete') {
      wx.redirectTo({ url: `/pages/result/index?testId=${definition.id}` })
    } else if (progress.stage === 'chapter-transition') {
      this.showChapterTransition()
    } else if (progress.stage === 'checkpoint') {
      this.showCheckpoint()
    } else if (progress.stage === 'organization-transition') {
      this.playOrganizationTransition()
    } else {
      this.renderQuestion()
    }
  },
  onUnload() {
    if (transitionTimer) clearTimeout(transitionTimer)
    if (scanTimer) clearInterval(scanTimer)
    transitionTimer = undefined
    scanTimer = undefined
    actionLocked = false
  },
  renderQuestion() {
    if (!progress) return
    const question = definition.questions[progress.currentQuestionIndex]
    if (!question) return
    const chapter = definition.chapters.find((item) => item.id === question.chapterId)
    actionLocked = false
    this.setData({
      displayMode: 'question',
      question,
      chapterTitle: chapter?.title ?? '',
      chapterSubtitle: chapter?.subtitle ?? '',
      questionNumber: progress.currentQuestionIndex + 1,
      selectedId: progress.answers[question.id] ?? '',
      interactionLocked: false,
      canGoBack: question.section === 'personal' ? progress.currentQuestionIndex > 0 : progress.currentQuestionIndex > 12,
    })
    analytics.track('question_view', { testId: definition.id, questionId: question.id, stage: question.section })
  },
  selectOption(event: any) {
    if (!progress || actionLocked || this.data.displayMode !== 'question') return
    const index = progress.currentQuestionIndex
    const question = definition.questions[index]
    if (!question) return
    const optionId = String(event.detail.optionId)
    const previous = progress.answers[question.id]
    actionLocked = true
    progress = setAnswer(progress, definition, question.id, optionId)
    saveProgress(progress)
    this.setData({ selectedId: optionId, interactionLocked: true })
    analytics.track(previous ? 'answer_change' : 'answer_select', {
      testId: definition.id,
      testVersion: definition.version,
      questionId: question.id,
      optionId,
      stage: question.section,
    })
    transitionTimer = setTimeout(() => this.advanceFrom(index), 260)
  },
  advanceFrom(index: number) {
    if (!progress || progress.currentQuestionIndex !== index) return
    const question = definition.questions[index]
    if (!question) return
    if (index === 3 || index === 7) {
      const chapter = definition.chapters.find((item) => item.id === question.chapterId)
      progress = {
        ...progress,
        stage: 'chapter-transition',
        pendingTransitionChapterId: chapter?.id,
        currentQuestionIndex: index + 1,
        timestamp: Date.now(),
      }
      saveProgress(progress)
      this.showChapterTransition()
      return
    }
    if (index === 11) {
      progress = { ...progress, stage: 'checkpoint', currentQuestionIndex: 11, timestamp: Date.now() }
      saveProgress(progress)
      this.showCheckpoint()
      return
    }
    if (index === definition.questions.length - 1) {
      progress = { ...progress, stage: 'complete', currentQuestionIndex: index, timestamp: Date.now() }
      saveProgress(progress)
      wx.redirectTo({ url: `/pages/result/index?testId=${definition.id}` })
      return
    }
    progress = { ...progress, currentQuestionIndex: index + 1, timestamp: Date.now() }
    saveProgress(progress)
    this.renderQuestion()
  },
  showChapterTransition() {
    if (!progress) return
    const chapter = definition.chapters.find((item) => item.id === progress?.pendingTransitionChapterId)
    if (!chapter?.transition) {
      progress = { ...progress, stage: 'personal', pendingTransitionChapterId: undefined, timestamp: Date.now() }
      saveProgress(progress)
      this.renderQuestion()
      return
    }
    actionLocked = false
    this.setData({ displayMode: 'chapter-transition', transition: chapter.transition, interactionLocked: false })
    analytics.track('chapter_transition', { testId: definition.id, questionId: chapter.questionIds[chapter.questionIds.length - 1] })
  },
  continueChapter() {
    if (!progress || actionLocked || progress.stage !== 'chapter-transition') return
    actionLocked = true
    progress = { ...progress, stage: 'personal', pendingTransitionChapterId: undefined, timestamp: Date.now() }
    saveProgress(progress)
    this.renderQuestion()
  },
  goBack() {
    if (!progress || actionLocked || this.data.displayMode !== 'question') return
    const minIndex = progress.baseOutcomeFrozen ? 12 : 0
    if (progress.currentQuestionIndex <= minIndex) return
    progress = { ...progress, currentQuestionIndex: progress.currentQuestionIndex - 1, timestamp: Date.now() }
    saveProgress(progress)
    analytics.track('back', { testId: definition.id, stage: progress.stage })
    this.renderQuestion()
  },
  showCheckpoint() {
    if (!progress) return
    actionLocked = false
    const personal = evaluatePersonal(definition, progress.answers)
    this.setData({
      displayMode: 'checkpoint',
      checkpointOutcome: personal.baseOutcome,
      interactionLocked: false,
    })
    analytics.track('personal_result_view', { testId: definition.id, outcome: personal.baseOutcome })
  },
  returnFromCheckpoint() {
    if (!progress || progress.baseOutcomeFrozen) return
    progress = { ...progress, stage: 'personal', currentQuestionIndex: 11, timestamp: Date.now() }
    saveProgress(progress)
    this.renderQuestion()
  },
  confirmOrganization() {
    if (!progress || actionLocked) return
    actionLocked = true
    this.setData({ interactionLocked: true })
    const frozen = freezePersonalProgress(progress, definition)
    progress = frozen.progress
    saveProgress(progress)
    analytics.track('organization_enter', { testId: definition.id, outcome: frozen.baseOutcome })
    this.playOrganizationTransition()
  },
  playOrganizationTransition() {
    if (!progress) return
    if (scanTimer) clearInterval(scanTimer)
    if (transitionTimer) clearTimeout(transitionTimer)
    let index = 0
    this.setData({ displayMode: 'organization-transition', scanIndex: index, interactionLocked: true })
    scanTimer = setInterval(() => {
      index = Math.min(index + 1, definition.organizationTransition.lines.length - 1)
      this.setData({ scanIndex: index })
    }, Math.floor(definition.organizationTransition.durationMs / definition.organizationTransition.lines.length))
    transitionTimer = setTimeout(() => {
      if (scanTimer) clearInterval(scanTimer)
      scanTimer = undefined
      if (!progress) return
      progress = { ...progress, stage: 'organization', currentQuestionIndex: 12, timestamp: Date.now() }
      saveProgress(progress)
      this.renderQuestion()
    }, definition.organizationTransition.durationMs)
  },
})
