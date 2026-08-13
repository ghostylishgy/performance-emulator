import type { TestDefinition } from './types'
import { performanceSimulator } from './tests/performance-simulator'

export const testRegistry: TestDefinition[] = [performanceSimulator]

export function getTestDefinition(testId: string): TestDefinition {
  const definition = testRegistry.find((item) => item.id === testId)
  if (!definition) throw new Error(`Unknown test: ${testId}`)
  return definition
}

export const defaultTestId = performanceSimulator.id

