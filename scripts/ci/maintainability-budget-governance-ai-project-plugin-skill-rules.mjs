const projectPluginSkillBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiProjectPluginSkillMaintainabilityBudgets = [
  projectPluginSkillBudget('scripts/ci/maintainability-budget-governance-ai-project-plugin-skill-rules.mjs', 20, '项目插件 Skill 预算子表应只维护 manifest、source/path、语义聚合与测试夹具'),
  projectPluginSkillBudget('scripts/ci/aiGovernanceProjectPluginManifestContract.mjs', 80, '项目插件 manifest authority 应复用 JSON/SemVer 叶子并维护闭字段、类型与项目身份'),
  projectPluginSkillBudget('scripts/ci/aiGovernanceProjectPluginManifestContract.test.mjs', 90, '项目插件 manifest 负例应锁三个正例、重复 authority、资源边界与 write-lock 零 inventory'),
  projectPluginSkillBudget('scripts/ci/aiGovernanceProjectPluginJsonAuthority.test.mjs', 70, '项目插件 JSON/SemVer 集成负例应锁 manifest、marketplace、MCP companion、eval 与零 inventory'),
  projectPluginSkillBudget('scripts/ci/aiGovernanceProjectPluginSkillContract.mjs', 85, '项目插件 Skill 语义契约应只组合 manifest、frontmatter、UI/eval 与前后完整 source snapshot'),
  projectPluginSkillBudget('scripts/ci/aiGovernanceProjectPluginSkillDiscovery.mjs', 45, '项目插件 Skill 发现应只枚举固定 skills 根下的全部普通目录并拒绝被忽略的异类入口'),
  projectPluginSkillBudget('scripts/ci/aiGovernanceProjectPluginSkillPaths.mjs', 45, '项目插件 Skill source/path helper 应让 manifest 与 SKILL 稳定有界 strict UTF-8，并拒绝 companion 非普通路径'),
  projectPluginSkillBudget('scripts/ci/aiGovernanceProjectPluginSkillContract.test.mjs', 245, '项目插件 Skill 语义负例应锁 YAML/UI/eval、全量发现、content lock 与 write-lock 不能封存歧义 source'),
  projectPluginSkillBudget('scripts/ci/aiGovernanceProjectPluginSkillOptionalFields.test.mjs', 45, '项目插件 Skill optional 字段集成测试应锁官方正例与共享值契约负例'),
  projectPluginSkillBudget('scripts/ci/aiGovernanceProjectPluginSkillSourceContract.test.mjs', 110, '项目插件 Skill source 负例应锁 hardlink、cap+1、discovery 前基线、文件/空目录聚合漂移与未知 authority'),
  projectPluginSkillBudget('scripts/ci/aiGovernanceProjectPluginTestFixtures.mjs', 50, '项目插件测试夹具应只维护临时完整副本、固定路径与文本/JSON mutation'),
];
