import type {
  StatusBarBadgeState,
  StatusBarSaveStatusInput,
} from './statusBarStateTypes';

export const getStatusBarSaveStatus = ({
  hasActiveFile,
  isSavedFile,
  isDirty,
  inputLength,
  isAutoSaveEnabled,
}: StatusBarSaveStatusInput): StatusBarBadgeState => {
  if (!hasActiveFile) {
    return inputLength > 0
      ? { label: '草稿未保存', className: 'bg-yellow-100 text-yellow-800', title: '当前内容还没有保存为文件' }
      : { label: '空白草稿', className: 'bg-white/15 text-white', title: '当前没有打开文件' };
  }

  if (!isSavedFile) {
    return isDirty
      ? { label: '未保存', className: 'bg-yellow-100 text-yellow-800', title: '当前标签尚未保存到文件' }
      : { label: '未保存标签', className: 'bg-white/15 text-white', title: '当前标签尚未绑定本地文件' };
  }

  if (isDirty) {
    return isAutoSaveEnabled
      ? { label: '等待自动保存', className: 'bg-yellow-100 text-yellow-800', title: '自动保存会在编辑停止后写入文件' }
      : { label: '未保存', className: 'bg-yellow-100 text-yellow-800', title: '当前文件有未保存修改' };
  }

  return isAutoSaveEnabled
    ? { label: '自动保存已同步', className: 'bg-green-100 text-green-800', title: '当前文件修改已自动同步' }
    : { label: '已保存', className: 'bg-white text-brand-primary', title: '当前文件没有未保存修改' };
};
