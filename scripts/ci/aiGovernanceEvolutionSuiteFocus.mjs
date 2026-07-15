// 纯焦点仲裁：保持 learning、grader、base failure 与 coverage preparation 的固定优先级。

export const buildAiGovernanceEvolutionSuiteFocus = ({ base, learning, graderHealth }) => {
  if (learning.failures.length > 0) {
    return { id: 'fix-learning-contract', nextAction: '修复 feedback/experiment 数据契约', caseIds: [] };
  }
  if (!graderHealth.ok) {
    return {
      id: 'fix-grader-calibration',
      nextAction: '修复生产 grader 的独立校准契约或分类漂移',
      caseIds: [graderHealth.bindings.componentCase?.id].filter(Boolean),
    };
  }
  if (base.failures.length > 0) return base.nextFocus;
  if (['increase-outcome-coverage', 'record-first-outcomes'].includes(base.nextFocus?.id)) {
    return learning.nextFocus;
  }
  return base.nextFocus;
};
