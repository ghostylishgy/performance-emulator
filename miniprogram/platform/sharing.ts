import type { EvaluationResult, PairRelationship, V3TestDefinition } from '../config/v3-types'
import { getProductByTestId } from '../config/products'
import { buildProductSharePath } from './product-routing'

export interface ShareMessage {
  title: string
  path: string
  imageUrl: string
}

function sharePathFor(definition: V3TestDefinition): string {
  const product = getProductByTestId(definition.id)
  if (!product) throw new Error(`No product is registered for test: ${definition.id}`)
  return buildProductSharePath(product.product_id)
}

export function createShareMessage(definition: V3TestDefinition, result: EvaluationResult): ShareMessage {
  const personaName = definition.personas.find((item) => item.id === result.primaryPersona)?.name
    ?? definition.personas.find((item) => item.id === definition.fallbackPersonaId)?.name
  if (!personaName) throw new Error('Fallback persona display name is missing')
  return {
    title: definition.share.titleTemplate
      .replace('{outcome}', result.finalOutcome)
      .replace('{persona}', personaName),
    path: sharePathFor(definition),
    imageUrl: '/assets/share-single.png',
  }
}

export function createRelationshipShareMessage(
  definition: V3TestDefinition,
  relationship: PairRelationship,
): ShareMessage {
  return {
    title: `我俩的牛马组合出结果了：「${relationship.title}」`,
    path: sharePathFor(definition),
    imageUrl: '/assets/share-relationship.png',
  }
}

export function appendPairCode(path: string, pairCode: string): string {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}pairCode=${encodeURIComponent(pairCode)}`
}

