# JSONUtils 项目编码与协作规范

本文只维护稳定、可执行的编码与发布不变量；AI 评测、receipt、attestation 和 runtime 协议细节统一由 `docs/AI-ENGINEERING-PLAYBOOK.md`、`docs/AI-EVOLUTION-PLAYBOOK.md` 与 `evals/ai-governance/README.md` 承担，避免在首读上下文重复。

## 项目与技术栈

- 项目：JSONUtils 专业版，全栈 Web 应用并支持 Electron 桌面端。
- 核心：JSON 格式化/验证/转换、JSONPath、AI 智能修复和管理后台。

### 前端 (`frontend/`)

| 类型 | 技术 | 版本要求 |
| --- | --- | --- |
| 框架 | React | 19.x |
| 构建工具 | Vite | 6.x |
| 语言 | TypeScript | 5.x |
| UI 组件库 | Tailwind CSS | 3.x |
| 管理后台 UI | Ant Design | 6.x |
| 编辑器封装 | @monaco-editor/react | 4.x |
| 桌面封装 | Electron | 未固定依赖版本 |

### 后端 (`backend/`)

| 类型 | 技术 | 版本要求 |
| --- | --- | --- |
| 框架 | Spring Boot | 3.x |
| 语言 | Java | 17+ |
| 数据库 | PostgreSQL | - |
| ORM | Spring Data JPA | - |

## 代码风格

### TypeScript / React

- 使用函数组件和 Hooks；组件 `PascalCase`，工具文件/函数 `camelCase`，常量 `UPPER_SNAKE_CASE`。
- 不使用无约束 `any`；为组件 props、API 请求/响应和工具函数声明明确类型。
- 导入顺序为 React、第三方、项目模块、类型；复用已有 service、hook 和工具，不平行造轮子。
- API 调用放在 `services/`，用户错误沿用现有 toast/message，详细诊断只写开发日志。
- 管理后台导航仍在 `frontend/src/admin/App.tsx` 的 `items` 与 `renderContent()` 维护，不假设 React Router。

### Java / Spring Boot

- 保持 Controller → Service → Repository 分层；DTO、entity、config、security 各归其目录。
- 类名 `PascalCase`，方法/变量 `camelCase`，常量 `UPPER_SNAKE_CASE`；DTO 使用 `XxxRequest`、`XxxResponse` 或语义明确的名称。
- Controller 只做协议、鉴权和参数边界，业务逻辑进入 Service；依赖优先构造器注入。
- 管理 API 使用 `/api/admin/`，公开 API 使用 `/api/`，返回结构保持 `code`、`message`、`data`。
- 业务异常交给统一异常处理器，保留可定位日志，不向客户端泄露内部实现或敏感值。

## 文件与注释

- 新管理页面放 `frontend/src/admin/pages/`，对应服务放 `frontend/src/admin/services/`；后端按 controller/service/repository/dto 分层。
- 所有代码注释使用中文，只解释复杂业务、非显然算法、边界条件和接口契约；不要复述代码本身。
- 修改前先读取同类实现和测试，保持现有命名、结构和格式；不顺手重构任务外模块。

## 测试与验证

- 新功能和 Bug 修复补最小回归测试；API/部署/架构变化同步相关文档。
- 先跑最相关测试，再按风险追加 typecheck、lint、build、Maven 或专项门禁；命令和路由见 `docs/AI-ENGINEERING-PLAYBOOK.md`。
- 失败、跳过、环境阻断和未覆盖风险必须如实报告；静态检查或 exit 0 不得夸大成未观察到的运行时/行为保证。

## Git 提交规范

格式：`[Type]简短中文描述`。

| Type | 用途 |
| --- | --- |
| `[Feature]` | 新功能 |
| `[FIXBUG]` | Bug 修复 |
| `[Refactor]` | 重构 |
| `[Style]` | 样式或格式 |
| `[Docs]` | 文档 |
| `[Chore]` | 构建或工具链 |
| `[LOG]` | 更新日志 |

不要擅自 stage、commit、push、reset 或覆盖用户现有修改；只有用户明确授权后才执行对应 Git 写操作。

## CHANGELOG 与版本

- 每次代码修改同步更新 `CHANGELOG.md` 顶部版本区块；内部 AI 基建且不影响前端产物时不递增前端版本。
- 用户可见、准备上线或会触发前端构建的改动，递增 `frontend/package.json` 的 patch 版本，同步 `frontend/package-lock.json`，并在 `CHANGELOG.md` 新建对应版本区块。
- 顶部版本区块使用规范分类标题和 `- **名称**: 描述`，最多 8 条；超过时新开 patch，不能把多轮交付长期堆在同一版本。
- 提交前运行 `node scripts/ci/check-version-consistency.mjs`。

推荐分类：`✨ 新特性`、`🐛 Bug 修复`、`⚡ 性能优化`、`🎨 UI/UE 优化`、`♻️ 代码重构`、`🏗️ 架构与基础设施`、`📝 文档更新`、`🔧 配置变更`、`🔒 安全修复`。

## AI 规则资产更新

- 只有重复踩坑、用户纠偏、验证缺口或可复用实践才做复盘沉淀。长期决策必须写清触发条件、反例、验证方式和适用边界，维护 `docs/AI-GOVERNANCE-DECISIONS.md` 的决策记录、回写追踪和锁定测试，再完成规则/skill 回写与治理校验；一次性偏好和未验证猜测不固化。
- JSONUtils AI 基建的 source of truth 必须入库。workspace/index/HEAD 依次只证明当前未忽略候选、下一提交候选、当前提交可 clone；不得把任何一层冒充安装、任务注册或 behavior。
- 仓库不是 plugin；rules、skills、MCP、hooks、evals 可作为项目资产直接集成，只有 `plugins/<name>/` 是插件包。Codex 治理 MCP 优先由 trusted `.codex/config.toml` 直接注册，项目信任与新任务是加载前置，不依赖插件安装。`.agents/plugins/marketplace.json` 只是 repo catalog；`AVAILABLE` 可发现但不会自动安装、启用或加载插件。
- 项目插件先运行 `node scripts/ci/manage-project-plugins.mjs --check` 做只读诊断；维护者明确同意后才 `--apply`，源码升版后才显式 `--write-lock`，随后新建任务。禁止 hook、CI、postinstall 静默安装，禁止覆盖异源或删除个人 selector。
- 项目源码、trusted project config 加载、marketplace 可发现、插件安装/启用、新任务注册、受保护 runtime/signer 分层取证；个人 marketplace/cache/config 只是派生状态。配置存在或安装匹配不证明 task registration、runtime isolation、signer trust 或 behavior。
- AI 基建先建代表 eval case，并显式区分 `behavior` 与 `component-boundary`。没有与当前版本匹配的脱敏真实 outcome 时保持 `unknown`；component、未验信 trace 和自报 pass 不进入 confirmed coverage。
- fixed runner、validation、writer 和 artifact 工具默认 preview/read-only；禁止 CI、hook、postinstall 或手工编辑 outcome/receipt JSONL。只有本地维护者复核后才可显式写账，详细链路以 `evals/ai-governance/README.md` 为准。
- 敏感正文、prompt、隐藏推理、凭据、命令/stdout 和 MCP 结果正文不得进入治理 ledger。真实 model trial 必须由 checkout 外控制面隔离 key-bearing Codex、待测 MCP、grader 与 signer；仓内 component 不得自证该边界。
- `.agents/skills/` 是项目 skill 唯一可编辑语义源码；不得在 `.codex/skills/` 复制同名 skill。Claude 原生发现只允许 `.claude/skills/*/SKILL.md` 普通文件薄 adapter，由 canonical name/description 和固定读取模板逐字节派生，不得独立维护正文、版本或触发语义；静态 adapter 只算 component evidence。修改 skill 时保留 metadata、UI 元数据、核心章节、eval 与发布追踪，并控制 mandatory context 余量。
- `.codex/hooks.json` 只允许单一只读 `SessionStart` advisory；不得增加自动批准、prompt/transcript/环境读取、网络、写入或阻断能力。配置/单测只算 component，新任务真实触发前 behavior 仍为 unknown。
- AI 资产变更运行 `node scripts/ci/check-ai-governance.mjs`、相关单测、`node scripts/ci/check-maintainability-budgets.mjs --top 35 --no-all` 和 `node scripts/ci/check-ai-asset-distribution.mjs --workspace`；新增资产同步 `docs/AI-ASSET-REGISTRY.md` 或登记显式豁免。

## CHANGELOG 格式示例

```markdown
## v1.x.x (YYYY-MM-DD)

### 🏗️ 架构与基础设施

- **变更名称**: 面向维护者说明结果、边界和必要迁移。
```
