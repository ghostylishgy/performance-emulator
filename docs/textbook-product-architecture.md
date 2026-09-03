# 教材产品架构基线 v1

## 目录与依赖方向

```text
main package
  config/products.ts
  platform/product-routing.ts
  platform/analytics.ts
        ^
        | subpackage may import shared main infrastructure
        |
pages/textbook-desk/                 # independent subpackage
  types.ts                           # runtime data contracts
  targets.ts                         # controlled target allowlist
  catalog.ts                         # reviewed runtime metadata only
  progression.ts                     # explicit nextTerm/nextGrade
  academic-phase.ts                  # date -> ordered recommendations
  storage.ts                         # versioned product preference
  share.ts                           # validated share state and payload
  view-state.ts                      # first_setup/semester_desk state
  analytics.ts                       # product event facade
  official-reader.ts                 # single clipboard action
  index.*                            # intentionally minimal page shell

scripts/textbook-catalog-source.ts   # build-time source sanitizer; not uploaded
```

主包不得 import 教材分包模块。教材分包可以复用主包 registry、routing 和 Analytics。`shareEntry` 直接指向教材分包页面，因此 `product-entry` 不需要新增教材特例。

## 数据契约

`TextbookRecord` 只包含运行所需字段：

```ts
id
title
stage                 // primary | junior
grade                 // primary_1 ... junior_9
term                  // upper | lower
subject
schoolSystem          // compulsory_6_3
variant?
officialReaderUrl
verifiedAt
editionNote?
```

数据采用平铺记录，同一 subject 可以对应多个 record；UI 使用 `groupBooksBySubject()` 组织 `subject -> books[]`，不得假设一科只有一本。

离线源清洗器严格要求：

```text
xdtype = 义务教育（六三学制）
小学年级对应 xd = 小学
初中年级对应 xd = 初中
cc 仅上册/下册
officialReaderUrl = https://book.pep.com.cn/<numeric id>/
```

源字段 `pdfurl` 只允许存在于仓库外/构建期输入适配器；runtime 一律命名为 `officialReaderUrl`。

## 时间模型

`resolveAcademicPhase()` 只按本地月份得到：

| 月份 | AcademicPhase |
|---|---|
| 9–12 | `upper_term` |
| 1–2 | `winter_break` |
| 3–6 | `lower_term` |
| 7–8 | `summer_break` |

`buildSemesterDeskRecommendations(homeGrade, date)` 返回带 priority 的展示模型。时间只决定推荐顺序，不写 Storage，也不改变 `homeGrade`。

## Progression Mapping

- `resolveNextTermTarget(grade, 'upper')` 返回同年级下册；下册返回 null。
- `resolveNextGradeTarget(grade)` 使用完整显式表。
- `primary_6 -> junior_7_upper` 是显式跨学段映射。
- `junior_9` 没有下一年级，不推导高中内容。
- catalog 只负责解析目标数据，绝不负责推断教学阶段顺序。

## 页面状态

```text
first_setup
  no valid saved preference and no valid share target

semester_desk
  local: saved homeGrade -> academic recommendations -> active target
  share: validated mode + target -> transient active target
```

合法分享在读取 Storage 前解析。分享视图不写入、不清除、不迁移接收者偏好；只有后续 UI 中明确的用户确认动作可以保存 `homeGrade`。

## Storage

固定 key：

```text
assessment-lab:preference:textbook-desk:v1
```

保存：

```ts
schemaVersion: 1
homeGrade
copyHelpSeen
selectedEnglishVariant?
lastConfirmedAcademicYear?
```

不保存 active target、preview target、展开状态、弹层状态或由月份计算出的推荐顺序。未知版本、损坏值和不合法年级 fail closed，不自动覆盖原值。

## Share Routing

受控 target 枚举覆盖一至九年级上下册。合法形式：

```text
product_id=textbook_desk
source=share
mode=current|preview
target=primary_6_upper|junior_7_upper|...
```

分享 payload 统一由 `buildTextbookSharePayload()` 生成。`parseTextbookShareState()` 同时校验 source、mode 和 target；大小写错误、未知值、路径字符串均拒绝。非法参数回到正常本地入口，不拼接文件名或 URL。

## Analytics Contract

复用 `platform/analytics.ts`，教材层只能通过本分包的 facade 调用：

- `trackBookSetOpen()` -> `book_set_open`
- `trackOfficialLinkCopy()` -> `official_link_copy`
- `trackTextbookShare()` -> `share_click`
- `trackOfflineInterest()` -> `offline_interest`

允许字段：`mode/viewer_grade/content_stage/content_grade/term/subject/book_id/target/reason/action_result/source`。禁止 PII 和剪贴板内容。
Smoke Test 的 `reason` 只能取 `offline/print/preview/emergency/other`；`other` 只表示分类，不携带自由文本。

## Official Reader Action

`copyOfficialReaderUrl(book, context)` 是唯一剪贴板入口：

1. 校验 numeric id；
2. 校验 URL 与 `https://book.pep.com.cn/<id>/` 完全相等；
3. 调用 `wx.setClipboardData`；
4. 返回 success/failure；
5. 记录不含 URL 正文的 Analytics。

教材组件不得自行调用 `wx.setClipboardData`，也不得接受任意 URL。

## 当前风险

- runtime 仅有首发 17 条数据，其他年级结构可用但不可在 UI 假装已有内容。
- `verifiedAt` 不是永久可用性保证；人教社页面存在 WAF，必须真机复核。
- 当前 product 暂停启用，UI Agent 完成前分享入口不可正式使用。
- 当前 `featured` 没有产品大厅消费者；推广必须使用指定分享路径/码或后续明确入口。
- 微信后台服务类目、客服和 Analytics 配置不在代码仓库中，属于上线前人工门。
