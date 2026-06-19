import * as Diff from 'diff';

export type AiRepairDiffType = 'add' | 'delete';

export interface AiRepairPreviewItem {
  type: AiRepairDiffType;
  text: string;
  length: number;
}

export interface AiRepairSummary {
  changed: boolean;
  repairMethod: 'local' | 'ai';
  localRuleLabels: string[];
  beforeLength: number;
  afterLength: number;
  beforeLines: number;
  afterLines: number;
  addedChars: number;
  removedChars: number;
  changedChunks: number;
  rootDescription: string;
  previewItems: AiRepairPreviewItem[];
  isPreviewTruncated: boolean;
  isDiffSkipped: boolean;
}

interface AiRepairSummaryOptions {
  repairMethod?: 'local' | 'ai';
  localRuleLabels?: string[];
}

const MAX_DIFF_INPUT_LENGTH = 200_000;
const MAX_PREVIEW_ITEMS = 8;
const MAX_PREVIEW_TEXT_LENGTH = 80;

/**
 * 生成智能修复前后的轻量差异摘要，用于帮助用户判断修复是否可信。
 */
export const buildAiRepairSummary = (
  before: string,
  after: string,
  options: AiRepairSummaryOptions = {}
): AiRepairSummary => {
  const baseSummary: AiRepairSummary = {
    changed: before !== after,
    repairMethod: options.repairMethod || 'ai',
    localRuleLabels: options.localRuleLabels || [],
    beforeLength: before.length,
    afterLength: after.length,
    beforeLines: countLines(before),
    afterLines: countLines(after),
    addedChars: 0,
    removedChars: 0,
    changedChunks: 0,
    rootDescription: describeJsonRoot(after),
    previewItems: [],
    isPreviewTruncated: false,
    isDiffSkipped: false,
  };

  if (!baseSummary.changed) {
    return baseSummary;
  }

  if (before.length + after.length > MAX_DIFF_INPUT_LENGTH) {
    return {
      ...baseSummary,
      isDiffSkipped: true,
    };
  }

  const changes = Diff.diffChars(before, after);
  let isInsideChangedChunk = false;

  changes.forEach(change => {
    if (!change.added && !change.removed) {
      isInsideChangedChunk = false;
      return;
    }

    if (!isInsideChangedChunk) {
      baseSummary.changedChunks += 1;
      isInsideChangedChunk = true;
    }

    if (change.added) {
      baseSummary.addedChars += change.value.length;
      appendPreviewItem(baseSummary, 'add', change.value);
    } else if (change.removed) {
      baseSummary.removedChars += change.value.length;
      appendPreviewItem(baseSummary, 'delete', change.value);
    }
  });

  return baseSummary;
};

export const formatAiRepairSummary = (summary: AiRepairSummary): string => {
  const lines = [
    '智能修复摘要',
    `方式: ${summary.repairMethod === 'local' ? '本地规则修复' : 'AI 模型修复'}`,
    `结构: ${summary.rootDescription}`,
    `长度: ${summary.beforeLength} -> ${summary.afterLength} 字符`,
    `行数: ${summary.beforeLines} -> ${summary.afterLines} 行`,
  ];

  if (summary.localRuleLabels.length > 0) {
    lines.push(`本地规则: ${summary.localRuleLabels.join('、')}`);
  }

  if (!summary.changed) {
    lines.push('差异: AI 返回内容与源内容一致');
  } else if (summary.isDiffSkipped) {
    lines.push('差异: 内容较大，已跳过字符级预览');
  } else {
    lines.push(`差异: ${summary.changedChunks} 处，新增 ${summary.addedChars} 字符，删除 ${summary.removedChars} 字符`);
  }

  if (summary.previewItems.length > 0) {
    lines.push('预览:');
    summary.previewItems.forEach(item => {
      lines.push(`${item.type === 'add' ? '+' : '-'} ${item.text}`);
    });
  }

  return lines.join('\n');
};

const appendPreviewItem = (summary: AiRepairSummary, type: AiRepairDiffType, value: string) => {
  if (summary.previewItems.length >= MAX_PREVIEW_ITEMS) {
    summary.isPreviewTruncated = true;
    return;
  }

  summary.previewItems.push({
    type,
    text: compactPreviewText(value),
    length: value.length,
  });
};

const compactPreviewText = (value: string): string => {
  const compacted = value.replace(/\s+/g, ' ').trim();
  const visible = compacted || '(空白字符)';

  if (visible.length <= MAX_PREVIEW_TEXT_LENGTH) {
    return visible;
  }

  return `${visible.slice(0, MAX_PREVIEW_TEXT_LENGTH)}...`;
};

const countLines = (value: string): number => {
  let lines = 1;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '\n') lines += 1;
  }
  return lines;
};

const describeJsonRoot = (jsonText: string): string => {
  try {
    const parsed: unknown = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      return `数组 ${parsed.length} 项`;
    }
    if (parsed && typeof parsed === 'object') {
      return `对象 ${Object.keys(parsed).length} 个键`;
    }
    if (parsed === null) {
      return 'null 值';
    }
    return `${typeof parsed} 值`;
  } catch {
    return '未知 JSON 结构';
  }
};
