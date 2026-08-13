import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator/index'

describe('presentation pacing contracts', () => {
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
})
