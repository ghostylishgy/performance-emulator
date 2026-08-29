import type { LovePersonaId } from '../../config/tests/love-accident/types'

export type LoveShareChannel = 'friend' | 'timeline'

export type LoveShareAssetSet = Record<LoveShareChannel, string>

export const loveShareAssets: Record<LovePersonaId, LoveShareAssetSet> = {
  MOON: {
    friend: '/pages/love-result/assets/share/01_MOON_friend.jpg',
    timeline: '/pages/love-result/assets/share/01_MOON_timeline.jpg',
  },
  AUDIT: {
    friend: '/pages/love-result/assets/share/02_AUDIT_friend.jpg',
    timeline: '/pages/love-result/assets/share/02_AUDIT_timeline.jpg',
  },
  REFUND: {
    friend: '/pages/love-result/assets/share/03_REFUND_friend.jpg',
    timeline: '/pages/love-result/assets/share/03_REFUND_timeline.jpg',
  },
  AI: {
    friend: '/pages/love-result/assets/share/04_AI_friend.jpg',
    timeline: '/pages/love-result/assets/share/04_AI_timeline.jpg',
  },
  PRIVATE: {
    friend: '/pages/love-result/assets/share/05_PRIVATE_friend.jpg',
    timeline: '/pages/love-result/assets/share/05_PRIVATE_timeline.jpg',
  },
  EVIDENCE: {
    friend: '/pages/love-result/assets/share/06_EVIDENCE_friend.jpg',
    timeline: '/pages/love-result/assets/share/06_EVIDENCE_timeline.jpg',
  },
  DD: {
    friend: '/pages/love-result/assets/share/07_DD_friend.jpg',
    timeline: '/pages/love-result/assets/share/07_DD_timeline.jpg',
  },
  DOUBLE: {
    friend: '/pages/love-result/assets/share/08_DOUBLE_friend.jpg',
    timeline: '/pages/love-result/assets/share/08_DOUBLE_timeline.jpg',
  },
  POMP: {
    friend: '/pages/love-result/assets/share/09_POMP_friend.jpg',
    timeline: '/pages/love-result/assets/share/09_POMP_timeline.jpg',
  },
  CARD3: {
    friend: '/pages/love-result/assets/share/10_CARD3_friend.jpg',
    timeline: '/pages/love-result/assets/share/10_CARD3_timeline.jpg',
  },
  FUTURE: {
    friend: '/pages/love-result/assets/share/11_FUTURE_friend.jpg',
    timeline: '/pages/love-result/assets/share/11_FUTURE_timeline.jpg',
  },
  DIGNITY: {
    friend: '/pages/love-result/assets/share/12_DIGNITY_friend.jpg',
    timeline: '/pages/love-result/assets/share/12_DIGNITY_timeline.jpg',
  },
}
