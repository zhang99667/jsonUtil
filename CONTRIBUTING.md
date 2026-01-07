# 贡献指南

感谢您对 JSONUtils 专业版项目的关注！本文档将指导您如何参与项目开发。

## 开发环境设置

### 前置要求

- Node.js 18+ (推荐 LTS 版本)
- Java 17+
- Maven 3.8+
- MySQL 8.0+ (可选，开发可用 H2)

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
   - 主应用: http://localhost:5173
   - 管理后台: http://localhost:5173/admin.html

---

## 开发工作流

### 分支策略

- `main` - 稳定版本，禁止直接推送
- `develop` - 开发分支
- `feature/*` - 新功能开发
- `fix/*` - Bug 修复
- `release/*` - 发布准备

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Type 类型**：
| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响逻辑） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具链 |

**Scope 范围**（可选）：
- `frontend` - 前端主应用
- `admin` - 管理后台
- `backend` - 后端服务
- `traffic` - 流量统计模块
- `editor` - 编辑器相关
- `ai` - AI 功能

**示例**：
```
feat(traffic): 添加地区分布统计功能

- 新增 GeoService 实现 IP 地理位置解析
- 添加 /api/admin/traffic/geo-distribution 接口
- 前端新增地区分布图表展示

Closes #123
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
   git add .
   git commit -m "feat: add my feature"
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
│       └── code-style.mdr  # AI 编码规范
├── ARCHITECTURE.md         # 架构说明
├── CONTRIBUTING.md         # 本文档
└── README.md
```

---

## 获取帮助

- 查看 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解项目架构
- 查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本历史
- 查看 `.comate/rules/code-style.mdr` 了解编码规范

如有问题，请创建 Issue 讨论。