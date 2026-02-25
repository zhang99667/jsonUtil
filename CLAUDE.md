# JSONUtils 专业版 - AI 助手指引

这是一个现代化的 JSON 处理工具项目，集成了 AI 智能修复功能。本文档为 Claude Code/Ducc 等 AI 编程助手提供项目上下文和开发指引。

## 项目概览

**项目类型**: 前后端分离的 Web 应用 + Electron 桌面应用
**核心功能**: JSON 格式化、验证、转换、AI 智能修复、JSONPath 查询
**目标用户**: 开发人员

### 技术栈

**前端**:
- React 19 + TypeScript
- Vite 6 (构建工具)
- Tailwind CSS (主应用样式)
- Ant Design (管理后台 UI)
- Monaco Editor (代码编辑器)
- Electron (桌面应用封装)

**后端**:
- Spring Boot 3.x + Java 17+
- Spring Data JPA + MySQL/H2
- Spring Security + JWT 认证

**AI 服务**:
- Google Gemini API (JSON 智能修复)

## 项目结构

```
json-助手-&-ai-修复/
├── frontend/              # React 前端应用
│   ├── src/
│   │   ├── admin/        # 管理后台模块 (独立入口)
│   │   ├── components/   # 主应用组件
│   │   ├── hooks/        # 自定义 React Hooks
│   │   ├── services/     # API 服务层
│   │   └── utils/        # 工具函数
│   ├── electron/         # Electron 主进程代码
│   ├── index.html        # 主应用入口
│   └── admin.html        # 管理后台入口
├── backend/              # Spring Boot 后端
│   └── src/main/java/com/jsonhelper/backend/
│       ├── controller/   # REST API 控制器
│       ├── service/      # 业务逻辑层
│       ├── repository/   # 数据访问层
│       ├── entity/       # JPA 实体
│       └── dto/          # 数据传输对象
├── docs/                 # 项目文档
├── rules/                # 代码规范和规则
├── ARCHITECTURE.md       # 架构详细说明
└── CHANGELOG.md          # 版本更新日志
```

## 核心功能模块

### 1. JSON 编辑器 (主应用)
- **文件**: `frontend/src/components/Editor.tsx`
- **功能**: 基于 Monaco Editor 的双栏实时编辑器
- **特性**: 语法高亮、错误提示、双向同步

### 2. JSON 转换工具
- **文件**: `frontend/src/utils/transformations.ts`
- **功能**: 格式化、压缩、转义、Unicode 转换等
- **模式**: 格式化、深度格式化、压缩、转义/反转义、Unicode/中文互转

### 3. AI 智能修复
- **文件**: `frontend/src/services/aiService.ts`
- **功能**: 使用 Gemini API 修复损坏的 JSON
- **配置**: 需要在设置中配置 API Key

### 4. JSONPath 查询
- **文件**: `frontend/src/components/JsonPathPanel.tsx`
- **功能**: JSONPath 表达式查询和结果高亮

### 5. 管理后台
- **入口**: `frontend/src/admin/App.tsx`
- **功能**:
  - 流量统计和分析
  - 用户管理
  - 数据可视化 (ECharts)
- **路由**: 基于状态的条件渲染 (非 React Router)

## 开发规范

### 代码风格

1. **TypeScript 优先**
   - 前端代码必须使用 TypeScript
   - 避免使用 `any` 类型，优先使用明确的类型定义
   - 复杂类型抽取到独立的 `.d.ts` 文件

2. **React 最佳实践**
   - 使用函数组件 + Hooks
   - 合理使用 `useMemo`/`useCallback` 避免不必要的重渲染
   - 自定义 Hooks 提取复用逻辑
   - 组件拆分遵循单一职责原则

3. **样式规范**
   - 主应用: Tailwind CSS utility classes
   - 管理后台: Ant Design 组件 + 自定义样式
   - 避免内联样式，使用 className

4. **文件命名**
   - 组件文件: PascalCase (e.g., `Editor.tsx`)
   - 工具函数: camelCase (e.g., `transformations.ts`)
   - 常量文件: UPPER_CASE (e.g., `CONSTANTS.ts`)

### Git 提交规范

使用约定式提交格式:

```
[类型]简短描述

详细说明（可选）
```

**类型标签**:
- `[Feature]`: 新功能
- `[FIXBUG]`: Bug 修复
- `[Refactor]`: 重构
- `[Docs]`: 文档更新
- `[Style]`: 代码格式调整
- `[Test]`: 测试相关
- `[Chore]`: 构建/工具链更新

**示例**:
```
[Feature]添加深度格式化模式

增加对嵌套JSON的深度格式化支持，包括:
- 自定义缩进级别
- 数组元素对齐
- 对象键排序
```

### API 设计规范

1. **RESTful 风格**
   - GET: 查询数据
   - POST: 创建资源
   - PUT: 更新资源
   - DELETE: 删除资源

2. **响应格式统一**
   ```json
   {
     "code": 200,
     "message": "success",
     "data": {...}
   }
   ```

3. **错误处理**
   - 前端统一使用 `react-hot-toast` 提示用户
   - 后端异常统一在全局异常处理器处理

## 常见任务指引

### 添加新的 JSON 转换功能

1. 在 `frontend/src/utils/transformations.ts` 添加转换函数
2. 在 `frontend/src/components/ActionPanel.tsx` 添加按钮
3. 更新快捷键配置 (如需要)
4. 更新 `CHANGELOG.md`

### 添加新的管理后台页面

1. 创建页面组件: `frontend/src/admin/pages/NewPage.tsx`
2. 创建 API 服务: `frontend/src/admin/services/newService.ts`
3. 在 `frontend/src/admin/App.tsx` 中:
   - 添加菜单项到 `items` 数组
   - 在 `renderContent()` 添加对应的 case
   - import 新组件
4. 后端添加对应 Controller 和 Service

### 修复 Bug 的流程

1. **定位问题**
   - 检查控制台错误信息
   - 使用浏览器 DevTools 断点调试
   - 查看 Network 面板检查 API 请求

2. **修复代码**
   - 优先查找单元测试覆盖
   - 修复后本地验证
   - 确保不引入新的问题

3. **提交代码**
   - 使用 `[FIXBUG]` 标签提交
   - 在 commit message 中说明问题和解决方案

### 性能优化建议

1. **前端优化**
   - Monaco Editor 按需加载语言支持
   - 使用 `React.lazy()` 代码分割
   - 大列表使用虚拟滚动
   - 合理使用 `useMemo`/`useCallback`

2. **后端优化**
   - 数据库查询添加索引
   - 使用分页避免大量数据返回
   - 缓存频繁查询的数据

## 测试指引

### 本地开发测试

**前端 Web 版本**:
```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:5173
```

**前端 Electron 版本**:
```bash
cd frontend
npm run electron:dev
```

**后端**:
```bash
cd backend
mvn spring-boot:run
# 访问 http://localhost:8080
```

**管理后台**:
```bash
# 访问 http://localhost:5173/admin.html
```

### 部署测试

**Docker 本地部署**:
```bash
docker-compose -f docker-compose.local.yml up
```

**生产环境部署**:
```bash
# 前端
cd frontend
npm run build

# 后端
cd backend
mvn clean package

# Docker 部署
docker-compose up -d
```

## 环境变量配置

### 前端 `.env.local`

```env
# Gemini AI API Configuration
VITE_GEMINI_API_KEY=your_api_key_here
VITE_GEMINI_MODEL=gemini-2.0-flash-exp
```

### 后端 `application.yml`

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/jsonhelper
    username: root
    password: your_password
  jpa:
    hibernate:
      ddl-auto: update
```

## 依赖管理

### 添加前端依赖

```bash
cd frontend
npm install package-name
# 或开发依赖
npm install -D package-name
```

### 添加后端依赖

在 `backend/pom.xml` 中添加 Maven 依赖:
```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>example-package</artifactId>
    <version>1.0.0</version>
</dependency>
```

## 故障排查

### 常见问题

1. **Monaco Editor 加载失败**
   - 检查网络连接
   - 清除浏览器缓存
   - 确认 CDN 资源可访问

2. **AI 修复不工作**
   - 检查 Gemini API Key 是否正确配置
   - 查看浏览器控制台网络请求
   - 确认 API 配额是否用尽

3. **后端启动失败**
   - 检查数据库连接配置
   - 确认端口 8080 未被占用
   - 查看日志文件定位错误

4. **Electron 打包失败**
   - 检查 Node.js 版本 (建议 LTS)
   - 清理 `node_modules` 重新安装
   - 查看 `electron-builder` 日志

## 相关文档

- [完整架构说明](./ARCHITECTURE.md) - 详细的架构设计和数据流
- [更新日志](./CHANGELOG.md) - 版本历史和功能变更
- [贡献指南](./CONTRIBUTING.md) - 如何参与项目开发

## AI 助手使用建议

1. **代码修改前先阅读**
   - 先用 Read 工具查看相关文件
   - 理解现有代码结构和模式
   - 避免破坏现有功能

2. **保持代码风格一致**
   - 遵循项目现有的命名规范
   - 使用项目中已有的工具函数和组件
   - 保持与周围代码相同的缩进和格式

3. **测试验证**
   - 修改后建议使用 `npm run dev` 本地测试
   - 确保不引入 TypeScript 类型错误
   - 验证功能是否符合预期

4. **文档更新**
   - 重要功能修改后更新 CHANGELOG.md
   - 新增 API 需要更新 ARCHITECTURE.md
   - 复杂逻辑添加必要的代码注释

## 项目目标和路线图

**当前版本**: 基础功能完善阶段
**近期目标**:
- [ ] 增强 AI 修复准确性
- [ ] 添加更多 JSON 转换模式
- [ ] 优化大文件处理性能
- [ ] 完善用户引导体验

**长期愿景**:
- 成为开发者首选的 JSON 处理工具
- 支持更多数据格式 (YAML, XML, etc.)
- 提供浏览器扩展版本
- 团队协作功能

---

💡 **提示**: 本文档持续更新中，如有疑问请查阅源码或相关文档。
