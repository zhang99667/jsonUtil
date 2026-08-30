// 单源维护项目插件 lifecycle 的固定失败与 component-only 报告契约。

import { isStrictSemver } from './aiGovernanceSemver.mjs';
import { AI_GOVERNANCE_PROJECT_PLUGIN_NAMES } from './aiGovernanceRequiredProjectPluginLifecycleFiles.mjs';

export const PROJECT_PLUGIN_LIFECYCLE_REPORT_TYPE = 'jsonutils-project-plugin-lifecycle';
export const PROJECT_PLUGIN_MARKETPLACE = 'jsonutils-project';
export const INVALID_PROJECT_PLUGIN_ROOT = '<invalid-project-root>';

const MAX_FAILURES = 8;

class ProjectPluginLifecycleFailure extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export const projectPluginLifecycleFailure = code => new ProjectPluginLifecycleFailure(code);
export const projectPluginLifecycleFailureCode = error => (
  error instanceof ProjectPluginLifecycleFailure ? error.code : 'LIFECYCLE_INTERNAL_ERROR'
);

export const emptyProjectPluginDescriptors = () => AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map(name => ({
  name,
  selector: `${name}@${PROJECT_PLUGIN_MARKETPLACE}`,
  expectedVersion: null,
}));

export const readExpectedProjectPlugins = (sourceSnapshot) => AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map((name) => {
  const plugin = sourceSnapshot.plugins.find(candidate => candidate.name === name);
  if (!plugin || plugin.manifestName !== name || !isStrictSemver(plugin.manifestVersion)) {
    throw projectPluginLifecycleFailure(`PROJECT_PLUGIN_MANIFEST_INVALID:${name}`);
  }
  return Object.freeze({
    name,
    selector: `${name}@${PROJECT_PLUGIN_MARKETPLACE}`,
    expectedVersion: plugin.manifestVersion,
  });
});

export const projectPluginLifecycleReportRoot = root => (
  typeof root === 'string' && root.length > 0 ? root : INVALID_PROJECT_PLUGIN_ROOT
);

export const buildProjectPluginLifecycleReport = ({
  root,
  mode,
  status,
  inspection,
  expected,
  attempted = 0,
  succeeded = 0,
  newTaskRequired = false,
  failures = [],
}) => ({
  schemaVersion: 1,
  reportType: PROJECT_PLUGIN_LIFECYCLE_REPORT_TYPE,
  mode,
  status,
  ok: ['ready', 'applied', 'lock-written'].includes(status),
  trustBoundary: 'local-installation-component-only',
  taskRegistrationVerified: false,
  runtimeTrustVerified: false,
  signerTrustVerified: false,
  attestationVerified: false,
  outcomeEligible: false,
  marketplace: {
    name: PROJECT_PLUGIN_MARKETPLACE,
    expectedRoot: root,
    state: inspection?.marketplaceState ?? (mode === 'write-lock' ? 'not-queried' : 'unknown'),
  },
  plugins: (inspection?.pluginStates ?? expected.map(plugin => ({
    ...plugin,
    installedVersion: null,
    enabled: null,
    cacheState: 'unknown',
    state: 'unknown',
    action: 'none',
  }))).map(plugin => ({
    selector: plugin.selector,
    expectedVersion: plugin.expectedVersion,
    installedVersion: plugin.installedVersion,
    enabled: plugin.enabled,
    cacheState: plugin.cacheState,
    state: plugin.state,
    action: plugin.action,
  })),
  mutations: { attempted, succeeded },
  newTaskRequired,
  failures: failures.slice(0, MAX_FAILURES),
});
