const telemetryHookBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appTelemetryHookMaintainabilityBudgets = [
  telemetryHookBudget('frontend/src/hooks/useAppToolTelemetry.ts', 40, '工具事件 telemetry hook 只维护输入大小、耗时分桶和 trackToolEvent 装配'),
  telemetryHookBudget('frontend/src/hooks/useAppToolTelemetry.test.ts', 70, '工具事件 telemetry hook 测试只锁定默认状态、耗时计算和 inputRef 当前值读取'),
  telemetryHookBudget('frontend/src/hooks/useAppVisitorTracking.ts', 35, '访客统计 hook 只维护 GA 初始化、visitor ping 和失败静默'),
  telemetryHookBudget('frontend/src/hooks/useAppVisitorTracking.test.ts', 60, '访客统计 hook 测试只锁定 GA 参数、ping 地址和失败静默'),
];
