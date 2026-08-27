import type { PersonaDefinition, PersonaId } from '../../v3-types'

const contributionSignals: Record<string, number> = {
  Q1A: 3, Q1B: 2, Q2A: 3, Q2B: 2, Q7A: 2, Q9A: 2, Q9B: 2, Q17A: 3, Q17B: 2, Q17C: 3,
}

export const personas: PersonaDefinition[] = [
  {
    id: 'single_point_failure',
    name: '单点故障型',
    copy: '组织运行时未必写了你的名字，但真出问题时，大家的通讯录会自动想到你。',
    signals: {
      C: { Q4A: 3, Q4B: 2, Q4C: -3, Q4D: 1, Q5D: 1, Q18A: 2, Q18B: 1, Q18C: -3, Q18D: 3, Q22A: 2 },
      D: { Q5A: 3, Q5B: 2, Q17A: 1, Q22A: 2, Q22B: 2 },
      M: { Q4B: 1, Q4D: 1, Q5A: 2, Q5B: 2, Q5D: 3, Q9D: 3, Q18D: 2, Q22A: 2, Q22B: 1, Q22D: -2 },
    },
    criteria: [
      { kind: 'axisMin', axis: 'M', min: 4 },
      { kind: 'maxAxisMin', axes: ['C', 'D'], min: 5 },
      { kind: 'axisSumMin', axes: ['C', 'D', 'M'], min: 11 },
    ],
    coreEvidenceAnswers: ['Q4A', 'Q5A', 'Q5D', 'Q9D', 'Q18D'],
  },
  {
    id: 'invisible_contributor',
    name: '隐形苦劳型',
    copy: '活确实干了，结果也确实有了；只是在组织记忆里，你偶尔被压缩成了“团队”。',
    signals: {
      C: contributionSignals,
      V: { Q13A: -3, Q13B: 2, Q13C: 1, Q13D: 3, Q16A: -3, Q16B: 2, Q16C: 3, Q16D: 3 },
      R: { Q14A: 2, Q14B: 2, Q14C: -2, Q21A: -3, Q21B: 2, Q21C: 3, Q21D: 3, Q22C: 1, Q22D: 2 },
    },
    criteria: [
      { kind: 'axisMin', axis: 'C', min: 5 },
      { kind: 'anyOf', criteria: [{ kind: 'axisMin', axis: 'V', min: 5 }, { kind: 'axisMin', axis: 'R', min: 5 }] },
      { kind: 'axisSumMin', axes: ['V', 'R'], min: 8 },
    ],
    coreEvidenceAnswers: ['Q1A', 'Q2A', 'Q16C', 'Q16D', 'Q21C', 'Q21D'],
  },
  {
    id: 'result_captioner',
    name: '成果字幕师',
    copy: '你做的不是 PPT，是把埋头苦干的散装现场，重新排版成合乎大盘逻辑的汇报奇迹。',
    signals: {
      C: contributionSignals,
      T: { Q12A: 3, Q13A: 3, Q16A: 3, Q14C: 1, Q13D: -3, Q16D: -3 },
      R: { Q12A: 1, Q13A: 2, Q16A: 1, Q14C: 3, Q21A: 3, Q21C: -3, Q21D: -3 },
    },
    criteria: [
      { kind: 'axisMin', axis: 'C', min: 5 },
      { kind: 'axisMin', axis: 'T', min: 5 },
      { kind: 'axisMin', axis: 'R', min: 3 },
    ],
    coreEvidenceAnswers: ['Q1A', 'Q2A', 'Q12A', 'Q13A', 'Q16A', 'Q14C', 'Q21A'],
  },
  {
    id: 'wild_middleware',
    name: '野生中间件',
    copy: '组织架构图里不一定有这条线，但人、信息和事情经常通过你才能真正接起来。',
    signals: {
      R: { Q5C: 3, Q9B: 3, Q10B: 3, Q2B: 1, Q10D: 2, Q15B: 1 },
      L: { Q5C: 2, Q9B: 1, Q10B: 3, Q2C: 2, Q10C: 3, Q10D: 2, Q15B: 2 },
      C: { Q5C: 2, Q9B: 3, Q10B: 2, Q2B: 2, Q10C: 1, Q10D: 1, Q15B: 2 },
    },
    criteria: [
      { kind: 'axisMin', axis: 'R', min: 5 },
      { kind: 'axisMin', axis: 'L', min: 4 },
      { kind: 'axisMin', axis: 'C', min: 4 },
      { kind: 'selectedCountMin', answers: ['Q5C', 'Q9B', 'Q10B'], min: 1 },
    ],
    coreEvidenceAnswers: ['Q5C', 'Q9B', 'Q10B'],
  },
  {
    id: 'reality_patcher',
    name: '现实补丁师',
    copy: '别人还在等正式方案，你已经用最野的路子把现场先跑通了，临了还不忘提醒同事：“先别声张。”',
    signals: {
      W: { Q10D: 3, Q15C: 3, Q17C: 2, Q2A: 1, Q9A: 1 },
      E: { Q17C: 3, Q9A: 1 },
      O: { Q10D: 2, Q15C: 3, Q2A: 2, Q9A: 3 },
    },
    criteria: [
      { kind: 'axisMin', axis: 'W', min: 5 },
      { kind: 'anyOf', criteria: [{ kind: 'axisMin', axis: 'E', min: 3 }, { kind: 'axisMin', axis: 'O', min: 3 }] },
      { kind: 'selectedCountMin', answers: ['Q10D', 'Q15C', 'Q17C'], min: 2 },
    ],
    coreEvidenceAnswers: ['Q10D', 'Q15C', 'Q17C', 'Q9A'],
  },
  {
    id: 'desk_firewall',
    name: '工位防火墙',
    copy: '想把活塞给你，手续必须比报销还齐全。没有明确拍板人和对齐邮件，谁也别想踏进你工位半步。',
    signals: {
      S: { Q2C: 3, Q6A: 3, Q7A: 2, Q8B: 3, Q15A: 3, Q17A: 2, Q17B: 2, Q17D: 1 },
      T: { Q2C: 1, Q8B: 2, Q17B: 2, Q17D: 3 },
      W: { Q2C: 1, Q6A: 2, Q7A: 3, Q8B: 1, Q15A: 2, Q17A: 3, Q17B: 2, Q17D: 1 },
    },
    criteria: [
      { kind: 'axisMin', axis: 'S', min: 6 },
      { kind: 'axisMin', axis: 'W', min: 4 },
      { kind: 'anyOf', criteria: [
        { kind: 'axisMin', axis: 'T', min: 1 },
        { kind: 'selectedCountMin', answers: ['Q2C', 'Q6A', 'Q8B', 'Q15A'], min: 2 },
      ] },
    ],
    coreEvidenceAnswers: ['Q2C', 'Q6A', 'Q8B', 'Q15A'],
  },
  {
    id: 'org_weather_station',
    name: '组织气象台',
    copy: '领导的邮件还没发，你已经从他今天关会议室门的声音里，听懂了下季度的预算。',
    signals: {
      S: { Q12B: 3, Q17B: 2, Q20C: 2, Q3A: 1, Q3B: 1, Q3C: 2, Q3D: 1, Q11A: 1, Q11B: 2, Q11C: 2, Q11D: 1, Q25A: 1, Q25B: 2, Q25C: 2, Q25D: 1 },
      I: { Q12B: 3, Q17B: 3, Q20C: 2, Q3A: 1, Q3B: 2, Q3C: 2, Q3D: 1, Q11A: 2, Q11B: 2, Q11C: 1, Q11D: 2, Q25A: 1, Q25B: 2, Q25C: 2, Q25D: 1 },
      A: { Q12B: 1, Q17B: 2, Q20C: 3, Q3A: 2, Q3B: 1, Q11A: 1, Q11C: 1, Q25A: 2, Q25B: 2, Q25D: 1 },
      O: { Q3B: 1, Q3C: 3, Q3D: 2, Q11B: 1, Q11D: 2, Q25C: 3, Q25D: 1 },
    },
    criteria: [
      { kind: 'axisMin', axis: 'S', min: 4 },
      { kind: 'axisMin', axis: 'I', min: 4 },
      { kind: 'axisMin', axis: 'A', min: 4 },
      { kind: 'axisDifferenceMin', leftAxes: ['I', 'A'], rightAxes: ['O'], min: 6 },
    ],
    coreEvidenceAnswers: ['Q12B', 'Q17B', 'Q20C'],
  },
  {
    id: 'stable_worker',
    name: '稳定牛马型',
    copy: '没有特别离谱的单一属性，胜在稳定、耐用，放进大多数组织环境里都能正常运行。',
    signals: {},
    criteria: [{ kind: 'axisMin', axis: '__fallback_only__', min: 1 }],
    coreEvidenceAnswers: [],
  },
]

export const personaTieBreak: PersonaId[] = [
  'single_point_failure',
  'reality_patcher',
  'wild_middleware',
  'desk_firewall',
  'org_weather_station',
  'result_captioner',
  'invisible_contributor',
]
