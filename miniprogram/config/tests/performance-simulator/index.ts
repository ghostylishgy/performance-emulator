import { metricDefinitions } from '../../metric-definitions'
import type { QuestionDefinition, TestDefinition } from '../../types'

const questions: QuestionDefinition[] = [
  {
    id: 'Q1', chapterId: 'chapter-1', section: 'personal',
    text: '过去半年，如果只能挑一个项目放在绩效自评的第一页，你更接近下面哪种情况？',
    options: [
      { id: 'A', text: '我负责核心部分，从关键问题到最终结果基本都能说清楚', effects: { P: 3, A: 2, K: 1 } },
      { id: 'B', text: '是团队成果，我扛了其中比较重要的一块', effects: { P: 2, A: 1 } },
      { id: 'C', text: '项目做了不少，但真要挑一个“一说就知道是我的”，一时有点难', effects: { P: 1 } },
      { id: 'D', text: '想了半天，最有成就感的一件事是：它终于结项了', effects: {} },
    ],
  },
  {
    id: 'Q2', chapterId: 'chapter-1', section: 'personal',
    text: '一个重要项目突然出了问题，刚好又在你的专业范围内。你通常会：',
    options: [
      { id: 'A', text: '先把原因和影响判断清楚，拿出解决方案，再同步相关的人', effects: { P: 2, F: 2, A: 3, O: 1 } },
      { id: 'B', text: '先把相关负责人拉齐，确认影响和分工，然后一起把问题解决掉', effects: { P: 2, I: 2, F: 3, A: 2, O: 3 } },
      { id: 'C', text: '先确认一下这块到底是谁负责，避免一上来就把事情接到自己身上', effects: { F: 1, O: 1 } },
      { id: 'D', text: '先翻一下当时的方案和聊天记录，看看这个风险第一次是怎么被写成“问题不大”的', effects: {} },
    ],
  },
  {
    id: 'Q3', chapterId: 'chapter-1', section: 'personal',
    text: '如果你从明天开始突然休假一个月，你手上的工作大概会变成什么样？',
    options: [
      { id: 'A', text: '至少有一两个关键项目会明显受影响', effects: { K: 3 } },
      { id: 'B', text: '同事能接，但前几天应该会频繁找我', effects: { K: 2, F: 2, I: 1 } },
      { id: 'C', text: '提前交接清楚，基本可以正常运转', effects: { K: 1, F: 3, I: 1 } },
      { id: 'D', text: '大概第三周，会有人在群里发一句：“这个谁负责来着？”然后安静五分钟。', effects: {} },
    ],
  },
  {
    id: 'Q4', chapterId: 'chapter-1', section: 'personal',
    text: '工作里，别人最经常因为什么事情来找你？',
    options: [
      { id: 'A', text: '遇到重要问题，需要我判断一下怎么处理', effects: { P: 1, I: 3, K: 2, A: 2 } },
      { id: 'B', text: '有一类专业问题我比较熟，大家习惯先问我', effects: { P: 1, K: 3, A: 1 } },
      { id: 'C', text: '跨部门的事情卡住了，通常会让我帮忙协调一下', effects: { I: 3, O: 3 } },
      { id: 'D', text: '“你还记不记得三年前那个文件 / 项目 / 规则到底是怎么回事？”', effects: { K: 2 }, personaEvidence: { legacy_knowledge: 1 } },
    ],
  },
  {
    id: 'Q5', chapterId: 'chapter-2', section: 'personal',
    text: '你做了一个自己投入挺多的项目，结果也还不错。下次有机会在更大的场合提到这个项目，你通常会：',
    options: [
      { id: 'A', text: '先说结果和业务影响，再说关键动作，最后点一下自己负责的部分。', effects: { V: 3, R: 1 } },
      { id: 'B', text: '先说团队整体怎么推进的，说到自己那块的时候再补充一下。', effects: { V: 2, I: 1 } },
      { id: 'C', text: '从背景开始讲，把来龙去脉、遇到的问题和怎么解决的，尽量讲完整。', effects: { V: 1 } },
      { id: 'D', text: '讲完之后发现，自己用了“我们”十一次，“我”零次。', effects: {} },
    ],
  },
  {
    id: 'Q6', chapterId: 'chapter-2', section: 'personal',
    text: '领导突然问你：“这个项目现在怎么样了？”你通常会：',
    options: [
      { id: 'A', text: '直接说当前进度、结果、主要风险和下一步', effects: { V: 3, F: 3, T: 2 } },
      { id: 'B', text: '先判断他为什么突然问，再决定重点讲什么', effects: { V: 2, F: 2, T: 2, O: 1 } },
      { id: 'C', text: '发一段比较完整的情况说明，最后补一句“总体可控”', effects: { V: 1, F: 1, T: 1 } },
      { id: 'D', text: '先翻一下聊天记录，确认自己上次跟他说到哪儿了', effects: { V: 1 } },
    ],
  },
  {
    id: 'Q7', chapterId: 'chapter-2', section: 'personal',
    text: '一个项目里，你承担了大部分关键工作。汇报会上，领导却重点表扬了另一位同事。你通常会：',
    options: [
      { id: 'A', text: '在后续复盘或汇报里，自然把自己负责的关键部分和结果补充清楚', effects: { V: 2, R: 1 } },
      { id: 'B', text: '会后找领导把项目分工和成果归属对齐一下', effects: { V: 3, R: 1, O: 2 } },
      { id: 'C', text: '算了，事情做好了就行，不想因为这种事显得自己很在意。', effects: {} },
      { id: 'D', text: '当时没说什么。晚上回家以后，那段表扬在脑子里自动重播了好几遍。', effects: {} },
    ],
  },
  {
    id: 'Q8', chapterId: 'chapter-2', section: 'personal',
    text: '年底写个人总结时，你通常更接近哪种状态？',
    options: [
      { id: 'A', text: '很快能列出几个关键成果，并尽量用数据说明结果', effects: { V: 3, R: 1 } },
      { id: 'B', text: '先翻日历、聊天记录和项目文件，再慢慢把这一年做过的事整理出来', effects: { V: 2 } },
      { id: 'C', text: '明明忙了一整年，打开文档后突然不知道该写什么', effects: {} },
      { id: 'D', text: '写了三段之后意识到，每一段的主语都是“团队”。', effects: { V: 1 } },
    ],
  },
  {
    id: 'Q9', chapterId: 'chapter-3', section: 'personal',
    text: '项目会上，领导提出了一个你判断风险不小的方向。你通常会：',
    options: [
      { id: 'A', text: '当场把主要风险讲清楚，同时给出一个可行的替代方案', effects: { A: 3, I: 3, F: 2 } },
      { id: 'B', text: '会上先听完，会后单独和领导沟通自己的判断和建议', effects: { A: 2, I: 2, O: 3, F: 2 } },
      { id: 'C', text: '先做一小段验证，用实际结果确认这个风险到底存不存在', effects: { A: 2, I: 1, P: 2, F: 1 } },
      { id: 'D', text: '当时没说。几个月后会上再次听到这个风险时，突然有一种参与过内测的熟悉感。', effects: {} },
    ],
  },
  {
    id: 'Q10', chapterId: 'chapter-3', section: 'personal',
    text: '一个跨部门事项卡了很久，正常流程一直推不动。你通常更倾向于：',
    options: [
      { id: 'A', text: '把目标、责任人和时间节点重新梳理清楚，按流程重新推进', effects: { O: 1, I: 2, F: 3, A: 2 } },
      { id: 'B', text: '找到真正有决定权的人，直接把问题和需要拍板的事项讲清楚', effects: { O: 3, I: 3, F: 2, A: 2 } },
      { id: 'C', text: '把直属领导拉进来，让这件事突然拥有更高优先级', effects: { O: 3, I: 2, F: 1 } },
      { id: 'D', text: '翻一下通讯录，找一个“刚好跟那边比较熟”的人先帮忙搭个桥', effects: { O: 3, I: 2, F: 2 } },
    ],
  },
  {
    id: 'Q11', chapterId: 'chapter-3', section: 'personal',
    text: '如果公司现在要找一个人接替你手上的工作，你觉得更接近下面哪种情况？',
    options: [
      { id: 'A', text: '得找一个专业能力差不多的人，而且至少熟悉几个月才能真正接住', effects: { K: 3, A: 2, F: 1 } },
      { id: 'B', text: '找到合适的人，把关键事项交接清楚，应该可以比较顺利接手', effects: { K: 2, F: 3, A: 1, O: 1 } },
      { id: 'C', text: '我的工作已经比较标准化，按流程和文档基本可以正常接替', effects: { F: 3, O: 1 } },
      { id: 'D', text: '理论上可以替代，只是暂时没人知道那几个 Excel 为什么不能动第三列', effects: { K: 3 }, personaEvidence: { legacy_knowledge: 1 } },
    ],
  },
  {
    id: 'Q12', chapterId: 'chapter-3', section: 'personal',
    text: '团队碰到一个没人处理过的新问题，也没有现成流程。你通常更接近哪种状态？',
    options: [
      { id: 'A', text: '我会先把问题拆开，给一个初步判断和下一步验证方向', effects: { A: 3, I: 2, K: 2, F: 1 } },
      { id: 'B', text: '我会主动拉上相关的人一起讨论，边补信息边找办法', effects: { A: 2, O: 2, I: 2, F: 1 } },
      { id: 'C', text: '先看谁最接近这个问题的专业范围，该谁接谁先接，我不一定参与', effects: { O: 1 } },
      { id: 'D', text: '群里通常会先安静一会儿，然后出现一句熟悉的：“@你 这个你怎么看？”', effects: { I: 3, K: 3 } },
    ],
  },
  {
    id: 'Q13', chapterId: 'chapter-4', section: 'organization',
    text: '如果让你的直属领导在绩效会上用一句话介绍你，他最可能说：',
    options: [
      { id: 'A', text: '“这块业务基本靠他撑着。”', effects: { L: 3, R: 3, T: 3 } },
      { id: 'B', text: '“很靠谱，重要事情交给他比较放心。”', effects: { L: 3, R: 1, T: 3 } },
      { id: 'C', text: '“能力不错，今年也确实挺辛苦。”', effects: { L: 1, T: 1 } },
      { id: 'D', text: '“他今年参与的事情挺多，整体贡献还是有的……”', effects: { R: -1 }, signals: ['credit_unclear'] },
    ],
  },
  {
    id: 'Q14', chapterId: 'chapter-4', section: 'organization',
    text: '回头看你今年最重要的那个项目，它在公司内部大概处于什么位置？',
    options: [
      { id: 'A', text: '明确的重点项目，领导层持续关注，阶段结果经常会被问到', effects: { S: 3 } },
      { id: 'B', text: '比较重要，部门和相关领导都关注，但还不是最核心的那几个', effects: { S: 2 } },
      { id: 'C', text: '日常业务，做好了是本分，出问题一定会有人注意', effects: { S: 1 } },
      { id: 'D', text: '去年还叫“战略方向”，今年开会已经很少有人提了', effects: { S: 0 }, signals: ['strategy_faded'] },
    ],
  },
  {
    id: 'Q15', chapterId: 'chapter-4', section: 'organization',
    text: '假设部门今年优秀绩效名额很少，几个人表现都不错。你觉得你的直属领导更可能：',
    options: [
      { id: 'A', text: '明确替我争取，而且能说出很充分的理由。', effects: { L: 3, T: 3 } },
      { id: 'B', text: '会替我说话，但最后能不能争下来，也要看组织的情况。', effects: { L: 2, T: 2 } },
      { id: 'C', text: '大概率会放进团队里一起综合平衡，不会特别倾斜。', effects: { L: 1, T: 1 } },
      { id: 'D', text: '找我聊聊，然后说一句：\n“你今年其实真的做得很好……”', effects: { L: 1 }, signals: ['quota_tight'] },
    ],
  },
  {
    id: 'Q16', chapterId: 'chapter-4', section: 'organization',
    text: '绩效季，直属领导突然发来一句：\n“下午有空吗？简单聊两句。”\n你的第一反应更接近：',
    options: [
      { id: 'A', text: '正常绩效沟通，回一句“有的”，等下午再说。', effects: { T: 3 } },
      { id: 'B', text: '顺手在脑子里过了一遍今年几个重点项目和结果。', effects: { T: 2 } },
      { id: 'C', text: '开始回忆他最近跟我说话的语气，有没有什么细微变化。', effects: { T: 1 } },
      { id: 'D', text: '打开招聘软件。但只是随便看看。', effects: { T: 0 } },
    ],
  },
]

export const performanceSimulator: TestDefinition = {
  id: 'performance-simulator',
  version: 'v1',
  evaluationVersion: 'engine-v1',
  title: '大厂绩效模拟器',
  subtitle: '16 道题。前 12 道看你，后 4 道看组织。',
  description: '职场娱乐测试 · 但不保证完全胡说',
  disclaimer: '本测试纯属职场娱乐，不代表任何公司的真实绩效标准。\n测到3.25不必连夜改简历，测到3.75也先别找老板谈晋升。',
  resultDisclaimer: '结果仅供娱乐，请勿据此判断真实绩效、晋升、优化风险或做职业决策。\n真正的绩效，请以老板那句“下午有空吗”之后的内容为准。',
  quizLayout: 'single-card',
  metrics: metricDefinitions,
  signalIds: ['credit_unclear', 'strategy_faded', 'quota_tight'],
  personaEvidenceIds: ['legacy_knowledge'],
  chapters: [
    { id: 'chapter-1', section: 'personal', title: '第一幕 · 活，到底是不是你干的？', questionIds: ['Q1', 'Q2', 'Q3', 'Q4'], transition: { title: '第一轮校验完成', lines: ['活是谁干的，系统大概已经知道了。', '接下来看看老板知不知道。'], continueLabel: '进入第二幕' } },
    { id: 'chapter-2', section: 'personal', title: '第二幕 · 老板知道是你干的吗？', questionIds: ['Q5', 'Q6', 'Q7', 'Q8'], transition: { title: '第二轮校验完成', lines: ['谁干的、谁知道的，系统已经大概有数了。', '接下来看看：如果你明天不来了呢？'], continueLabel: '进入第三幕' } },
    { id: 'chapter-3', section: 'personal', title: '第三幕 · 如果你明天不来了呢？', questionIds: ['Q9', 'Q10', 'Q11', 'Q12'] },
    { id: 'chapter-4', section: 'organization', title: '第四幕 · 欢迎进入绩效校准会', subtitle: '组织努力部分', questionIds: ['Q13', 'Q14', 'Q15', 'Q16'] },
  ],
  questions,
  performanceWeights: { P: 0.28, V: 0.20, I: 0.17, K: 0.20, F: 0.15 },
  outcomeConfig: {
    scale: ['3.25', '3.5-', '3.5', '3.5+', '3.75'],
    thresholds: [
      { min: 0, outcome: '3.25' },
      { min: 43, outcome: '3.5-' },
      { min: 50, outcome: '3.5' },
      { min: 62, outcome: '3.5+' },
      { min: 70, outcome: '3.75' },
    ],
    subtitles: {
      '3.25': '组织正在重新评估你',
      '3.5-': '努力痕迹明显',
      '3.5': '稳定核心牛马',
      '3.5+': '老板开始记住你的名字',
      '3.75': '晋升候选人',
      '4.0': '组织级传说',
    },
  },
  calibrationConfig: {
    weights: { O: 0.15, L: 0.30, S: 0.25, R: 0.20, T: 0.10 },
    upThreshold: 72,
    downThreshold: 35,
    upwardBlockSignals: ['credit_unclear', 'strategy_faded', 'quota_tight'],
    reasonPriority: ['quota_tight', 'strategy_faded', 'credit_unclear'],
    reasons: {
      quota_tight: '优秀名额紧张，组织正在进行一些艰难但熟练的平衡。',
      strategy_faded: '项目战略位置发生变化，本轮未触发向上校准。',
      credit_unclear: '成果归属尚未完全对齐，组织暂未识别全部个人贡献。',
      organization_high: '直属领导与项目位置形成合力，本轮触发向上校准。',
      organization_low: '组织支持与项目位置偏弱，本轮触发向下校准。',
      organization_balanced: '组织完成了校准，并决定暂时维持原判。',
    },
  },
  specialOutcomeConfig: {
    outcome: '4.0',
    hiddenResultId: 'organization-legend',
    condition: {
      all: [
        { fact: { namespace: 'result', key: 'baseOutcome' }, op: 'eq', value: '3.75' },
        { fact: { namespace: 'result', key: 'organizationScore' }, op: 'gte', value: 88 },
        { fact: { namespace: 'normalizedMetric', key: 'L' }, op: 'gte', value: 80 },
        { fact: { namespace: 'normalizedMetric', key: 'S' }, op: 'gte', value: 80 },
        { fact: { namespace: 'normalizedMetric', key: 'R' }, op: 'gte', value: 75 },
        { not: { fact: { namespace: 'signal', key: 'credit_unclear' }, op: 'eq', value: true } },
        { not: { fact: { namespace: 'signal', key: 'strategy_faded' }, op: 'eq', value: true } },
        { not: { fact: { namespace: 'signal', key: 'quota_tight' }, op: 'eq', value: true } },
      ],
    },
  },
  personas: [
    { id: 'invisible-hard-worker', name: '隐形苦劳型', copy: '是金子总会发光。系统提醒：公司不是珠宝鉴定机构。' },
    { id: 'steady-ox', name: '稳定老黄牛', copy: '每年都说“稳定可靠”，怀疑是不是一种诅咒。' },
    { id: 'scapegoat-backbone', name: '背锅型核心骨干', copy: '好消息：领导很信任你。坏消息：出事的时候也非常信任你。' },
    { id: 'technical-island', name: '技术孤岛型', copy: '大家不知道你每天具体做什么，但也没人敢让你离职。' },
    { id: 'legacy-core', name: '历史包袱型核心人才', copy: '不是掌握未来，是记得过去。' },
    { id: 'single-point', name: '单点故障型人才', copy: '组织的容灾方案：你本人。' },
    { id: 'reporting-loop', name: '汇报闭环型', copy: '别人完成工作，你完成目标—动作—成果—复盘—下一步。' },
    { id: 'organization-lubricant', name: '组织润滑剂', copy: '最大优势不是流程，是知道该给谁发微信。' },
    { id: 'ppt-high-potential', name: 'PPT型高潜', copy: '项目完成度68%，项目价值总结完成度127%。' },
    { id: 'strategic-lucky', name: '战略项目幸运儿', copy: '组织今年恰好决定你的方向是对的。' },
    { id: 'edge-survivor', name: '边缘求生型', copy: '每次组织调整都在名单附近，结束后居然还在。' },
    { id: 'quota-victim', name: '名额受害者', copy: '你的绩效没有输给工作表现，输给了 Excel 里那一列百分比。' },
  ],
  personaRules: [
    { id: 'quota-victim', priority: 120, personaId: 'quota-victim', evidence: '高基础绩效因名额因素下调', conditions: { all: [
      { fact: { namespace: 'signal', key: 'quota_tight' }, op: 'eq', value: true },
      { fact: { namespace: 'result', key: 'calibrationDelta' }, op: 'eq', value: -1 },
      { fact: { namespace: 'result', key: 'performanceIndex' }, op: 'gte', value: 62 },
    ] } },
    { id: 'strategic-lucky', priority: 110, personaId: 'strategic-lucky', evidence: '战略项目与领导支持共同上调', conditions: { all: [
      { fact: { namespace: 'normalizedMetric', key: 'S' }, op: 'gte', value: 70 },
      { fact: { namespace: 'normalizedMetric', key: 'L' }, op: 'gte', value: 70 },
      { fact: { namespace: 'result', key: 'calibrationDelta' }, op: 'eq', value: 1 },
    ] } },
    { id: 'legacy-core', priority: 105, personaId: 'legacy-core', evidence: '历史知识证据与高不可替代性', conditions: { all: [
      { fact: { namespace: 'personaEvidence', key: 'legacy_knowledge' }, op: 'gte', value: 1 },
      { fact: { namespace: 'normalizedMetric', key: 'K' }, op: 'gte', value: 60 },
    ] } },
    { id: 'scapegoat-backbone', priority: 100, personaId: 'scapegoat-backbone', evidence: '产出和关键性较高但支持或归属较弱', conditions: { all: [
      { fact: { namespace: 'normalizedMetric', key: 'P' }, op: 'gte', value: 55 },
      { fact: { namespace: 'normalizedMetric', key: 'K' }, op: 'gte', value: 60 },
      { any: [
        { fact: { namespace: 'normalizedMetric', key: 'R' }, op: 'lte', value: 40 },
        { fact: { namespace: 'normalizedMetric', key: 'L' }, op: 'lte', value: 35 },
      ] },
    ] } },
    { id: 'invisible-hard-worker', priority: 90, personaId: 'invisible-hard-worker', evidence: '产出明显高于可见度', conditions: { all: [
      { fact: { namespace: 'normalizedMetric', key: 'P' }, op: 'gte', value: 60 },
      { fact: { namespace: 'normalizedMetric', key: 'V' }, op: 'lte', value: 40 },
    ] } },
    { id: 'single-point', priority: 85, personaId: 'single-point', evidence: '不可替代性极高且适配度有限', conditions: { all: [
      { fact: { namespace: 'normalizedMetric', key: 'K' }, op: 'gte', value: 85 },
      { fact: { namespace: 'normalizedMetric', key: 'F' }, op: 'lte', value: 55 },
    ] } },
    { id: 'technical-island', priority: 80, personaId: 'technical-island', evidence: '不可替代性高但组织杠杆较低', conditions: { all: [
      { fact: { namespace: 'normalizedMetric', key: 'K' }, op: 'gte', value: 70 },
      { fact: { namespace: 'normalizedMetric', key: 'O' }, op: 'lte', value: 40 },
    ] } },
    { id: 'ppt-high-potential', priority: 75, personaId: 'ppt-high-potential', evidence: '可见度较高而产出偏低', conditions: { all: [
      { fact: { namespace: 'normalizedMetric', key: 'V' }, op: 'gte', value: 65 },
      { fact: { namespace: 'normalizedMetric', key: 'P' }, op: 'lte', value: 50 },
    ] } },
    { id: 'organization-lubricant', priority: 70, personaId: 'organization-lubricant', evidence: '影响力与组织杠杆均高', conditions: { all: [
      { fact: { namespace: 'normalizedMetric', key: 'I' }, op: 'gte', value: 65 },
      { fact: { namespace: 'normalizedMetric', key: 'O' }, op: 'gte', value: 65 },
    ] } },
    { id: 'reporting-loop', priority: 65, personaId: 'reporting-loop', evidence: '成果可见度与适配度较高', conditions: { all: [
      { fact: { namespace: 'normalizedMetric', key: 'V' }, op: 'gte', value: 70 },
      { fact: { namespace: 'normalizedMetric', key: 'F' }, op: 'gte', value: 60 },
    ] } },
    { id: 'edge-survivor', priority: 50, personaId: 'edge-survivor', evidence: '低基础区间仍保持组织位置', conditions: { all: [
      { fact: { namespace: 'result', key: 'baseOutcome' }, op: 'eq', value: '3.25' },
      { fact: { namespace: 'normalizedMetric', key: 'T' }, op: 'gte', value: 45 },
    ] } },
  ],
  fallbackPersonaId: 'steady-ox',
  hiddenResults: [
    { id: 'organization-legend', title: '检测到异常绩效区间。\n4.0\n组织级传说', copy: '由于现实样本过少，系统无法提供参考案例。' },
  ],
  organizationTransition: {
    lines: ['正在确认项目战略等级……', '正在评估直属领导支持度……', '正在进行同职级横向比较……', '正在检查优秀名额……', '正在判断今年的风往哪边吹……'],
    disclaimer: '接下来发生的一切，仅代表本系统对职场玄学的有限理解。',
    durationMs: 3200,
  },
  resultTransition: {
    lines: ['正在汇总个人努力证据……', '正在应用组织校准系数……', '正在检查异常绩效区间……', '正在生成本轮组织结论……'],
    disclaimer: '系统正在以非常严谨的方式，解释一些不太严谨的事情。',
    durationMs: 2800,
  },
  checkpoint: {
    title: '恭喜，你已经完成了个人努力部分。',
    subtitle: '个人部分已封存，组织变量即将接管。',
    backLabel: '返回修改',
    confirmLabel: '看看组织怎么说',
    outcomeNotes: {
      '3.25': '系统初步判断：\n你确实干了活。\n只是暂未形成组织共识。',
      '3.5-': '系统检测到明显努力痕迹。\n正在寻找能被写进绩效里的那部分。',
      '3.5': '个人努力部分运行稳定。\n暂未发现明显传奇，也暂未发现事故。',
      '3.5+': '个人努力证据良好。\n接下来主要看组织愿不愿意配合。',
      '3.75': '个人努力证据充分。\n接下来请把命运交给组织流程。',
    },
  },
  reflectionConfig: {
    title: '最后，系统还是想说一句',
    paragraphs: [
      '前面的分数都是假的，工作是真的。',
      '这 16 道题当然不能决定你的真实绩效，更不能定义你的价值。',
      '但如果它让你想起了某个项目、某次汇报，或者某个“我明明做了很多，为什么没人知道”的瞬间——\n那这个小游戏可能也不算完全没用。',
      '做好事情很重要。\n让自己的价值被正确看见，也很重要。',
      '懂得独立判断，也懂得借助组织；\n愿意承担责任，也保留自己的边界。',
      '绩效只是工作的一部分。别让它变成你对自己的全部评价。',
    ],
    footer: '如果这个测试除了让你笑了一下，还让你想了一下，那我们就算多赚到了。',
  },
  shareConfig: {
    titleTemplate: '我的绩效校准结果是 {outcome} · {persona}',
    path: '/pages/home/index',
  },
  adSlots: [
    { key: 'home_bottom', enabled: false, type: 'banner' },
    { key: 'result_after_primary', enabled: false, type: 'banner' },
    { key: 'result_bottom', enabled: false, type: 'banner' },
    { key: 'test_hub_inline', enabled: false, type: 'custom' },
    { key: 'future_recommendation', enabled: false, type: 'custom' },
  ],
  theme: { accent: '#2457d6', background: '#f4f6f9' },
}
