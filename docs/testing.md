# V3 测试策略

## 自动验证

```powershell
npm.cmd run typecheck
npm.cmd run validate:config
npm.cmd test
git diff --check
```

当前自动测试覆盖：

- 连续 25 题 session、版本隔离和异常进度；
- BaseScore、OrgScore、普通校准、4.0 gate、Persona、死因和证据；
- 8 persona × 6 performance score × 7 deathCause 的 pair code round trip；
- checksum、非法字符、截断、不支持版本和非法枚举；
- 大小写、分享参数解析和 pendingPairCode 本地 Storage；
- 36 个无序关系唯一性与 A+B/B+A 对称；
- 跨题 synthesis 的 required/optional/excluded、真实回答约束、类别与死因去重；
- 单人/关系 Canvas 模型、高 DPR、长文案折行和相册拒绝后再授权；
- corrupt progress 统一恢复及 Storage 写入失败降级；
- 运行时代码不存在 `wx.cloud`、网络请求、云函数目录或云端运行依赖。

固定 seed Monte Carlo 仅用于检查分布和不可达门槛，不代表真实玩家分布。

## 手工验收

1. 连续完成 Q1-Q25，返回修改、自动前进和恢复不跳题。
2. 结果页在 3~4 秒内显示 5 句计算文案，人格、死因、证据自动出现，最多一次点击后显示绩效。
3. 生成的 5 位对口径码可以复制，清缓存前可重复使用。
4. 分享卡片 query 自动携带 pairCode；好友首页显示“有人等你对口径”。
5. 好友完成答题后无需联网即可解码并显示关系结果。
6. 小写手输可用，`0/O/1/I/L`、截断和 checksum 错误均给出明确提示。
7. 飞行模式下单人测试、pair code 生成、手动输入和关系鉴定仍能工作。
8. 在不同尺寸真机复核 Reveal、输入框、复制按钮和分享返回。
9. 分别保存单人结果卡和关系卡，覆盖首次授权、拒绝后再授权、Android/iOS 高 DPR 与长文案。
10. 从好友分享进入，中断答题再恢复；完成后应自动消费 pendingPairCode，无需再次手输。

历史上已经失效的 `test:golden` 与 `test:archetype` 已从公开脚本移除；当前 V3 验证统一由 `npm test` 覆盖。
