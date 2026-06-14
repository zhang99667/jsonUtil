import React from 'react';
import type { AiRepairSummary } from '../utils/aiRepairSummary';
import { formatAiRepairSummary } from '../utils/aiRepairSummary';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import { formatByteSize, getDocumentStats } from '../utils/documentStats';

interface AiRepairSummaryBannerProps {
  summary: AiRepairSummary;
  onClose: () => void;
  onCopySuccess: (message: string) => void;
  onCopyError: (errorMessage: string) => void;
}

const formatSummarySizeLabel = (content: string): string => {
  const stats = getDocumentStats(content);
  return `${stats.characterCount} 字符 / ${formatByteSize(stats.utf8ByteLength)}`;
};

export const AiRepairSummaryBanner: React.FC<AiRepairSummaryBannerProps> = ({
  summary,
  onClose,
  onCopySuccess,
  onCopyError,
}) => {
  const handleCopy = async () => {
    try {
      const summaryText = formatAiRepairSummary(summary);
      await copyText(summaryText);
      onCopySuccess(`已复制 AI 修复摘要（${formatSummarySizeLabel(summaryText)}）`);
    } catch (error) {
      onCopyError(getClipboardErrorMessage(error, '复制 AI 修复摘要失败'));
    }
  };

  const diffText = summary.changed
    ? summary.isDiffSkipped
      ? '内容较大，已跳过字符级预览'
      : `${summary.changedChunks} 处差异 / +${summary.addedChars} / -${summary.removedChars}`
    : 'AI 返回内容与源内容一致';

  return (
    <div className="flex-shrink-0 border-b border-editor-border bg-editor-sidebar/95 px-3 py-2">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-2 w-2 rounded-full bg-status-success-text shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="font-semibold text-gray-100">AI 修复摘要</span>
            <span className="text-gray-300">{diffText}</span>
            <span className="text-gray-500">{summary.beforeLength} -&gt; {summary.afterLength} 字符</span>
            <span className="text-gray-500">{summary.beforeLines} -&gt; {summary.afterLines} 行</span>
            <span className="text-gray-400">{summary.rootDescription}</span>
          </div>

          {summary.previewItems.length > 0 && (
            <div className="mt-1 flex gap-1.5 overflow-hidden text-[11px]">
              {summary.previewItems.slice(0, 5).map((item, index) => (
                <span
                  key={`${item.type}-${index}-${item.length}`}
                  className={`max-w-[180px] truncate rounded border px-1.5 py-0.5 ${
                    item.type === 'add'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                  }`}
                  title={`${item.type === 'add' ? '新增' : '删除'} ${item.length} 字符: ${item.text}`}
                >
                  {item.type === 'add' ? '+' : '-'} {item.text}
                </span>
              ))}
              {summary.isPreviewTruncated && (
                <span className="rounded border border-editor-border px-1.5 py-0.5 text-gray-500">...</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-editor-active hover:text-gray-100"
            title="复制 AI 修复摘要"
            aria-label="复制 AI 修复摘要"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 transition-colors hover:bg-editor-active hover:text-gray-100"
            title="关闭 AI 修复摘要"
            aria-label="关闭 AI 修复摘要"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
