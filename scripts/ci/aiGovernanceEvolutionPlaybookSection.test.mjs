import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectMissingAiGovernanceReferences } from './aiGovernanceChecks.mjs';
import { AI_GOVERNANCE_DOC_REFERENCE_RULES } from './aiGovernanceDocReferenceRules.mjs';
import { buildAiGovernanceEntryReferenceRules } from './aiGovernanceEntryReferenceRules.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';
const skillFiles = ['.agents/skills/jsonutils-maintainer/SKILL.md'];
const collect = (rootDir, rule, content) => {
  writeFixtureFile(rootDir, rule.file, content);
  return collectMissingAiGovernanceReferences(rootDir, [rule], skillFiles);
};
const assertMarkerScoped = (rootDir, rule, content, sectionTitle, marker) => {
  const moved = content.replace(`\n${marker}\n`, '\n') + `\n## 移出章节\n${marker}`;
  assert.deepEqual(collect(rootDir, rule, moved), [`${rule.file}: ${sectionTitle} 缺少 "${marker}"`]);
};
test('AI evolution Playbook 必须保留按需路由与 Skill 评测契约', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const rule = buildAiGovernanceEntryReferenceRules([]).find(item => item.file === 'docs/AI-EVOLUTION-PLAYBOOK.md');
    const content = [...rule.contains, ...rule.sections.flatMap(section => [section.sectionTitle, ...section.contains])].join('\n');
    assert.deepEqual(collect(rootDir, rule, content), []);
    assertMarkerScoped(rootDir, rule, content, '## 按需字段协议', 'evals/ai-governance/README.md');
    assertMarkerScoped(rootDir, rule, content, '## Skill 评测', '前后状态快照');
  });
});
test('Eval README 字段契约必须保留在指定章节', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const rule = AI_GOVERNANCE_DOC_REFERENCE_RULES.find(item => item.file === 'evals/ai-governance/README.md');
    const content = rule.sections.flatMap(section => [section.sectionTitle, ...section.contains]).join('\n');
    assert.deepEqual(collect(rootDir, rule, content), []);
    for (const [section, marker] of [['## Observable trace v1', 'afterRevision'],
      ['## Feedback 与 experiment', '完整 experiment SHA-256'],
      ['### Unverified trace authoring', 'trace-bound-unverified'],
      ['### Paired receipt v4 authoring', 'pre-execution assignment']]) {
      assertMarkerScoped(rootDir, rule, content, section, marker);
    }
  });
});
