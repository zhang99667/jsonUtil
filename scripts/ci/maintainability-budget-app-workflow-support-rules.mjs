import { appWorkflowSupportSmartSuggestionMaintainabilityBudgets } from './maintainability-budget-app-workflow-support-smart-suggestion-rules.mjs';

const appWorkflowSupportBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowSupportMaintainabilityBudgets = [
  ...appWorkflowSupportSmartSuggestionMaintainabilityBudgets,
  appWorkflowSupportBudget('frontend/src/utils/appActionLabels.ts', 90, '主应用操作文案 helper 应保持纯函数，避免夹带业务副作用'),
  appWorkflowSupportBudget('frontend/src/utils/appLegacyJsonPath.ts', 50, '旧 JSONPath 写值兼容逻辑应独立维护，避免回流到主应用文案 helper'),
  appWorkflowSupportBudget('frontend/src/utils/appWorkflowHelpers.ts', 100, '主应用 helper 应保持纯函数和少量编排辅助，不承载 React 状态'),
  appWorkflowSupportBudget('frontend/src/utils/memoryStorageTestHelper.ts', 35, '本地存储测试夹具只维护内存版 Storage 行为，避免各测试重复实现'),
  appWorkflowSupportBudget('frontend/src/utils/storage.ts', 100, '存储公共工具只维护 JSON 回退、安全对象属性读取和浏览器存储访问'),
  appWorkflowSupportBudget('frontend/src/utils/storage.test.ts', 135, '存储工具测试只锁定 JSON、类型守卫、敌意属性和存储权限边界'),
  appWorkflowSupportBudget('frontend/src/utils/clipboard.ts', 40, '剪贴板工具只装配成熟复制能力并维护读取与稳定错误语义'),
  appWorkflowSupportBudget('frontend/src/utils/clipboard.test.ts', 100, '剪贴板测试只锁定成熟工具委托、加载恢复、失败和错误文案'),
  appWorkflowSupportBudget('frontend/src/utils/fileGuards.ts', 185, '文件打开校验只维护大小、扩展名与 MIME 边界，不读取文件内容'),
  appWorkflowSupportBudget('frontend/src/utils/fileGuards.test.ts', 145, '文件打开校验测试锁定文本白名单、二进制拒绝和规范化边界'),
  appWorkflowSupportBudget('frontend/src/utils/errors.ts', 55, '公共错误工具只维护取消识别、稳定消息提取和上下文组合'),
  appWorkflowSupportBudget('frontend/src/utils/errors.test.ts', 90, '公共错误测试锁定跨上下文取消、敌意对象和中文兜底边界'),
];
