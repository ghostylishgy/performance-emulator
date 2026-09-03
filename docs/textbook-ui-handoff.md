# SECOND BACKPACK UI IMPLEMENTATION HANDOFF

## 当前状态

- 稳定内部 ID：`textbook_desk`。
- 公开名称只由 `miniprogram/config/products.ts` 的 registry 提供；UI 使用 ViewModel 的 `productName`。
- 产品仍为 `enabled: false` / `featured: false`，未经 Codex 验收不得正式开启。
- Foundation 基线 commit：`0503c64 feat(textbook-desk): establish product foundation`。

## Gemini 可编辑

- `miniprogram/pages/textbook-desk/index.wxml`
- `miniprogram/pages/textbook-desk/index.wxss`
- `miniprogram/pages/textbook-desk/components/**`
- `miniprogram/pages/textbook-desk/styles/tokens.wxss`
- `miniprogram/pages/textbook-desk/index.ts` 仅限 UI 显隐、sheet 开关与已定义 Action 的事件协调
- `tests/unit/textbook-ui-*.test.ts` 中的 UI 契约与视觉验收测试

为本地预览可临时将 registry 的 `textbook_desk.enabled` 改为 true；交付前必须恢复 false。

## Gemini 禁止编辑

- `miniprogram/app.wxss` 及全局 `page` / `button` / `.card` 样式
- `miniprogram/pages/textbook-desk/types.ts`
- `targets.ts`、`catalog.ts`、`progression.ts`、`academic-phase.ts`
- `storage.ts`、`share.ts`、`analytics.ts`、`official-reader.ts`、`view-state.ts`
- `ui/state-adapter.ts` 与 `ui/actions.ts`；若现有契约不足，应停止并提交架构变更请求
- `love_accident` 和 `performance` 的页面、配置、视觉、评分、分享与缓存逻辑

## 页面 ViewModel 契约

`resolveTextbookPageState(route, preference, now)` 是页面状态唯一入口，返回 `TextbookDeskViewModel`：

- `productName`：来自 registry 的公开名称。
- `screen`：`first_setup | semester_desk`。
- `user`：`hasHomeGrade` 与可选 `homeGrade`。
- `academicPhase`：`upper_term | winter_break | lower_term | summer_break | null`。
- `seasonalLabel`：已派生的展示标签，页面不解析月份。
- `current / nextTerm / nextGrade`：可选的 `TextbookBookSetViewModel`。
- `layout.hero / secondary / history`：已排序的页面模块，页面不再判断年级或季节。
- `share.kind`：`normal | current_share | preview_share`。
- `share.mode / target / showPreviewSocialHint`：已校验的分享上下文。

`TextbookBookSetViewModel` 已包含 target、mode、关系标签、教材数、books、subjectGroups、available 和 priority。无数据时必须诚实呈现，不得填充虚构教材。

## 可调用 Action

页面和组件只通过 `ui/actions.ts` 调用副作用：

- `setTextbookHomeGrade()`：显式设置/切换 homeGrade。
- `selectTextbookEnglishVariant()`：保存已确认的英语版本。
- `resolveTextbookPageState()`：生成完整 ViewModel。
- `openTextbookBookSet()`：上报真实展开的教材集。
- `copyTextbookOfficialUrl()`：复制白名单官方阅读入口。
- `shareTextbookBookSet()`：构建 current/preview 分享并上报。
- `defaultTextbookSharePayload()`：首次设置态的通用分享。
- `recordTextbookOfflineInterest()`：上报闭合枚举的离线需求原因。

禁止在 WXML/页面 TS 中直接调用 `wx.setClipboardData`、创建 Storage key、解析月份、计算 nextGrade、拼接分享 query 或直接 `reportEvent`。

## 已建组件骨架

- `semester-header`：产品名与 seasonal label。
- `grade-picker`：年级选择与 `select` 事件。
- `book-set-summary`：Hero/次级/历史教材集容器。
- `textbook-row`：教材行与 `copy` 事件，内置临时学科 monogram。
- `share-landing-hint`：仅 preview 分享落地显示。
- `scaffold-sheet`：英语版本、年级切换、复制帮助、需求反馈共用的最小 sheet 容器；不得为每个 sheet 复制一套基础结构。

## Token 与样式边界

- Token 文件：`miniprogram/pages/textbook-desk/styles/tokens.wxss`。
- 变量仅定义在 `.textbook-desk, :host` 内，统一使用 `--td-*` 前缀。
- 当前色值、间距和字号只是 integration placeholder，不是正式视觉定稿。
- 所有教材组件都使用 `styleIsolation: isolated`。

## 不可破坏的产品边界

- 一个物理页面，通过 First Setup / Semester Desk / Bottom Sheet 切换。
- 时间只改变模块权重，不改变已保存 homeGrade。
- 合法分享落地优先于 Storage，且不读取、覆盖或清理接收者偏好。
- 不使用教材封面、教材页面、章节目录或所谓年份标签。
- 不实现 PDF、web-view、下载、后端、AI、账号、支付、订阅消息或任意 URL 输入。

## UI 测试入口

- `tests/unit/textbook-ui-adapter.test.ts`：ViewModel、季节权重、六升七和分享隔离。
- `tests/unit/textbook-ui-scaffold.test.ts`：名称集中化、组件隔离、Token 作用域和页面禁止调用。
- 现有 `textbook-*.test.ts` 继续覆盖 catalog、progression、storage、share 和 foundation 边界。

## 正式 UI 后必须交回 Codex 验收

1. registry 启用时机与默认产品未改变；
2. 一至九年级 Setup 在有/无数据下均安全；
3. 一年级缺英语、六年级英语三版本；
4. 六升七和 8 月/9 月/1 月/3 月日期边界；
5. 分享 target 白名单与接收者 Storage 隔离；
6. 官方 URL 复制成功/失败与真实浏览器访问；
7. Analytics 后台实收；
8. 小屏、安全区、按钮和长教材名；
9. 主包、love-result、textbook-desk 分包实际上传体积；
10. typecheck、config validation、全量测试、diff check、Zero Backend Audit。
