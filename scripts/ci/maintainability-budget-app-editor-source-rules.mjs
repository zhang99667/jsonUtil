export const appEditorSourceMaintainabilityBudgets = [
  { file: 'frontend/src/components/AppSourceEditorPane.tsx', maxLines: 25, reason: 'SOURCE 编辑 pane 只负责左侧编辑器容器宽度和 SOURCE CodeEditor 装配' },
  { file: 'frontend/src/components/AppSourceCodeEditor.tsx', maxLines: 60, reason: 'SOURCE CodeEditor 组件只负责源编辑器 props helper、错误修复 slot 和头部动作装配' },
  { file: 'frontend/src/components/appSourceCodeEditorProps.ts', maxLines: 75, reason: 'SOURCE CodeEditor props helper 应只维护源文本、文件状态、校验状态和 schema warning 到编辑器 props 的映射' },
  { file: 'frontend/src/components/appSourceCodeEditorProps.test.ts', maxLines: 110, reason: 'SOURCE CodeEditor props helper 测试只覆盖文件/路径/校验映射和空活动文件清理路径' },
  { file: 'frontend/src/components/AppSourceCodeEditorTypes.ts', maxLines: 40, reason: 'SOURCE CodeEditor props 契约应独立维护，避免渲染装配文件因类型声明贴线' },
  { file: 'frontend/src/components/AppSourceErrorActionsSlot.tsx', maxLines: 40, reason: 'SOURCE 错误修复 slot 只负责校验错误与 SOURCE 内容条件下的 AI 修复入口装配' },
  { file: 'frontend/src/components/SourceEditorErrorActions.tsx', maxLines: 40, reason: 'SOURCE 错误态 AI 修复入口只负责按钮可用态、标题和事件透传' },
];
