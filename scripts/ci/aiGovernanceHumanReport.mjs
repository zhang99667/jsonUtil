import {
  AI_GOVERNANCE_FAILURE_GROUPS,
  hasAiGovernanceFailures,
} from './aiGovernanceFailureGroupDescriptors.mjs';

export const printAiGovernanceHumanReport = (report, output = console) => {
  if (!hasAiGovernanceFailures(report)) {
    output.log(
      `AI 协作治理校验通过，共 ${report.requiredFiles.length} 个关键文件、` +
      `${report.referenceRules.length} 组引用规则。`
    );
    return;
  }

  AI_GOVERNANCE_FAILURE_GROUPS.forEach(([key, title]) => {
    if ((report[key]?.length ?? 0) === 0) return;
    output.error(title);
    report[key].forEach(message => output.error(`- ${message}`));
  });
};
