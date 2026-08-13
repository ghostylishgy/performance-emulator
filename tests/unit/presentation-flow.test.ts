import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator/index'

describe('presentation pacing contracts', () => {
  it('keeps the productized brand and entertainment-first calls to action', () => {
    const home = readFileSync('miniprogram/pages/home/index.wxml', 'utf8')
    const result = readFileSync('miniprogram/pages/result/index.wxml', 'utf8')
    expect(home).toContain('烛龙实验室｜绩效内测会')
    expect(home).toContain('PERFORMANCE REVIEW BETA')
    expect(home).toContain('开始打分')
    expect(home).toContain('接着打')
    expect(result).toContain('发给同事看看')
    expect(result).toContain('我不服，再测一次')
  })

  it('keeps the opening lightweight and skippable', () => {
    const homeLogic = readFileSync('miniprogram/pages/home/index.ts', 'utf8')
    const home = readFileSync('miniprogram/pages/home/index.wxml', 'utf8')
    expect(homeLogic).toContain('1050')
    expect(home).toContain('bindtap="skipOpening"')
    expect(home).toContain('员工档案未找到。')
  })

  it('requires manual chapter continuation and slower staged processing', () => {
    expect(definition.chapters[0]?.transition?.continueLabel).toBe('进入第二幕')
    expect(definition.chapters[1]?.transition?.continueLabel).toBe('进入第三幕')
    expect(definition.organizationTransition.durationMs).toBeGreaterThanOrEqual(3000)
    expect(definition.resultTransition.durationMs).toBeGreaterThanOrEqual(2500)
  })

  it('gates the reflection card behind share intent', () => {
    const page = readFileSync('miniprogram/pages/result/index.wxml', 'utf8')
    expect(page).toContain('wx:if="{{reflectionVisible}}"')
    expect(page).toContain('bindtap="shareIntent"')
    expect(page.indexOf('<reflection-card')).toBeGreaterThan(page.indexOf('wx:if="{{reflectionVisible}}"'))
  })

  it('allows only the explicit acknowledgement button to close the reflection', () => {
    const page = readFileSync('miniprogram/pages/result/index.wxml', 'utf8')
    const closeBindings = page.match(/bindtap="closeReflection"/g) ?? []
    expect(closeBindings).toHaveLength(1)
    expect(page).toContain('<button class="reflection-close" bindtap="closeReflection">我知道了</button>')
    expect(page).toContain('class="reflection-backdrop" catchtap="noop"')
  })

  it('preserves the locked reflection copy', () => {
    const source = readFileSync('miniprogram/config/tests/performance-simulator/index.ts', 'utf8')
    expect(source).toContain("title: '最后，系统想认真一句'")
    expect(source).toContain('前面的分数都是假的，工作是真的。')
    expect(source).toContain('绩效只是工作的一部分。别让它变成你对自己的全部评价。')
    expect(source).toContain('如果这个测试除了让你笑了一下，还让你想了一下，那我们就算多赚到了。')
  })

  it('recovers invalid result progress without redirecting back to the quiz', () => {
    const page = readFileSync('miniprogram/pages/result/index.ts', 'utf8')
    expect(page).toContain("title: '进度异常'")
    expect(page).toContain('clearProgress(definition.id)')
    expect(page).toContain("wx.reLaunch({ url: '/pages/home/index' })")
    expect(page).not.toContain('wx.redirectTo')
  })
})
