# UI IMPLEMENTATION HANDOFF

## 可以编辑

- `miniprogram/pages/textbook-desk/index.wxml`
- `miniprogram/pages/textbook-desk/index.wxss`
- `miniprogram/pages/textbook-desk/index.json`
- `miniprogram/pages/textbook-desk/index.ts` 中仅限 UI 状态绑定与用户事件协调
- 可在 `miniprogram/pages/textbook-desk/components/` 新增教材产品专属组件
- 可新增教材产品专属、非版权内容的本地品牌分享资源
- 对应教材 UI 测试
- 为本地预览可临时将 `miniprogram/config/products.ts` 中 `textbook_desk.enabled` 改为 true；交付时必须恢复 false，最终启用由 Codex 验收后单独决定

## 不得编辑或重写第二套

- `types.ts`：唯一数据契约
- `targets.ts`：唯一 target allowlist
- `catalog.ts`：唯一 runtime 教材数据入口
- `progression.ts`：唯一 nextTerm/nextGrade 逻辑
- `academic-phase.ts`：唯一月份和推荐排序逻辑
- `storage.ts`：唯一教材偏好 Storage 入口
- `share.ts`：唯一分享参数与标题入口
- `analytics.ts`：唯一教材 Analytics facade
- `official-reader.ts`：唯一剪贴板入口
- `view-state.ts`：唯一初始/分享落地状态解释器

如这些模块无法支持 UI，不得在页面内复制逻辑，应停止并提交架构变更申请。

## 页面状态读取

- 首次进入：`resolveTextbookEntryState()` 返回 `first_setup`。
- 已保存年级：返回 `semester_desk` 和当月 priority 最高 target。
- 合法分享：返回 transient `semester_desk`，分享 target 优先且不读取/覆盖接收者偏好。
- UI 要展示完整推荐模块时，调用 `buildSemesterDeskRecommendations(homeGrade, now)`。
- 读取教材：`getBooksForTarget(target)`。
- 按学科分组：`groupBooksBySubject(books)`；必须允许 0 本和多版本。

## 用户确认与 Storage

- 用户在 First Setup 明确确认后，才调用 `saveTextbookPreference()`。
- 时间变化、预览点击和分享落地都不得写 `homeGrade`。
- 新学年升级必须是显式确认动作。
- 英语版本可保存到 `selectedEnglishVariant`，不得默认选择或隐藏其他版本。

## 分享

- 当前教材：`buildTextbookSharePayload('current', target)`。
- 下一册/下一年级：`buildTextbookSharePayload('preview', target)`。
- 页面不得自行串 query。
- `source=share && mode=preview` 时可以显示已批准的轻提示；不得引入好友关系、openid 或云端计数。

## 链接动作

- 只能调用 `copyOfficialReaderUrl(book, analyticsContext)`。
- 成功后 UI 可以提示去系统浏览器打开。
- 不得实现 `web-view`、下载、PDF viewer 或任意网址输入。

## Analytics

- 列表真实展开/切换后调用 `trackBookSetOpen()`。
- 分享按钮调用 `trackTextbookShare()`。
- Smoke Test 选定用途后调用 `trackOfflineInterest()`。
- 复制事件由 `copyOfficialReaderUrl()` 内部记录，UI 不得重复上报。
- 不得增加 PII 字段。

## UI LOCK

- 一个物理页面，通过 First Setup / Semester Desk / Bottom Sheet 状态切换完成。
- 同页支持当前教材、下一册、下一年级/下一学段前瞻。
- 时间改变模块权重，不改变保存年级。
- 没有数据就诚实显示无记录；不得填充虚构教材。
- 不使用教材封面、教材页面、章节目录或所谓年份标签。
- 不实现 PDF、后端、AI、账号、支付、订阅消息。
- 不修改 `love_accident`、`performance` 的代码、视觉和 LOCK 逻辑。

## 完成 UI 后必须交回 Codex 验收

1. registry 启用时机与默认产品是否保持不变；
2. 一至九年级 Setup 是否都能安全处理有/无数据；
3. 一年级缺英语、六年级英语三版本；
4. 六升七和 8 月/9 月/1 月/3 月日期边界；
5. 分享 target 白名单与接收者 Storage 隔离；
6. 官方 URL 复制成功/失败与真实浏览器访问；
7. Analytics 后台实收；
8. 小屏、安全区、按钮和长教材名；
9. 主包、love-result、textbook-desk 分包实际上传体积；
10. typecheck、config validation、全量测试、diff check、Zero Backend Audit。
