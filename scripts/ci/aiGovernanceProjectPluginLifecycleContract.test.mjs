import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildProjectPluginLifecycleReport,
  emptyProjectPluginDescriptors,
  INVALID_PROJECT_PLUGIN_ROOT,
  PROJECT_PLUGIN_LIFECYCLE_REPORT_TYPE,
  PROJECT_PLUGIN_MARKETPLACE,
  projectPluginLifecycleReportRoot,
} from './aiGovernanceProjectPluginLifecycleContract.mjs';

test('lifecycle report 单源锁定字段、顺序、trust 边界与 failure 上限', () => {
  const expected = emptyProjectPluginDescriptors();
  const pluginStates = expected.map((plugin, index) => ({
    ...plugin,
    installedVersion: index === 0 ? plugin.expectedVersion : null,
    installedRoot: `/private/cache/${plugin.name}`,
    enabled: index === 0,
    cacheState: index === 0 ? 'matched' : 'mismatch',
    state: index === 0 ? 'ready' : 'missing',
    action: index === 0 ? 'none' : 'add',
  }));
  const value = buildProjectPluginLifecycleReport({
    root: '/project',
    mode: 'apply',
    status: 'blocked',
    inspection: { marketplaceState: 'ready', pluginStates },
    expected,
    attempted: 2,
    succeeded: 1,
    newTaskRequired: true,
    failures: Array.from({ length: 10 }, (_, index) => `FAILURE_${index}`),
  });
  assert.deepEqual(Object.keys(value), [
    'schemaVersion', 'reportType', 'mode', 'status', 'ok', 'trustBoundary',
    'taskRegistrationVerified', 'runtimeTrustVerified', 'signerTrustVerified',
    'attestationVerified', 'outcomeEligible', 'marketplace', 'plugins', 'mutations',
    'newTaskRequired', 'failures',
  ]);
  assert.equal(value.reportType, PROJECT_PLUGIN_LIFECYCLE_REPORT_TYPE);
  assert.deepEqual(value.marketplace, { name: PROJECT_PLUGIN_MARKETPLACE, expectedRoot: '/project', state: 'ready' });
  assert.deepEqual(value.mutations, { attempted: 2, succeeded: 1 });
  assert.deepEqual([value.ok, value.trustBoundary, value.taskRegistrationVerified,
    value.runtimeTrustVerified, value.signerTrustVerified, value.attestationVerified,
    value.outcomeEligible], [false, 'local-installation-component-only', false, false, false, false, false]);
  assert.deepEqual(value.plugins.map(plugin => plugin.selector), expected.map(plugin => plugin.selector));
  assert.equal(value.plugins.some(plugin => Object.hasOwn(plugin, 'installedRoot')), false);
  assert.deepEqual(value.failures, Array.from({ length: 8 }, (_, index) => `FAILURE_${index}`));
});

test('lifecycle contract 为非法 root 提供固定脱敏 fallback，且 writer 不经 lifecycle façade', async () => {
  assert.equal(projectPluginLifecycleReportRoot(undefined, undefined), INVALID_PROJECT_PLUGIN_ROOT);
  assert.equal(projectPluginLifecycleReportRoot(undefined, '/private/sensitive-project'), INVALID_PROJECT_PLUGIN_ROOT);
  const lifecycle = await import('./aiGovernanceProjectPluginLifecycle.mjs');
  const writer = await import('./aiGovernanceProjectPluginLockWriter.mjs');
  assert.equal(Object.hasOwn(lifecycle, 'writeProjectPluginLockLifecycle'), false);
  assert.deepEqual(Object.keys(writer).sort(), ['listGitProjectPluginFiles', 'writeProjectPluginLockLifecycle']);
});
