# V3 架构边界

## 基础设施约束

- Native WeChat Mini Program
- Local-first
- Zero Backend
- Zero CloudBase
- Zero Login
- Server fixed cost: RMB 0/month

本项目不使用云函数、云数据库、自建 API、远程数据库、Redis、账户体系或常驻后端。能在客户端完成的逻辑不上云。

## 分层

1. Content：题目、选项、人格、关系、文案和主题配置。
2. Evaluation：BaseScore、组织校准、Persona、死因、证据和 pair code 纯函数。
3. Presentation：home、连续 25 题 quiz、result 和通用组件。
4. Platform：`wx.Storage`、微信原生分享及无远程副作用的 Analytics 抽象。

评分域不导入 `wx`，同一组答案在任何设备上产生同一结果。

## 本地数据流

```text
25 answers in wx.Storage
  -> local scoring/persona/death-cause/evidence
  -> local ResultViewModel

local result
  -> encodePairCode()
  -> 5-character self-contained code
  -> WeChat share query or manual copy
  -> decodePairCode() on peer device
  -> pendingPairCode in peer wx.Storage
  -> local symmetric relationship lookup
```

本地缓存清除或卸载后数据丢失是当前接受的边界。完整答案、结果和 pendingPairCode 不同步到远程账户。

## Pair code

V3 使用固定 5 位 Base31 编码，字符表排除 `0/O/1/I/L`。19-bit payload 为：

```text
algorithmVersion  3 bits
persona           4 bits
performanceScore  3 bits
deathCause        3 bits
reserved          6 bits
checksum          5 bits (CRC-5 style)
```

关系结果只使用双方 persona；score 和 deathCause 仅作为编码中的未来兼容数据。`pairKey()` 对人格 ID 排序，因此 A+B 与 B+A 使用相同的 36 组关系配置。

编码只用于错误检测，不提供密码学真实性或防伪造能力。娱乐结果不值得引入服务器信任链。

## 平台能力边界

- Analytics：只允许微信官方统计/分析能力；当前适配器不发送远程事件。细粒度事件无法在零后端获得时暂不支持。
- Poster：如实现，只能使用客户端 Canvas 生成和保存；不得上传服务器或对象存储。
- Share：使用微信官方分享能力，query 可携带自包含 pairCode。
- Mini Program Code：只有在微信提供完全原生、无需自建后端的能力时才允许接入；当前未实现。

