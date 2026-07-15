export const mergeUniqueEvolutionCaseDescriptorGroups = (...groups) => {
  const registry = {};
  for (const group of groups) {
    for (const [caseId, descriptor] of Object.entries(group)) {
      if (Object.hasOwn(registry, caseId)) {
        throw new Error(`AI evolution descriptor group 存在重复 case id \`${caseId}\``);
      }
      registry[caseId] = descriptor;
    }
  }
  return Object.freeze(registry);
};
