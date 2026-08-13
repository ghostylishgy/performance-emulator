# Assessment Lab Mini Program

一个零服务器、零 CloudBase、零数据库、零登录的配置驱动微信原生娱乐测评工程。首个 TestDefinition 是《大厂绩效模拟器》，工程边界允许后续主要通过新增配置接入其他测试。

## 当前能力

- 微信原生小程序 + TypeScript，一份动态 Quiz 页面承载全部 16 题
- Q4/Q8 自动轻转场、Q12 个人结果 Checkpoint、组织扫描与 Q13–Q16 校准
- 个人答案快照冻结；组织阶段不能修改 P/V/I/K/F/A/O
- effects 累加、理论区间自动归一化、个人绩效、组织校准、独立 4.0 Gate
- signals、PersonaRule、hidden result、ResultViewModel
- 本地断点续答、版本隔离、重新开始、微信原生分享
- no-op AnalyticsAdapter、关闭态 AdvertisingAdapter、配置化 AdSlot
- unit、golden、10 组 archetype、固定 seed Monte Carlo

## 开发环境

- Node.js 22+
- npm 11+
- 微信开发者工具（需支持 TypeScript 编译插件）

安装并验收：

```powershell
npm install
npm run typecheck
npm run validate:config
npm test
npm run simulate
npm run simulate:uniform
```

## 在微信开发者工具中打开

1. 打开微信开发者工具，选择“导入项目”。
2. 项目目录选择本仓库根目录 `D:\Dev\assessment-lab-miniapp`。
3. 工程已在 `project.config.json` 中声明 `miniprogramRoot: miniprogram/` 和 TypeScript 编译插件。
4. 当前 `appid` 为 `touristappid`，可用于本地体验；需要真机预览、分享验证或上传时，换成有权限的真实小程序 AppID。
5. 编译后从首页依次走完 16 题。Q12 必须先显示个人努力建议，确认后才进入组织阶段。

本轮已通过本地 TypeScript、配置、纯函数和模拟验收。尚未使用真实 AppID 进行真机预览、分享卡落地或广告资格验证。

## 目录结构

```text
miniprogram/
  config/                 TestDefinition、指标定义、测试注册表、正式 C 版内容
  domain/                 评分、归一化、规则、校准、Persona、状态机、模拟
  platform/               Storage、分享、Analytics、Advertising 适配层
  components/             通用题卡、进度、Checkpoint、结果、反思、AdSlot
  pages/home|quiz|result/  首页、唯一动态答题页、结果页
scripts/                  配置校验、Monte Carlo、审计辅助脚本
tests/unit/               纯函数、配置、Storage、状态与模拟测试
tests/golden/             固定答案回归真值
tests/archetype/          10 组产品角色向量
reports/                  固定 seed Monte Carlo 完整 JSON 报告
docs/                     架构与本轮工程报告
```

## TestDefinition

通用模型位于 `miniprogram/config/types.ts`。当前正式测试位于：

`miniprogram/config/tests/performance-simulator/index.ts`

页面不包含任何具体题目或评分阈值。新增测试时，应新增 TestDefinition 并注册到 `test-registry.ts`；非法 metric、跨阶段 effects、未知 signal、非法 Persona Rule、非法广告位等会 fail fast。

## 评分管线

```text
answers
→ raw metrics / signals / persona evidence
→ theoretical range normalization
→ performanceIndex
→ baseOutcome
→ frozen personal snapshot
→ organizationScore
→ generic calibration (-1/0/+1, normal scale clamp)
→ special 4.0 gate
→ persona matching / hidden results
→ ResultViewModel
```

`baseOutcome` 只使用 P/V/I/K/F；R/T 不会进入个人绩效。完整结果通过 `evaluateFromFrozen()` 接收冻结的 Q1–Q12 和组织答案，不信任页面传入的结果字符串。

## 测试与模拟

- `npm test`：unit + golden + 10 组 archetype + fixed-seed simulation
- `npm run validate:config`：验证注册表及全部配置约束
- `npm run simulate`：100,000 次 weighted，A/B/C/D = 0.35/0.32/0.20/0.13
- `npm run simulate:uniform`：100,000 次 uniform 对照

完整报告：

- `reports/monte-carlo-weighted.json`
- `reports/monte-carlo-uniform.json`

## 当前未完成

- 真实 AppID 真机兼容性、分享卡和平台审核验证
- 真实广告单元与微信广告生命周期 Adapter
- 最终视觉稿、复杂动画、Canvas 海报、Radar Chart
- 第二份正式测试、Test Hub、历史结果和 Persona 收藏
- 生产统计平台接入（当前 Analytics 为 no-op）

## Provisional 参数

下列参数全部集中在 TestDefinition，可在保留回归测试的前提下调整：

- organizationScore 权重
- 72/35 校准阈值
- 4.0 Gate 阈值
- Persona 规则阈值与优先级
- calibration reason 优先级

正式 16 题、effects、P/V/I/K/F 权重、base 阈值、两阶段机制、Q12 Checkpoint、普通校准最多 ±1、4.0 不可普通升级、答题中无广告均未改动。

