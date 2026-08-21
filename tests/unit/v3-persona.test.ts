import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import type { Answers, PersonaDefinition } from '../../miniprogram/config/v3-types'
import { evaluatePersona, selectPersona, theoreticalMaximum } from '../../miniprogram/domain/v3-persona'

const answers = (...keys: string[]): Answers => Object.fromEntries(keys.map((key) => [key.slice(0, -1), key.slice(-1)])) as Answers
const persona = (id: string) => definition.personas.find((item) => item.id === id)!

describe('V3 independent persona thresholds', () => {
  const positives: Array<[string, Answers]> = [
    ['single_point_failure', answers('Q4A', 'Q5A', 'Q22A')],
    ['invisible_contributor', answers('Q1A', 'Q2A', 'Q13D', 'Q16D', 'Q21D', 'Q22D')],
    ['result_captioner', answers('Q1A', 'Q2A', 'Q12A', 'Q13A')],
    ['wild_middleware', answers('Q5C', 'Q9B', 'Q10B')],
    ['reality_patcher', answers('Q10D', 'Q15C')],
    ['desk_firewall', answers('Q6A', 'Q7A', 'Q8B')],
    ['org_weather_station', answers('Q12B', 'Q17B', 'Q20C')],
  ]

  it.each(positives)('%s has a clear positive example', (id, selected) => {
    expect(evaluatePersona(persona(id), selected)?.id).toBe(id)
  })

  it.each([
    ['single_point_failure', answers('Q4C', 'Q18C', 'Q5A')],
    ['invisible_contributor', answers('Q13D', 'Q16D', 'Q21D')],
    ['result_captioner', answers('Q12A', 'Q13A', 'Q16A', 'Q14C', 'Q21A')],
    ['wild_middleware', answers('Q2B', 'Q10D', 'Q15B')],
    ['reality_patcher', answers('Q10D', 'Q2A', 'Q9A')],
    ['desk_firewall', answers('Q6C', 'Q7C', 'Q15D')],
    ['org_weather_station', answers('Q3C', 'Q25C')],
  ] as Array<[string, Answers]>)('%s rejects its key boundary example', (id, selected) => {
    expect(evaluatePersona(persona(id), selected)).toBeNull()
  })

  it('requires two strong core answers for reality patcher', () => {
    expect(evaluatePersona(persona('reality_patcher'), answers('Q10D', 'Q2A', 'Q9A'))).toBeNull()
    expect(evaluatePersona(persona('reality_patcher'), answers('Q10D', 'Q15C'))).not.toBeNull()
  })

  it('does not let pure overthinking qualify as weather station', () => {
    expect(evaluatePersona(persona('org_weather_station'), answers('Q3C', 'Q25C'))).toBeNull()
  })

  it('does not let inactivity qualify as desk firewall', () => {
    expect(evaluatePersona(persona('desk_firewall'), answers('Q6C', 'Q7C', 'Q15D'))).toBeNull()
  })

  it('requires real contribution for invisible contributor and result captioner', () => {
    expect(evaluatePersona(persona('invisible_contributor'), answers('Q13D', 'Q16D', 'Q21D'))).toBeNull()
    expect(evaluatePersona(persona('result_captioner'), answers('Q12A', 'Q13A', 'Q16A', 'Q14C', 'Q21A'))).toBeNull()
  })

  it('falls back to stable worker when no special persona qualifies', () => {
    expect(selectPersona(definition, {}).primary).toBe('stable_worker')
  })

  it('uses confidence first, then core evidence and the fixed tie-break', () => {
    const first: PersonaDefinition = { id: 'single_point_failure', name: 'a', copy: '', signals: { X: { Q1A: 3 } }, criteria: [{ kind: 'axisMin', axis: 'X', min: 1 }], coreEvidenceAnswers: [] }
    const second: PersonaDefinition = { id: 'reality_patcher', name: 'b', copy: '', signals: { X: { Q1A: 3 } }, criteria: [{ kind: 'axisMin', axis: 'X', min: 1 }], coreEvidenceAnswers: [] }
    const stable = persona('stable_worker')
    const tied = selectPersona({ ...definition, personas: [first, second, stable] }, answers('Q1A'))
    expect(tied.candidates).toHaveLength(2)
    expect(tied.primary).toBe('single_point_failure')
    const secondWithCore = { ...second, coreEvidenceAnswers: ['Q1A'] }
    expect(selectPersona({ ...definition, personas: [first, secondWithCore, stable] }, answers('Q1A')).primary).toBe('reality_patcher')
  })

  it('has a finite, positive theoretical maximum for every special persona', () => {
    expect(Object.fromEntries(definition.personas.filter((entry) => entry.id !== 'stable_worker')
      .map((item) => [item.id, theoreticalMaximum(item)]))).toEqual({
      single_point_failure: 23,
      invisible_contributor: 26,
      result_captioner: 33,
      wild_middleware: 30,
      reality_patcher: 24,
      desk_firewall: 32,
      org_weather_station: 40,
    })
  })
})
