import { performanceSimulator as definition } from '../miniprogram/config/tests/performance-simulator'
import { evaluateComplete } from '../miniprogram/domain/evaluation-pipeline'

function answers(letters: string) {
  if (letters.length !== 16) throw new Error(`${letters} has ${letters.length} letters`)
  return Object.fromEntries([...letters].map((letter, index) => [`Q${index + 1}`, letter]))
}

const vectors: Record<string, string> = {
  allD: 'DDDDDDDDDDDDDDDD',
  legend1: 'AAAAAAAAABAAAAAA',
  legend2: 'ABAAAAAAABAAAAAA',
  technical: 'AAABDCDCAABDABBB',
  orgExpert: 'BBCBBBBBBBBBBBBB',
  orgExpert2: 'BBCCBBBBBBBBBBBB',
  orgExpert3: 'ABCCBBBBBBBBBBBB',
  solo: 'AAABBAAAAABAABBB',
  legacy: 'AAADAAAAAADDABBB',
  low: 'DDDCDDDDDDCDCCCC',
  stable1: 'CCCCCCCCCCCCBBBB',
  stable2: 'CCCCCCCCCCCCCCCC',
  stable3: 'BBBBCCCCCCCCBBBB',
}

for (const [name, letters] of Object.entries(vectors)) {
  const result = evaluateComplete(definition, answers(letters))
  console.log(name, letters, {
    p: result.performanceIndex,
    base: result.baseOutcome,
    org: result.organizationScore,
    delta: result.calibrationDelta,
    final: result.finalOutcome,
    persona: result.primaryPersona,
    matched: result.matchedPersonas,
    metrics: result.normalizedMetrics,
    evidence: result.personaEvidence,
  })
}

let seed = 2463534242
let foundStable = false
let foundUpStory = false
for (let attempt = 0; attempt < 100_000; attempt += 1) {
  let letters = ''
  for (let index = 0; index < 16; index += 1) {
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    letters += 'ABCD'[(seed >>> 0) % 4]
  }
  const result = evaluateComplete(definition, answers(letters))
  if (!foundStable && result.primaryPersona === 'steady-ox' && result.performanceIndex >= 50 && result.performanceIndex < 62) {
    console.log('stableFound', letters, result.performanceIndex, result.organizationScore, result.normalizedMetrics)
    foundStable = true
  }
  if (!foundUpStory && result.baseOutcome === '3.5' && result.calibrationDelta === 1 && result.finalOutcome === '3.5+' && result.signals.length === 0) {
    console.log('upStoryFound', letters, result.performanceIndex, result.organizationScore, result.calibrationReason)
    foundUpStory = true
  }
  if (foundStable && foundUpStory) break
}
