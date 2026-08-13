# 架构边界

## 四个独立层

1. Content：TestDefinition、题目、选项、文案、主题和广告逻辑位。
2. Evaluation：纯函数累计、归一化、规则解释、校准、Persona 和隐藏结果。
3. Presentation：home、唯一动态 quiz、result 与通用组件，只消费配置和 ViewModel。
4. Platform：Storage、分享、Analytics、Advertising；评分域不导入 `wx`。

## 个人快照边界

Q1–Q12 答完只进入 checkpoint，尚未冻结，返回修改会重新计算。用户确认后，`freezePersonalProgress()` 复制个人答案并设置 `baseOutcomeFrozen`。此后：

- `setAnswer()` 对 personal 问题直接抛错；
- UI 的上一题下界变为 Q13；
- `evaluateFromFrozen()` 只从 `frozenPersonalAnswers` 重算 base；
- Q13–Q16 的 effects 还会由 MetricDefinition 的 `collectFrom` 和配置校验双重限制。

因此冻结不是显示状态，也不是保存 `3.5+` 字符串，而是一份可审计、可重算的答案真值。

## 规则系统

Persona 与 special gate 使用白名单 RuleCondition：`all`、`any`、`not` 和 `eq/neq/gt/gte/lt/lte/in`。可引用 normalizedMetric、rawMetric、signal、personaEvidence 和有限 result 字段；不使用 `eval`、函数字符串或配置回调。

普通校准在五档有序 scale 内 clamp。4.0 不属于该 scale，只能由 special gate 产生。Persona 与 hidden result 均不能修改 finalOutcome。

