import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import { evaluateComplete } from '../../miniprogram/domain/v3-evaluation'
import { POSTER_COLORS } from '../../miniprogram/platform/poster'
import { createShareMessage } from '../../miniprogram/platform/sharing'
import { allA } from '../fixtures'

const read = (path: string): string => readFileSync(path, 'utf8')

function filesUnder(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name)
    return statSync(path).isDirectory() ? filesUnder(path) : [path]
  })
}

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

  it('defines readable semantic contrast tokens alongside the decorative palette', () => {
    const tokens = read('miniprogram/styles/tokens.wxss')
    for (const token of [
      '--color-primary-action:', '--color-primary-ink:', '--color-primary-deep:',
      '--color-text-muted-readable:', '--color-focus:',
    ]) expect(tokens).toContain(token)
    const appCss = read('miniprogram/app.wxss')
    expect(appCss.replace(/\s/g, '')).toContain('.primary-button{color:var(--color-text-inverse);background:var(--color-primary-action)')
    expect(appCss.replace(/\s/g, '')).toContain('.secondary-button{color:var(--color-primary-ink)')
    expect(appCss.replace(/\s/g, '')).toContain('.eyebrow{color:var(--color-primary-ink)')
  })

  it('routes meaningful small text through the readable muted token on every core page', () => {
    const tokens = read('miniprogram/styles/tokens.wxss')
    const readableMuted = (tokens.match(/--color-text-muted-readable:\s*(#[0-9a-fA-F]{6})/) ?? ['', ''])[1] ?? ''
    expect(readableMuted.toLowerCase()).toBe('#6e686d')
    expect(readableMuted.toLowerCase()).not.toBe(
      ((tokens.match(/--color-text-muted:\s*(#[0-9a-fA-F]{6})/) ?? ['', ''])[1] ?? '').toLowerCase(),
    )
    for (const path of [
      'miniprogram/pages/home/index.wxss',
      'miniprogram/pages/quiz/index.wxss',
      'miniprogram/pages/result/index.wxss',
    ]) expect(read(path)).toContain('var(--color-text-muted-readable)')
  })

  it('ships a light spacing and typography scale and applies it to core surfaces', () => {
    const tokens = read('miniprogram/styles/tokens.wxss')
    for (const token of ['--space-xs:', '--space-sm:', '--space-md:', '--space-lg:', '--space-xl:', '--space-2xl:']) {
      expect(tokens).toContain(token)
    }
    for (const token of ['--text-caption:', '--text-body:', '--text-subtitle:', '--text-title:', '--text-headline:', '--text-display:']) {
      expect(tokens).toContain(token)
    }
    for (const leading of ['--leading-tight:', '--leading-snug:', '--leading-normal:']) {
      expect(tokens).toContain(leading)
    }
    for (const path of [
      'miniprogram/app.wxss',
      'miniprogram/pages/home/index.wxss',
      'miniprogram/pages/result/index.wxss',
      'miniprogram/components/question-card/index.wxss',
      'miniprogram/components/progress/index.wxss',
    ]) {
      expect(read(path)).toMatch(/var\(--space-(xs|sm|md|lg|xl|2xl)\)/)
    }
    expect(read('miniprogram/app.wxss')).toContain('font-size: var(--text-body)')
  })

  it('retires page-wide English system labels and keeps at most two per page', () => {
    const pages: Array<[string, string]> = [
      ['home', read('miniprogram/pages/home/index.wxml')],
      ['quiz', read('miniprogram/pages/quiz/index.wxml')],
      ['result', read('miniprogram/pages/result/index.wxml')],
    ]
    const retired = [
      'ORGANIZATION REVIEWED', 'PERFORMANCE RECORD', 'CALCULATION COMPLETE', 'CALCULATION ENGINE',
      'COLLEAGUE PROTOCOL', 'RELATIONSHIP REVIEWED', 'SYSTEM MESSAGE', 'LOCAL ONLY', 'INTERNAL REVIEW',
      'SYSTEM BOOTING', 'BEFORE WE START', 'PERFORMANCE REVIEW BETA', 'FILE · V3',
    ]
    for (const [page, markup] of pages) {
      for (const label of retired) expect(markup.includes(label), `${page} should retire "${label}"`).toBe(false)
    }
    const resultMarkup = pages[2] ?? ['', '']
    const homeMarkup = pages[0] ?? ['', '']
    expect(resultMarkup[1]).toContain('RESULT CONFIRMED')
    expect(homeMarkup[1]).toContain('INTERNAL ONLY')
    const resultWatermark = read('miniprogram/pages/result/index.wxss')
    expect(resultWatermark).toContain('content:"INTERNAL ONLY"')
    for (const [, markup] of pages) {
      const englishTokens = markup.match(/\b[A-Z]{3,}\b/g) ?? []
      expect(englishTokens.length).toBeLessThanOrEqual(3)
    }
  })

  it('keeps poster spines as the brand-only archive ridge language', () => {
    const posterSource = read('miniprogram/platform/poster.ts')
    expect(posterSource).toContain('context.fillRect(0, 0, 9, 600)')
    expect(posterSource).toContain("model.kind === 'single' ? POSTER_COLORS.primary : POSTER_COLORS.secondary")
    const resultCss = read('miniprogram/pages/result/index.wxss')
    for (const stripe of ['border-left:5rpx', 'border-left:7rpx']) expect(resultCss).not.toContain(stripe)
    const homeCss = read('miniprogram/pages/home/index.wxss')
    expect(homeCss).not.toContain('border-left')
  })

  it('keeps canvas colors aligned with the visual tokens and persona over score', () => {
    const tokens = read('miniprogram/styles/tokens.wxss')
    const tokenValue = (name: string): string =>
      (tokens.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`)) ?? ['', ''])[1]?.toLowerCase() ?? ''
    expect(POSTER_COLORS.muted).toBe(tokenValue('--color-text-muted-readable'))
    expect(POSTER_COLORS.inkSecondary).toBe(tokenValue('--color-text-secondary'))
    expect(POSTER_COLORS.page).toBe(tokenValue('--color-page'))
    expect(POSTER_COLORS.card).toBe(tokenValue('--color-card'))
  })

  it('keeps the poster persona title at or above the score weight in the unchanged structure', () => {
    const source = read('miniprogram/platform/poster.ts')
    const singleSection = source.slice(source.indexOf('function drawSinglePoster'), source.indexOf('function drawRelationshipPoster'))
    const titleFont = Number((singleSection.match(/font = '900 (\d+)px sans-serif'[\s\S]*?wrapCanvasText\(context, model\.title/) ?? ['0', '0'])[1] ?? 0)
    const scoreFont = Number((singleSection.match(/FINAL RESULT[\s\S]*?font = '900 (\d+)px sans-serif'[\s\S]*?fillText\(model\.score/) ?? ['0', '0'])[1] ?? 0)
    expect(titleFont).toBeGreaterThanOrEqual(scoreFont)
  })

  it('ships deterministic local 5:4 thumbnails for single and relationship sharing', () => {
    for (const name of ['share-single.png', 'share-relationship.png']) {
      const image = readFileSync(`miniprogram/assets/${name}`)
      expect(image.subarray(1, 4).toString()).toBe('PNG')
      expect(image.readUInt32BE(16)).toBe(750)
      expect(image.readUInt32BE(20)).toBe(600)
    }
    expect(createShareMessage(definition, evaluateComplete(definition, allA))).toEqual(
      expect.objectContaining({ imageUrl: '/assets/share-single.png' }),
    )
  })
})

describe('system font strategy boundary', () => {
  it('uses only reliable system fonts with no local or remote font assets', () => {
    const appCss = read('miniprogram/app.wxss')
    expect(appCss).toContain('-apple-system')
    expect(appCss).toContain('"PingFang SC"')
    const styles = filesUnder('miniprogram').filter((path) => /\.(wxss|ts|wxml)$/.test(path))
    for (const path of styles) {
      const content = read(path)
      expect(content).not.toMatch(/@font-face/i)
      expect(content).not.toMatch(/url\(\s*['"]?[^)]*\.(ttf|otf|woff2?)\)/i)
      expect(content).not.toMatch(/https?:\/\/[^)"'\s]*font/i)
    }
    const fontAssets = filesUnder('miniprogram').filter((path) => /\.(ttf|otf|woff2?)$/i.test(path))
    expect(fontAssets).toEqual([])
    expect(existsSync('miniprogram/fonts')).toBe(false)
  })
})
