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
- 规则变更要说明触发条件、反例、适用边界和验证方式，写入 `docs/AI-GOVERNANCE-DECISIONS.md` 决策记录、回写追踪和锁定测试，并同步完成 `docs/AI-ENGINEERING-PLAYBOOK.md`、项目入口或 Codex skill 的规则/skill 回写。
- 决策账本的触发条件、反例和适用边界不能整格使用弱占位；回写追踪必须包含 `docs/AI-GOVERNANCE-DECISIONS.md` 和 `CHANGELOG.md`；锁定测试必须同时包含 `node --test ...test.mjs` 和 `node scripts/ci/check-ai-governance.mjs`，且引用的测试文件必须保留普通可执行 `test(...)` 或 `it(...)` 用例，不能只剩 `skip`、`todo`、`.only` 或空文件。
- 新增或修改 `.codex/skills/*/SKILL.md` 时，必须保留 frontmatter `name`/`description`/`version`/`tags`，且 `name` 必须等于 skill 目录名、`version` 使用 `x.y.z` 格式、`tags` 使用非空数组；当前 `name` 与 `version` 必须在 `CHANGELOG.md` 同一条记录中可追踪，并保留 `## 必读文件`、`## 工作流`、`## 常用验证命令`、`## 重点边界` 四个核心章节。
- `.codex/skills/*/SKILL.md` 中反引号包裹的具体项目路径、fenced code block 里的 `cd <dir>` 工作目录、`node ...mjs` 验证脚本和 `npm run ...` 脚本必须真实存在，由 `node scripts/ci/check-ai-governance.mjs` 反查，避免 skill 迁移后留下不可执行引用。
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
- 项目级 MCP 配置必须是合法 JSON，且只能包含 `mcpServers` 或 `servers` 其中一个 server map；每个 server 至少声明 `command` 或 `url`，`command` 不能使用 shell 包装命令或绝对路径，仓库内脚本参数必须存在，敏感字段以及 URL、args、header 字符串里的 token、secret、password、api key 或 authorization 值不能写明文，应使用 `$ENV_NAME` 或 `${ENV_NAME}` 这类环境变量引用。`jsonutils-governance` 本地 MCP server 只能暴露只读治理资源和固定治理报告/上下文工具，不能扩展成任意 shell 或通用文件读取入口；真实 stdio 测试必须覆盖工具清单、治理资源读取和 `ai_governance_context` 调用。

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
