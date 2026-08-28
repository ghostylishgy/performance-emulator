import type { LovePersonaId, LoveResultCardContent } from './types'

// The twelve locked result-card bodies have not been supplied in this repository yet.
// Keeping this typed map empty prevents placeholder copy from becoming production copy.
export const loveResultCards: Partial<Record<LovePersonaId, LoveResultCardContent>> = {}
