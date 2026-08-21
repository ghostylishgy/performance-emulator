import type { EvaluationResult, V3TestDefinition } from '../config/v3-types'

export function createShareMessage(definition: V3TestDefinition, result: EvaluationResult): { title: string; path: string } {
  const personaName = definition.personas.find((item) => item.id === result.primaryPersona)?.name ?? '稳定牛马型'
  return {
    title: definition.share.titleTemplate
      .replace('{outcome}', result.finalOutcome)
      .replace('{persona}', personaName),
    path: definition.share.path,
  }
}

