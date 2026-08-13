import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import { evaluateComplete } from '../../miniprogram/domain/evaluation-pipeline'
import { answersFromLetters } from '../fixtures'

describe('golden evaluation vectors', () => {
  it('keeps the low-presence vector stable', () => {
    const result = evaluateComplete(definition, answersFromLetters('DDDCDDDDDDCDCCCC'))
    expect({
      metrics: result.normalizedMetrics,
      performanceIndex: result.performanceIndex,
      baseOutcome: result.baseOutcome,
      organizationScore: result.organizationScore,
      calibrationDelta: result.calibrationDelta,
      finalOutcome: result.finalOutcome,
      persona: result.primaryPersona,
      hidden: result.hiddenResults,
    }).toMatchInlineSnapshot(`
      {
        "baseOutcome": "3.25",
        "calibrationDelta": -1,
        "finalOutcome": "3.25",
        "hidden": [],
        "metrics": {
          "A": 0,
          "F": 23.53,
          "I": 42.86,
          "K": 23.08,
          "L": 20,
          "O": 35.29,
          "P": 0,
          "R": 14.29,
          "S": 33.33,
          "T": 27.27,
          "V": 9.09,
        },
        "organizationScore": 25.21,
        "performanceIndex": 17.25,
        "persona": "steady-ox",
      }
    `)
  })

  it('keeps the hidden 4.0 vector stable', () => {
    const result = evaluateComplete(definition, answersFromLetters('ABAAAAAAABAAAAAA'))
    expect({
      performanceIndex: result.performanceIndex,
      baseOutcome: result.baseOutcome,
      organizationScore: result.organizationScore,
      calibrationDelta: result.calibrationDelta,
      finalOutcome: result.finalOutcome,
      persona: result.primaryPersona,
      hidden: result.hiddenResults,
    }).toEqual({
      performanceIndex: 79.17,
      baseOutcome: '3.75',
      organizationScore: 89.41,
      calibrationDelta: 1,
      finalOutcome: '4.0',
      persona: 'strategic-lucky',
      hidden: ['organization-legend'],
    })
  })
})
