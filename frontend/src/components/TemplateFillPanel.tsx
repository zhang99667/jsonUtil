import React, { useState, useEffect, useMemo } from 'react';
import { SimpleEditor } from './SimpleEditor';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { TemplateFillFooterActions } from './TemplateFillFooterActions';
import { TemplateFillPlaceholderForm } from './TemplateFillPlaceholderForm';
import { TemplateFillPlaceholderSummary } from './TemplateFillPlaceholderSummary';
import { TemplateFillQualityDeltaPanel } from './TemplateFillQualityDeltaPanel';
import { TemplateFillStatusAlerts } from './TemplateFillStatusAlerts';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import { TEMPLATE_FILL_STORAGE_KEY, loadTemplateFillConfig } from '../utils/appSettings';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import { safeSetStorageItem } from '../utils/storage';
import {
  buildPlaceholderTemplateSummary,
  formatTemplateSizeLabel,
  parsePlaceholderTemplateDraft,
  updatePlaceholderReplacement,
  validateTemplateJson,
  type PlaceholderTemplateDetail,
} from '../utils/templateFillPanelModel';
import toast from 'react-hot-toast';

interface TemplateFillPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (templateJson: string) => void;
  targetError?: string;
  initialTemplate?: string;
  initialTemplateKey?: number;
  applyQualityDelta?: string;
}

export const TemplateFillPanel: React.FC<TemplateFillPanelProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
  targetError,
  initialTemplate,
  initialTemplateKey,
  applyQualityDelta,
}) => {
  // 从 localStorage 恢复模板内容
  const [template, setTemplate] = useState<string>(() => loadTemplateFillConfig().template);

  // 实时 JSON 校验
  const validation = useMemo(() => validateTemplateJson(template), [template]);
  const placeholderTemplateSummary = useMemo(() => (
    buildPlaceholderTemplateSummary(template)
  ), [template]);
  const placeholderTemplateDraft = useMemo(() => (
    parsePlaceholderTemplateDraft(template)
  ), [template]);

  // 自动保存到 localStorage
  useEffect(() => {
    safeSetStorageItem(TEMPLATE_FILL_STORAGE_KEY, JSON.stringify({
      template,
      lastUpdated: Date.now(),
    }));
  }, [template]);

  // 外部报告面板可把生成的回填模板直接送入当前面板
  useEffect(() => {
    if (!initialTemplate || initialTemplateKey === undefined) return;

    setTemplate(initialTemplate);
  }, [initialTemplate, initialTemplateKey]);

  // 配置备份导入后同步刷新已挂载面板中的模板内容
  useEffect(() => {
    const handleBackupImported = () => {
      setTemplate(loadTemplateFillConfig().template);
    };

    window.addEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
    return () => window.removeEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
  }, []);

  const handleApply = () => {
    if (targetError) return;
    onApplyTemplate(template);
  };

  const handleClear = () => {
    setTemplate('');
    toast.success('模板已清空', { duration: 1600 });
  };

  const handleFormatTemplate = () => {
    if (!template.trim() || !validation.isValid) return;

    const formattedTemplate = JSON.stringify(JSON.parse(template), null, 2);
    setTemplate(formattedTemplate);
    toast.success(`模板已格式化（${formatTemplateSizeLabel(formattedTemplate)}）`, { duration: 1600 });
  };

  const handleCopyQualityDelta = async () => {
    if (!applyQualityDelta) return;

    try {
      await copyText(applyQualityDelta);
      toast.success(`已复制质量对比（${formatTemplateSizeLabel(applyQualityDelta)}）`, { duration: 1600 });
    } catch (error) {
      console.warn('复制模板质量对比失败:', error);
      toast.error(getClipboardErrorMessage(error), { duration: 2000 });
    }
  };

  const handlePlaceholderReplacementChange = (placeholderValue: string, replacement: string) => {
    try {
      setTemplate(updatePlaceholderReplacement(template, placeholderValue, replacement));
    } catch (error) {
      console.warn('更新占位符 replacement 失败:', error);
    }
  };

  const handleUsePlaceholderSuggestion = (detail: PlaceholderTemplateDetail) => {
    if (!detail.suggestion) return;

    handlePlaceholderReplacementChange(detail.value, detail.suggestion.replacement);
    toast.success('已采用候选 replacement', { duration: 1400 });
  };

  const hasTemplateContent = template.trim().length > 0;

  // 底部操作栏
  const footer = (
    <TemplateFillFooterActions
      hasTemplateContent={hasTemplateContent}
      isTemplateValid={validation.isValid}
      targetError={targetError}
      onClear={handleClear}
      onFormatTemplate={handleFormatTemplate}
      onApply={handleApply}
    />
  );

  return (
    <DraggablePanel
      isOpen={isOpen}
      onClose={onClose}
      title="JSON 模板填充"
      icon={PanelIcons.Code}
      storageKey="template-fill-panel"
      defaultPosition={{ x: 200, y: 100 }}
      defaultSize={{ width: 520, height: 500 }}
      minSize={{ width: 380, height: 300 }}
      footer={footer}
      dataTour="template-fill-panel"
    >
      <div className="flex-1 flex flex-col min-h-0 p-2 gap-2 bg-editor-bg">
        {/* 提示文字 */}
        <div className="text-xs text-gray-500 px-1">
          输入 JSON 模板，普通模板会深度合并，占位符回填模板会替换当前 JSON 中的运行时占位符。
        </div>

        {placeholderTemplateSummary && (
          <TemplateFillPlaceholderSummary summary={placeholderTemplateSummary} />
        )}

        {placeholderTemplateDraft && (
          <TemplateFillPlaceholderForm
            placeholderDetails={placeholderTemplateDraft.placeholderDetails}
            onReplacementChange={handlePlaceholderReplacementChange}
            onUseSuggestion={handleUsePlaceholderSuggestion}
          />
        )}

        {/* 模板编辑区 */}
        <div className="flex-1 min-h-[120px] border border-editor-border rounded overflow-hidden">
          <SimpleEditor
            value={template}
            onChange={setTemplate}
            language="json"
            height="100%"
            placeholder='例如: {"env": "test", "debug": true}'
          />
        </div>

        <TemplateFillStatusAlerts
          hasTemplateContent={hasTemplateContent}
          templateError={validation.isValid ? undefined : validation.error}
          targetError={targetError}
        />

        {applyQualityDelta && (
          <TemplateFillQualityDeltaPanel
            qualityDelta={applyQualityDelta}
            onCopy={handleCopyQualityDelta}
          />
        )}

        {/* 操作提示 */}
        <div className="text-[10px] text-gray-600 px-1">
          数组将被整体替换，嵌套对象会递归合并。
        </div>
      </div>
    </DraggablePanel>
  );
};
