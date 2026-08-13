# 《大厂绩效模拟器》MVP 工程报告

报告日期：2026-08-13  
项目根目录：`D:\Dev\assessment-lab-miniapp`

## 1. 根目录确认

接手时目标目录存在但为空，不是 Git 仓库。全部项目文件均在该目录内创建；已初始化本地 Git，没有配置 GitHub remote，也没有因此阻塞开发。

## 2. 创建/修改文件

当前排除 `node_modules` 和 `.git` 后共有 90 个文件：根配置 7 个、`miniprogram` 原生工程、`tests`、`scripts`、`reports` 与 `docs`。未覆盖或删除用户文件。

## 3. 当前目录树

```text
D:\Dev\assessment-lab-miniapp
├─ miniprogram
│  ├─ config
│  │  ├─ tests/performance-simulator/index.ts
│  │  ├─ metric-definitions.ts
│  │  ├─ test-registry.ts
│  │  └─ types.ts
│  ├─ domain
│  │  ├─ scoring.ts / normalization.ts / evaluation-pipeline.ts
│  │  ├─ calibration.ts / rules.ts / persona.ts
│  │  ├─ validation.ts / session.ts / simulation.ts
│  ├─ pages/home|quiz|result
│  ├─ components (8 个通用组件)
│  ├─ platform/storage|sharing|analytics|advertising.ts
│  └─ app.ts / app.json / app.wxss / sitemap.json
├─ tests/unit|golden|archetype
├─ scripts/validate-config.ts / monte-carlo.ts / audit-vectors.ts
├─ reports/monte-carlo-weighted.json / monte-carlo-uniform.json
├─ docs/architecture.md / testing.md / engineering-report.md
├─ README.md
├─ package.json / package-lock.json / tsconfig.json / vitest.config.ts
└─ project.config.json / .gitignore
```

## 4. 微信项目运行

微信开发者工具导入仓库根目录即可，`project.config.json` 已指定 `miniprogramRoot` 和 TypeScript 编译插件。当前使用 `touristappid`；本机已确认存在微信开发者工具 CLI，但本轮没有真实 AppID，因此未执行真机 preview/upload。完整步骤见根 README。

## 5. TestDefinition 设计

通用类型包含 id/version/evaluationVersion、章节、问题、MetricDefinition、effects、signals、personaEvidence、权重、普通档位、校准、独立 4.0 Gate、PersonaRule、hidden result、布局、主题、分享、反思与广告逻辑位。测试注册表允许继续加入第二份配置。

## 6. 16 题配置位置

正式 C 版全部文案、选项顺序、effects、Q15 省略号、章节转场、4.0 文案和反思原文均集中在：

`miniprogram/config/tests/performance-simulator/index.ts`

Quiz 页面不知道任何具体题目文案。

## 7. Evaluation Pipeline

`answers → raw metrics/signals/evidence → theoretical normalization → performanceIndex → baseOutcome → frozen snapshot → organizationScore → generic calibration → special gate → persona/hidden result → ResultViewModel`。

评分函数不导入微信 API、不使用随机数；相同配置与答案完全确定。

## 8. Theoretical normalization

`deriveTheoreticalRanges()` 遍历当前问题的四个选项，逐题累加 metric 的最小/最大可能 effect，包括 0 和 -1，不手写上下限。当前覆盖/区间：

| Metric | 题数 | 理论区间 |
|---|---:|---:|
| P | 4 | 0..8 |
| V | 4 | 1..12 |
| I | 7 | 2..16 |
| K | 5 | 0..13 |
| F | 7 | 1..18 |
| A | 7 | 0..17 |
| O | 8 | 1..18 |
| L | 2 | 1..6 |
| S | 1 | 0..3 |
| R | 4 | -1..6 |
| T | 4 | 0..11 |

## 9. PerformanceIndex

只使用 normalized P/V/I/K/F：`P×0.28 + V×0.20 + I×0.17 + K×0.20 + F×0.15`。权重由配置校验为总和 1。

## 10. BaseOutcome

按 `0/43/50/62/70` 的递增 min 阈值映射到 `3.25/3.5-/3.5/3.5+/3.75`。普通 scale 不含 4.0，边界测试覆盖 42.99、43、49.99、50、62、70。

## 11. Q12 Checkpoint 状态机

进度 stage 为 `personal → checkpoint → organization-transition → organization → complete`。Q12 选项先写入答案和 Storage，再计算个人结果并进入 checkpoint；“返回修改”回 Q12，结果重新计算；确认按钮有独立 action lock 防止重复冻结。

## 12. Personal snapshot 冻结

只有 `freezePersonalProgress()` 在用户确认后复制 Q1–Q12 为 `frozenPersonalAnswers`，并设置 `baseOutcomeFrozen=true`。Storage 保存的是真实答案快照，不是结果字符串。最终评估从快照重算 base。

## 13. 组织题无法污染个人指标

三层保护：MetricDefinition 的 `collectFrom` 限定来源；配置验证对 Q13–Q16 越权 effects fail fast；`evaluateFromFrozen()` 分别接收个人快照和组织答案。`setAnswer()` 还会在冻结后拒绝 personal 写入。

## 14. OrganizationScore

使用 normalized `O×0.15 + L×0.30 + S×0.25 + R×0.20 + T×0.10`。O 来自冻结个人答案；L/S/R/T 使用配置允许的完整证据。权重集中配置且校验总和 1。

## 15. Calibration engine

默认 `>=72` 候选 +1、`<=35` 候选 -1，其余 0；delta 类型和值域严格为 -1/0/+1。signals 可阻断向上并选择解释原因，不被实现为“出现即自动降档”。移动在普通 scale 上 clamp，所以 `3.75 + 1` 仍是 3.75。

## 16. 4.0 special gate

独立 RuleCondition 精确实现：base=3.75、organizationScore>=88、L>=80、S>=80、R>=75，且不存在 credit_unclear/strategy_faded/quota_tight。命中后产生 4.0 与 `organization-legend` hidden result。测试证明普通 scale 不存在任何 4.0 路径。

## 17. Signals

`credit_unclear`、`strategy_faded`、`quota_tight` 是集合事实；`legacy_knowledge` 独立放在 personaEvidence，完全不进入绩效。signals 可供 rule、upward block、reason 和 special gate 使用。

## 18. Persona engine

12 个 Persona 文案与 11 条可调优先级规则配置化，fallback 为稳定老黄牛。规则使用白名单 DSL，不使用 12 坨页面 if/else。`matchedPersonas[]` 保留全部命中，UI 只展示 primary；具体叙事事件优先于静态性格。

## 19. Storage / Resume

按 `assessment-lab:progress:{testId}` 隔离，保存 testId、testVersion、answers、currentQuestionIndex、stage、baseOutcomeFrozen、frozenPersonalAnswers、timestamp。旧 version 显示重新开始提示，不拼接新 effects。Storage 异常返回 corrupt，不影响新建进度。

## 20. AnalyticsAdapter

定义 17 个事件及最小化属性，页面只调用统一 Adapter。V1 使用 NoopAnalyticsAdapter，不上传答案或敏感信息。

## 21. AdvertisingAdapter

定义 isAvailable/load/show/hide/destroy 和 load/error/close/impression 事件订阅。V1 使用 DisabledAdvertisingAdapter；无广告配置和广告失败都不触碰主流程。

## 22. AdSlot

通用组件读取 TestDefinition 的 slot；预留 `home_bottom`、`result_after_primary`、`result_bottom`、`test_hub_inline`、`future_recommendation`，目前全关闭。Quiz 页面没有 AdSlot。

## 23. 当前 UI

已完成低彩度企业系统风格的首页、续答卡、唯一动态 Quiz、进度条、选项反馈、200–300ms 自动前进、上一题、Q4/Q8 点击确认式转场、Q12 checkpoint、较慢的组织扫描、结果生成动画、结果主卡、个人→组织变化、五条 Metric Bar、分享、重新测试、hidden result，以及分享意图触发的反思弹卡。极小屏允许当前题内部滚动，但页面只渲染一题。

## 24–26. 自动测试结果

- Unit：scoring、normalization、outcome、calibration、4.0、signals、validation、session、Storage、simulation 全通过。
- Golden：低存在感与 4.0 固定向量全通过。
- Archetype：10/10 固定角色全通过。
- 总计：8 个测试文件、31 个测试通过（本轮最终复跑数）。

## 27. Monte Carlo 参数

固定 seed `20260813`：weighted 100,000 次（0.35/0.32/0.20/0.13）和 uniform 100,000 次（各 0.25）。正式评估无随机；随机只生成测试输入。

## 28. BaseOutcome 分布（weighted）

| 3.25 | 3.5- | 3.5 | 3.5+ | 3.75 |
|---:|---:|---:|---:|---:|
| 9.589% | 17.810% | 46.829% | 19.954% | 5.818% |

## 29–30. FinalOutcome 与 4.0（weighted）

| 3.25 | 3.5- | 3.5 | 3.5+ | 3.75 | 4.0 |
|---:|---:|---:|---:|---:|---:|
| 9.548% | 18.657% | 37.829% | 24.072% | 9.806% | 0.088% |

Calibration：-1 为 9.055%，0 为 69.953%，+1 为 20.992%。uniform 对照的 4.0 为 0.002%，说明 4.0 不会因均匀乱选而泛滥。

## 31. Persona 分布（weighted）

| Persona | 占比 | Persona | 占比 |
|---|---:|---|---:|
| 稳定老黄牛 | 33.745% | 战略项目幸运儿 | 13.660% |
| 历史包袱型核心人才 | 11.894% | PPT型高潜 | 11.290% |
| 背锅型核心骨干 | 5.872% | 边缘求生型 | 5.761% |
| 汇报闭环型 | 5.508% | 技术孤岛型 | 5.048% |
| 隐形苦劳型 | 4.955% | 组织润滑剂 | 1.040% |
| 单点故障型人才 | 0.726% | 名额受害者 | 0.501% |

## 32. Metric correlation matrix（weighted）

| |P|V|I|K|F|A|O|L|S|R|T|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|P|1|-0.003|0.003|0.201|0.149|0.507|-0.041|0|0|-0.002|-0.001|
|V|-0.003|1|0.012|-0.001|0.154|0|0.146|0.004|0.003|0.392|0.115|
|I|0.003|0.012|1|-0.098|0.357|0.345|0.292|-0.001|0.002|-0.029|0.002|
|K|0.201|-0.001|-0.098|1|-0.272|0.271|-0.406|-0.002|0|-0.004|0.002|
|F|0.149|0.154|0.357|-0.272|1|0.338|0.217|0.001|0.007|0.002|0.136|
|A|0.507|0|0.345|0.271|0.338|1|-0.151|-0.004|0.002|-0.007|-0.003|
|O|-0.041|0.146|0.292|-0.406|0.217|-0.151|1|-0.001|-0.001|0.049|0.024|
|L|0|0.004|-0.001|-0.002|0.001|-0.004|-0.001|1|0|0.581|0.761|
|S|0|0.003|0.002|0|0.007|0.002|-0.001|0|1|-0.007|0|
|R|-0.002|0.392|-0.029|-0.004|0.002|-0.007|0.049|0.581|-0.007|1|0.418|
|T|-0.001|0.115|0.002|0.002|0.136|-0.003|0.024|0.761|0|0.418|1|

重点：V-F=0.154、V-R=0.392、P-A=0.507、K-O=-0.406。

## 33. 发现的算法问题

没有发现硬错误或严重档位塌缩；weighted final 与参考形态接近。仍需产品侧关注：P-A 中等正相关，K-O 中等负相关；L-T=0.761 较高，来自 Q13/Q15 共享证据；S 只有一题、方差较大；Persona fallback 为 33.745%，规则精确阈值仍可调。根据用户要求，本轮不擅自修改正式 effects 或 provisional 阈值。

## 34. 发现的 UX 问题

未做真机小屏与不同基础库验证；组织扫描或结果生成在中途退出后会从动画第一行重播，但冻结业务状态和结果真值不回滚；微信无法可靠返回真实分享成功，因此只记录 share intent，并在点击分享后展示反思弹卡；视觉为可用 MVP，不是最终稿。

## 35. 发现的架构问题

当前入口固定选择 registry 的 defaultTestId；第二个测试加入后需要 Test Hub/route 参数，但评分和页面配置边界无需重写。真实广告 Adapter、生产 Analytics、历史结果存储尚未实现。`touristappid` 不能代表真机/提审完成。

## 36. Provisional 参数

organizationScore 权重、72/35、4.0 Gate 阈值、Persona 规则阈值与优先级、calibration reason priority。均只存在于 TestDefinition，便于回滚并由 golden/Monte Carlo 复验。

## 37. 下一阶段优先五件事

1. 用真实 AppID 在至少两台不同尺寸手机完成全流程、返回、杀进程恢复和分享测试。
2. 根据 Persona 33.745% fallback、L-T 0.761、S 单题波动做产品审阅，再决定是否调 provisional 参数。
3. 补微信自动化 UI 测试，覆盖快速双击、Q12 重复确认、返回与自动切题竞争。
4. 在不改答题链的前提下实现真实 AdvertisingAdapter，并只启用首页/结果页 slot。
5. 加入第二份小型 TestDefinition 和最简 Test Hub，验证工程确实不是单测试特例。
