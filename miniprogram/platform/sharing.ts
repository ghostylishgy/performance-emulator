import type { EvaluationResult, PairRelationship, V3TestDefinition } from '../config/v3-types'

export interface ShareMessage {
  title: string
  path: string
  imageUrl: string
}

export function createShareMessage(definition: V3TestDefinition, result: EvaluationResult): ShareMessage {
  const personaName = definition.personas.find((item) => item.id === result.primaryPersona)?.name
    ?? definition.personas.find((item) => item.id === definition.fallbackPersonaId)?.name
  if (!personaName) throw new Error('Fallback persona display name is missing')
  return {
    title: definition.share.titleTemplate
      .replace('{outcome}', result.finalOutcome)
      .replace('{persona}', personaName),
    path: definition.share.path,
    imageUrl: '/assets/share-single.png',
  }
}

export function createRelationshipShareMessage(
  definition: V3TestDefinition,
  relationship: PairRelationship,
): ShareMessage {
  return {
    title: `系统说我们两个属于「${relationship.title}」`,
    path: definition.share.path,
    imageUrl: '/assets/share-relationship.png',
  }
}

export function appendPairCode(path: string, pairCode: string): string {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}pairCode=${encodeURIComponent(pairCode)}`
}

