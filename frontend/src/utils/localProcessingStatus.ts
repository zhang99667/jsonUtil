export type LocalProcessingStatusTone = 'local' | 'large' | 'worker' | 'repairing';

export interface LocalProcessingStatus {
  label: string;
  title: string;
  tone: LocalProcessingStatusTone;
}

export interface LocalProcessingStatusInput {
  hasSourceContent: boolean;
  isSourceLarge: boolean;
  isOutputTransforming: boolean;
  isAiRepairing: boolean;
  isAiConfigured: boolean;
}

export const getLocalProcessingStatus = ({
  hasSourceContent,
  isSourceLarge,
  isOutputTransforming,
  isAiRepairing,
  isAiConfigured,
}: LocalProcessingStatusInput): LocalProcessingStatus => {
  const aiConfigText = isAiConfigured
    ? '已配置 AI 时，只有手动触发智能修复且本地规则无法修复时才可能调用模型。'
    : '当前未配置 AI，智能修复只能使用本地规则或提示先配置。';

  if (isAiRepairing) {
    return {
      label: '智能修复中',
      title: `智能修复会先尝试本地确定性规则；本地可修不会发送到模型。${aiConfigText}`,
      tone: 'repairing',
    };
  }

  if (isOutputTransforming) {
    return {
      label: '本地 Worker',
      title: '大输入转换正在浏览器 Worker 中运行，不会发送到 AI；处理完成前会限制复制、保存和应用预览。',
      tone: 'worker',
    };
  }

  if (hasSourceContent && isSourceLarge) {
    return {
      label: '本地大输入',
      title: `当前 SOURCE 较大，格式化、校验、结构导航和查询会使用 Worker、采样或结果上限保护。${aiConfigText}`,
      tone: 'large',
    };
  }

  return {
    label: '本地处理',
    title: `格式化、压缩、深度解析、结构导航、JSONPath、Schema 和类型生成默认在浏览器本地执行。${aiConfigText}`,
    tone: 'local',
  };
};
