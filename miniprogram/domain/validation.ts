import type { RuleCondition, TestDefinition } from '../config/types'

const allowedAdSlots = new Set(['home_bottom', 'result_after_primary', 'result_bottom', 'test_hub_inline', 'future_recommendation'])
const allowedLayouts = new Set(['single-card', 'scroll', 'swipe'])
const resultFields = new Set(['baseOutcome', 'performanceIndex', 'organizationScore', 'calibrationDelta', 'genericOutcome', 'finalOutcome'])

function duplicateValues(values: string[]): string[] {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value)
}

function validateCondition(condition: RuleCondition, definition: TestDefinition, path: string, errors: string[]): void {
  if ('all' in condition) {
    if (condition.all.length === 0) errors.push(`${path}: all cannot be empty`)
    condition.all.forEach((item, index) => validateCondition(item, definition, `${path}.all[${index}]`, errors))
    return
  }
  if ('any' in condition) {
    if (condition.any.length === 0) errors.push(`${path}: any cannot be empty`)
    condition.any.forEach((item, index) => validateCondition(item, definition, `${path}.any[${index}]`, errors))
    return
  }
  if ('not' in condition) {
    validateCondition(condition.not, definition, `${path}.not`, errors)
    return
  }
  const { namespace, key } = condition.fact
  if ((namespace === 'normalizedMetric' || namespace === 'rawMetric') && !definition.metrics.some((metric) => metric.id === key)) {
    errors.push(`${path}: unknown metric ${key}`)
  }
  if (namespace === 'signal' && !definition.signalIds.includes(key)) errors.push(`${path}: unknown signal ${key}`)
  if (namespace === 'personaEvidence' && !definition.personaEvidenceIds.includes(key)) errors.push(`${path}: unknown persona evidence ${key}`)
  if (namespace === 'result' && !resultFields.has(key)) errors.push(`${path}: unknown result field ${key}`)
}

export function validateTestDefinition(definition: TestDefinition): string[] {
  const errors: string[] = []
  if (!definition.id.trim()) errors.push('test id is required')
  if (!definition.version.trim()) errors.push('test version is required')
  if (!definition.evaluationVersion.trim()) errors.push('evaluation version is required')
  if (!allowedLayouts.has(definition.quizLayout)) errors.push(`unsupported quizLayout: ${definition.quizLayout}`)

  const chapterIds = definition.chapters.map((chapter) => chapter.id)
  for (const id of duplicateValues(chapterIds)) errors.push(`duplicate chapter id: ${id}`)
  const questionIds = definition.questions.map((question) => question.id)
  for (const id of duplicateValues(questionIds)) errors.push(`duplicate question id: ${id}`)
  const metricIds = definition.metrics.map((metric) => metric.id)
  for (const id of duplicateValues(metricIds)) errors.push(`duplicate metric id: ${id}`)
  const metricMap = new Map(definition.metrics.map((metric) => [metric.id, metric]))
  const chapterQuestionIds = definition.chapters.flatMap((chapter) => chapter.questionIds)
  for (const id of duplicateValues(chapterQuestionIds)) errors.push(`question appears in multiple chapter lists: ${id}`)

  for (const chapter of definition.chapters) {
    for (const questionId of chapter.questionIds) {
      const question = definition.questions.find((item) => item.id === questionId)
      if (!question) errors.push(`chapter ${chapter.id} references unknown question ${questionId}`)
      else if (question.chapterId !== chapter.id) errors.push(`question ${questionId} chapter mismatch`)
    }
  }

  for (const question of definition.questions) {
    const chapter = definition.chapters.find((item) => item.id === question.chapterId)
    if (!chapter) errors.push(`${question.id}: unknown chapter ${question.chapterId}`)
    else {
      if (chapter.section !== question.section) errors.push(`${question.id}: section does not match chapter`)
      if (!chapter.questionIds.includes(question.id)) errors.push(`${question.id}: missing from chapter ${chapter.id} questionIds`)
    }
    if (question.options.length !== 4) errors.push(`${question.id}: expected exactly 4 options`)
    for (const id of duplicateValues(question.options.map((option) => option.id))) errors.push(`${question.id}: duplicate option id ${id}`)
    for (const option of question.options) {
      for (const [metricId, value] of Object.entries(option.effects)) {
        const metric = metricMap.get(metricId)
        if (!metric) errors.push(`${question.id}.${option.id}: unknown metric ${metricId}`)
        else if (!metric.collectFrom.includes(question.section)) errors.push(`${question.id}.${option.id}: ${metricId} cannot collect from ${question.section}`)
        if (!Number.isFinite(value)) errors.push(`${question.id}.${option.id}: non-finite effect for ${metricId}`)
      }
      for (const signal of option.signals ?? []) {
        if (!definition.signalIds.includes(signal)) errors.push(`${question.id}.${option.id}: unknown signal ${signal}`)
      }
      for (const evidence of Object.keys(option.personaEvidence ?? {})) {
        if (!definition.personaEvidenceIds.includes(evidence)) errors.push(`${question.id}.${option.id}: unknown persona evidence ${evidence}`)
      }
    }
  }

  const performanceWeightTotal = Object.values(definition.performanceWeights).reduce((sum, value) => sum + value, 0)
  if (Math.abs(performanceWeightTotal - 1) > 1e-9) errors.push('performanceWeights must sum to 1')
  for (const metric of Object.keys(definition.performanceWeights)) {
    if (metricMap.get(metric)?.role !== 'performance') errors.push(`performanceWeights references non-performance metric ${metric}`)
  }
  const organizationWeightTotal = Object.values(definition.calibrationConfig.weights).reduce((sum, value) => sum + value, 0)
  if (Math.abs(organizationWeightTotal - 1) > 1e-9) errors.push('calibration weights must sum to 1')
  for (const metric of Object.keys(definition.calibrationConfig.weights)) {
    if (!metricMap.has(metric)) errors.push(`calibration weights references unknown metric ${metric}`)
  }
  if (definition.calibrationConfig.downThreshold >= definition.calibrationConfig.upThreshold) errors.push('calibration thresholds must be ordered')

  if (definition.outcomeConfig.scale.includes('4.0' as never)) errors.push('normal outcome scale must not contain 4.0')
  const thresholdMins = definition.outcomeConfig.thresholds.map((band) => band.min)
  for (let index = 1; index < thresholdMins.length; index += 1) {
    if ((thresholdMins[index] ?? 0) <= (thresholdMins[index - 1] ?? 0)) errors.push('outcome thresholds must be strictly increasing')
  }
  for (const band of definition.outcomeConfig.thresholds) {
    if (!definition.outcomeConfig.scale.includes(band.outcome)) errors.push(`threshold outcome ${band.outcome} is not in scale`)
  }

  const personaIds = definition.personas.map((persona) => persona.id)
  for (const id of duplicateValues(personaIds)) errors.push(`duplicate persona id: ${id}`)
  if (!personaIds.includes(definition.fallbackPersonaId)) errors.push('fallback persona does not exist')
  for (const rule of definition.personaRules) {
    if (!personaIds.includes(rule.personaId)) errors.push(`${rule.id}: unknown persona ${rule.personaId}`)
    validateCondition(rule.conditions, definition, `personaRules.${rule.id}`, errors)
  }
  for (const priority of duplicateValues(definition.personaRules.map((rule) => String(rule.priority)))) errors.push(`duplicate persona priority: ${priority}`)

  validateCondition(definition.specialOutcomeConfig.condition, definition, 'specialOutcomeConfig.condition', errors)
  if (definition.specialOutcomeConfig.outcome !== '4.0') errors.push('special outcome must be 4.0')
  if (!definition.hiddenResults.some((item) => item.id === definition.specialOutcomeConfig.hiddenResultId)) errors.push('special hidden result does not exist')

  for (const slot of definition.adSlots) {
    if (!allowedAdSlots.has(slot.key)) errors.push(`unknown ad slot key: ${slot.key}`)
    if (slot.enabled && !slot.unitId) errors.push(`enabled ad slot ${slot.key} requires unitId`)
  }
  for (const key of duplicateValues(definition.adSlots.map((slot) => slot.key))) errors.push(`duplicate ad slot key: ${key}`)

  return errors
}

export function validateTestRegistry(definitions: TestDefinition[]): void {
  const errors: string[] = []
  for (const id of duplicateValues(definitions.map((definition) => definition.id))) errors.push(`duplicate test id: ${id}`)
  for (const definition of definitions) {
    errors.push(...validateTestDefinition(definition).map((error) => `${definition.id}: ${error}`))
  }
  if (errors.length) throw new Error(`Invalid test configuration:\n${errors.map((error) => `- ${error}`).join('\n')}`)
}
