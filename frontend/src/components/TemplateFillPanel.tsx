import React, { useState, useEffect, useMemo } from 'react';
import { SimpleEditor } from './SimpleEditor';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { validateJson } from '../utils/transformations';

interface TemplateFillPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (templateJson: string) => void;
}

const STORAGE_KEY = 'json-helper-template-fill';

export const TemplateFillPanel: React.FC<TemplateFillPanelProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  // 从 localStorage 恢复模板内容
  const [template, setTemplate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        return config.template || '';
      }
    } catch {
      // 忽略解析失败
    }
    return '';
  });

  // 实时 JSON 校验
  const validation = useMemo(() => {
    if (!template.trim()) return { isValid: true };
    return validateJson(template);
  }, [template]);

  // 自动保存到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      template,
      lastUpdated: Date.now(),
    }));
  }, [template]);

  const handleApply = () => {
    onApplyTemplate(template);
  };

  const handleClear = () => {
    setTemplate('');
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
        onClick={handleApply}
        disabled={!template.trim() || !validation.isValid}
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
    >
      <div className="flex-1 flex flex-col min-h-0 p-2 gap-2 bg-editor-bg">
        {/* 提示文字 */}
        <div className="text-xs text-gray-500 px-1">
          输入 JSON 模板，模板中的字段将深度合并到当前编辑器的 JSON 中，未涉及的字段保持不变。
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

        {/* 操作提示 */}
        <div className="text-[10px] text-gray-600 px-1">
          数组将被整体替换，嵌套对象会递归合并。
        </div>
      </div>
    </DraggablePanel>
  );
};
