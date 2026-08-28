import type { AnswerId, DeathCauseId, EvidenceCategory, PersonaId, QuestionDefinition, QuestionOption } from '../../v3-types'

const weights = [9, 8, 2, 1, 5, 4, 5, 4, 5, 7, 0, 6, 8, 4, 5, 5, 8, 1, 0, 3, 7, 3, 0, 0, 0]
const coefficients: Array<[number, number, number, number]> = [
  [1, .85, .45, .35], [1, .9, .45, .2], [1, .55, .25, .35], [.75, .65, 1, .45],
  [1, .95, .7, .55], [1, .7, .55, .95], [1, .7, .25, .95], [.75, 1, .35, .25],
  [.9, 1, .1, .35], [.7, 1, .8, .7], [0, 0, 0, 0], [1, .65, .75, .35],
  [1, .7, .25, .15], [.4, .35, .9, .2], [.8, .85, 1, .75], [1, .55, .25, .15],
  [1, .9, .95, .45], [.7, .9, 1, .5], [0, 0, 0, 0], [1, .4, .8, .2],
  [1, .45, .25, .15], [1, .9, .55, .25], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
]

const categoryByQuestion: EvidenceCategory[] = [
  'work_behavior', 'work_behavior', 'human_moment', 'work_behavior', 'work_behavior',
  'human_moment', 'human_moment', 'human_moment', 'work_behavior', 'work_behavior',
  'human_moment', 'expression_org', 'expression_org', 'expression_org', 'work_behavior',
  'expression_org', 'work_behavior', 'work_behavior', 'expression_org', 'human_moment',
  'expression_org', 'expression_org', 'human_moment', 'expression_org', 'human_moment',
]

const texts: Array<[string, string, string, string, string]> = [
  ['过去大半年，真要挑一个项目给自己撑场面，你选：', '就那个，核心那块真是我扛的', '团队的项目，但最难啃的那块，确实是我扛的', '项目不少，一时还真挑不出哪个能撑场面', '就那个，折腾最久，至少记得最清楚'],
  ['项目突然炸了，刚好这块你最懂。你先：', '先救火，锅可以晚点分', '拉群，把能打的都叫进来', '先问清楚，这事儿现在归谁管', '翻记录，找“问题不大”的出处'],
  ['领导在群里只回了一个“？”。你：', '补三行结论，当刚才没发生', '先问同事：这个问号什么意思', '把领导最近半个月发过的问号翻出来，做了一次横向语气比对', '第一次意识到标点符号也有职级'],
  ['你突然休假一个月，部门大概会：', '至少有个项目先暂停思考', '人休假了，微信没有', '交接完还能跑，文明社会', '第三周群里问：“这事谁管？”'],
  ['别人最常因为什么来找你？', '“这事你帮我判断一下。”', '“这个你最熟，你先看看。”', '“你跟那边熟不熟？”', '“三年前那个文件，你这儿还有吧？”'],
  ['同事说：“这个很简单，你顺手弄一下。”你：', '先问清楚，到底有多简单', '嘴上说好，已经开始排时间了', '笑着说“我看看”，文件夹已经建好了', '先问一句：“这是帮一下，还是以后都归我了？”'],
  ['周五下班前十分钟，突然有人@你：“今天能出吗？”', '先问清楚，真急就先做关键部分', '回“收到”，给自己争取三分钟', '看到“今天”两个字，先喝了口水', '把手头的活截了个图，问“今天先放弃哪个？”'],
  ['需求改到已经不知道第几版了。你：', '继续改，已经能平静找差异了', '先确认，这一版到底谁拍的板', 'V3和V7一对比，发现改回去了', '新建：最终版_真的最终_2'],
  ['群里掉下来一个没人认领的新问题。你：', '先拆一下，看真正的问题在哪', '把相关的人拉齐，先让事情动起来', '心里已经回复过了', '等两分钟。果然有人@我'],
  ['跨部门流程卡了两周，你开始：', '把流程扶起来，再走最后一次', '直接找那个真正能拍板的人', '请领导进群，观察自然现象', '翻通讯录，启动轻度流程邪修'],
  ['老板突然进了项目群。你发现：', '大家突然开始用完整句子汇报进度了', '半小时前的表情包突然很刺眼', '有人平地生成了一份项目日报', '群里安静得像终于开始开会'],
  ['领导突然问：“那个项目怎么样了？”你：', '进度、结果、风险、下一步，一口气说清楚', '先猜他为什么突然想起它', '发完整说明，结尾：总体可控', '先翻记录，确认上次说到哪版'],
  ['汇报一个你干了大半年的项目，你会：', '结果先上，哪块我干的说清楚', '先说团队，再慢慢找到自己', '从盘古开天开始讲项目背景', '讲完发现，“我”全程没出场'],
  ['你发现自己的想法，被别人拿去汇报了。你：', '笑着说“能用上挺好”，剩下的意见交给后槽牙', '回去把聊天记录往上翻三页', '周报里重新写一遍，正式一点', '决定下次想法先说七成'],
  ['一个从来没人做过的新活突然掉到你桌上。没流程，没模板。你：', '先问一句：“这锅多大？做到哪儿算完？”', '找个踩过类似坑的：“来，借我抄点活人经验。”', '既然没人做过，那我先糊一版能跑的。临时的，理论上。', '先把这坨东西拆开，不然连加班都不知道从哪儿加。'],
  ['年底写总结，你最像：', '成果很快列完，还有数据', '翻日历、聊天记录，开始考古自己', '忙了一年，第一句愣是写不出', '写了三段，主语全是“团队”'],
  ['领导提了个方向，你越听越觉得有坑。你：', '当场把风险讲明白，顺手给条别的路', '会上先不顶，会后单聊', '先小范围试一把，看坑会不会自己冒出来', '先留个记录，免得以后复盘只剩我记得'],
  ['要是真换个人来接你这摊活，你觉得：', '能接，先跟着我考古一阵', '能接，前提是他真看交接文档', '流程都写着，理论上应该没事', '人可以换，历史包袱不同意'],
  ['你过去大半年最重要的项目，现在公司怎么看？', '重点项目，隔一阵就被问进度', '挺重要，但还没重要到天天问', '平时没什么存在感，一出事马上变重点', '年初叫战略，现在简称“那个”'],
  ['跟你同级的人突然晋升了。你第一反应：', '真心恭喜，顺便盘盘自己到底差在哪', '嘴上恭喜，脑子里开始算他凭什么', '默默把自己的材料又改了一版', '晚上比平时多刷了半小时手机'],
  ['项目终于成功了，开始总结功劳。你发现：', '名字和成果对得上，不用考古', '发言的人不是你，但PPT是你做的', '名字没出现，但“团队”两个字里应该有我', '出问题精准到我，成功自动马赛克'],
  ['如果让直属领导在会上介绍你，他大概会说：', '“这块没他还真不好推。”', '“很靠谱，重要的事可以交给他。”', '“能力不错，今年也确实挺辛苦。”', '“参与很多，整体贡献还是有的……”'],
  ['有人当众夸你：“抗压能力真强。”你：', '笑着说“还好还好”', '开始琢磨：怎么每次压力都能找到我', '记下来，年终总结也许能用', '突然觉得这夸法不太吉利'],
  ['优秀名额只够一个，几个人表现都不错。你觉得：', '领导真会替我去抢，至少这次不是客套', '会替我说几句，能不能抢到就看现场了', '大家都很好，只是名额不同意', '“你今年其实真的做得很好……”'],
  ['绩效季，领导突然发来：“下午有空吗？聊两句。”你：', '回“有”，下午再说', '顺手把这大半年的重点项目过一遍', '开始考古他最近的语气', '打开招聘软件。但只是随便看看。'],
]

function deathTagsFor(answerKey: string): DeathCauseId[] {
  const tags: DeathCauseId[] = []
  if (answerKey === 'Q19D') tags.push('strategy_faded')
  if (answerKey === 'Q21C' || answerKey === 'Q21D') tags.push('credit_unclear')
  if (answerKey === 'Q24C' || answerKey === 'Q24D') tags.push('quota_tight')
  if (['Q13C', 'Q13D', 'Q16C', 'Q16D'].includes(answerKey)) tags.push('visibility_lag')
  return tags
}

function option(questionIndex: number, optionIndex: number, text: string): QuestionOption {
  const id = (['A', 'B', 'C', 'D'] as AnswerId[])[optionIndex]!
  const coefficient = coefficients[questionIndex]![optionIndex]!
  const answerKey = `Q${questionIndex + 1}${id}`
  return {
    id,
    text,
    coefficient,
    evidence: {
      text,
      category: categoryByQuestion[questionIndex]!,
      priority: weights[questionIndex]! + (optionIndex === 0 ? 2 : 0),
      personaTags: [] as PersonaId[],
      deathTags: deathTagsFor(answerKey),
    },
  }
}

export const questions: QuestionDefinition[] = texts.map(([questionText, ...optionTexts], questionIndex) => ({
  id: `Q${questionIndex + 1}`,
  text: questionText,
  weight: weights[questionIndex]!,
  options: optionTexts.map((text, optionIndex) => option(questionIndex, optionIndex, text)),
}))
