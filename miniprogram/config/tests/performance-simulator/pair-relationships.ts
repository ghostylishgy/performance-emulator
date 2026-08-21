import type { PairRelationship, PersonaId } from '../../v3-types'

const rows: Array<[PersonaId, PersonaId, string, string]> = [
  ['single_point_failure','single_point_failure','双核单点故障','两个人都很重要。坏消息是，你们都指着对方有备份。'],
  ['single_point_failure','invisible_contributor','显隐双核心','一个出事必被@，一个做完容易被马赛克。都在核心，组织记人的方式不一样。'],
  ['single_point_failure','result_captioner','核心放大器','一个负责扛事，一个负责把扛的事说清楚。组合起来，组织很难假装没看见。'],
  ['single_point_failure','wild_middleware','人工总线系统','一个是组织绕不开的节点，一个专门知道怎么把人路由到这个节点。'],
  ['single_point_failure','reality_patcher','故障抢修组','一个出事以后容易被@，一个在彻底出事以前先糊个能跑的。'],
  ['single_point_failure','desk_firewall','依赖限流协议','一个被依赖惯了，一个在旁边提醒：适量，适量。组织第一次听说依赖也有限流。'],
  ['single_point_failure','org_weather_station','预警抢修中心','一个负责说“好像要下雨”，一个负责雨真下起来以后被叫出去修屋顶。'],
  ['single_point_failure','stable_worker','主备不明系统','一个怎么看都像主机，另一个怎么看都挺稳定。至于真正的备份，目前没有证据。'],
  ['invisible_contributor','invisible_contributor','公共功劳池','两个人都干了很多。年底一看，主要成果统一署名：“团队”。'],
  ['invisible_contributor','result_captioner','前店后厂同盟','一个把东西做厚，一个让组织知道它为什么这么厚。系统建议：别拆。'],
  ['invisible_contributor','wild_middleware','幕后调度中心','一个默默把活干了，一个默默把人接上。汇报里统称“协同完成”。'],
  ['invisible_contributor','reality_patcher','地下工程队','没人正式立项的时候，你们已经开工了。等组织发现，临时版本可能都迭代两轮了。'],
  ['invisible_contributor','desk_firewall','工位自救小组','一个习惯“算了我来”，另一个负责问：“等一下，凭什么又是你？”'],
  ['invisible_contributor','org_weather_station','地下气象站','一个低头干活，一个抬头看风。共同问题：都不太喜欢把自己写进标题。'],
  ['invisible_contributor','stable_worker','量产牛马联盟','活干了但名字容易失踪，人稳定但像默认配置。反正系统还能跑。'],
  ['result_captioner','result_captioner','双人发布会','项目基本不会被埋。唯一的问题是，你们俩都知道标题应该怎么写。'],
  ['result_captioner','wild_middleware','口径接线台','一个把人拉齐，一个把话说齐。会开完以后，居然真的有结论。'],
  ['result_captioner','reality_patcher','上线搭子','一个先糊出能跑的版本，一个负责把它翻译成能上会的版本。'],
  ['result_captioner','desk_firewall','闭环护栏组','开头有人把边界划清，收尾有人把成果说清。中间终于可以正常干活。'],
  ['result_captioner','org_weather_station','风向字幕组','风还没完全转，汇报口径已经更新到最新版。'],
  ['result_captioner','stable_worker','标准交付组','一个稳定干，一个稳定记。年底不太容易出现“这是谁做的来着”。'],
  ['wild_middleware','wild_middleware','野生总线局','两个人都知道该找谁。唯一风险是一个问题最后可能长出三个群。'],
  ['wild_middleware','reality_patcher','民间接口协议','一个负责找人，一个负责找路。组织架构图里没有这条线，现实里天天在走。'],
  ['wild_middleware','desk_firewall','接线安检处','一个负责把人接进来，一个负责先问：“这人为什么要接进来？”'],
  ['wild_middleware','org_weather_station','组织雷达网','一个知道该找谁，一个知道现在是不是时候去找。'],
  ['wild_middleware','stable_worker','民间办事处','一个负责把路问出来，一个负责把活接住。看起来普通，实际上非常好用。'],
  ['reality_patcher','reality_patcher','临时方案永久化','你们没有解决不了的问题。主要问题是三个月前那个“先凑合一下”，现在已经成为正式流程。'],
  ['reality_patcher','desk_firewall','受控野路子','一个负责“现在怎么办”，一个负责追问“这个办法准备活多久”。'],
  ['reality_patcher','org_weather_station','气压应急包','一个刚说可能要下雨，一个已经拿着胶带去补屋顶了。'],
  ['reality_patcher','stable_worker','临时转正局','一个先让东西跑起来，一个负责让这个“临时的”悄悄活过试用期。'],
  ['desk_firewall','desk_firewall','双重访问控制','谁都不太容易被乱塞活。一个模糊需求可能在你们之间来回弹三次。'],
  ['desk_firewall','org_weather_station','风险预警墙','一个先发现风向不对，一个负责检查这个活到底该不该进门。'],
  ['desk_firewall','stable_worker','文明施工组','先把范围说清楚，再安安静静把事做完。组织偶尔管这叫“不够有冲劲”。'],
  ['org_weather_station','org_weather_station','联合天气预报','别人看到领导一个“？”。你们已经完成第一次双台会商。'],
  ['org_weather_station','stable_worker','气象值班组','一个负责看天，一个负责照常上班。除非真下雨。'],
  ['stable_worker','stable_worker','默认配置双排','两个人都没有特别离谱的属性。胜在稳定、耐用，出厂基本兼容。'],
]

export function pairKey(left: PersonaId, right: PersonaId): string {
  return [left, right].sort().join('+')
}

export const pairRelationships: PairRelationship[] = rows.map(([left, right, title, copy]) => ({
  key: pairKey(left, right), title, copy,
}))
