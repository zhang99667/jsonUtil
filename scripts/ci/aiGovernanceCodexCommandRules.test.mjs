import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  CANONICAL_CODEX_PROJECT_COMMAND_RULES,
  CODEX_PROJECT_COMMAND_RULE_FILES,
  CODEX_PROJECT_COMMAND_RULES,
  collectCodexCommandRuleFailures,
} from './aiGovernanceCodexCommandRules.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const RULES_FILE = CODEX_PROJECT_COMMAND_RULE_FILES[0];
const writeRulesFixture = rootDir => writeFixtureFile(rootDir, RULES_FILE, CANONICAL_CODEX_PROJECT_COMMAND_RULES);

test('Codex project command rules 固定 prompt-only 策略与 inline examples', () => {
  assert.deepEqual(collectCodexCommandRuleFailures(process.cwd()), []);
  assert.equal(CODEX_PROJECT_COMMAND_RULES.length, 6);
  CODEX_PROJECT_COMMAND_RULES.forEach((rule) => {
    assert.equal(rule.decision, 'prompt');
    assert.ok(rule.pattern.length > 0);
    assert.ok(rule.justification.length > 0);
    assert.ok(rule.match.length > 0);
    assert.ok(rule.notMatch.length > 0);
  });
  assert.doesNotMatch(CANONICAL_CODEX_PROJECT_COMMAND_RULES, /decision = "allow"/);
  assert.match(CANONICAL_CODEX_PROJECT_COMMAND_RULES, /scripts\/ci\/manage-project-plugins\.mjs/);
  assert.match(CANONICAL_CODEX_PROJECT_COMMAND_RULES, /scripts\/ci\/record-ai-evolution-paired-outcome\.mjs/);
  assert.match(CANONICAL_CODEX_PROJECT_COMMAND_RULES, /\["bash", "zsh", "sh"\]/);
});

test('Codex project command rules 拒绝决策漂移、额外 allow 与文件扩权', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeRulesFixture(rootDir);
    writeFixtureFile(rootDir, RULES_FILE, CANONICAL_CODEX_PROJECT_COMMAND_RULES.replace('decision = "prompt"', 'decision = "allow"'));
    assert.match(collectCodexCommandRuleFailures(rootDir).join('\n'), /canonical command policy/);
  });
  withAiGovernanceTempRoot((rootDir) => {
    writeRulesFixture(rootDir);
    fs.appendFileSync(path.join(rootDir, RULES_FILE), '\nprefix_rule(pattern = ["rg"], decision = "allow")\n');
    assert.match(collectCodexCommandRuleFailures(rootDir).join('\n'), /canonical command policy/);
  });
});

test('Codex project command rules 拒绝缺失、symlink 与超限文件', { skip: process.platform === 'win32' }, () => {
  withAiGovernanceTempRoot((rootDir) => {
    assert.match(collectCodexCommandRuleFailures(rootDir).join('\n'), /无法读取/);
  });
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.codex/rules/target.rules', CANONICAL_CODEX_PROJECT_COMMAND_RULES);
    fs.symlinkSync('target.rules', path.join(rootDir, RULES_FILE));
    assert.match(collectCodexCommandRuleFailures(rootDir).join('\n'), /不能是 symlink/);
  });
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, RULES_FILE, 'x'.repeat(16 * 1024 + 1));
    assert.match(collectCodexCommandRuleFailures(rootDir).join('\n'), /不能超过/);
  });
});
