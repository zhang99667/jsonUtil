const schemeViewerSupportBudget = (file, maxLines, reason) => ({
  file,
  maxLines,
  reason,
});

export const schemeViewerSupportMaintainabilityBudgets = [
  schemeViewerSupportBudget(
    'frontend/src/utils/schemeViewerDecodeMetadata.ts',
    55,
    'Scheme 弹窗 metadata helper 只负责复用 Base64 与 CMD 摘要提取规则'
  ),
  schemeViewerSupportBudget(
    'frontend/src/utils/schemeViewerDecodeMetadata.test.ts',
    90,
    'Scheme 弹窗 metadata 测试应覆盖空结果、worker 精简行和 Base64 摘要边界'
  ),
  schemeViewerSupportBudget(
    'frontend/src/utils/schemeViewerQualityStyles.ts',
    45,
    'Scheme 质量摘要样式 helper 应保持纯映射，避免样式矩阵回流弹窗主组件'
  ),
  schemeViewerSupportBudget(
    'frontend/src/utils/schemeViewerQualityStyles.test.ts',
    35,
    'Scheme 质量摘要样式测试只覆盖状态到 class token 的映射'
  ),
  schemeViewerSupportBudget(
    'frontend/src/utils/schemeViewerBase64MetaBadges.ts',
    85,
    'Scheme Base64 元信息 badge helper 应只维护展示模型、截断长度和剩余数量计算'
  ),
  schemeViewerSupportBudget(
    'frontend/src/utils/schemeViewerBase64MetaBadges.test.ts',
    90,
    'Scheme Base64 元信息 badge helper 测试应覆盖顺序、key 命名空间、剩余数量和后缀长度边界'
  ),
  schemeViewerSupportBudget(
    'frontend/src/workers/schemeDecode.worker.ts',
    45,
    'Scheme 大输入解码 worker 只负责调用解码和弹窗 metadata 构造，不承载展示规则'
  ),
  schemeViewerSupportBudget('frontend/src/utils/schemeViewerDecodeWorker.ts', 35, 'Scheme 解码线程协议只定义请求、响应、可注入工厂和默认入口'),
  schemeViewerSupportBudget('frontend/src/hooks/useSchemeViewerDecode.ts', 290, 'Scheme 解码钩子只管理延迟值、线程生命周期、请求身份、取消和受控降级'),
  schemeViewerSupportBudget('frontend/src/hooks/useSchemeViewerDecode.test.ts', 330, 'Scheme 解码钩子测试覆盖阈值、旧响应、取消、清理与线程构造和运行失败'),
  schemeViewerSupportBudget('frontend/src/utils/schemeViewerQrCode.ts', 75, 'Scheme 二维码容量函数只区分数字、字母数字和字节模式，并检查 Unicode 可编码边界'),
  schemeViewerSupportBudget('frontend/src/utils/schemeViewerQrCode.test.tsx', 135, 'Scheme 二维码容量测试锁定 M 级三种模式的依赖边界、中文字节和不完整代理字符'),
];
