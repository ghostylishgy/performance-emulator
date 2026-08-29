import { existsSync, readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const MASCOTS = ['welcome.png', 'analysis.png', 'result.png'] as const

describe('mascot package assets', () => {
  it('keeps runtime PNGs below the code-quality limit with source copies outside miniprogramRoot', () => {
    for (const name of MASCOTS) {
      const runtimePath = `miniprogram/assets/mascot/${name}`
      const sourcePath = `source-assets/mascot-original/${name}`
      expect(existsSync(runtimePath), runtimePath).toBe(true)
      expect(existsSync(sourcePath), sourcePath).toBe(true)
      expect(statSync(runtimePath).size, runtimePath).toBeLessThanOrEqual(200 * 1024)

      const runtime = readFileSync(runtimePath)
      const source = readFileSync(sourcePath)
      expect(runtime.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      expect(runtime.readUInt32BE(16)).toBe(384)
      expect(runtime.readUInt32BE(20)).toBe(384)
      expect(source.readUInt32BE(16)).toBe(512)
      expect(source.readUInt32BE(20)).toBe(512)
    }
  })
})
