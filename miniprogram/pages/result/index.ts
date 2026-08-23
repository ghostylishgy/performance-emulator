import { defaultTestId, getTestDefinition } from '../../config/test-registry'
import type { EvaluationResult, PairCodeResult, PairRelationship, PersonaId, ResultViewModel } from '../../config/v3-types'
import { createResultViewModel, evaluateComplete } from '../../domain/v3-evaluation'
import { encodePairCode, normalizePairCode, pairCodeErrorMessage, resolvePairRelationship } from '../../domain/v3-pairing'
import { analytics } from '../../platform/analytics'
import {
  createPosterImage,
  createRelationshipPosterModel,
  createSinglePosterModel,
  savePosterToAlbum,
} from '../../platform/poster'
import type { PosterModel } from '../../platform/poster'
import { recoverCorruptProgress } from '../../platform/progress-recovery'
import { appendPairCode, createRelationshipShareMessage, createShareMessage } from '../../platform/sharing'
import { clearPendingPairCode, clearProgress, loadPendingPairCode, loadProgress } from '../../platform/storage'

const definition = getTestDefinition(defaultTestId)
let evaluation: EvaluationResult | null = null
let viewModel: ResultViewModel | null = null
let resultTimers: Array<ReturnType<typeof setTimeout>> = []
let currentCalculationLines: string[] = []
let hasShownOnce = false

interface RelationshipView extends PairRelationship {
  ownPersonaName: string
  peerPersonaName: string
}

function personaName(personaId: PersonaId): string {
  const configured = definition.personas.find((item) => item.id === personaId)?.name
    ?? definition.personas.find((item) => item.id === definition.fallbackPersonaId)?.name
  if (!configured) throw new Error('Fallback persona display name is missing')
  return configured
}

function currentPairResult(): PairCodeResult {
  if (!evaluation) throw new Error('Result is not ready')
  return {
    algorithmVersion: definition.pairing.algorithmVersion,
    persona: evaluation.primaryPersona,
    performanceScore: evaluation.finalOutcome,
    deathCause: evaluation.deathCause,
  }
}

function clearResultTimers(): void {
  resultTimers.forEach((timer) => clearTimeout(timer))
  resultTimers = []
}

function schedule(callback: () => void, delay: number): void {
  resultTimers.push(setTimeout(callback, delay))
}

function calculationLines(result: EvaluationResult): string[] {
  const pool = definition.calculation.materialPool
  const start = Math.round(result.baseScore) % pool.length
  const materials = Array.from({ length: definition.calculation.materialLineCount }, (_, offset) => pool[(start + offset) % pool.length]!)
  return [...materials, ...definition.calculation.endingLines]
}

function relationshipView(relationship: PairRelationship, peerPersona: PersonaId): RelationshipView {
  if (!evaluation) throw new Error('Result is not ready')
  return {
    ...relationship,
    ownPersonaName: personaName(evaluation.primaryPersona),
    peerPersonaName: personaName(peerPersona),
  }
}

Page({
  data: {
    ready: false,
    loading: true,
    result: {},
    revealStage: 0,
    resultTransition: { lines: [] },
    activeCalculationLine: '',
    resultLineIndex: 0,
    reflection: definition.reflection,
    reflectionVisible: false,
    pairCode: '',
    pairInput: '',
    pairMessage: '',
    pairMessageTone: '',
    manualPairExpanded: false,
    pairRelationship: null,
    posterSaving: false,
  },
  onLoad() {
    clearResultTimers()
    hasShownOnce = false
    evaluation = null
    viewModel = null
    const stored = loadProgress(definition)
    if (stored.status === 'corrupt') return recoverCorruptProgress(definition)
    if (stored.status !== 'current' || stored.progress.stage !== 'complete') {
      wx.reLaunch({ url: '/pages/home/index' })
      return
    }
    try {
      evaluation = evaluateComplete(definition, stored.progress.answers)
      viewModel = createResultViewModel(definition, evaluation)
      currentCalculationLines = calculationLines(evaluation)
      const pendingPairCode = loadPendingPairCode()
      let pairRelationship: RelationshipView | null = null
      let pairMessage = ''
      if (pendingPairCode) {
        const resolved = resolvePairRelationship(definition, evaluation.primaryPersona, pendingPairCode)
        clearPendingPairCode()
        if (resolved.ok) {
          pairRelationship = relationshipView(resolved.relationship, resolved.peer.persona)
          analytics.track('pair_resolve', { testId: definition.id, relation: resolved.relationship.key, source: 'share' })
        }
      }
      this.setData({ result: viewModel, resultTransition: { lines: currentCalculationLines }, pairInput: '', pairRelationship, pairMessage })
      this.playCalculation()
    } catch {
      recoverCorruptProgress(definition)
    }
  },
  onShow() {
    if (!hasShownOnce) {
      hasShownOnce = true
      return
    }
    if (this.data.loading) this.playCalculation()
    else if (this.data.ready && Number(this.data.revealStage) < 3) this.setData({ revealStage: 3 })
  },
  onHide() {
    clearResultTimers()
  },
  onUnload() {
    clearResultTimers()
    hasShownOnce = false
    evaluation = null
    viewModel = null
    currentCalculationLines = []
  },
  playCalculation() {
    clearResultTimers()
    const lines = currentCalculationLines
    const interval = definition.calculation.durationMs / Math.max(1, lines.length)
    this.setData({
      loading: true,
      ready: false,
      revealStage: 0,
      resultLineIndex: 0,
      activeCalculationLine: lines[0] ?? '',
    })
    lines.slice(1).forEach((line, offset) => {
      schedule(() => this.setData({ resultLineIndex: offset + 1, activeCalculationLine: line }), interval * (offset + 1))
    })
    schedule(() => {
      this.setData({ loading: false, ready: true, revealStage: 1 })
      analytics.track('final_result_view', {
        testId: definition.id,
        testVersion: definition.version,
        outcome: evaluation?.finalOutcome,
        persona: evaluation?.primaryPersona,
      })
      schedule(() => this.setData({ revealStage: 2 }), 650)
      schedule(() => this.setData({ revealStage: 3 }), 1400)
    }, definition.calculation.durationMs)
  },
  revealScore() {
    if (Number(this.data.revealStage) < 3) return
    this.setData({ revealStage: 4 })
  },
  shareIntent() {
    analytics.track('share_tap', { testId: definition.id, outcome: evaluation?.finalOutcome })
    this.revealReflection()
  },
  revealReflection() {
    if (this.data.reflectionVisible) return
    this.setData({ reflectionVisible: true })
    analytics.track('reflection_view', { testId: definition.id })
  },
  closeReflection() { this.setData({ reflectionVisible: false }) },
  noop() { /* Absorb backdrop taps. */ },
  restart() {
    clearProgress(definition.id)
    analytics.track('restart', { testId: definition.id })
    wx.reLaunch({ url: '/pages/home/index' })
  },
  onPairInput(event: any) {
    this.setData({
      pairInput: normalizePairCode(String(event.detail.value ?? '')),
      pairMessage: '',
      pairMessageTone: '',
      pairRelationship: null,
    })
  },
  toggleManualPair() {
    this.setData({ manualPairExpanded: !this.data.manualPairExpanded })
  },
  generatePairCode() {
    if (!evaluation) return
    try {
      const pairCode = encodePairCode(currentPairResult())
      this.setData({ pairCode, pairMessage: '匿名码已在本机生成。', pairMessageTone: 'success' })
      analytics.track('pair_create', { testId: definition.id })
    } catch (error) {
      this.setData({ pairMessage: error instanceof Error ? error.message : '生成失败，请稍后再试。', pairMessageTone: 'error' })
    }
  },
  copyPairCode() {
    const code = String(this.data.pairCode || '')
    if (!code) return
    wx.setClipboardData({ data: code })
  },
  resolvePair() {
    if (!evaluation) return
    const resolved = resolvePairRelationship(definition, evaluation.primaryPersona, String(this.data.pairInput ?? ''))
    if (!resolved.ok) {
      this.setData({ pairRelationship: null, pairMessage: pairCodeErrorMessage(resolved.error), pairMessageTone: 'error' })
      return
    }
    clearPendingPairCode()
    const relation = relationshipView(resolved.relationship, resolved.peer.persona)
    this.setData({
      pairRelationship: relation,
      pairMessage: '',
      pairMessageTone: '',
      manualPairExpanded: false,
    })
    analytics.track('pair_resolve', { testId: definition.id, relation: resolved.relationship.key, source: 'manual' })
  },
  async savePoster(model: PosterModel) {
    if (this.data.posterSaving) return
    this.setData({ posterSaving: true })
    try {
      const tempFilePath = await createPosterImage(this, model)
      const status = await savePosterToAlbum(tempFilePath)
      if (status === 'saved') wx.showToast({ title: '已保存到相册', icon: 'success' })
      if (status === 'failed') wx.showToast({ title: '保存失败，请稍后再试', icon: 'none' })
    } catch {
      wx.showToast({ title: '生成结果卡失败', icon: 'none' })
    } finally {
      this.setData({ posterSaving: false })
    }
  },
  saveSinglePoster() {
    if (!viewModel) return
    return this.savePoster(createSinglePosterModel(viewModel))
  },
  saveRelationshipPoster() {
    const relationship = this.data.pairRelationship as RelationshipView | null
    if (!relationship) return
    return this.savePoster(createRelationshipPosterModel({
      relationship,
      ownPersonaName: relationship.ownPersonaName,
      peerPersonaName: relationship.peerPersonaName,
    }))
  },
  onShareAppMessage(options: { from?: string; target?: { dataset?: { shareMode?: string } } }) {
    this.revealReflection()
    if (!evaluation) return { title: definition.title, path: definition.share.path, imageUrl: '/assets/share-single.png' }
    const inviteFromButton = options?.target?.dataset?.shareMode === 'invite'
    const relationship = this.data.pairRelationship as RelationshipView | null
    const message = !inviteFromButton && relationship
      ? createRelationshipShareMessage(definition, relationship)
      : createShareMessage(definition, evaluation)
    const pairCode = String(this.data.pairCode || encodePairCode(currentPairResult()))
    if (!this.data.pairCode) this.setData({ pairCode })
    return { ...message, path: appendPairCode(message.path, pairCode) }
  },
})
