import type { V3TestDefinition } from './v3-types'
// WeChat's module loader does not resolve a directory import to index.js.
import { performanceSimulator } from './tests/performance-simulator/index'

export const testRegistry: V3TestDefinition[] = [performanceSimulator]

export function getTestDefinition(testId: string): V3TestDefinition {
  const definition = testRegistry.find((item) => item.id === testId)
  if (!definition) throw new Error(`Unknown test: ${testId}`)
  return definition
}

export const defaultTestId = performanceSimulator.id
