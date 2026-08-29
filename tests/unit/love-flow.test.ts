import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getProduct, LOVE_ACCIDENT_PRODUCT_ID } from '../../miniprogram/config/products'
import { loveResultCards } from '../../miniprogram/config/tests/love-accident/result-cards'
import { LOVE_PERSONA_IDS } from '../../miniprogram/config/tests/love-accident/types'

describe('love accident mini-program flow', () => {
  it('registers independent home, quiz, and result pages', () => {
    const product = getProduct(LOVE_ACCIDENT_PRODUCT_ID)!
    expect(product.routes).toMatchObject({
      home: '/pages/love-accident/index',
      test: '/pages/love-quiz/index',
      result: '/pages/love-result/index',
    })
    const pages = (JSON.parse(readFileSync('miniprogram/app.json', 'utf8')) as { pages: string[] }).pages
    expect(pages).toEqual(expect.arrayContaining(['pages/love-accident/index', 'pages/love-quiz/index', 'pages/love-result/index']))
  })

  it('reports all required love events and answer duration only through the adapter', () => {
    const home = readFileSync('miniprogram/pages/love-accident/index.ts', 'utf8')
    const quiz = readFileSync('miniprogram/pages/love-quiz/index.ts', 'utf8')
    const result = readFileSync('miniprogram/pages/love-result/index.ts', 'utf8')
    expect(home).toContain("analytics.track('page_view'")
    expect(home).toContain("analytics.track('test_start'")
    expect(quiz).toContain("analytics.track('question_view'")
    expect(quiz).toContain("analytics.track('question_answer'")
    expect(quiz).toContain('duration,')
    expect(quiz).toContain("analytics.track('test_complete'")
    expect(result).toContain("analytics.track('result_view'")
    expect(result).toContain("analytics.track('share_click'")
    expect(result).toContain("analytics.track('retry_click'")
    for (const source of [home, quiz, result]) expect(source).not.toContain('wx.reportEvent')
  })

  it('provides one complete locked result card for every persona', () => {
    expect(Object.keys(loveResultCards)).toEqual([...LOVE_PERSONA_IDS])
    for (const personaId of LOVE_PERSONA_IDS) {
      const card = loveResultCards[personaId]
      expect(card.personaId).toBe(personaId)
      expect(card.personaName).not.toBe('')
      expect(card.headline).not.toBe('')
      expect(card.punchline).not.toBe('')
      expect(card.metrics).toHaveLength(3)
      expect(card.metrics.every((metric) => metric.label.length > 0 && metric.value.length > 0)).toBe(true)
      expect(card.verdict).not.toBe('')
      expect(card.illustrationKey).not.toBe('')
      expect(card.illustrationDescription).not.toBe('')
    }
  })

  it('renders the complete MVP result structure without illustration placeholders', () => {
    const resultMarkup = readFileSync('miniprogram/pages/love-result/index.wxml', 'utf8')
    expect(resultMarkup).toContain('{{resultCard.headline}}')
    expect(resultMarkup).toContain('{{resultCard.punchline}}')
    expect(resultMarkup).toContain('wx:for="{{resultCard.metrics}}"')
    expect(resultMarkup).toContain('{{resultCard.verdict}}')
    expect(resultMarkup).toContain('鉴定成立')
    expect(resultMarkup).not.toMatch(/TODO|图片待补|占位图/)
  })
})
