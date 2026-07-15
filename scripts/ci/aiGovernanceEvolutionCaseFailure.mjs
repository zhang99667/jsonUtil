import fs from 'node:fs';
import path from 'node:path';

const SAFE_ID = /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$/;
const FAILURE_PRIORITY = Object.freeze({
  'infrastructure-invalid': 0,
  'behavior-fail': 1,
  'component-fail': 2,
  'delivery-blocked': 3,
});

const sameFields = (value, expected) => (
  value && typeof value === 'object'
  && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort())
);

export const deliveryBlockedCommand = (args, reasonCode) => Object.freeze({
  args: Object.freeze(args),
  failureClass: 'delivery-blocked',
  reasonCode,
});

export const resolveEvolutionCaseCommand = (command, rootDir) => {
  if (Array.isArray(command)) return { args: command, display: `node ${command.join(' ')}` };
  if (sameFields(command, ['testDirectory'])) {
    const files = fs.readdirSync(path.join(rootDir, command.testDirectory))
      .filter(file => file.endsWith('.test.mjs'))
      .sort()
      .map(file => `${command.testDirectory}/${file}`);
    return {
      args: ['--test', '--test-reporter=dot', ...files],
      display: `node --test --test-reporter=dot ${command.testDirectory}/*.test.mjs`,
    };
  }
  if (!sameFields(command, ['args', 'failureClass', 'reasonCode'])
    || command.failureClass !== 'delivery-blocked'
    || !Array.isArray(command.args) || command.args.some(value => typeof value !== 'string')
    || !SAFE_ID.test(command.reasonCode ?? '')) {
    throw new Error('AI evolution command descriptor 非法');
  }
  return { ...command, display: `node ${command.args.join(' ')}` };
};

const infrastructureReasonCode = (result) => {
  if (result?.error?.code === 'ETIMEDOUT') return 'fixed-runner-timeout';
  if (result?.error?.code === 'ENOBUFS') return 'fixed-runner-output-limit';
  if (result?.error) return 'fixed-runner-spawn-failed';
  if (typeof result?.signal === 'string' && result.signal.length > 0) return 'fixed-runner-signal-exit';
  if (!Number.isInteger(result?.status)) return 'fixed-runner-status-unavailable';
  return null;
};

const structuredDiagnostic = (stdout) => {
  if (typeof stdout !== 'string' || stdout.length === 0 || stdout.length > 4 * 1024 * 1024) return null;
  try {
    const report = JSON.parse(stdout);
    const failures = report?.counts?.failures;
    if (!SAFE_ID.test(report?.reportType ?? '') || !SAFE_ID.test(report?.scope ?? '')
      || !Number.isInteger(failures) || failures < 0) return null;
    return `${report.reportType}/${report.scope}: failures=${failures}`;
  } catch {
    return null;
  }
};

export const classifyEvolutionCaseCommandFailure = (result, command, defaultFailureClass = 'behavior-fail') => {
  const infrastructureReason = infrastructureReasonCode(result);
  const failureClass = infrastructureReason ? 'infrastructure-invalid' : command.failureClass ?? defaultFailureClass;
  const reasonCode = infrastructureReason ?? command.reasonCode ?? 'fixed-command-assertion-failed';
  return {
    failureClass,
    reasonCode,
    diagnostic: structuredDiagnostic(result?.stdout) ?? `fixed runner command failed: ${reasonCode}`,
  };
};

export const summarizeEvolutionCaseFailures = (validations) => {
  const failures = validations.filter(item => item.status === 'failed');
  if (failures.length === 0) return {};
  const primary = [...failures].sort((left, right) => (
    FAILURE_PRIORITY[left.failureClass] - FAILURE_PRIORITY[right.failureClass]
  ))[0];
  return {
    failureClass: primary.failureClass,
    reasonCode: primary.reasonCode,
    diagnostic: primary.diagnostic,
  };
};

export const countEvolutionCaseFailureClasses = (results) => ({
  behaviorFailed: results.filter(item => item.failureClass === 'behavior-fail').length,
  componentFailed: results.filter(item => item.failureClass === 'component-fail').length,
  deliveryBlocked: results.filter(item => item.failureClass === 'delivery-blocked').length,
  infrastructureInvalid: results.filter(item => item.failureClass === 'infrastructure-invalid').length,
});

export const normalizeEvolutionCurrentRunIssues = (failures, issues) => issues ?? failures.map(() => ({
  failureClass: 'infrastructure-invalid',
  reasonCode: 'fixed-runner-unclassified',
  diagnostic: 'fixed runner command failed: fixed-runner-unclassified',
}));

export const countEvolutionCurrentRunIssues = (issues) => {
  const counts = countEvolutionCaseFailureClasses(issues);
  return {
    currentRunBehaviorFailures: counts.behaviorFailed,
    currentRunComponentFailures: counts.componentFailed,
    currentRunDeliveryBlocked: counts.deliveryBlocked,
    currentRunInfrastructureInvalid: counts.infrastructureInvalid,
  };
};

export const buildEvolutionCurrentRunFocus = (issues) => {
  const descriptors = [
    ['infrastructure-invalid', 'repair-fixed-runner-infrastructure', '修复 fixed runner 基础设施'],
    ['behavior-fail', 'repair-current-deterministic-run', '修复 fixed runner 行为断言'],
    ['component-fail', 'repair-current-component-run', '修复 fixed runner 组件断言'],
    ['delivery-blocked', 'complete-project-delivery-evidence', '由维护者完成项目交付证据'],
  ];
  for (const [failureClass, id, action] of descriptors) {
    const issue = issues.find(item => item.failureClass === failureClass);
    if (issue) return { id, nextAction: `${action}：${issue.reasonCode}`, caseIds: [issue.caseId].filter(Boolean) };
  }
  return null;
};
