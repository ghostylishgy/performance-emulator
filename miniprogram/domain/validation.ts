import type { PersonaCriterion, PersonaId, V3TestDefinition } from '../config/v3-types'
import { pairKey } from './v3-pairing'
import { theoreticalMaximum } from './v3-persona'

const duplicateValues = (values: string[]): string[] => values.filter((value, index) => values.indexOf(value) !== index)

function validateCriterion(criterion: PersonaCriterion, axes: Set<string>, answerKeys: Set<string>, path: string, errors: string[]): void {
  if (criterion.kind === 'axisMin' && !axes.has(criterion.axis) && criterion.axis !== '__fallback_only__') errors.push(`${path}: unknown axis ${criterion.axis}`)
  if (criterion.kind === 'maxAxisMin' || criterion.kind === 'axisSumMin') {
    for (const axis of criterion.axes) if (!axes.has(axis)) errors.push(`${path}: unknown axis ${axis}`)
  }
  if (criterion.kind === 'axisDifferenceMin') {
    for (const axis of [...criterion.leftAxes, ...criterion.rightAxes]) if (!axes.has(axis)) errors.push(`${path}: unknown axis ${axis}`)
  }
  if (criterion.kind === 'selectedCountMin') {
    for (const answer of criterion.answers) if (!answerKeys.has(answer)) errors.push(`${path}: unknown answer ${answer}`)
  }
  if (criterion.kind === 'anyOf') {
    if (!criterion.criteria.length) errors.push(`${path}: anyOf cannot be empty`)
    criterion.criteria.forEach((item, index) => validateCriterion(item, axes, answerKeys, `${path}.anyOf[${index}]`, errors))
  }
}

export function validateTestDefinition(definition: V3TestDefinition): string[] {
  const errors: string[] = []
  if (!definition.id || !definition.version || !definition.evaluationVersion) errors.push('identity fields are required')
  if (definition.questions.length !== 25) errors.push(`expected 25 questions, got ${definition.questions.length}`)
  const questionIds = definition.questions.map((question) => question.id)
  for (const id of duplicateValues(questionIds)) errors.push(`duplicate question id: ${id}`)
  const answerKeys = new Set<string>()
  for (const [index, question] of definition.questions.entries()) {
    if (question.id !== `Q${index + 1}`) errors.push(`unexpected question order at ${question.id}`)
    if (question.options.length !== 4) errors.push(`${question.id}: expected 4 options`)
    for (const option of question.options) {
      const answerKey = `${question.id}${option.id}`
      answerKeys.add(answerKey)
      if (!Number.isFinite(option.coefficient) || option.coefficient < 0 || option.coefficient > 1) errors.push(`${answerKey}: invalid coefficient`)
      if (!option.evidence.text.trim()) errors.push(`${answerKey}: evidence text is required`)
      if (!Number.isFinite(option.evidence.priority)) errors.push(`${answerKey}: evidence priority is invalid`)
    }
  }
  const totalWeight = definition.questions.reduce((sum, question) => sum + question.weight, 0)
  if (totalWeight !== 100) errors.push(`question weights must sum to 100, got ${totalWeight}`)
  const thresholdMins = definition.outcomeThresholds.map((threshold) => threshold.min)
  if (thresholdMins.some((value, index) => index > 0 && value <= thresholdMins[index - 1]!)) errors.push('outcome thresholds must be strictly increasing')
  const orgWeight = Object.values(definition.organization.weights).reduce((sum, weight) => sum + weight, 0)
  if (Math.abs(orgWeight - 1) > 1e-9) errors.push('organization weights must sum to 1')
  for (const [metric, values] of Object.entries(definition.organization.values)) {
    for (const key of Object.keys(values)) if (!answerKeys.has(key)) errors.push(`organization ${metric}: unknown answer ${key}`)
  }
  const personaIds = definition.personas.map((persona) => persona.id)
  for (const id of duplicateValues(personaIds)) errors.push(`duplicate persona id: ${id}`)
  if (!personaIds.includes(definition.fallbackPersonaId)) errors.push('fallback persona is missing')
  const specialPersonaIds = personaIds.filter((id) => id !== definition.fallbackPersonaId)
  if (specialPersonaIds.length !== 7) errors.push(`expected 7 special personas, got ${specialPersonaIds.length}`)
  for (const persona of definition.personas) {
    const axes = new Set(Object.keys(persona.signals))
    for (const [axis, signals] of Object.entries(persona.signals)) {
      for (const [answer, points] of Object.entries(signals)) {
        if (!answerKeys.has(answer)) errors.push(`${persona.id}.${axis}: unknown answer ${answer}`)
        if (!Number.isFinite(points)) errors.push(`${persona.id}.${axis}.${answer}: invalid points`)
      }
    }
    persona.criteria.forEach((criterion, index) => validateCriterion(criterion, axes, answerKeys, `${persona.id}.criteria[${index}]`, errors))
    for (const answer of persona.coreEvidenceAnswers) if (!answerKeys.has(answer)) errors.push(`${persona.id}: unknown core answer ${answer}`)
    if (persona.id !== definition.fallbackPersonaId && theoreticalMaximum(persona) <= 0) errors.push(`${persona.id}: theoretical maximum must be positive`)
  }
  if (definition.personaTieBreak.length !== 7 || new Set(definition.personaTieBreak).size !== 7) errors.push('persona tie-break must list seven unique special personas')
  const expectedPairKeys = new Set<string>()
  const allPersonaIds = personaIds as PersonaId[]
  for (let left = 0; left < allPersonaIds.length; left += 1) {
    for (let right = left; right < allPersonaIds.length; right += 1) expectedPairKeys.add(pairKey(allPersonaIds[left]!, allPersonaIds[right]!))
  }
  const relationshipKeys = definition.pairRelationships.map((relationship) => relationship.key)
  if (relationshipKeys.length !== 36) errors.push(`expected 36 pair relationships, got ${relationshipKeys.length}`)
  for (const key of duplicateValues(relationshipKeys)) errors.push(`duplicate pair relationship: ${key}`)
  for (const key of expectedPairKeys) if (!relationshipKeys.includes(key)) errors.push(`missing pair relationship: ${key}`)
  for (const key of relationshipKeys) if (!expectedPairKeys.has(key)) errors.push(`unknown pair relationship: ${key}`)
  if (definition.calculation.durationMs < 2000 || definition.calculation.durationMs > 3000) errors.push('calculation duration must be 2-3 seconds')
  if (definition.pairing.codeLength !== 6 || definition.pairing.expiresInMs <= 0) errors.push('pairing policy is invalid')
  return errors
}

export function validateTestRegistry(definitions: V3TestDefinition[]): void {
  const errors = definitions.flatMap((definition) => validateTestDefinition(definition).map((error) => `${definition.id}: ${error}`))
  if (errors.length) throw new Error(`Invalid test configuration:\n${errors.map((error) => `- ${error}`).join('\n')}`)
}
