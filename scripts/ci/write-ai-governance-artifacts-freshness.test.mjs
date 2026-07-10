import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';
import {
  buildAiGovernanceArtifactFreshnessReport,
  checkAiGovernanceArtifactsFreshness,
  writeAiGovernanceArtifacts,
} from './write-ai-governance-artifacts.mjs';
import {
  createAiGovernanceArtifactRunReport,
  prepareAiGovernanceArtifactProject,
} from './writeAiGovernanceArtifactTestFixtures.mjs';

test('check AI governance artifact freshness ignores generatedAt but catches stale artifacts', () => {
  withAiGovernanceTempRoot((rootDir) => {
    prepareAiGovernanceArtifactProject(rootDir, 'scripts/ci/write-ai-governance-artifacts-freshness.test.mjs');
    const runReport = createAiGovernanceArtifactRunReport();
    const options = { rootDir, outDir: 'tmp-artifacts', now: () => new Date('2026-07-10T01:02:03.000Z'), runReport };
    const written = writeAiGovernanceArtifacts(options);

    const fresh = checkAiGovernanceArtifactsFreshness({ ...options, now: () => new Date('2026-07-10T02:03:04.000Z') });
    assert.equal(fresh.ok, true);

    fs.writeFileSync(written.files.summary, '### AI Governance\n- stale\n');
    writeFixtureFile(rootDir, 'tmp-artifacts/ai-governance-scorecard.json', JSON.stringify({ generatedAt: 'old', score: 1 }));
    const stale = checkAiGovernanceArtifactsFreshness(options);
    assert.deepEqual(stale.freshnessFailures.map(failure => failure.id).sort(), ['scorecard', 'summary']);
    assert.equal(stale.ok, false);
    assert.deepEqual(
      buildAiGovernanceArtifactFreshnessReport(stale, rootDir).failures.map(failure => failure.file).sort(),
      ['tmp-artifacts/ai-governance-scorecard.json', 'tmp-artifacts/summary.md'],
    );
  });
});
