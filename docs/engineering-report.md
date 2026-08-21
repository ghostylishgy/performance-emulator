# V3 工程状态

原 2026-08-13 工程报告描述的是已退出运行路径的 16 题/Q12 checkpoint 架构，已不再作为当前实现依据。

当前权威说明：

- 产品运行和本地验证：`README.md`
- 基础设施与分层约束：`docs/architecture.md`
- 自动及手工验收：`docs/testing.md`

当前 V3 为原生微信小程序、连续 25 题、纯客户端确定性评估。架构固定为 Local-first、Zero Backend、Zero CloudBase、Zero Login，固定服务器成本为 RMB 0/month。

评分、人格、死因、pair code 和双人关系全部本地计算；进度和 pendingPairCode 只写入 `wx.Storage`。不存在云函数、云数据库、远程答案存储或账户系统。未来结果海报只允许由客户端 Canvas 生成。
