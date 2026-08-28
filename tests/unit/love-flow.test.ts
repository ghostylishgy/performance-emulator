import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getProduct, LOVE_ACCIDENT_PRODUCT_ID } from '../../miniprogram/config/products'

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

  it('keeps locked result copy behind a typed configuration boundary', () => {
    const resultCards = readFileSync('miniprogram/config/tests/love-accident/result-cards.ts', 'utf8')
    expect(resultCards).toContain('Partial<Record<LovePersonaId, LoveResultCardContent>>')
    expect(resultCards).toContain('= {}')
  })
})
