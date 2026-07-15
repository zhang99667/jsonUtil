# 贡献指南

感谢您对 JSONUtils 专业版项目的关注！本文档将指导您如何参与项目开发。

## 开发环境设置

### 前置要求

- Node.js 18+ (推荐 LTS 版本)
- Java 17+
- Maven 3.8+
- PostgreSQL 14+

### 快速开始

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd json-助手-&-ai-修复
   ```

2. **启动后端**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. **启动前端**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **访问应用**
   - 主应用: http://localhost:3000
   - 管理后台: http://localhost:3000/admin.html

### AI 协作资产与项目插件

- `.agents/skills/`、rules、MCP、hooks、evals、`.agents/plugins/` 和 `plugins/` 都是项目资产，必须进入 Git；仓库不是插件，只有 `plugins/<name>/` 是插件包。受信任项目的 `.codex/config.toml` 直接注册固定治理 MCP，不依赖个人插件安装，但必须在新任务中验证实际注册。
- 修改 AI 资产后先运行 `node scripts/ci/check-ai-asset-distribution.mjs --workspace`。门禁覆盖项目资产、AI 治理实现/测试、eval 数据及 CI/local-ci 控制面；准备提交时暂存目标文件，再运行 `node scripts/ci/check-ai-asset-distribution.mjs --index`，PR 与定时 CI 使用 `--head`（完整命令：`node scripts/ci/check-ai-asset-distribution.mjs --head`）。index/HEAD 直接比较当前普通文件的原始字节、Git blob 类型和执行位；只有 HEAD 视图能证明其他维护者从所测提交 clone 后可获得当前版本。
- `node scripts/ci/manage-project-plugins.mjs --check` 是诊断模式，不执行 marketplace/plugin add/remove/enable/disable 或 lock 写入。`.agents/plugins/marketplace.json` 是 repo marketplace catalog；当前 `AVAILABLE` 条目可被插件目录发现，但不会自动安装、启用或热加载。只有维护者明确同意时才运行 `--apply`，并在完成后新建任务。
- 用户级 Codex cache、marketplace 注册和启用状态不是项目权威源，也不能作为 CI 成功条件。具体流程见 `docs/AI-TOOLS-SETUP.md` 和 `docs/AI-ENGINEERING-PLAYBOOK.md`。

---

## 开发工作流

### 分支策略

- `main` - 稳定版本，禁止直接推送
- `develop` - 开发分支
- `feature/*` - 新功能开发
- `fix/*` - Bug 修复
- `release/*` - 发布准备

### 提交规范

使用项目约定的 `[Type]简短中文描述` 格式，与 `rules/code-style.md` 保持一致：

```
[Type]简短描述
```

**Type 类型**：
| Type | 说明 |
|------|------|
| `[Feature]` | 新功能 |
| `[FIXBUG]` | Bug 修复 |
| `[Refactor]` | 代码重构 |
| `[Docs]` | 文档更新 |
| `[Style]` | 样式或格式调整 |
| `[Chore]` | 构建/工具链 |
| `[LOG]` | 更新日志 |

**示例**：
```
[Feature]添加地区分布统计功能
```

---

## 代码规范

### TypeScript / React

1. **使用函数式组件**
   ```tsx
   const MyComponent: React.FC<Props> = ({ prop1 }) => {
     return <div>{prop1}</div>;
   };
   ```

2. **优先使用 Hooks**
   ```tsx
   const [state, setState] = useState<Type>(initialValue);
   ```

3. **类型定义**
   - 导出的接口放在单独的 `types.ts` 或组件同文件
   - 使用 `interface` 定义对象类型
   - 使用 `type` 定义联合类型

4. **文件命名**
   - 组件: `PascalCase.tsx`
   - 工具/服务: `camelCase.ts`
   - 样式: `kebab-case.css`

### Java / Spring Boot

1. **遵循标准分层架构**
   - Controller → Service → Repository

2. **使用 Lombok 简化代码**
   ```java
   @Data
   @RequiredArgsConstructor
   public class MyDTO { }
   ```

3. **RESTful API 设计**
   - 使用名词而非动词
   - 正确使用 HTTP 方法
   - 统一响应格式

4. **异常处理**
   - 使用自定义异常类
   - 统一异常处理器

---

## 测试

### 前端测试

```bash
cd frontend
npm run test        # 运行测试
npm run test:watch  # 监听模式
```

### 后端测试

```bash
cd backend
mvn test
```

### 手动测试检查清单

新功能提交前，请确保：

- [ ] 功能正常工作
- [ ] 不同时间范围切换正常（7天/30天）
- [ ] 空数据状态展示正常
- [ ] 加载状态展示正常
- [ ] 响应式布局正常
- [ ] 控制台无错误

---

## Pull Request 流程

1. **创建分支**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **开发并提交**
   ```bash
   git add <目标文件>
   git commit -m "[Feature]添加功能"
   ```

3. **同步最新代码**
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

4. **推送并创建 PR**
   ```bash
   git push origin feature/my-feature
   ```

5. **PR 描述模板**
   ```markdown
   ## 变更说明
   简要描述本次变更的内容

   ## 变更类型
   - [ ] 新功能
   - [ ] Bug 修复
   - [ ] 文档更新
   - [ ] 重构
   - [ ] 其他

   ## 测试情况
   描述如何测试这些变更

   ## 截图（如适用）
   UI 变更请附截图

   ## 相关 Issue
   Closes #xxx
   ```

---

## 常见开发任务

### 添加新的统计图表

1. **后端**
   - `VisitLogRepository.java` - 添加查询方法
   - `TrafficService.java` - 添加业务方法
   - `dto/response/` - 创建 DTO
   - `TrafficController.java` - 添加 API

2. **前端**
   - `services/traffic.ts` - 添加接口和类型
   - `pages/TrafficStats.tsx` - 添加图表组件

### 添加管理后台新页面

1. 创建 `src/admin/pages/NewPage.tsx`
2. 创建 `src/admin/services/newService.ts`（如需 API）
3. 修改 `src/admin/App.tsx`:
   - 添加菜单项到 `items` 数组
   - 添加路由到 `renderContent` 函数
   - import 新组件

### 修改数据库结构

1. 修改 `entity/*.java` 实体类
2. Spring Boot 开发模式会自动更新表结构
3. 生产环境需要手动执行 migration

---

## 目录结构参考

```
json-助手-&-ai-修复/
├── backend/
│   └── src/main/java/com/jsonhelper/backend/
│       ├── controller/
│       ├── service/
│       ├── repository/
│       ├── entity/
│       └── dto/
├── frontend/
│   └── src/
│       ├── admin/          # 管理后台
│       │   ├── pages/
│       │   └── services/
│       ├── components/     # 主应用组件
│       ├── hooks/
│       └── utils/
├── .comate/
│   └── rules/
│       └── code-style.md   # AI 工具薄入口
├── ARCHITECTURE.md         # 架构说明
├── CONTRIBUTING.md         # 本文档
└── README.md
```

---

## 获取帮助

- 查看 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解项目架构
- 查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本历史
- 查看 `rules/code-style.md` 了解权威编码规范，`.comate/rules/code-style.md` 仅作 Comate 薄入口

如有问题，请创建 Issue 讨论。
