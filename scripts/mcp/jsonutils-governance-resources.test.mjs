import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  withJsonutilsGovernanceMcpTempRoot,
  writeJsonutilsGovernanceMcpFixtureFile,
} from '../ci/jsonutilsGovernanceMcpTestFixtures.mjs';
import {
  listJsonutilsGovernanceResources,
  readJsonutilsGovernanceResource,
} from './jsonutils-governance-resources.mjs';

test('MCP resources list public governance resources without file paths', () => {
  const resources = listJsonutilsGovernanceResources().resources;
  const registry = resources.find(resource => resource.uri === 'jsonutils://ai-governance/asset-registry');

  assert.equal(registry?.name, 'AI Asset Registry');
  assert.equal(Object.hasOwn(registry ?? {}, 'file'), false);
});

test('MCP resources read governance files from the requested root', async () => {
  await withJsonutilsGovernanceMcpTempRoot(async (rootDir) => {
    writeJsonutilsGovernanceMcpFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', '# registry');

    const response = readJsonutilsGovernanceResource(
      'jsonutils://ai-governance/asset-registry',
      rootDir
    );

    assert.equal(response.contents[0].text, '# registry');
  });
});
