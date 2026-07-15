import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectUngovernedAiGovernanceAssets,
  discoverAiGovernanceAssetFiles,
} from './aiGovernanceDiscoveredAssets.mjs';
import { EXPECTED_DISCOVERED_AI_GOVERNANCE_ASSETS } from './aiGovernanceDiscoveredAssetExpectedTestFixtures.mjs';
import { writeDiscoveredAssetFixtureFiles } from './aiGovernanceDiscoveredAssetTestFixtures.mjs';
import { withAiGovernanceTempRoot } from './aiGovernanceTestFixtures.mjs';
test('AI 治理资产发现会跳过显式豁免并报告未治理资产', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDiscoveredAssetFixtureFiles(rootDir);

    assert.deepEqual(discoverAiGovernanceAssetFiles(rootDir), EXPECTED_DISCOVERED_AI_GOVERNANCE_ASSETS);
    assert.deepEqual(
      collectUngovernedAiGovernanceAssets(rootDir, []),
      EXPECTED_DISCOVERED_AI_GOVERNANCE_ASSETS.map(file => `${file}: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免`)
    );
  });
});
