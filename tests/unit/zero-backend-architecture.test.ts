import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function filesUnder(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name)
    return statSync(path).isDirectory() ? filesUnder(path) : [path]
  })
}

describe('Zero Backend architecture boundary', () => {
  it('has no cloudfunctions runtime or cloud project root', () => {
    expect(existsSync('cloudfunctions')).toBe(false)
    expect(readFileSync('project.config.json', 'utf8')).not.toContain('cloudfunctionRoot')
    expect(existsSync('miniprogram/platform/pairing.ts')).toBe(false)
  })

  it('contains no pairing network request or cloud runtime dependency', () => {
    const runtime = filesUnder('miniprogram')
      .filter((path) => /\.(ts|js|json)$/.test(path))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n')
    for (const forbidden of ['wx.cloud', 'callFunction', 'wx.request', 'wx.uploadFile', 'wx.downloadFile', 'WebSocket']) {
      expect(runtime).not.toContain(forbidden)
    }
    const dependencies = `${readFileSync('package.json', 'utf8')}\n${readFileSync('package-lock.json', 'utf8')}`
    expect(dependencies).not.toContain('wx-server-sdk')
    expect(dependencies).not.toContain('@cloudbase/')
  })
})
