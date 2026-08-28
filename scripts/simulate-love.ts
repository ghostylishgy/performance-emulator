import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { loveAccidentTest } from '../miniprogram/config/tests/love-accident/index'
import { simulateLoveAccident } from '../miniprogram/domain/love-simulation'

const runs = Number(process.argv.find((value) => value.startsWith('--runs='))?.split('=')[1] ?? 100_000)
const seed = Number(process.argv.find((value) => value.startsWith('--seed='))?.split('=')[1] ?? 20260828)
const output = resolve(process.argv.find((value) => value.startsWith('--output='))?.split('=')[1] ?? 'reports/love-accident-monte-carlo.json')
const report = simulateLoveAccident(loveAccidentTest, runs, seed)
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
