import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

describe('love accident button and viewport contracts', () => {
  it('overrides WeChat v2 button width only inside love pages', () => {
    const app = read('miniprogram/app.wxss')
    const home = read('miniprogram/pages/love-accident/index.wxss')
    const quiz = read('miniprogram/pages/love-quiz/index.wxss')
    const result = read('miniprogram/pages/love-result/index.wxss')

    expect(app).not.toContain("button:not([size='mini'])")
    expect(home).toMatch(/button\.start-button\s*\{[^}]*width:\s*100%\s*!important/)
    expect(home).toMatch(/button\.secondary-action\s*\{[^}]*width:\s*100%\s*!important/)
    expect(quiz).toMatch(/button\.option\s*\{[^}]*width:\s*100%\s*!important/)
    expect(result).toMatch(/button\.share-button, button\.retry-button\s*\{[^}]*width:\s*100%\s*!important/)
  })

  it('lets option text consume the row and keeps back navigation auxiliary', () => {
    const quiz = read('miniprogram/pages/love-quiz/index.wxss')
    expect(quiz).toMatch(/\.option-text\s*\{[^}]*flex:\s*1;[^}]*min-width:\s*0;/)
    expect(quiz).toContain('word-break: break-word;')
    expect(quiz).toMatch(/button\.option:active\s*\{[^}]*translateY\(2rpx\)/)
    expect(quiz).toMatch(/button\.back-button\s*\{[^}]*width:\s*auto\s*!important/)
    expect(quiz).toMatch(/button\.back-button\s*\{[^}]*min-height:\s*44px\s*!important/)
  })

  it('uses valid WXML line structure and reduces only the love home top space', () => {
    const markup = read('miniprogram/pages/love-accident/index.wxml')
    const styles = read('miniprogram/pages/love-accident/index.wxss')
    expect(markup).not.toContain('<br')
    expect(markup).toContain('<view>爱的时候叫宝宝，</view>')
    expect(markup).toContain('<view>分手以后开始找发票。</view>')
    expect(styles).toContain('padding: 40rpx 48rpx calc(48rpx + env(safe-area-inset-bottom));')
    expect(styles).toContain('margin-top: 36rpx;')
  })
})
