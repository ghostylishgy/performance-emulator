import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourceRoot = resolve('miniprogram')

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') ? [path] : []
  })
}

function runtimeImports(source: string): string[] {
  return [...source.matchAll(/^import\s+(?!type\b)[\s\S]*?\sfrom\s+['"]([^'"]+)['"]/gm)]
    .map((match) => match[1])
    .filter((value): value is string => Boolean(value?.startsWith('.')))
}

describe('WeChat runtime module paths', () => {
  it('does not rely on Node-style directory index resolution', () => {
    for (const sourcePath of sourceFiles(sourceRoot)) {
      const imports = runtimeImports(readFileSync(sourcePath, 'utf8'))
      for (const specifier of imports) {
        const target = resolve(dirname(sourcePath), specifier)
        expect(existsSync(`${target}.ts`), `${sourcePath}: ${specifier} must point to a concrete TypeScript module`).toBe(true)
      }
    }
  })
})
