import type { Answers, QuestionDefinition, SectionId, TestDefinition } from '../config/types'

export interface AggregateResult {
  rawMetrics: Record<string, number>
  signals: string[]
  personaEvidence: Record<string, number>
}

export function questionsForSections(definition: TestDefinition, sections: SectionId[]): QuestionDefinition[] {
  return definition.questions.filter((question) => sections.includes(question.section))
}

export function assertCompleteAnswers(questions: QuestionDefinition[], answers: Answers): void {
  for (const question of questions) {
    const selected = answers[question.id]
    if (!selected || !question.options.some((option) => option.id === selected)) {
      throw new Error(`Missing or invalid answer for ${question.id}`)
    }
  }
}

export function selectAnswers(questions: QuestionDefinition[], answers: Answers): Answers {
  return Object.fromEntries(
    questions
      .filter((question) => answers[question.id] !== undefined)
      .map((question) => [question.id, answers[question.id] as string]),
  )
}

export function aggregateAnswers(questions: QuestionDefinition[], answers: Answers): AggregateResult {
  const rawMetrics: Record<string, number> = {}
  const signalSet = new Set<string>()
  const personaEvidence: Record<string, number> = {}

  for (const question of questions) {
    const selected = answers[question.id]
    if (!selected) continue
    const option = question.options.find((item) => item.id === selected)
    if (!option) throw new Error(`Invalid option ${selected} for ${question.id}`)

    for (const [metric, value] of Object.entries(option.effects)) {
      rawMetrics[metric] = (rawMetrics[metric] ?? 0) + value
    }
    for (const signal of option.signals ?? []) signalSet.add(signal)
    for (const [evidence, value] of Object.entries(option.personaEvidence ?? {})) {
      personaEvidence[evidence] = (personaEvidence[evidence] ?? 0) + value
    }
  }

  return { rawMetrics, signals: [...signalSet].sort(), personaEvidence }
}

