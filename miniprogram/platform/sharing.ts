import type { EvaluationResult, PairRelationship, V3TestDefinition } from '../config/v3-types'

export function createShareMessage(definition: V3TestDefinition, result: EvaluationResult): { title: string; path: string } {
  const personaName = definition.personas.find((item) => item.id === result.primaryPersona)?.name
    ?? definition.personas.find((item) => item.id === definition.fallbackPersonaId)?.name
  if (!personaName) throw new Error('Fallback persona display name is missing')
  return {
    title: definition.share.titleTemplate
      .replace('{outcome}', result.finalOutcome)
      .replace('{persona}', personaName),
    path: definition.share.path,
  }
}

export function createRelationshipShareMessage(
  definition: V3TestDefinition,
  relationship: PairRelationship,
): { title: string; path: string } {
  return {
    title: `系统说我们两个属于「${relationship.title}」`,
    path: definition.share.path,
  }
}

export function appendPairCode(path: string, pairCode: string): string {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}pairCode=${encodeURIComponent(pairCode)}`
}

