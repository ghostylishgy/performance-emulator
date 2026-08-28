import type { V3TestDefinition } from '../../v3-types'
import { pairRelationships } from './pair-relationships'
import { evidenceSynthesisRules } from './evidence-synthesis'
import { personaTieBreak, personas } from './personas'
import { questions } from './questions'

export const performanceSimulator: V3TestDefinition = {
  id: 'performance-simulator', version: 'v3', evaluationVersion: 'engine-v3',
  title: '大厂绩效模拟器', subtitle: '25题，测测你的工位物种。', description: '哪个像你就点哪个。',
  disclaimer: '仅供职场娱乐，请勿过度认真。',
  resultDisclaimer: '仅供娱乐，不代表真实绩效或职业建议。',
  questions,
  outcomeScale: ['3.25', '3.5-', '3.5', '3.5+', '3.75'],
  outcomeThresholds: [
    { min: 0, outcome: '3.25' }, { min: 42, outcome: '3.5-' }, { min: 50, outcome: '3.5' },
    { min: 67, outcome: '3.5+' }, { min: 77, outcome: '3.75' },
  ],
  outcomeSubtitles: {
    '3.25': '组织正在重新评估你', '3.5-': '努力痕迹明显', '3.5': '稳定核心牛马',
    '3.5+': '老板开始记住你的名字', '3.75': '本轮组织记忆较为清晰', '4.0': '检测到罕见的组织共识',
  },
  organization: {
    values: {
      L: { Q22A: 100, Q22B: 85, Q22C: 60, Q22D: 35, Q24A: 95, Q24B: 80, Q24C: 55, Q24D: 70 },
      S: { Q19A: 100, Q19B: 80, Q19C: 55, Q19D: 25 },
      R: { Q14A: 45, Q14B: 50, Q14C: 90, Q14D: 35, Q21A: 100, Q21B: 60, Q21C: 40, Q21D: 25 },
      N: { Q24A: 70, Q24B: 55, Q24C: 25, Q24D: 10 },
    },
    weights: { L: .35, S: .30, R: .25, N: .10 },
    upThreshold: 78, downThreshold: 42,
    upwardBlockSignals: ['strategy_faded', 'credit_unclear', 'quota_tight'],
  },
  personas, fallbackPersonaId: 'stable_worker', personaTieBreak,
  deathCauseLabels: {
    strategy_faded: '战略突然过期', credit_unclear: '功劳进入公共区域', quota_tight: '名额发生自然现象',
    visibility_lag: '成果被当成自然规律', civilized_boundary: '边界感过于文明', impact_not_enough: '分量还差一点', none: '暂无明显死因',
  },
  deathCauseRecords: {
    strategy_faded: '判定记录：项目按原计划跑完，只是终点线昨晚被连夜拆除了。',
    credit_unclear: '判定记录：活主要由你完成，成果经各级汇报稀释后，已被划定为公摊面积。',
    quota_tight: '判定记录：未发现明显工作缺陷。优秀名额在本周期内发生了物理级收缩。',
    visibility_lag: '判定记录：事情运行得太顺，组织一度认为这件事本来就会自己发生。',
    civilized_boundary: '判定记录：不抢未认领之功，不甩无主之锅；在本周期的绩效现场里，显得过分体面。',
    impact_not_enough: '判定记录：工作密度已达 100%，距离让大领导眼前一黑又一亮，还差一次戏剧性机缘。',
    none: '判定记录：本周期未检出致命硬伤。系统建议保持当前姿态，切勿主动加戏。',
  },
  mascotSignalNotes: { credit_unclear: '干活有你，合影没你。行，我记着了。' },
  evidenceSynthesisRules,
  pairRelationships,
  calculation: {
    materialPool: [
      '正在统计确实干过的活……',
      '正在确认哪些活最后还记得是你干的……',
      '正在检查年初的战略现在还算不算战略……',
      '正在参考一些不能写进公式的因素……',
      '正在确认优秀人数……',
      '正在确认优秀名额……',
    ],
    materialLineCount: 2,
    endingLines: ['两项数据存在轻微分歧。', '组织进行了必要的工作……', '计算完成。大概。'],
    durationMs: 3600,
  },
  reflection: {
    title: '最后，系统想认真一句',
    paragraphs: [
      '前面的分数都是假的，工作是真的。',
      '这 25 道题当然不能决定你的真实绩效，更不能定义你的价值。',
      '但如果它让你想起了某个项目、某次汇报，或者某个“我明明做了很多，为什么没人知道”的瞬间——\n那这个小游戏可能也不算完全没用。',
      '做好事情很重要。\n让自己的价值被正确看见，也很重要。',
      '懂得独立判断，也懂得借助组织；\n愿意承担责任，也保留自己的边界。',
      '绩效只是工作的一部分。别让它变成你对自己的全部评价。',
    ],
    footer: '如果你笑完以后，还顺手想起了点什么，这个测试就没白做。', button: '我知道了',
  },
  share: { titleTemplate: '我的绩效结果是 {outcome} · {persona}', path: '/pages/product-entry/index?product_id=performance&source=share' },
  pairing: { codeLength: 5, algorithmVersion: 3 },
  theme: { accent: '#e94f87', background: '#f6f1ea' },
}
