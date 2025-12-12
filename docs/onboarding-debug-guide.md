# 用户引导调试指南

## 如何重新触发引导

### 方法 1：浏览器开发者工具（推荐）

1. 打开应用 http://localhost:3000
2. 按 `F12`（Windows/Linux）或 `Cmd+Option+I`（Mac）打开开发者工具
3. 切换到 **Application** 标签
4. 在左侧导航栏找到：
   ```
   Storage
     └─ Local Storage
         └─ http://localhost:3000
   ```
5. 在右侧列表中找到键 `json-helper-onboarding-completed`
6. 右键点击该行，选择 **Delete**
7. 刷新页面（`Cmd+R` 或 `F5`）

### 方法 2：浏览器控制台

1. 按 `F12` 打开开发者工具
2. 切换到 **Console** 标签
3. 输入以下命令并按回车：
   ```javascript
   localStorage.removeItem('json-helper-onboarding-completed')
   ```
4. 刷新页面

### 方法 3：代码临时禁用检测（开发调试用）

编辑 `src/hooks/useOnboardingTour.ts`，注释掉第 10-12 行：

```typescript
// if (hasCompletedOnboarding) {
//   return;
// }
```

这样每次刷新页面都会触发引导。**记得调试完后恢复代码！**

## 检测机制说明

引导使用 localStorage 存储完成状态：

- **键名**：`json-helper-onboarding-completed`
- **值**：`'true'`
- **存储时机**：用户完成引导或点击关闭按钮时
- **检测时机**：每次页面加载时（useEffect）

## 已修复的问题

### 问题：底部元素被遮挡

**现象**：JSONPath 查询按钮和设置按钮在工具栏底部，需要滚动才能看到，引导时可能被遮挡。

**解决方案**：
- 添加了 `smoothScroll: true` 配置
- driver.js 会自动将目标元素滚动到可见区域
- 滚动动画平滑流畅

**验证方法**：
1. 清除 localStorage 重新触发引导
2. 进行到 JSONPath 查询步骤（第 5 步）
3. 观察工具栏是否自动滚动到底部
4. 确认 JSONPath 按钮完全可见且高亮

## 调试技巧

### 查看当前步骤

在控制台输入：
```javascript
// 查看 localStorage 中的所有键
Object.keys(localStorage)

// 查看引导完成状态
localStorage.getItem('json-helper-onboarding-completed')
```

### 跳过延迟启动

如果想立即启动引导（不等待 1 秒），可以修改 `useOnboardingTour.ts` 第 105 行：
```typescript
}, 0); // 将 1000 改为 0
```

### 自定义引导步骤

编辑 `src/hooks/useOnboardingTour.ts` 的 `steps` 数组：
- 修改 `title` 和 `description` 来改变文案
- 修改 `element` 来改变目标元素（使用 CSS 选择器）
- 修改 `side` 来改变提示框位置（`'top'`, `'right'`, `'bottom'`, `'left'`, `'over'`）
- 修改 `align` 来改变对齐方式（`'start'`, `'center'`, `'end'`）

## 常见问题

### Q: 引导不显示怎么办？

**A**: 检查以下几点：
1. localStorage 中是否有 `json-helper-onboarding-completed` 键（如果有，删除它）
2. 浏览器控制台是否有错误信息
3. 目标元素是否存在（检查 `data-tour` 属性是否正确添加）

### Q: 如何禁用引导？

**A**: 有两种方法：
1. **临时禁用**：在 localStorage 中手动添加 `json-helper-onboarding-completed = 'true'`
2. **永久禁用**：注释掉 `App.tsx` 中的 `useOnboardingTour()` 调用

### Q: 如何添加新的引导步骤？

**A**: 
1. 在目标元素上添加 `data-tour="your-id"` 属性
2. 在 `useOnboardingTour.ts` 的 `steps` 数组中添加新步骤：
   ```typescript
   {
     element: '[data-tour="your-id"]',
     popover: {
       title: '标题',
       description: '描述',
       side: 'right',
       align: 'start'
     }
   }
   ```
