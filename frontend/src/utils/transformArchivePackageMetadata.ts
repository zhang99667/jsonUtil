import type { TransformArchivePackage } from './transformSummaryArchivePackageTypes';

export const buildTransformArchivePackageSafety = (
  cmdComparisonMayContainValues: boolean
): TransformArchivePackage['safety'] => ({
  containsRawResponse: false,
  issueSampleOriginalValues: 'omitted-or-redacted',
  placeholderSourcePreviews: false,
  cmdComparisonMayContainValues,
  notes: [
    '归档包默认不携带原始 response；保存 corpus 前请单独提供已脱敏的 response 文件。',
    '问题样本 originalValue 已省略或脱敏，避免把 token/sign/cookie/设备标识带入协作材料。',
    '如包含 cmdHandler 差异报告，提交前仍需确认其中 actual/expected 值是否需要脱敏。',
  ],
});

export const buildTransformArchiveCorpusCandidate = (
  sampleName: string
): TransformArchivePackage['corpusCandidate'] => ({
  recommendedFiles: [
    `${sampleName}.redacted.json`,
    `${sampleName}.expected.snapshot.json`,
    `${sampleName}.cmdhandler.expected.json`,
  ],
  checklist: [
    `将已脱敏原始 response 保存为 ${sampleName}.redacted.json`,
    `将 artifacts.qualitySnapshot 转写为 ${sampleName}.expected.snapshot.json`,
    `如已粘贴 cmdHandler 输出，将稳定子集保存为 ${sampleName}.cmdhandler.expected.json`,
    '把 artifacts.issueSamples 中仍有价值的路径补成单测或 corpus 阈值断言',
  ],
});
