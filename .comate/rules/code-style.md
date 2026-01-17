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
| 编辑器 | Monaco Editor | 最新 |
| 桌面封装 | Electron | 最新 |

### 后端 (backend/)

| 类型 | 技术 | 版本要求 |
|------|------|----------|
| 框架 | Spring Boot | 3.x |
| 语言 | Java | 17+ |
| 数据库 | MySQL/H2 | - |
| ORM | Spring Data JPA | - |

### 管理后台 (frontend/src/admin/)

| 类型 | 技术 |
|------|------|
| UI 组件库 | Ant Design |
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

在 `CHANGELOG.md` 文件顶部的当前版本区块中添加记录。

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