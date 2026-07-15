// 按 case/subject 版本保留全部尝试，只让当前实现的最后一次结果参与评分。
export const classifyEvolutionOutcomeHistory = (outcomes, caseDescriptorsById, retiredCaseIds = new Set()) => {
  const currentAttempts = [];
  const staleOutcomes = [];
  const retiredOutcomes = [];
  const futureOutcomes = [];
  const legacyOutcomes = [];
  let invalidOutcomes = 0;
  outcomes.forEach((outcome) => {
    const descriptor = caseDescriptorsById.get(outcome.caseId);
    if (outcome.schemaVersion === 1) legacyOutcomes.push(outcome);
    else if (retiredCaseIds.has(outcome.caseId)) retiredOutcomes.push(outcome);
    else if (descriptor === undefined) invalidOutcomes += 1;
    else if (outcome.caseVersion > descriptor.caseVersion) futureOutcomes.push(outcome);
    else if (outcome.caseVersion === descriptor.caseVersion && outcome.subjectVersion === descriptor.subjectVersion) {
      currentAttempts.push(outcome);
    } else staleOutcomes.push(outcome);
  });
  const latestByCase = new Map();
  currentAttempts.forEach((outcome, index) => {
    const candidateOrder = outcome.schemaVersion === 3 ? outcome.chain.sequence : index + 1;
    const previous = latestByCase.get(outcome.caseId);
    const previousOrder = previous?.schemaVersion === 3 ? previous.chain.sequence : 0;
    if (!previous || candidateOrder > previousOrder) latestByCase.set(outcome.caseId, outcome);
  });
  const activeLatestOutcomes = [...latestByCase.values()];
  return {
    activeLatestOutcomes,
    futureOutcomes,
    legacyOutcomes,
    retiredOutcomes,
    staleOutcomes,
    supersededOutcomes: currentAttempts.length - activeLatestOutcomes.length,
    invalidOutcomes: invalidOutcomes + futureOutcomes.length,
  };
};
