import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { performanceSimulator } from '../miniprogram/config/tests/performance-simulator'
import { runSimulation, type SimulationDistribution } from '../miniprogram/domain/simulation'

const args = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const [key, value = ''] = argument.replace(/^--/, '').split('=', 2)
  return [key, value]
}))
const runs = Number(args.runs ?? 100_000)
const seed = Number(args.seed ?? 20260813)
const distribution = (args.distribution ?? 'weighted') as SimulationDistribution
if (!['uniform', 'weighted'].includes(distribution)) throw new Error('distribution must be uniform or weighted')

const report = runSimulation({ definition: performanceSimulator, runs, distribution, seed })
const output = JSON.stringify(report, null, 2)
if (args.output) {
  const outputPath = resolve(args.output)
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `${output}\n`, 'utf8')
  console.log(`Monte Carlo report written to ${outputPath}`)
}
console.log(JSON.stringify({
  metadata: report.metadata,
  baseOutcomeDistribution: report.baseOutcomeDistribution,
  finalOutcomeDistribution: report.finalOutcomeDistribution,
  calibrationDistribution: report.calibrationDistribution,
  fourPointZeroHitRate: report.fourPointZeroHitRate,
  focusCorrelations: report.focusCorrelations,
}, null, 2))

