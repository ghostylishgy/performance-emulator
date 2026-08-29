import { LOVE_PERSONA_IDS, type LovePersonaId } from './types'

const LOVE_PERSONA_ID_SET: ReadonlySet<string> = new Set(LOVE_PERSONA_IDS)

export function parseLovePublicPersona(value?: string): LovePersonaId | null {
  return typeof value === 'string' && LOVE_PERSONA_ID_SET.has(value)
    ? value as LovePersonaId
    : null
}
