const FAILURE_GROUPS = [
  ['missingFiles', 'AI 协作资产缺少以下文件:'],
  ['skillContractFailures', 'AI 协作 skill 契约缺少以下内容:'],
  ['contractFailures', 'AI 协作治理契约失败:'],
  ['missingReferences', 'AI 协作资产缺少以下关键引用:'],
];

export const hasAiGovernanceFailures = report => FAILURE_GROUPS.some(([key]) => report[key].length > 0);

export const toAiGovernanceJsonReport = report => ({
  ok: !hasAiGovernanceFailures(report),
  counts: {
    requiredFiles: report.requiredFiles.length,
    referenceRules: report.referenceRules.length,
    ...Object.fromEntries(FAILURE_GROUPS.map(([key]) => [key, report[key].length])),
  },
  failures: Object.fromEntries(FAILURE_GROUPS.map(([key]) => [key, report[key]])),
});

export const formatAiGovernanceJsonReport = report => `${JSON.stringify(toAiGovernanceJsonReport(report), null, 2)}\n`;

export const printAiGovernanceHumanReport = (report, output = console) => {
  if (!hasAiGovernanceFailures(report)) {
    output.log(
      `AI 协作治理校验通过，共 ${report.requiredFiles.length} 个关键文件、` +
      `${report.referenceRules.length} 组引用规则。`
    );
    return;
  }

  FAILURE_GROUPS.forEach(([key, title]) => {
    if (report[key].length === 0) return;
    output.error(title);
    report[key].forEach(message => output.error(`- ${message}`));
  });
};
