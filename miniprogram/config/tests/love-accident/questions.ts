import type { LoveQuestionDefinition } from './types'

export const loveQuestions: LoveQuestionDefinition[] = [
  {
    id: 'Q1',
    title: '白月光突然重新上线',
    prompt: '当年你死活没追到的白月光，多年后突然私信：\n\n“周末刚好在你城市，有空喝杯咖啡吗？”',
    options: [
      { id: 'A', text: '正常约个咖啡，先看看这么多年过去TA有没有发福', scores: {} },
      { id: 'B', text: '周末全部取消，衣服重新买，餐厅连夜订——青春欠的票今天一次补齐', scores: { MOON: 5, POMP: 1 } },
      { id: 'C', text: '先把TA最近几年的公开动态翻一遍，再决定见不见', scores: { DD: 3 } },
      { id: 'D', text: '故意第二天才回：“抱歉刚看到”，绝不能暴露自己秒回的手', scores: { MOON: 2 } },
    ],
  },
  {
    id: 'Q2',
    title: '“要是这里只有我们两个人就好了”',
    prompt: '第一次正式约会看电影，热门场次只剩前排。\n\nTA随口说：\n\n“要是放映厅里只有我们两个就好了。”',
    options: [
      { id: 'A', text: '前排就前排，爱情不能先把颈椎干废', scores: {} },
      { id: 'B', text: '换个贵一点的私人影厅', scores: { POMP: 3 } },
      { id: 'C', text: '要不问问经理，把这一场其他人的票全买下来多少钱？', scores: { POMP: 5 } },
      { id: 'D', text: '今天先将就，以后发财了再给你包场', scores: { POMP: 1, MOON: 1 } },
    ],
  },
  {
    id: 'Q3',
    title: '私人关系里的奇怪规矩',
    prompt: '平时在外特别强势的对象，私下认真给你磨了快一个小时指甲，还反复提醒：\n\n“手伸好，要顺着一个方向。”\n\n然后又让你私下换个辈分明显不太对的亲昵称呼。\n\n你：',
    options: [
      { id: 'A', text: '磨指甲可以，辈分不能乱', scores: {} },
      { id: 'B', text: 'TA开心就行，门关上以后谁还不是另一副人格', scores: { PRIVATE: 5 } },
      { id: 'C', text: '一边乖乖伸手，一边认真问：“所以到底往哪边磨？”', scores: { PRIVATE: 4, FUTURE: 1 } },
      { id: 'D', text: '先确认一下：这个称呼出了卧室是否自动失效', scores: { PRIVATE: 3 } },
    ],
  },
  {
    id: 'Q4',
    title: '第三张卡',
    prompt: '给对象连续大额付款，因为限额需要换银行卡。\n\n前两张都很顺。\n\n到了第三张，你真实的反应：',
    options: [
      { id: 'A', text: '没区别，三张和三十张只是次数问题', scores: { MOON: 2, POMP: 2 } },
      { id: 'B', text: '手指突然有了自己的想法：等等，我是不是有点过了？', scores: { CARD3: 5 } },
      { id: 'C', text: '钱可以继续付，但对方最好表现出同等密度的感动', scores: { CARD3: 3, POMP: 1 } },
      { id: 'D', text: '“银行好像有点问题”，先拖十分钟恢复一下理智', scores: { CARD3: 4, DD: 1 } },
    ],
  },
  {
    id: 'Q5',
    title: '嘴上全信，回家以后……',
    prompt: '对象认真把家庭、过去和重要经历都告诉了你。\n\n你当场说：\n\n“我都相信你。”\n\n晚上回家以后：',
    options: [
      { id: 'A', text: '真不查。说信就是信', scores: {} },
      { id: 'B', text: '忍不住把TA的公开信息和时间线捋一遍', scores: { DD: 3 } },
      { id: 'C', text: '关键事实会核实，但不会无限深挖', scores: { DD: 2 } },
      { id: 'D', text: '嘴上全信，浏览器已经开了十二个标签页', scores: { DD: 5 } },
    ],
  },
  {
    id: 'Q6',
    title: 'AI已经开始报警了',
    prompt: '你准备为这段关系做一笔很大的投入，于是顺手把情况发给AI。\n\nAI回复：\n\n“风险较高，建议停止追加投入。”\n\n你：',
    options: [
      { id: 'A', text: '冷静下来，先停几天', scores: {} },
      { id: 'B', text: '换三个模型继续问，直到有一个支持我', scores: { AI: 5 } },
      { id: 'C', text: '关掉窗口：你分析数据，我谈的是爱情', scores: { AI: 5 } },
      { id: 'D', text: '不仅暂停，还让AI帮我列一份风险清单', scores: { DD: 3 } },
    ],
  },
  {
    id: 'Q7',
    title: '你送出去的贵重礼物',
    prompt: '你花了大半个月积蓄，给TA买了一件很贵的礼物。\n\n几个月后和平分手。\n\n你内心更接近：',
    options: [
      { id: 'A', text: '送出去就是送出去，心疼也算了', scores: { DIGNITY: 4 } },
      { id: 'B', text: '会希望TA主动还回来，但我不一定开口', scores: { REFUND: 3 } },
      { id: 'C', text: '如果后来闹得很难看，我会翻当时的聊天记录', scores: { REFUND: 4, AUDIT: 2, EVIDENCE: 1 } },
      { id: 'D', text: '先算算双方到底谁花得更多，再决定要不要谈', scores: { AUDIT: 3, CARD3: 2 } },
    ],
  },
  {
    id: 'Q8',
    title: '转账说明那一栏',
    prompt: '对象临时需要2万元周转。\n\n付款前，你看到：\n\n“转账说明”\n\n你会填：',
    options: [
      { id: 'A', text: '“宝宝零花钱❤️”', scores: {} },
      { id: 'B', text: '“周转一下，发财记得请我吃饭”', scores: { EVIDENCE: 2 } },
      { id: 'C', text: '“个人应急借款，请于XX日前归还”', scores: { EVIDENCE: 5, DD: 1, CARD3: 1 } },
      { id: 'D', text: '什么都不写，但重要聊天我会默默留好', scores: { EVIDENCE: 3, DD: 1, CARD3: 1 } },
    ],
  },
  {
    id: 'Q9',
    title: '前任突然发来一份Excel',
    prompt: '分手一个月，前任突然甩来一份巨细靡遗的Excel：\n\n电影票、打车、奶茶、吃饭……\n\n要求你结算一半。\n\n你的第一反应：',
    options: [
      { id: 'A', text: '转了算了，从此别联系', scores: { DIGNITY: 2 } },
      { id: 'B', text: '打开自己的账单，做一份更专业的对冲表', scores: { AUDIT: 5 } },
      { id: 'C', text: '“当时抢着买单的是你，现在怎么突然开始售票？”', scores: { DOUBLE: 2, REFUND: 1 } },
      { id: 'D', text: '截图发给朋友：“来看当代前任审计报告”', scores: { AUDIT: 2 } },
    ],
  },
  {
    id: 'Q10',
    title: '现在礼物是别人送你的',
    prompt: '角色对调。\n\n半年前TA主动送你一件很贵的礼物。现在分手，对方说：\n\n“能不能把东西还我？”\n\n你：',
    options: [
      { id: 'A', text: '还，省得以后继续拉扯', scores: { DIGNITY: 3 } },
      { id: 'B', text: '都送我了，现在要回去算怎么回事', scores: { DOUBLE: 2 } },
      { id: 'C', text: '可以谈，但双方投入最好一起算清楚', scores: { AUDIT: 2 } },
      { id: 'D', text: '送的时候叫心意，分手以后突然变资产？', scores: { DOUBLE: 3 } },
    ],
  },
  {
    id: 'Q11',
    title: '发现TA也查过你',
    prompt: '你后来发现，恋爱初期TA其实也核实过你的工作、家庭和过去。\n\n你：',
    options: [
      { id: 'A', text: '可以理解，我自己可能也会查', scores: { DD: 3 } },
      { id: 'B', text: '核实重要事情可以，但查太细会不舒服', scores: { DD: 2 } },
      { id: 'C', text: '等等，我查你叫风控，你查我怎么突然就侵犯隐私了？', scores: { DOUBLE: 5 } },
      { id: 'D', text: '完全不能接受，信任就应该是不查', scores: {} },
    ],
  },
  {
    id: 'Q12',
    title: '恋爱体验与描述严重不符',
    prompt: '相处半年后，你突然发现：\n\n当初认识的TA和现在的TA简直不是一个版本。\n\n你：',
    options: [
      { id: 'A', text: '认栽，当买教训，赶紧撤', scores: { DIGNITY: 2 } },
      { id: 'B', text: '启动恋爱仅退款：感情不要了，钱最好回来', scores: { REFUND: 5 } },
      { id: 'C', text: '已经投入这么多了，再抢救一下', scores: { AI: 4 } },
      { id: 'D', text: '心理账户直接计提坏账，以后一分钱不追加', scores: { DIGNITY: 2, AUDIT: 1, CARD3: 2 } },
    ],
  },
  {
    id: 'Q13',
    title: '昨天还叫宝宝，今天直接变被告',
    prompt: '关系彻底闹翻以后，你最先做什么？',
    options: [
      { id: 'A', text: '找朋友狠狠吐槽一顿', scores: {} },
      { id: 'B', text: '拉黑删除，眼不见心不烦', scores: { DIGNITY: 1 } },
      { id: 'C', text: '把重要聊天和转账截图保存下来', scores: { EVIDENCE: 3, AUDIT: 1 } },
      { id: 'D', text: '新建文件夹：聊天记录 / 转账记录 / 其他证据', scores: { EVIDENCE: 5, AUDIT: 2 } },
    ],
  },
  {
    id: 'Q14',
    title: '手机提醒你一个已经不存在的未来',
    prompt: '分手大半年，你早已恢复正常生活。\n\n某天手机突然弹出以前一起设好的未来计划。\n\n你：',
    options: [
      { id: 'A', text: '愣一下，删除，继续刷牙上班', scores: { DIGNITY: 3, FUTURE: 1 } },
      { id: 'B', text: '截图发朋友：“系统还挺守约”', scores: { FUTURE: 2 } },
      { id: 'C', text: '坐在那里看了一会儿，什么也没做', scores: { FUTURE: 5 } },
      { id: 'D', text: '趁机把所有旧日程和照片彻底清理一次', scores: { FUTURE: 1 } },
    ],
  },
  {
    id: 'Q15',
    title: '抽屉里的那件小东西',
    prompt: '整理房间时，你翻出前任留下的一件很不起眼的小东西。\n\n拿起来才发现：\n\n你甚至已经忘了当年TA教你应该怎么用。\n\n你：',
    options: [
      { id: 'A', text: '顺手扔掉', scores: {} },
      { id: 'B', text: '放回去，也说不清为什么', scores: { FUTURE: 4, PRIVATE: 1 } },
      { id: 'C', text: '突然觉得挺好笑：那么多大事都过去了，最后留下的居然是这个破玩意', scores: { FUTURE: 3, PRIVATE: 1 } },
      { id: 'D', text: '拿在手里愣一会儿，然后继续收拾房间', scores: { FUTURE: 5, PRIVATE: 1, DIGNITY: 1 } },
    ],
  },
  {
    id: 'Q16',
    title: '凌晨三点的红灯',
    prompt: '一段耗尽心力的关系终于彻底结束。\n\n凌晨三点，你独自回家。\n\n街上一辆车都没有。\n\n前面亮着红灯。\n\n你：',
    options: [
      { id: 'A', text: '没车，直接过去', scores: {} },
      { id: 'B', text: '还是停在白线前，等它变绿', scores: { DIGNITY: 5 } },
      { id: 'C', text: '靠在座椅上发会儿呆，绿了再走', scores: { DIGNITY: 3, FUTURE: 1 } },
      { id: 'D', text: '一边等一边想：老子什么都亏了，交通规则不能再亏', scores: { DIGNITY: 4 } },
    ],
  },
]
