export type AnswerId = 'A' | 'B' | 'C' | 'D'
export type Outcome = '3.25' | '3.5-' | '3.5' | '3.5+' | '3.75' | '4.0'
export type NormalOutcome = Exclude<Outcome, '4.0'>
export type Answers = Record<string, AnswerId>
export type EvidenceCategory = 'work_behavior' | 'expression_org' | 'human_moment'

export type PersonaId =
  | 'single_point_failure'
  | 'invisible_contributor'
  | 'result_captioner'
  | 'wild_middleware'
  | 'reality_patcher'
  | 'desk_firewall'
  | 'org_weather_station'
  | 'stable_worker'

export type DeathCauseId =
  | 'strategy_faded'
  | 'credit_unclear'
  | 'quota_tight'
  | 'visibility_lag'
  | 'civilized_boundary'
  | 'impact_not_enough'
  | 'none'

export interface EvidenceConfig {
  text: string
  category: EvidenceCategory
  priority: number
  personaTags: PersonaId[]
  deathTags: DeathCauseId[]
}

export interface QuestionOption {
  id: AnswerId
  text: string
  coefficient: number
  dimensionEffects: Partial<Record<'P' | 'V' | 'I' | 'J' | 'A', number>>
  evidence: EvidenceConfig
}

export interface QuestionDefinition {
  id: string
  text: string
  weight: number
  options: QuestionOption[]
}

export type PersonaCriterion =
  | { kind: 'axisMin'; axis: string; min: number }
  | { kind: 'maxAxisMin'; axes: string[]; min: number }
  | { kind: 'axisSumMin'; axes: string[]; min: number }
  | { kind: 'selectedCountMin'; answers: string[]; min: number }
  | { kind: 'axisDifferenceMin'; leftAxes: string[]; rightAxes: string[]; min: number }
  | { kind: 'anyOf'; criteria: PersonaCriterion[] }

export interface PersonaDefinition {
  id: PersonaId
  name: string
  copy: string
  signals: Record<string, Record<string, number>>
  criteria: PersonaCriterion[]
  coreEvidenceAnswers: string[]
}

export interface PairRelationship {
  key: string
  title: string
  copy: string
}

export interface V3TestDefinition {
  id: string
  version: string
  evaluationVersion: string
  title: string
  subtitle: string
  description: string
  disclaimer: string
  resultDisclaimer: string
  questions: QuestionDefinition[]
  dimensions: Array<{ id: 'P' | 'V' | 'I' | 'J' | 'A'; name: string }>
  outcomeScale: NormalOutcome[]
  outcomeThresholds: Array<{ min: number; outcome: NormalOutcome }>
  outcomeSubtitles: Record<Outcome, string>
  organization: {
    values: Record<'L' | 'S' | 'R' | 'N', Record<string, number>>
    weights: Record<'L' | 'S' | 'R' | 'N', number>
    upThreshold: number
    downThreshold: number
    upwardBlockSignals: DeathCauseId[]
  }
  personas: PersonaDefinition[]
  fallbackPersonaId: 'stable_worker'
  personaTieBreak: PersonaId[]
  deathCauseLabels: Record<DeathCauseId, string>
  pairRelationships: PairRelationship[]
  calculation: { lines: string[]; durationMs: number; pauseAfterLine: number }
  reflection: { title: string; paragraphs: string[]; footer: string; button: string }
  share: { titleTemplate: string; path: string }
  pairing: { codeLength: number; expiresInMs: number }
  theme: { accent: string; background: string }
}

export interface PersonaCandidate {
  id: PersonaId
  scores: Record<string, number>
  evidenceScore: number
  theoreticalMax: number
  confidence: number
  coreEvidenceCount: number
}

export interface SelectedEvidence {
  questionId: string
  optionId: AnswerId
  text: string
  category: EvidenceCategory
}

export interface EvaluationResult {
  testId: string
  testVersion: string
  evaluationVersion: string
  answers: Answers
  baseScore: number
  baseOutcome: NormalOutcome
  dimensions: Record<'P' | 'V' | 'I' | 'J' | 'A', number>
  organizationMetrics: Record<'L' | 'S' | 'R' | 'N', number>
  organizationScore: number
  organizationSignals: DeathCauseId[]
  calibrationDelta: -1 | 0 | 1
  finalOutcome: Outcome
  candidates: PersonaCandidate[]
  primaryPersona: PersonaId
  deathCause: DeathCauseId
  evidence: SelectedEvidence[]
}

export interface ResultViewModel {
  personaId: PersonaId
  personaName: string
  personaCopy: string
  deathCause: DeathCauseId
  deathCauseLabel: string
  evidence: SelectedEvidence[]
  outcome: Outcome
  outcomeSubtitle: string
  baseOutcome: NormalOutcome
  baseScore: number
  organizationScore: number
  calibrationDelta: -1 | 0 | 1
  metricBars: Array<{ id: string; label: string; value: number }>
  resultDisclaimer: string
}

export interface PairResultSnapshot {
  resultId?: string
  persona: PersonaId
  score: Outcome
  deathCause: DeathCauseId
  evaluationVersion: string
}
