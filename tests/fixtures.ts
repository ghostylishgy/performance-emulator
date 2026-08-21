import { performanceSimulator as definition } from '../miniprogram/config/tests/performance-simulator'
import type { AnswerId, Answers } from '../miniprogram/config/v3-types'

export function answersFromLetters(letters: string): Answers {
  const compact = letters.replace(/\s+/g, '')
  if (compact.length !== 25) throw new Error(`Expected 25 answers, got ${compact.length}`)
  return Object.fromEntries([...compact].map((letter, index) => [`Q${index + 1}`, letter as AnswerId]))
}

export function repeatedAnswers(option: AnswerId): Answers {
  return Object.fromEntries(definition.questions.map((question) => [question.id, option]))
}

export function answersForCoefficient(select: 'min' | 'max'): Answers {
  return Object.fromEntries(definition.questions.map((question) => {
    const sorted = [...question.options].sort((left, right) => left.coefficient - right.coefficient)
    const option = select === 'min' ? sorted[0]! : sorted[sorted.length - 1]!
    return [question.id, option.id]
  }))
}

export const allA = repeatedAnswers('A')
export const allB = repeatedAnswers('B')
export const allC = repeatedAnswers('C')
export const allD = repeatedAnswers('D')
