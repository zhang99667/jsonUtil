const fileSystemRuntimeBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const appFileSystemRuntimeMaintainabilityBudgets = [
  fileSystemRuntimeBudget('frontend/src/hooks/useFileSystem.ts', 210, '文件系统 hook 只编排状态、标签和专用命令，打开保存、草稿持久化、自动保存和并发守卫留在专用模块'),
  fileSystemRuntimeBudget('frontend/src/hooks/useWorkspaceFileTabState.ts', 150, '工作区文件标签状态 hook 原子维护文件追加、活动标签、切换关闭和同步工作区快照'),
  fileSystemRuntimeBudget('frontend/src/hooks/useFileAutoSave.ts', 60, '文件自动保存 hook 只维护活动文件快照、防抖调度和写入反馈，不承载标签状态或文件选择流程'),
  fileSystemRuntimeBudget('frontend/src/hooks/useFileOpenRequestGuard.ts', 60, '文件打开请求守卫只维护请求次序和共享工作区意图版本，不读取文件或修改标签状态'),
  fileSystemRuntimeBudget('frontend/src/hooks/useWorkspaceDraftPersistence.ts', 120, '工作区草稿持久化 hook 只维护恢复、防抖、隐藏页和卸载保存生命周期'),
  fileSystemRuntimeBudget('frontend/src/utils/browserFileSave.ts', 35, '浏览器下载 helper 只维护临时链接、Blob 和对象 URL 回收'),
  fileSystemRuntimeBudget('frontend/src/utils/browserFileHandleWrite.ts', 110, '文件句柄写入 helper 只维护可写流事务、有界同入口识别和活动写入队列'),
  fileSystemRuntimeBudget('frontend/src/utils/secureUuid.ts', 30, '安全随机标识 helper 只封装浏览器密码学能力和标准版本位，不引入业务状态'),
  fileSystemRuntimeBudget('frontend/src/utils/workspaceFileSaveState.ts', 25, '工作区文件保存状态 helper 只按已写入快照和当前内容计算未保存状态'),
  fileSystemRuntimeBudget('frontend/src/utils/workspaceFileTabs.ts', 45, '工作区文件标签 helper 应只维护 Untitled 命名和关闭标签后选择下一个活动标签的纯规则'),
  fileSystemRuntimeBudget('frontend/src/utils/workspaceStandaloneDraftFile.ts', 45, '工作区无标签输入草稿 helper 应只维护 standalone input 转未保存标签的纯规则'),
  fileSystemRuntimeBudget('frontend/src/utils/workspaceSourceState.ts', 35, '工作区 SOURCE 状态 helper 应只维护 before-change、setInput、ref 和 mode 的写入顺序'),
];
