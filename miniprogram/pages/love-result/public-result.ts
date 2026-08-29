import { loveAccidentTest } from '../../config/tests/love-accident/index'
import type { LovePersonaId, LoveResultCardContent } from '../../config/tests/love-accident/types'
import { loveShareAssets } from './share-assets'

export interface LovePublicResultData {
  personaId: LovePersonaId
  personaName: string
  resultCard: LoveResultCardContent
  shareImageUrl: string
}

export function getLovePublicResultData(personaId: LovePersonaId): LovePublicResultData | null {
  const persona = loveAccidentTest.personas.find((item) => item.id === personaId)
  if (!persona?.resultCard) return null
  return {
    personaId,
    personaName: persona.resultCard.personaName,
    resultCard: persona.resultCard,
    shareImageUrl: loveShareAssets[personaId].friend,
  }
}
