const schemeViewerBudget = (file, maxLines, reason) => ({
  file,
  maxLines,
  reason,
});

export const schemeViewerMaintainabilityBudgets = [
  schemeViewerBudget(
    'frontend/src/components/SchemeViewerModal.tsx',
    1530,
    'Scheme 弹窗主组件应继续拆出纯展示面板、worker helper 和状态 helper，避免诊断 UI 继续回流主文件'
  ),
  schemeViewerBudget(
    'frontend/src/components/SchemeViewerBase64MetaPanel.tsx',
    80,
    'Scheme 内部 Base64 元信息面板只负责只读展示，提取和格式化规则应留在 utils'
  ),
  schemeViewerBudget(
    'frontend/src/components/SchemeViewerBase64MetaPanel.test.tsx',
    110,
    'Scheme 内部 Base64 元信息面板测试只覆盖展示截断、数量和空态'
  ),
  schemeViewerBudget(
    'frontend/src/utils/schemeViewerDecodeMetadata.ts',
    55,
    'Scheme 弹窗 metadata helper 只负责复用 Base64 与 CMD 摘要提取规则'
  ),
  schemeViewerBudget(
    'frontend/src/utils/schemeViewerDecodeMetadata.test.ts',
    90,
    'Scheme 弹窗 metadata 测试应覆盖空结果、worker 精简行和 Base64 摘要边界'
  ),
  schemeViewerBudget(
    'frontend/src/utils/schemeViewerQualityStyles.ts',
    45,
    'Scheme 质量摘要样式 helper 应保持纯映射，避免样式矩阵回流弹窗主组件'
  ),
  schemeViewerBudget(
    'frontend/src/utils/schemeViewerQualityStyles.test.ts',
    35,
    'Scheme 质量摘要样式测试只覆盖状态到 class token 的映射'
  ),
  schemeViewerBudget(
    'frontend/src/workers/schemeDecode.worker.ts',
    55,
    'Scheme 大输入解码 worker 只负责调用解码和弹窗 metadata 构造，不承载展示规则'
  ),
];
