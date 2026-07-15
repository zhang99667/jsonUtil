# JSONUtils 项目 AI 编码规范

本文档用于指导 AI 助手在该项目中进行代码编写和修改时应遵循的规范。

## 项目概述

- **项目名称**: JSONUtils 专业版
- **项目类型**: 全栈 Web 应用（支持 Electron 桌面端）
- **主要功能**: JSON 格式化、验证、AI 智能修复、JSONPath 查询

---

## 技术栈规范

### 前端 (frontend/)

| 类型 | 技术 | 版本要求 |
|------|------|----------|
| 框架 | React | 19.x |
| 构建工具 | Vite | 6.x |
| 语言 | TypeScript | 5.x |
| UI 组件库 | Tailwind CSS | 3.x |
| 管理后台 UI | Ant Design | 6.x |
| 编辑器封装 | @monaco-editor/react | 4.x |
| 桌面封装 | Electron | 未固定依赖版本 |

### 后端 (backend/)

| 类型 | 技术 | 版本要求 |
|------|------|----------|
| 框架 | Spring Boot | 3.x |
| 语言 | Java | 17+ |
| 数据库 | PostgreSQL | - |
| ORM | Spring Data JPA | - |

### 管理后台 (frontend/src/admin/)

| 类型 | 技术 |
|------|------|
| UI 组件库 | Ant Design 6 |
| 路由 | 状态驱动（非 React Router） |

---

## 代码风格规范

### TypeScript / React

1. **组件定义**：使用函数式组件 + React.FC 类型
   ```typescript
   const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
     // ...
   };
   ```

2. **状态管理**：优先使用 React Hooks (useState, useEffect, useCallback, useMemo)

3. **命名规范**：
   - 组件文件：PascalCase (如 `TrafficStats.tsx`)
   - 工具函数文件：camelCase (如 `transformations.ts`)
   - 常量：UPPER_SNAKE_CASE
   - 接口/类型：PascalCase，以 `I` 或具体含义命名

4. **导入顺序**：
   ```typescript
   // 1. React 相关
   import React, { useState, useEffect } from 'react';
   // 2. 第三方库
   import { Button, Card } from 'antd';
   // 3. 项目内部模块
   import { myService } from '../services/myService';
   // 4. 类型定义
   import type { MyType } from '../types';
   ```

5. **API 服务封装**：
   - 所有 API 调用放在 `services/` 目录
   - 使用 TypeScript 接口定义请求/响应类型
   - 统一使用 request.ts 中的封装方法

### Java / Spring Boot

1. **包结构**：
   ```
   com.jsonhelper.backend
   ├── controller/    # REST API 控制器
   ├── service/       # 业务逻辑层
   ├── repository/    # 数据访问层
   ├── entity/        # JPA 实体
   ├── dto/           # 数据传输对象
   │   ├── request/   # 请求 DTO
   │   └── response/  # 响应 DTO
   ├── config/        # 配置类
   ├── security/      # 安全相关
   └── common/        # 公共组件
   ```

2. **命名规范**：
   - 类名：PascalCase
   - 方法/变量：camelCase
   - 常量：UPPER_SNAKE_CASE
   - DTO 命名：`XxxDTO`, `XxxRequest`, `XxxResponse`

3. **API 设计**：
   - RESTful 风格
   - 管理后台 API 前缀：`/api/admin/`
   - 公开 API 前缀：`/api/`
   - 返回统一响应格式

4. **注解使用**：
   ```java
   @RestController
   @RequestMapping("/api/admin/xxx")
   @RequiredArgsConstructor  // Lombok 构造器注入
   public class XxxController {
       private final XxxService xxxService;
   }
   ```

---

## 文件组织规范

### 新增功能时

1. **前端页面**：`frontend/src/admin/pages/XxxPage.tsx`
2. **前端服务**：`frontend/src/admin/services/xxx.ts`
3. **后端控制器**：`backend/.../controller/XxxController.java`
4. **后端服务**：`backend/.../service/XxxService.java`
5. **DTO**：`backend/.../dto/response/XxxDTO.java`

### 修改路由/导航

- 前端 Admin 路由在 `frontend/src/admin/App.tsx` 的 `items` 数组和 `renderContent` 函数中配置

---

## 注释规范

**重要：所有注释必须使用中文**

1. **必须添加注释的场景**：
   - 复杂业务逻辑
   - 非显而易见的算法
   - 重要的边界条件处理
   - API 接口说明
   - 函数/方法的功能说明

2. **注释风格**：
   ```typescript
   // 单行注释：解释下一行代码的作用
   
   /**
    * 获取流量统计概览数据
    * @param days 统计天数范围
    * @returns 流量概览数据对象
    */
   ```

   ```java
   /**
    * 获取指定时间范围内的 IP 访问排行
    * @param days 统计天数
    * @param limit 返回条数限制
    * @return IP 统计列表
    */
   ```

3. **注释示例**：
   ```typescript
   // 计算趋势图的最大值，用于百分比展示
   const maxPv = Math.max(...trend.map(t => t.pv), 1);
   
   // 处理本地/内网 IP 的特殊情况
   if (isPrivateIp(ip)) {
     return '本地/内网';
   }
   ```

---

## 错误处理规范

### 前端

- API 调用统一使用 try-catch
- 错误信息使用 Toast 或 Message 提示用户
- 控制台记录详细错误信息用于调试

### 后端

- 业务异常使用自定义 Exception
- 统一异常处理返回标准错误响应
- 记录异常日志

---

## 测试规范

- 新增功能应有对应的测试用例
- 修改现有功能需确保不破坏现有测试
- API 修改需更新相关文档

---

## Git 提交规范

### 提交信息格式

```
[Type]简短描述
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `[Feature]` | 新功能 | `[Feature]流量统计添加访客地区` |
| `[FIXBUG]` | Bug 修复 | `[FIXBUG]修复保存失效问题` |
| `[LOG]` | 更新日志 | `[LOG]更新 CHANGELOG 日志` |
| `[Refactor]` | 代码重构 | `[Refactor]前后端架构拆分` |
| `[Style]` | 样式调整 | `[Style]优化工具栏样式` |
| `[Docs]` | 文档更新 | `[Docs]更新 README` |
| `[Chore]` | 构建/工具 | `[Chore]Docker 配置` |

### 提交示例

```bash
# 新功能
git commit -m "[Feature]流量统计添加访客地区分布"

# Bug 修复
git commit -m "[FIXBUG]修复撤销操作TAB粘连问题"

# 日志更新
git commit -m "[LOG]更新 CHANGELOG 日志"

# 优化相关
git commit -m "[Feature]优化专项-UI UE"
```

---

## CHANGELOG 更新规范

**重要：每次提交代码修改时，必须同步更新 `CHANGELOG.md`**

### 更新位置

在 `CHANGELOG.md` 文件顶部维护当前发布版本区块。

### 发布节奏

- 用户可见、准备上线或会触发前端构建的改动，先递增 `frontend/package.json` 的 patch 版本，并同步 `frontend/package-lock.json`。
- 同步在 `CHANGELOG.md` 顶部新建对应版本区块，只记录本次发布内容，不要把多轮提交长期追加到同一个版本。
- 顶部版本区块必须包含规范分类标题，例如 `### 🏗️ 架构与基础设施`，列表项使用 `- **功能名称**: 功能描述`，避免裸 bullet 或自定义分类进入发布说明。
- 顶部版本区块最多保留 8 条列表项；超过时必须新开下一个 patch 版本，避免一个版本下堆积几十条提交。
- 提交前运行 `node scripts/ci/check-version-consistency.mjs`，校验包版本、锁文件、CHANGELOG 顶部版本、顶部条目数量和发布说明结构。

### AI 规则资产更新

- 只有重复踩坑、用户纠偏、验证缺口或可复用实践适合做复盘沉淀；一次性偏好和未验证猜测不要写成长期规则。
- 凡为 JSONUtils 建设的 AI 基建权威源必须入库成为项目资产。分发全集包含必需文件、引用资产、自动发现资产、AI 治理实现/测试、完整 eval 数据和 CI/local-ci 控制面；workspace 要求当前路径是存在且未被 ignore 的普通文件，Git index/HEAD 直接把当前原始字节计算为 blob OID，并精确匹配 stage-0/对象类型与 `100644`/`100755` mode，同时禁用 replace refs；index 只证明下一次提交候选，只有 CI 的 HEAD 视图才能证明所测提交中的当前版本可被其他维护者 clone。`.agents/plugins/marketplace.json` 是项目内插件目录清单/索引，`plugins/` 承载插件源码、manifest、skill、MCP、测试和版本，`.agents/plugins/plugin-lock.json` 绑定完整 selector、版本、文件集和内容摘要。个人 marketplace、安装 cache 或 checkout 外副本只是派生运行状态，不得成为 source of truth；lock 或缓存匹配只证明 repository content / installed-copy component，不得被解读为 protected runtime、trusted signer、当前任务注册或 behavior pass。
- 仓库不是 plugin，只有 `plugins/<name>/` 是插件包；rules/skills/MCP/hooks 可直接集成。Marketplace 不会自动安装：先用 `--check` 诊断且不发出 lifecycle mutation，明确同意后才 `--apply` 并新建任务；禁止静默安装、覆盖异源或删除个人 selector，源码升版后才 `--write-lock`。
- AI 基建先补 eval case 并显式标记 `coverageClass`；`component-boundary` 不进 behavior 分母或 active outcome。外部不可控前置必须作为 `blockedFocus` 保持可见并列出恢复条件，不能覆盖不依赖该前置的仓内 `nextFocus`。v3 outcome 只追加并锁 chain/supersession；receipt v1 限 replay，v2 无签名，v3 需仓外 proof。deterministic replay 的 `worktree-<sha256>` 使用域分离 source-state v2，排除 outcome/receipt 双 ledger 且不混入 HEAD，只绑定非账本 path/type/mode/原始字节；HEAD 仍独立用于 clone-visible 分发和 sealed manifest 审计。fixed runner 永不写账，deterministic writer 默认 preview，只有本地维护者复核后可显式 `--write`；字段必须从 runner/source/账本尾部派生，禁止手改 JSONL 或 CI/hook/postinstall 写入。Codex adapter 只能纯投影外部 JSONL；仓库 CLI 只允许空认证根下的 keyless binary/version preflight，component descriptor 不可执行，artifact verifier 不接受 callback，validation 使用空 HOME/CODEX_HOME 并快照双 ledger 终点。真实 run 必须在仓外将 key-bearing Codex 与待测 MCP 隔离 UID/PID 信任域。未知 signer unverified，坏签名/绑定 rejected；禁止保存 prompt、推理、凭据、命令/stdout 或 MCP 正文。
- 未验信 trace writer 只收闭字段 `redacted` observation，默认 preview；仅本地显式 `--write`，CI 禁写，结果永不计 scored/confirmed/coverage 或覆盖 confirmed。它是仓库资产而非 marketplace 条目；细则见 `evals/ai-governance/README.md`。
- 静态治理契约不能冒充行为有效；没有真实 outcome 时 scorecard 行为维度必须保持 `unknown`，Git 基线未知、覆盖不足或存在 confirmed/unverified partial/fail 时保持 `warn`。机器报告的 `top` / `limit` 只能裁剪展示样本，不能改变全局计数、状态或 nextFocus。
- MCP 声明、当前任务注册发现和 Agent 工具选择必须分开评测；前置注册失败只写入脱敏 feedback signal，不得归因成 tool-selection outcome。paired experiment 的 train/validation/holdout 必须互斥，baseline/candidate 共用 task/fixture/base environment 且至少 3 次配对 repetition；未执行指标显式 `unavailable`。
- Registration canary 启动前必须用固定 producer 分别生成 Agent、grader、host 三个闭字段投影：Agent 不得读取 arm/rubric/plugin 状态，grader 不得读取 arm，host 绑定当前 worktree、case/experiment、MCP/hook、ledger 端点、交替顺序与外部 single-use lease。packet 只算 `component-only`；fresh task、baseline plugin disabled/candidate enabled、相同 base environment 与实际 task registry 未由仓外 host 观察前，不得把 experiment、feedback 或 behavior outcome 标为完成。
- Registration snapshot 必须排除 ambient Git 配置，从完整 inventory 经稳定 descriptor 与增量门禁在 checkout 外 owner-only 封存并按实际字节复核；失败产物保留且禁止不安全自动递归删除。组合 CLI 只返三视图摘要，不得合并 rubric/expected outcome/arm/treatment/lease；模型与写账未请求不等于 absence 已验证，chmod、environment digest、ledger 副本和 snapshot MCP 只算 component evidence。
- Seatbelt sentinel v2 只执行通过固定 OpenAI code-sign policy 的 Codex capability，并把 write/chmod 控制组放在 disposable mirror；真实 snapshot 零变更，同 UID observation 仍只算 component。
- Attested runtime preflight 的双角色 DSSE、七角色 UID/GID/namespace、派生 state/challenge 和 root-owned path metadata 都只算 component；仓内 Node 无法排除 pre-runtime 注入，固定不升级 trust/runtime/registration。下一层必须由 checkout 外受保护 launcher/service 固定 clean env、verifier bundle/runtime、policy 与 non-caller bindings；未验证 inclusion/consistency 时 at-most-once/non-equivocation 保持 false。
- Registration canary 外部结果必须依次经过闭字段 blind result 摄取、无 host/arm 的确定性盲评、六条 grade 的 digest commitment、detached checkpoint request 和独立揭盲；`infrastructure-invalid` 不得计作 behavior fail。checkpoint request 只绑定 grade-set 精确字节、六条 result/grade digest、当前 case/experiment/policy、fixture/environment/rubric，禁止 host disclosure、arm/trial/pair/order/plugin/treatment/lease、caller verified、自报时间和仓内密钥。unblind 绑定器只接受闭字段 packet/grade/host record/context 并内部重建 review，必须拒绝 caller review、跨 grade-set/experiment 嫁接和 pass/outcomeEligible/writeback 权限升级。request 固定 `external-anchor-required`、`component-only`、`trustedSigners=0`，没有仓外有状态单次 anchor receipt 时仍可重算，不证明先后、身份或不可替换；揭盲预览保持 `external-json-unverified`，timing、cost 与未版本化的 `passPower3`（pass^3）保持 `unavailable`，不得自动修改 experiment、feedback、receipt 或 outcome。
- Registration anchor、disclosure grant 与 consumption receipt 必须分成独立闭字段状态转换：anchor 绑定 checkpoint 精确字节和派生唯一 batch key；grant 必须逐 alias 核对 blind grade 的 result/grade digest、fixture/environment/rubric 与 host 中 Agent/grader 投影，再深绑 checkpoint/host commitment 与 `anchored→authorized`，稳定 authorization state key 不含 caller grant；consume 绑定 redemption digest 与 `authorized→consumed`，稳定 consumption state key 不含 nonce。host 预分配的 anchor expected bindings 必须贯穿高层验证；已观察 receipt 按签名 `proofSha256` 而非未签 `keyid` 或 transport JSON 去重。`keyid` 只是未签 hint，三角色必须比较 Ed25519 SPKI 指纹，consumer 签名公钥必须匹配 grant sender constraint。仓内只允许纯 Statement/envelope verifier，不生成/读取私钥、不保存状态、不释放 host disclosure、不写 ledger、不加入只读治理 MCP。caller 公钥验签、`maxUses=1`、短 expiry、nonce、自报 sequence/time、进程内 Set 或本地 JSON 都不能建立仓外身份、first-write-wins、at-most-once、inclusion 或 non-equivocation；缺共享原子状态和 witness 时固定 `trustedSigners=0`，已验签最多 `consumed-signature-bound-unwitnessed`、未验签为 `claimed-consumed-signature-unchecked`，writeback blocked。
- `.codex/agents/` 只允许治理契约登记的 explorer、worker、verifier 三个闭字段 profile；explorer 只读，worker 必须收到父任务写入白名单，verifier 的可写 sandbox 只服务验证临时/忽略产物且不得修复源码。profile 静态通过只算 component evidence，不能冒充真实委派 outcome。
- `.codex/hooks.json` 只允许单一 `SessionStart` 的 `startup|resume` advisory，固定短 timeout 和仓库内普通文件 runtime；不得增加 `PreToolUse`、`PermissionRequest`、`PostToolUse`、`Stop`、自动批准或读 prompt/transcript/环境/用户配置、网络与写入能力。项目/定义信任、配置存在和合成测试均只算 component evidence，新任务实际触发前不得写 behavior outcome。
- 规则变更要说明触发条件、反例、适用边界和验证方式，写入 `docs/AI-GOVERNANCE-DECISIONS.md` 决策记录、回写追踪和锁定测试，并同步完成 `docs/AI-ENGINEERING-PLAYBOOK.md`、项目入口或 Codex skill 的规则/skill 回写。
- 决策账本的触发条件、反例和适用边界不能整格使用弱占位；回写追踪必须包含 `docs/AI-GOVERNANCE-DECISIONS.md` 和 `CHANGELOG.md`；锁定测试必须同时包含 `node --test ...test.mjs` 和 `node scripts/ci/check-ai-governance.mjs`，且引用的测试文件必须保留普通可执行 `test(...)` 或 `it(...)` 用例，不能只剩 `skip`、`todo`、`.only` 或空文件。
- `.agents/skills/` 是项目 skill 唯一源码；新增或修改时必须保留 frontmatter `name`/`description`/`metadata.version`/`metadata.tags`，且 `name` 等于目录名、`version` 使用 `x.y.z`、`tags` 使用非空数组；`agents/openai.yaml` 必须保留显示名、25-64 字符短描述和引用 `$<skill-name>` 的默认提示。当前 `name` 与 `version` 必须在 `CHANGELOG.md` 同行追踪，并保留四个核心章节；禁止在 `.codex/skills/` 放同名副本。
- 每个项目级 skill 必须在 profile 表显式分类并提供由 profile 自动派生的 `evals/evals.json`；必读文件使用反引号包裹真实项目路径，skill 本体加必读文件总量不超过 90 KiB，段落、粗体、目录或锚点写法不能绕过计费。
- `.agents/skills/*/SKILL.md` 中反引号包裹的具体项目路径、fenced code block 里的 `cd <dir>` 工作目录、`node ...mjs` 验证脚本和 `npm run ...` 脚本必须真实存在，由 `node scripts/ci/check-ai-governance.mjs` 反查，避免 skill 迁移后留下不可执行引用。
- AI 治理、版本一致性、脚本单测和可维护性预算命令必须保留在 GitHub Actions `run:` 与 `scripts/ci/local-ci.sh` 的 `run_in_root` 可执行入口，并由 `node scripts/ci/check-ai-governance.mjs` 反查。
- `.github/workflows/ai-governance.yml` 必须保留 weekly schedule、workflow_dispatch、治理脚本单测、MCP 测试和 artifact 上传，用定时巡检覆盖长期不改文件时的 AI 资产漂移风险。
- `scripts/ci/aiGovernance*.mjs` 与 `scripts/ci/aiGovernance*.test.mjs` 都必须纳入可维护性预算，新增治理 helper 或测试时同步登记预算子表。
- `scripts/ci/aiGovernance*.mjs` 非测试 helper 还必须具备调用所有权：生产契约、规则、引用和失败收集 helper 必须能从 `scripts/ci/check-ai-governance.mjs` 静态 import 图到达；只有 `*TestFixtures.mjs` 和 `*MissingCases.mjs` 测试支撑文件允许只被 `scripts/ci/*.test.mjs` 覆盖。
- AGENTS、CLAUDE 和 `rules/code-style.md` 的技术栈事实必须与真实配置一致；数据库和关键主版本事实由 `node scripts/ci/check-ai-governance.mjs` 从后端配置、前后端依赖、前端 lock 和 Compose 文件反查，避免入口文档继续传播旧事实。
- Claude 工具指南、Codex README、Copilot、Cursor 和 Comate 这类工具薄入口不得维护独立更新记录；变更历史统一写入 `docs/AI-GOVERNANCE-DECISIONS.md` 和 `CHANGELOG.md`。
- 工具薄入口共享片段必须声明权威来源文件和锚点，由 `node scripts/ci/check-ai-governance.mjs` 反查来源内容，避免薄入口硬编码约束脱离 `rules/code-style.md`、Playbook 或 skill。
- `AGENTS.md` 和 `CLAUDE.md` 作为首读核心入口，必须直接引用 `docs/AI-ASSET-REGISTRY.md`，不能只靠 Playbook 间接跳转到资产账本。
- `docs/AI-ASSET-REGISTRY.md` 的每条资产登记必须维护真实有效且不晚于当前日期的 `YYYY-MM-DD` 最近复核日期；它只作为审计证据，不承担到期提醒或自动调度。
- 影响 AI 协作资产的改动必须运行 `node scripts/ci/check-ai-governance.mjs` 做治理校验；新增 `.claude/`、`.codex/`、`.cursor/rules/**/*.mdc`、MCP 配置（`.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`）、`.github/copilot-instructions.md`、`.github/instructions/**/*.instructions.md`、`.github/prompts/**/*.prompt.md`、`.github/agents/**/*.agent.md`、`.github/chatmodes/**/*.chatmode.md`、`.comate/`、`docs/AI-*.md` 或 `rules/ai-*.md` 协作资产时，需要同步 `docs/AI-ASSET-REGISTRY.md`，并纳入治理清单、引用规则或显式豁免。
- 项目级 MCP 配置必须是合法 JSON，且只能包含 `mcpServers` 或 `servers` 其中一个 server map；每个 server 至少声明 `command` 或 `url`，`command` 不能使用 shell 包装命令或绝对路径，仓库内脚本参数必须存在，敏感字段以及 URL、args、header 字符串里的 token、secret、password、api key 或 authorization 值不能写明文，应使用 `$ENV_NAME` 或 `${ENV_NAME}` 这类环境变量引用。`jsonutils-governance` 本地 MCP server 只能暴露只读治理资源和固定治理工具，不能扩展成任意 shell或通用文件读取入口；工具保留只读 annotations、output schema、双轨一致输出并实际校验 input schema。真实 newline-delimited stdio 测试必须锁版本、framing、`-32602`、资源与调用，并限制 client stdout buffer/queue、校验 response id；所有 child-derived JSON/EOF/stream/timeout 错误不得带 stdout/stderr 正文。
- 用户级 Codex TOML 与上述项目 JSON 配置语义不同：`mcp_servers.*.http_headers` 是静态值，即使内容形似 `$ENV_NAME` 也必须按敏感静态 header 告警；应改用 `env_http_headers`、`bearer_token_env_var` 或 OAuth。审计器源码属于项目资产，但只允许用户在本机显式运行并返回 value-free 固定字段；通用治理 MCP 不得读取或回显用户配置值。

### 更新格式

```markdown
## v1.x.x (日期)
### ✨ 新特性
- **功能名称**: 功能描述

### 🐛 Bug 修复
- **问题名称**: 修复描述

### 🎨 UI/UE 优化
- 优化描述

### 🏗️ 架构与基础设施
- 架构变更描述
```

### 分类图标

| 图标 | 分类 | 说明 |
|------|------|------|
| ✨ | 新特性 | 新增功能 |
| 🐛 | Bug 修复 | 修复问题 |
| 🎨 | UI/UE 优化 | 界面和体验优化 |
| 🏗️ | 架构与基础设施 | 架构调整、CICD 等 |
| 🚀 | 优化与改进 | 性能优化、代码改进 |
| 🎉 | 重大更新 | 大版本发布 |

### CHANGELOG 示例

```markdown
## v1.4.1 (2026-01-07)
### ✨ 新特性
- **流量统计**: 新增独立流量统计页面，支持 7 天/30 天数据查看
- **地区分布**: 添加访客 IP 地理位置分析功能

### 🐛 Bug 修复
- **数据统计**: 修复空数据时图表显示异常的问题
```
