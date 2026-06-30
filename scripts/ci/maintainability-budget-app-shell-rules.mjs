export const appShellMaintainabilityBudgets = [
  {
    file: 'frontend/src/components/AppActionSidebar.tsx',
    maxLines: 45,
    reason: '主工作台侧栏外壳只装配工具面板容器和 resize handle，业务状态与事件语义应留在 App',
  },
  {
    file: 'frontend/src/components/AppSidebarActionPanel.tsx',
    maxLines: 35,
    reason: '主工作台工具面板容器只负责侧栏宽度和 ActionPanel props 透传',
  },
];
