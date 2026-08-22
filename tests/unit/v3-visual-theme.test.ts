import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import { evaluateComplete } from '../../miniprogram/domain/v3-evaluation'
import { POSTER_COLORS } from '../../miniprogram/platform/poster'
import { createShareMessage } from '../../miniprogram/platform/sharing'
import { allA } from '../fixtures'

const read = (path: string): string => readFileSync(path, 'utf8')

describe('Warm Internal Memo visual system', () => {
  it('locks berry pink, soft violet, warm yellow and cream paper roles', () => {
    const tokens = read('miniprogram/styles/tokens.wxss').toLowerCase()
    expect(tokens).toContain('--color-primary: #e94f87')
    expect(tokens).toContain('--color-secondary: #89658e')
    expect(tokens).toContain('--color-accent: #f0ca6a')
    expect(tokens).toContain('--color-page: #f6f1ea')
    expect(POSTER_COLORS.primary).toBe('#e94f87')
    expect(POSTER_COLORS.secondary).toBe('#89658e')
    expect(POSTER_COLORS.accent).toBe('#f0ca6a')
    const runtimeTheme = [
      read('miniprogram/app.wxss'), read('miniprogram/pages/home/index.wxss'),
      read('miniprogram/pages/quiz/index.wxss'), read('miniprogram/pages/result/index.wxss'),
      read('miniprogram/config/tests/performance-simulator/index.ts'),
    ].join('\n').toLowerCase()
    for (const retired of ['#ff4d8d', '#b16cff', '#f7f6fa']) expect(runtimeTheme).not.toContain(retired)
  })

  it('ships deterministic local 5:4 thumbnails for single and relationship sharing', () => {
    for (const name of ['share-single.png', 'share-relationship.png']) {
      const image = readFileSync(`miniprogram/assets/${name}`)
      expect(image.subarray(1, 4).toString()).toBe('PNG')
      expect(image.readUInt32BE(16)).toBe(750)
      expect(image.readUInt32BE(20)).toBe(600)
    }
    expect(createShareMessage(definition, evaluateComplete(definition, allA)).imageUrl).toBe('/assets/share-single.png')
  })

  it('keeps decorative system language subordinate to the Chinese result structure', () => {
    const result = read('miniprogram/pages/result/index.wxml')
    expect(result).toContain('RESULT CONFIRMED')
    expect(result).toContain('ORGANIZATION REVIEWED')
    expect(result).toContain('CALCULATION COMPLETE')
    expect(result.indexOf('{{result.personaName}}')).toBeLessThan(result.indexOf('{{result.outcome}}'))
  })
})
