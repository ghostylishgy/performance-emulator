import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { loveShareAssets } from '../../miniprogram/pages/love-result/share-assets'
import { LOVE_PERSONA_IDS } from '../../miniprogram/config/tests/love-accident/types'

const expectedAssets = {
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
} as const

function readJpegDimensions(buffer: Buffer) {
  expect(buffer.subarray(0, 3).toString('hex')).toBe('ffd8ff')
  let offset = 2
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1
      continue
    }
    const marker = buffer[offset + 1]
    if (marker === undefined) break
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2
      continue
    }
    const length = buffer.readUInt16BE(offset + 2)
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) }
    }
    offset += 2 + length
  }
  throw new Error('JPEG dimensions not found')
}

describe('love accident share assets', () => {
  it('maps every locked persona to explicit friend and timeline assets', () => {
    expect(Object.keys(loveShareAssets)).toEqual([...LOVE_PERSONA_IDS])
    expect(loveShareAssets).toEqual(expectedAssets)
    for (const persona of LOVE_PERSONA_IDS) {
      expect(Object.keys(loveShareAssets[persona])).toEqual(['friend', 'timeline'])
    }
  })

  it('keeps the runtime mapping inside the love-result subpackage', () => {
    expect(existsSync('miniprogram/pages/love-result/share-assets.ts')).toBe(true)
    expect(existsSync('miniprogram/config/tests/love-accident/share-assets.ts')).toBe(false)
  })

  it('ships twenty-four distinct JPEG files with channel-correct dimensions', () => {
    const paths = new Set<string>()
    const hashes = new Set<string>()
    for (const persona of LOVE_PERSONA_IDS) {
      for (const channel of ['friend', 'timeline'] as const) {
        const imageUrl = loveShareAssets[persona][channel]
        const filePath = `miniprogram${imageUrl}`
        expect(paths.has(imageUrl), `duplicate path: ${imageUrl}`).toBe(false)
        paths.add(imageUrl)
        expect(existsSync(filePath), filePath).toBe(true)
        const buffer = readFileSync(filePath)
        expect(readJpegDimensions(buffer)).toEqual(channel === 'friend'
          ? { width: 600, height: 480 }
          : { width: 600, height: 600 })
        hashes.add(createHash('sha256').update(buffer).digest('hex'))
      }
    }
    expect(paths.size).toBe(24)
    expect(hashes.size).toBe(24)
  })

  it('keeps all twelve original portrait PNG masters outside miniprogramRoot', () => {
    for (const assets of Object.values(expectedAssets)) {
      const sourceName = assets.friend.split('/').at(-1)!.replace('_friend.jpg', '.png')
      const sourcePath = `source-assets/love-accident/share-original/${sourceName}`
      expect(existsSync(sourcePath), sourcePath).toBe(true)
      const buffer = readFileSync(sourcePath)
      expect(buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      expect(buffer.readUInt32BE(16)).toBe(1086)
      expect(buffer.readUInt32BE(20)).toBe(1448)
    }
    expect(existsSync('source-assets/love-accident/share-original/SHA256SUMS.txt')).toBe(true)
    expect(existsSync('source-assets/love-accident/share-revised/06_EVIDENCE_share_master.png')).toBe(true)
    expect(existsSync('miniprogram/assets/love-accident/share')).toBe(false)
  })

  it('binds both channels to evaluation.final_persona and never changes persona by channel', () => {
    const result = readFileSync('miniprogram/pages/love-result/index.ts', 'utf8')
    const home = readFileSync('miniprogram/pages/love-accident/index.ts', 'utf8')
    expect(result).toContain('imageUrl: loveShareAssets[activePersona].friend')
    expect(result).toContain('imageUrl: loveShareAssets[activePersona].timeline')
    expect(result).toContain('shareImageUrl: loveShareAssets[evaluation.final_persona].friend')
    expect(result).toContain('onShareAppMessage()')
    expect(result).toContain('onShareTimeline()')
    expect(result).not.toMatch(/Math\.random|randomPersona|random_persona|fallbackPersona|fallback_persona/)
    expect(home).not.toContain('loveShareAssets')
  })

  it('renders the selected persona image on the result page', () => {
    const resultView = readFileSync('miniprogram/pages/love-result/index.wxml', 'utf8')
    expect(resultView).toContain('wx:if="{{shareImageUrl}}"')
    expect(resultView).toContain('src="{{shareImageUrl}}"')
  })
})
