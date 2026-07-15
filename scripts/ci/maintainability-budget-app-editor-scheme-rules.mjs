const editorSchemeBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appEditorSchemeMaintainabilityBudgets = [
  editorSchemeBudget(
    'frontend/src/components/Editor.tsx',
    830,
    '通用编辑器应继续下沉 Scheme 扫描、弹窗状态和其它独立生命周期，避免恢复为单文件状态中心',
  ),
  editorSchemeBudget(
    'frontend/src/components/editorSchemeModalState.ts',
    45,
    'Scheme 弹窗状态只维护输入所有权、开关和应用资格',
  ),
  editorSchemeBudget(
    'frontend/src/components/editorSchemeModalState.test.ts',
    55,
    'Scheme 弹窗状态测试只锁定来源绑定、输入切换和关闭态',
  ),
  editorSchemeBudget(
    'frontend/src/hooks/useEditorSchemeScan.ts',
    185,
    'Editor Scheme 扫描 Hook 只维护防抖、有界等待、请求所有权、单次终态和结果新鲜度',
  ),
  editorSchemeBudget(
    'frontend/src/hooks/useEditorSchemeScan.test.ts',
    325,
    'Editor Scheme 扫描测试只覆盖输入失效、Worker 异常与超时、协议负例和迟到回调',
  ),
  editorSchemeBudget(
    'frontend/src/utils/schemeScanWorker.ts',
    95,
    'Scheme 扫描 Worker 协议只维护请求响应类型、工厂和运行时守卫',
  ),
  editorSchemeBudget(
    'frontend/src/workers/schemeScan.worker.ts',
    40,
    'Scheme 扫描 Worker 入口只调用扫描器并返回共享协议终态',
  ),
];
