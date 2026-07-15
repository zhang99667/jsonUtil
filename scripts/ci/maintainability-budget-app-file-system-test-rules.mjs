import { appFileSystemHookTestMaintainabilityBudgets } from './maintainability-budget-app-file-system-hook-test-rules.mjs';

const fileSystemTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appFileSystemTestMaintainabilityBudgets = [
  ...appFileSystemHookTestMaintainabilityBudgets,
  fileSystemTestBudget('frontend/src/utils/browserFileSave.test.ts', 90, '浏览器下载测试只锁定临时链接和对象 URL 回收'),
  fileSystemTestBudget('frontend/src/utils/browserFileHandleWrite.test.ts', 150, '文件句柄写入测试锁定事务清理、同入口顺序及入口比较失败恢复'),
  fileSystemTestBudget('frontend/src/utils/browserFileHandleWriteTimeout.test.ts', 70, '文件句柄入口比较超时测试只锁定本次拒绝和无关文件登记恢复'),
  fileSystemTestBudget('frontend/src/utils/secureUuid.test.ts', 55, '安全随机标识测试只覆盖原生方法、安全随机字节回退和能力缺失'),
  fileSystemTestBudget('frontend/src/utils/workspaceFileTabs.test.ts', 65, '工作区文件标签测试只锁定 Untitled 编号和关闭标签选择规则'),
  fileSystemTestBudget('frontend/src/utils/workspaceStandaloneDraftFile.test.ts', 65, '工作区无标签输入草稿测试只覆盖跳过条件和 Untitled 草稿生成'),
  fileSystemTestBudget('frontend/src/utils/workspaceSourceState.test.ts', 55, '工作区 SOURCE 状态测试只锁定写入顺序和无模式写入分支'),
];
