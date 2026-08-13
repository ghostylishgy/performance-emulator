import type { Answers } from '../miniprogram/config/types'

export function answersFromLetters(letters: string): Answers {
  const compact = letters.replace(/\s+/g, '')
  if (compact.length !== 16) throw new Error(`Expected 16 answers, got ${compact.length}`)
  return Object.fromEntries([...compact].map((letter, index) => [`Q${index + 1}`, letter]))
}

export const allA = answersFromLetters('AAAAAAAAAAAAAAAA')
export const allB = answersFromLetters('BBBBBBBBBBBBBBBB')
export const allC = answersFromLetters('CCCCCCCCCCCCCCCC')
export const allD = answersFromLetters('DDDDDDDDDDDDDDDD')

