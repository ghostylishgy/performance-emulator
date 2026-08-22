# 大厂绩效模拟器

烛龙实验室｜绩效内测会：一个配置驱动、确定性评分的微信原生职场娱乐测试。

> V3 是破坏性流程升级：旧版 16 题、章节转场、Q12 Checkpoint 和中途成绩已退出运行路径。旧进度会因版本不匹配而提示重新开始。

## Architecture

- Native WeChat Mini Program
- Local-first
- Zero Backend
- Zero CloudBase
- Zero Login
- Server fixed cost: RMB 0/month

评分、人格、死因、证据选择和双人关系鉴定全部在客户端运行。对口径码是包含算法版本、人格、绩效和死因的 5 位自包含编码；不依赖 `resultId`、短码数据库、TTL、云函数或网络查询。答题进度和待处理对口径码只保存在 `wx.Storage`，不上传完整答案，也没有账户系统。

Analytics 抽象层可以保留，但当前不向自建或第三方服务发送事件。需要统计时只允许接入微信平台官方统计/分析能力；零后端条件下无法取得的细粒度事件暂不支持。单人结果卡和双人关系卡均由客户端 Canvas 本地生成，不上传图片，也不使用对象存储或海报服务。

## 本地验证

需要 Node.js 22+ 和 npm 11+。在 Windows PowerShell 中如执行策略阻止 `npm.ps1`，直接使用 `npm.cmd`：

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd test
npm.cmd run validate:config
```

固定 seed 模拟：

```powershell
npm.cmd run simulate
npm.cmd run simulate:uniform
```

模拟只用于发现不可达门槛和回归异常，不用于反向控制人格比例。

## 在微信开发者工具中运行

1. 导入仓库根目录；`project.config.json` 已设置 `miniprogramRoot` 和 TypeScript 编译插件。
2. 编译后从首页进入 `BEFORE WE START`，连续完成 25 题。
3. Q25 后播放约 3.6 秒、共 5 句的计算动画；人格、主要死因和三条抓包证据自动出现，仅需点击一次查看最终绩效。
4. 返回首页可恢复未完成答题；V3 以前的本地进度不会被复用。

## 匿名对口径码

结果页在本机通过 `encodePairCode()` 生成 5 位 Base31 编码，字符表排除了 `0/O/1/I/L`。编码包含 algorithmVersion、persona、performanceScore、deathCause、未来兼容保留位和 CRC-5 校验位。解码可识别格式、字符、checksum、版本和枚举错误；不提供密码学安全，也不阻止玩家主动伪造娱乐结果。

分享路径直接携带 `pairCode`。好友打开后由客户端校验并暂存到 `wx.Storage`，完成自己的 25 题后，本地解码对方人格并查询 36 组无序关系配置。手动输入和复制编码作为备用入口保留，整个过程不访问服务器。

结果页暂不实现 `onShareTimeline`：朋友圈能力只能分享当前结果页，不能把接收路径改到首页；而朋友圈打开又可能处于 `browseOnly` 单页模式。当前结果页必须读取本机完整答题进度，这会让第三方设备直接打开时进入错误恢复链路。朋友圈传播先使用本地 Canvas 结果卡，待有经过真机验证的首页落地方案后再启用 API。

## V3 结果是怎样算出的

```text
25 个答案
  → BaseScore：Σ(题目权重 × 选项系数)
  → 基础绩效档：3.25 / 3.5- / 3.5 / 3.5+ / 3.75
  → L/S/R/N 组织指标与 OrgScore
  → 普通校准 -1 / 0 / +1（3.75 不会普通上调为 4.0）
  → 独立 4.0 闸门

同一组答案（独立计算）
  → 7 种特殊人格分别过门槛
  → confidence / 核心证据数 / 固定 tie-break
  → 全部不过线时为“稳定牛马型”
  → 4.0 强制使用 none；其他结果进入独立死因规则
  → 跨 2~3 道真实回答合成行为模式，单题证据只作 fallback
  → 确定性挑选 3 条抓包，显式限制主要死因重复
```

结果页聚焦职场人格、绩效死因、跨题抓包与最终绩效。人格、死因和绩效互相独立，特殊人格不代表高绩效。

## 代码结构

```text
miniprogram/config/tests/performance-simulator/
  questions.ts             25 题、权重、系数与单题证据元数据
  evidence-synthesis.ts    31 条跨题行为模式规则
  personas.ts              7 人格信号矩阵、门槛和 tie-break
  pair-relationships.ts    36 种无序双人关系
  index.ts                 V3 产品配置与组织校准参数
miniprogram/domain/
  v3-evaluation.ts         BaseScore、OrgScore、4.0 与结果模型
  v3-persona.ts            candidate、confidence 和人格决胜
  v3-death-cause.ts        独立绩效死因
  v3-evidence.ts           跨题合成、实际答案校验与类别/死因去重
  v3-pairing.ts            自包含 pair code 编解码与无序关系键
  session.ts               answering → complete 连续状态机
miniprogram/platform/
  storage.ts               本地进度与 pendingPairCode
  sharing.ts               微信原生带参分享消息
  poster.ts                单人/双人本地 Canvas 卡片与相册保存
  progress-recovery.ts     损坏进度恢复与写入失败降级
  analytics.ts             零远程副作用的统计抽象
```

页面代码只负责状态和展示，不包含题目专用评分分支。配置在启动和 `validate:config` 中进行结构、引用、门槛和 36 关系完整性校验。

## 当前验证边界

- 自动验证覆盖 25 题流程、BaseScore/OrgScore、全部绩效档边界、4.0、7 人格正反例、fallback、Evidence Synthesis、36 关系、pair code 全枚举 round trip、错误校验、本地 pendingPairCode、两类 Canvas 卡片、Storage 恢复、零后端架构约束和 Reveal 节点。
- 固定 seed weighted/uniform 模拟报告位于 `reports/`。
- 旧版流程曾由用户确认在小米 15 Ultra、iPhone 8 Plus、iPhone 16 Pro Max 完成真机验证。
- 本轮 V3 结果页、Canvas 相册授权、自动关系解锁、复制/分享/手输流程仍需重新进行微信开发者工具及多机真机验收；自动测试不能替代这部分证据。
