import React, { useState, useEffect, useMemo } from 'react';
import { SimpleEditor } from './SimpleEditor';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { validateJson } from '../utils/transformations';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import { TEMPLATE_FILL_STORAGE_KEY, loadTemplateFillConfig } from '../utils/appSettings';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import { safeSetStorageItem } from '../utils/storage';
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
  const validation = useMemo(() => {
    if (!template.trim()) return { isValid: true };
    return validateJson(template);
  }, [template]);

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
  };

  const handleFormatTemplate = () => {
    if (!template.trim() || !validation.isValid) return;

    setTemplate(JSON.stringify(JSON.parse(template), null, 2));
  };

  const handleCopyQualityDelta = async () => {
    if (!applyQualityDelta) return;

    try {
      await copyText(applyQualityDelta);
      toast.success('已复制质量对比', { duration: 1600 });
    } catch (error) {
      console.warn('复制模板质量对比失败:', error);
      toast.error(getClipboardErrorMessage(error), { duration: 2000 });
    }
  };

  // 底部操作栏
  const footer = (
    <>
      <button
        onClick={handleClear}
        disabled={!template.trim()}
        className="px-2.5 py-1 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        清空模板
      </button>
      <button
        data-tour="template-format-button"
        onClick={handleFormatTemplate}
        disabled={!template.trim() || !validation.isValid}
        className="px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        格式化模板
      </button>
      <button
        onClick={handleApply}
        disabled={!template.trim() || !validation.isValid || Boolean(targetError)}
        title={targetError || undefined}
        className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        应用模板到当前 JSON
      </button>
    </>
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

        {/* 错误提示 */}
        {template.trim() && !validation.isValid && (
          <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded px-2.5 py-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {validation.error}
          </div>
        )}

        {targetError && (
          <div className="text-xs text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded px-2.5 py-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17z" />
            </svg>
            {targetError}
          </div>
        )}

        {applyQualityDelta && (
          <div
            data-tour="template-fill-quality-delta"
            className="rounded border border-emerald-800/40 bg-emerald-950/20 px-2.5 py-2 text-xs text-emerald-100"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium">最近回填质量变化</div>
              <button
                type="button"
                data-tour="template-fill-copy-quality-delta"
                onClick={handleCopyQualityDelta}
                className="shrink-0 rounded border border-emerald-800/60 bg-editor-bg px-2 py-0.5 text-emerald-100 transition-colors hover:bg-emerald-900/30"
              >
                复制质量对比
              </button>
            </div>
            <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-emerald-50/90">
              {applyQualityDelta}
            </pre>
          </div>
        )}

        {/* 操作提示 */}
        <div className="text-[10px] text-gray-600 px-1">
          数组将被整体替换，嵌套对象会递归合并。
        </div>
      </div>
    </DraggablePanel>
  );
};
