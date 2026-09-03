import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function filesUnder(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name)
    return statSync(path).isDirectory() ? filesUnder(path) : [path]
  })
}

function sizeOf(files: readonly string[]): number {
  return files.reduce((total, file) => total + statSync(file).size, 0)
}

describe('textbook subpackage foundation boundary', () => {
  it('registers a separate textbook subpackage and keeps the unfinished product disabled', () => {
    const app = JSON.parse(readFileSync('miniprogram/app.json', 'utf8')) as { subPackages: Array<{ root: string; pages: string[] }> }
    expect(app.subPackages).toContainEqual({ root: 'pages/textbook-desk', pages: ['index'] })
    const products = readFileSync('miniprogram/config/products.ts', 'utf8')
    expect(products).toContain("product_id: TEXTBOOK_DESK_PRODUCT_ID")
    expect(products).toMatch(/product_id: TEXTBOOK_DESK_PRODUCT_ID,[\s\S]*?enabled: false,[\s\S]*?featured: false/)
  })

  it('keeps all textbook-specific runtime modules inside the textbook subpackage', () => {
    const textbookRoot = resolve('miniprogram/pages/textbook-desk')
    expect(filesUnder(textbookRoot).some((file) => file.endsWith('catalog.ts'))).toBe(true)
    const outsideTypescript = filesUnder('miniprogram')
      .filter((file) => file.endsWith('.ts') && !resolve(file).startsWith(textbookRoot))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')
    expect(outsideTypescript).not.toMatch(/from ['"].*pages\/textbook-desk/)
  })

  it('leaves meaningful filesystem headroom in every current package', () => {
    const all = filesUnder('miniprogram')
    const loveRoot = resolve('miniprogram/pages/love-result')
    const textbookRoot = resolve('miniprogram/pages/textbook-desk')
    const love = all.filter((file) => resolve(file).startsWith(loveRoot))
    const textbook = all.filter((file) => resolve(file).startsWith(textbookRoot))
    const main = all.filter((file) => !love.includes(file) && !textbook.includes(file))
    expect(sizeOf(main)).toBeLessThan(1.5 * 1024 * 1024)
    expect(sizeOf(love)).toBeLessThan(1.5 * 1024 * 1024)
    expect(sizeOf(textbook)).toBeLessThan(0.25 * 1024 * 1024)
  })

  it('contains no textbook backend, crawler, PDF, cover, or web-view implementation', () => {
    const runtime = filesUnder('miniprogram/pages/textbook-desk')
      .filter((file) => /\.(ts|js|json|wxml)$/.test(file))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')
    for (const forbidden of ['wx.request', 'wx.downloadFile', 'wx.cloud', '<web-view', 'Playwright', 'pdfurl', 'thumb', 'Math.random']) {
      expect(runtime).not.toContain(forbidden)
    }
  })
})
