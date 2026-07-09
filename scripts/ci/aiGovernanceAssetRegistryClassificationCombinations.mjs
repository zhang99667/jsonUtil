const prefix = file => `AI 资产登记 \`${file}\``;

export const collectRegistryClassificationCombinationFailures = (file, row) => [
  ...(row.status === '显式豁免' && row.owner !== '本机用户'
    ? [`${prefix(file)} 显式豁免必须由本机用户负责`]
    : []),
  ...(row.status === '显式豁免' && row.reviewCadence !== '季度复核'
    ? [`${prefix(file)} 显式豁免必须使用季度复核`]
    : []),
  ...(row.owner === '本机用户' && row.status !== '显式豁免'
    ? [`${prefix(file)} 本机用户责任人只能用于显式豁免`]
    : []),
  ...(row.status === '治理门禁' && row.owner !== '项目维护者'
    ? [`${prefix(file)} 治理门禁必须由项目维护者负责`]
    : []),
  ...(row.status === '治理门禁' && row.reviewCadence !== '发布前复核'
    ? [`${prefix(file)} 治理门禁必须使用发布前复核`]
    : []),
];
