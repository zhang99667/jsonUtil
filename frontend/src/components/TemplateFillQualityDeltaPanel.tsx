import React from 'react';

interface TemplateFillQualityDeltaPanelProps {
  qualityDelta: string;
  onCopy: () => void;
}

export const TemplateFillQualityDeltaPanel: React.FC<TemplateFillQualityDeltaPanelProps> = ({
  qualityDelta,
  onCopy,
}) => (
  <div
    data-tour="template-fill-quality-delta"
    className="rounded border border-emerald-800/40 bg-emerald-950/20 px-2.5 py-2 text-xs text-emerald-100"
  >
    <div className="flex items-center justify-between gap-2">
      <div className="font-medium">最近回填质量变化</div>
      <button
        type="button"
        data-tour="template-fill-copy-quality-delta"
        onClick={onCopy}
        title="复制最近回填质量变化"
        aria-label="复制质量对比，复制最近回填质量变化"
        className="shrink-0 rounded border border-emerald-800/60 bg-editor-bg px-2 py-0.5 text-emerald-100 transition-colors hover:bg-emerald-900/30"
      >
        复制质量对比
      </button>
    </div>
    <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-emerald-50/90">
      {qualityDelta}
    </pre>
  </div>
);
