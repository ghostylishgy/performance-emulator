export type SectionId = 'personal' | 'organization'
export type MetricRole = 'performance' | 'trait' | 'environment'
export type MetricVisibility = 'public' | 'hidden'
export type QuizLayout = 'single-card' | 'scroll' | 'swipe'
export type Outcome = '3.25' | '3.5-' | '3.5' | '3.5+' | '3.75' | '4.0'
export type NormalOutcome = Exclude<Outcome, '4.0'>

export interface MetricDefinition {
  id: string
  name: string
  role: MetricRole
  visibility: MetricVisibility
  collectFrom: SectionId[]
}

export interface QuestionOption {
  id: string
  text: string
  effects: Record<string, number>
  signals?: string[]
  personaEvidence?: Record<string, number>
}

export interface QuestionDefinition {
  id: string
  chapterId: string
  section: SectionId
  text: string
  options: QuestionOption[]
}

export interface ChapterDefinition {
  id: string
  section: SectionId
  title: string
  subtitle?: string
  questionIds: string[]
  transition?: {
    title: string
    lines: string[]
    durationMs: number
  }
}

export type FactNamespace =
  | 'normalizedMetric'
  | 'rawMetric'
  | 'signal'
  | 'personaEvidence'
  | 'result'

export interface FactReference {
  namespace: FactNamespace
  key: string
}

export type ComparisonOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in'

export type RuleCondition =
  | { all: RuleCondition[] }
  | { any: RuleCondition[] }
  | { not: RuleCondition }
  | { fact: FactReference; op: ComparisonOperator; value: string | number | boolean | string[] }

export interface PersonaDefinition {
  id: string
  name: string
  copy: string
}

export interface PersonaRule {
  id: string
  priority: number
  personaId: string
  conditions: RuleCondition
  evidence: string
}

export interface AdSlotConfig {
  key: string
  enabled: boolean
  type: 'banner' | 'custom'
  unitId?: string
}

export interface TestDefinition {
  id: string
  version: string
  evaluationVersion: string
  title: string
  subtitle: string
  description: string
  disclaimer: string
  resultDisclaimer: string
  quizLayout: QuizLayout
  chapters: ChapterDefinition[]
  questions: QuestionDefinition[]
  metrics: MetricDefinition[]
  signalIds: string[]
  personaEvidenceIds: string[]
  performanceWeights: Record<string, number>
  outcomeConfig: {
    scale: NormalOutcome[]
    thresholds: Array<{ min: number; outcome: NormalOutcome }>
    subtitles: Record<Outcome, string>
  }
  calibrationConfig: {
    weights: Record<string, number>
    upThreshold: number
    downThreshold: number
    upwardBlockSignals: string[]
    reasonPriority: string[]
    reasons: Record<string, string>
  }
  specialOutcomeConfig: {
    outcome: '4.0'
    condition: RuleCondition
    hiddenResultId: string
  }
  personas: PersonaDefinition[]
  personaRules: PersonaRule[]
  fallbackPersonaId: string
  hiddenResults: Array<{ id: string; title: string; copy: string }>
  organizationTransition: {
    lines: string[]
    disclaimer: string
    durationMs: number
  }
  checkpoint: {
    title: string
    subtitle: string
    backLabel: string
    confirmLabel: string
  }
  reflectionConfig: {
    title: string
    paragraphs: string[]
    footer: string
  }
  shareConfig: {
    titleTemplate: string
    path: string
  }
  adSlots: AdSlotConfig[]
  theme: {
    accent: string
    background: string
  }
}

export type Answers = Record<string, string>

export interface MetricRange {
  min: number
  max: number
}

export interface PersonalEvaluation {
  answers: Answers
  rawMetrics: Record<string, number>
  normalizedMetrics: Record<string, number>
  ranges: Record<string, MetricRange>
  signals: string[]
  personaEvidence: Record<string, number>
  performanceIndex: number
  baseOutcome: NormalOutcome
}

export interface EvaluationResult {
  testId: string
  testVersion: string
  evaluationVersion: string
  answers: Answers
  personalAnswersSnapshot: Answers
  rawMetrics: Record<string, number>
  normalizedMetrics: Record<string, number>
  signals: string[]
  personaEvidence: Record<string, number>
  performanceIndex: number
  baseOutcome: NormalOutcome
  organizationScore: number
  calibrationDelta: -1 | 0 | 1
  calibrationReason: string
  finalOutcome: Outcome
  matchedPersonas: string[]
  primaryPersona: string
  hiddenResults: string[]
}

export interface ResultViewModel {
  outcome: Outcome
  outcomeSubtitle: string
  personaName: string
  personaCopy: string
  baseOutcome: NormalOutcome
  calibrationReason: string
  metricBars: Array<{ id: string; label: string; value: number }>
  hiddenResults: Array<{ id: string; title: string; copy: string }>
  resultDisclaimer: string
}

