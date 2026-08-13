import type { EvaluationResult, TestDefinition } from '../config/types'

export function createShareMessage(definition: TestDefinition, result: EvaluationResult, personaName: string): { title: string; path: string } {
  return {
    title: definition.shareConfig.titleTemplate
      .replace('{outcome}', result.finalOutcome)
      .replace('{persona}', personaName),
    path: definition.shareConfig.path,
  }
}

