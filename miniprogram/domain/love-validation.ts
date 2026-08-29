import { LOVE_PERSONA_IDS, type LoveTestDefinition } from '../config/tests/love-accident/types'

export function validateLoveTestDefinition(definition: LoveTestDefinition): string[] {
  const errors: string[] = []
  if (definition.questions.length !== 16) errors.push(`expected 16 questions, got ${definition.questions.length}`)
  const questionIds = new Set(definition.questions.map((question) => question.id))
  definition.questions.forEach((question, index) => {
    if (question.id !== `Q${index + 1}`) errors.push(`unexpected question order at ${question.id}`)
    if (!question.title.trim() || !question.prompt.trim()) errors.push(`${question.id}: title and prompt are required`)
    if (question.options.map((option) => option.id).join('') !== 'ABCD') errors.push(`${question.id}: options must be ABCD in order`)
    for (const option of question.options) {
      if (!option.text.trim()) errors.push(`${question.id}${option.id}: option text is required`)
      for (const [persona, score] of Object.entries(option.scores)) {
        if (!LOVE_PERSONA_IDS.includes(persona as never)) errors.push(`${question.id}${option.id}: unknown persona ${persona}`)
        if (!Number.isFinite(score) || score < 0) errors.push(`${question.id}${option.id}.${persona}: invalid score`)
      }
    }
  })
  if (definition.personas.length !== LOVE_PERSONA_IDS.length) errors.push(`expected ${LOVE_PERSONA_IDS.length} personas`)
  const personaIds = definition.personas.map((persona) => persona.id)
  if (new Set(personaIds).size !== personaIds.length) errors.push('persona ids must be unique')
  for (const id of LOVE_PERSONA_IDS) if (!personaIds.includes(id)) errors.push(`missing persona ${id}`)
  for (const persona of definition.personas) {
    if (!persona.name.trim()) errors.push(`${persona.id}: name is required`)
    if (!Number.isFinite(persona.baseline) || persona.baseline <= 0) errors.push(`${persona.id}: baseline must be positive`)
    const card = persona.resultCard
    if (!card) {
      errors.push(`${persona.id}: result card is required`)
      continue
    }
    if (card.personaId !== persona.id) errors.push(`${persona.id}: result card personaId mismatch`)
    if (card.personaName !== persona.name) errors.push(`${persona.id}: result card personaName mismatch`)
    if (!card.headline.trim() || !card.punchline.trim() || !card.verdict.trim()) errors.push(`${persona.id}: result card copy is required`)
    if (card.metrics.length !== 3 || card.metrics.some((metric) => !metric.label.trim() || !metric.value.trim())) {
      errors.push(`${persona.id}: result card must contain three complete metrics`)
    }
    if (!card.illustrationKey.trim() || !card.illustrationDescription.trim()) errors.push(`${persona.id}: illustration metadata is required`)
  }
  const ruleIds = definition.combinationRules.map((rule) => rule.id)
  if (new Set(ruleIds).size !== ruleIds.length) errors.push('combination rule ids must be unique')
  for (const rule of definition.combinationRules) {
    if (!rule.conditions.length) errors.push(`${rule.id}: conditions are required`)
    for (const condition of rule.conditions) {
      if (!questionIds.has(condition.questionId)) errors.push(`${rule.id}: unknown question ${condition.questionId}`)
      if (!condition.answers.length) errors.push(`${rule.id}: expected answers are required`)
    }
    for (const [persona, bonus] of Object.entries(rule.bonuses)) {
      if (!LOVE_PERSONA_IDS.includes(persona as never)) errors.push(`${rule.id}: unknown persona ${persona}`)
      if (!Number.isFinite(bonus) || bonus <= 0) errors.push(`${rule.id}.${persona}: bonus must be positive`)
    }
  }
  if (!Number.isFinite(definition.confidenceTieEpsilon) || definition.confidenceTieEpsilon < 0) errors.push('confidence tie epsilon must be non-negative')
  return errors
}

export function assertValidLoveTestDefinition(definition: LoveTestDefinition): void {
  const errors = validateLoveTestDefinition(definition)
  if (errors.length) throw new Error(`Invalid love accident configuration:\n${errors.map((error) => `- ${error}`).join('\n')}`)
}
