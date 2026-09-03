import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getProduct, TEXTBOOK_DESK_PRODUCT_ID } from '../../miniprogram/config/products'

const root = 'miniprogram/pages/textbook-desk'

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    return statSync(path).isDirectory() ? filesUnder(path) : [path]
  })
}

describe('textbook UI integration scaffold', () => {
  it('reads the public name from the registry instead of hard-coding it in UI', () => {
    expect(getProduct(TEXTBOOK_DESK_PRODUCT_ID)?.title).toBe('第二书包')
    const uiSource = filesUnder(root)
      .filter((file) => /\.(ts|wxml|wxss|json)$/.test(file))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')
    expect(uiSource).not.toContain('第二书包')
  })

  it('keeps every scaffold component isolated inside the textbook subpackage', () => {
    const names = ['semester-header', 'grade-picker', 'textbook-row', 'book-set-summary', 'scaffold-sheet', 'share-landing-hint']
    for (const name of names) {
      const base = `${root}/components/${name}/index`
      for (const extension of ['ts', 'json', 'wxml', 'wxss']) expect(statSync(`${base}.${extension}`).isFile()).toBe(true)
      expect(JSON.parse(readFileSync(`${base}.json`, 'utf8'))).toMatchObject({ component: true, styleIsolation: 'isolated' })
    }
  })

  it('scopes provisional design tokens to the product root and component hosts', () => {
    const tokens = readFileSync(`${root}/styles/tokens.wxss`, 'utf8')
    expect(tokens).toContain('.textbook-desk')
    expect(tokens).toContain(':host')
    for (const token of ['--td-page', '--td-surface', '--td-text', '--td-border', '--td-brand', '--td-preview', '--td-warning', '--td-success', '--td-space-1', '--td-radius-1', '--td-text-body']) {
      expect(tokens).toContain(token)
    }
    expect(readFileSync('miniprogram/app.wxss', 'utf8')).not.toContain('--td-')
  })

  it('keeps business derivation and sensitive platform actions out of the page', () => {
    const page = readFileSync(`${root}/index.ts`, 'utf8')
    for (const forbidden of ['getMonth(', 'primary_6', 'junior_7', 'nextGradeMap', 'wx.setClipboardData', 'wx.setStorageSync', 'buildProductSharePath', 'buildProductShareQuery', 'reportEvent(']) {
      expect(page).not.toContain(forbidden)
    }
    expect(page).toContain('resolveTextbookPageState')
    expect(page).toContain('copyTextbookOfficialUrl')
    expect(page).toContain('shareTextbookBookSet')
  })

  it('does not import textbook UI from the main package or other products', () => {
    const outside = filesUnder('miniprogram')
      .filter((file) => file.endsWith('.ts') && !file.replace(/\\/g, '/').includes('/pages/textbook-desk/'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')
    expect(outside).not.toMatch(/from ['"].*textbook-desk\/(components|styles|ui)/)
  })
})
