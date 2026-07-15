import fs from 'node:fs';

import {
  collectEvolutionIsoDateFailures,
  collectEvolutionSensitiveFieldFailures,
  isEvolutionRecord,
  isEvolutionString,
} from './aiGovernanceEvolutionEvalContract.mjs';

const ROOT_FIELDS = new Set(['schemaVersion', 'manifestVersion', 'updatedAt', 'experiments']);
const EXPERIMENT_FIELDS = new Set(['id', 'caseRef', 'originSignalId', 'design', 'execution', 'metrics']);
const CASE_FIELDS = new Set(['id', 'caseVersion', 'subjectVersion']);
const DESIGN_FIELDS = new Set(['type', 'repetitions', 'splits', 'arms', 'sharedBindings', 'blinding', 'trialPlan']);
const EXECUTION_FIELDS = new Set(['status', 'reasonCode', 'modelInvoked', 'automaticLedgerWrites']);
const METRIC_NAMES = ['passAt1', 'passPower3', 'meanScore', 'standardDeviation', 'pairedDelta', 'timing', 'cost'];

const unexpectedFields = (value, allowed, label) => (
  isEvolutionRecord(value)
    ? Object.keys(value).filter(key => !allowed.has(key)).map(key => `${label}: 不允许字段 \`${key}\``)
    : []
);
const sortedUnique = value => Array.isArray(value) && value.every(isEvolutionString) && new Set(value).size === value.length;

const collectSplitFailures = (splits, label) => {
  if (!isEvolutionRecord(splits)) return [`${label} 必须是对象`];
  const failures = unexpectedFields(splits, new Set(['train', 'validation', 'holdout']), label);
  const all = [];
  for (const split of ['train', 'validation', 'holdout']) {
    if (!sortedUnique(splits[split]) || splits[split].length === 0) failures.push(`${label}.${split} 必须是非空唯一 case id 数组`);
    else all.push(...splits[split]);
  }
  if (new Set(all).size !== all.length) failures.push(`${label} 的 train/validation/holdout 必须互斥`);
  return failures;
};

const collectTrialPlanFailures = (experiment, label) => {
  const { repetitions, trialPlan } = experiment.design ?? {};
  if (!Number.isInteger(repetitions) || repetitions < 3) return [`${label}.design.repetitions 至少为 3`];
  if (!Array.isArray(trialPlan) || trialPlan.length !== repetitions * 2) return [`${label}.design.trialPlan 必须包含 ${repetitions * 2} 个 paired trials`];
  const failures = [];
  const ids = new Set();
  for (let pair = 1; pair <= repetitions; pair += 1) {
    for (const arm of ['baseline', 'candidate']) {
      const trial = trialPlan.find(item => item?.pair === pair && item?.arm === arm);
      if (!isEvolutionRecord(trial)) failures.push(`${label}.design.trialPlan 缺少 pair ${pair}/${arm}`);
      else {
        failures.push(...unexpectedFields(trial, new Set(['id', 'pair', 'arm', 'status', 'receiptId']), `${label}.design.trialPlan`));
        if (!isEvolutionString(trial.id) || ids.has(trial.id)) failures.push(`${label}.design.trialPlan id 必须唯一`);
        ids.add(trial.id);
        if (trial.status !== 'planned' || trial.receiptId !== null) failures.push(`${label}.design.trialPlan 未执行 trial 必须 planned 且 receiptId=null`);
      }
    }
  }
  return failures;
};

const collectExperimentFailures = ({ experiment, index, casesById }) => {
  const label = `experiments.json: 第 ${index + 1} 个 experiment`;
  if (!isEvolutionRecord(experiment)) return [`${label} 必须是对象`];
  const failures = unexpectedFields(experiment, EXPERIMENT_FIELDS, label);
  if (!isEvolutionString(experiment.id) || !isEvolutionString(experiment.originSignalId)) failures.push(`${label} id/originSignalId 不能为空`);
  failures.push(...unexpectedFields(experiment.caseRef, CASE_FIELDS, `${label}.caseRef`));
  const caseItem = casesById.get(experiment.caseRef?.id);
  if (!caseItem || experiment.caseRef?.caseVersion !== caseItem.caseVersion || experiment.caseRef?.subjectVersion !== caseItem.subject?.version) {
    failures.push(`${label}.caseRef 必须绑定当前 case/subject 版本`);
  }
  failures.push(...unexpectedFields(experiment.design, DESIGN_FIELDS, `${label}.design`));
  if (experiment.design?.type !== 'paired-ab') failures.push(`${label}.design.type 必须为 paired-ab`);
  failures.push(...collectSplitFailures(experiment.design?.splits, `${label}.design.splits`));
  if (!experiment.design?.splits?.validation?.includes(experiment.caseRef?.id)) failures.push(`${label} 当前 case 必须位于 validation split`);
  if (!experiment.design?.splits?.holdout?.includes('mcp-fixed-tool-selection')) failures.push(`${label} 必须保留 tool-selection holdout`);
  const arms = experiment.design?.arms;
  if (!Array.isArray(arms) || JSON.stringify(arms.map(item => item?.id)) !== JSON.stringify(['baseline', 'candidate'])) failures.push(`${label}.design.arms 必须按 baseline/candidate 排列`);
  else if (!arms.every(item => isEvolutionString(item.treatment) && Object.keys(item).length === 2)) failures.push(`${label}.design.arms 只能声明 id/treatment`);
  const bindings = experiment.design?.sharedBindings;
  if (!isEvolutionRecord(bindings) || Object.keys(bindings).sort().join(',') !== 'environment,fixture,task') failures.push(`${label}.design.sharedBindings 必须只含 task/fixture/environment`);
  else {
    if (bindings.task?.status !== 'bound' || bindings.task?.source !== 'case-input') failures.push(`${label}.design.sharedBindings.task 必须绑定 case-input`);
    for (const key of ['fixture', 'environment']) if (bindings[key]?.status !== 'unavailable' || bindings[key]?.reasonCode !== 'sealed-snapshot-not-created') failures.push(`${label}.design.sharedBindings.${key} 必须显式 unavailable`);
  }
  const blinding = experiment.design?.blinding;
  if (!isEvolutionRecord(blinding)
    || JSON.stringify(blinding.agentProjection) !== JSON.stringify(['input.request', 'input.context'])
    || JSON.stringify(blinding.graderProjection) !== JSON.stringify(['expectedOutcome', 'graders'])
    || blinding.candidateCanReadGrader !== false) failures.push(`${label}.design.blinding 必须隔离 agent/grader 字段`);
  failures.push(...collectTrialPlanFailures(experiment, label));
  failures.push(...unexpectedFields(experiment.execution, EXECUTION_FIELDS, `${label}.execution`));
  if (experiment.execution?.status !== 'blocked' || experiment.execution?.reasonCode !== 'new-task-required'
    || experiment.execution?.modelInvoked !== false || experiment.execution?.automaticLedgerWrites !== false) failures.push(`${label}.execution 必须诚实保持 blocked/new-task-required`);
  if (!isEvolutionRecord(experiment.metrics) || Object.keys(experiment.metrics).sort().join(',') !== [...METRIC_NAMES].sort().join(',')) failures.push(`${label}.metrics 字段不完整`);
  else for (const metric of METRIC_NAMES) if (experiment.metrics[metric]?.status !== 'unavailable' || experiment.metrics[metric]?.reasonCode !== 'trials-not-executed') failures.push(`${label}.metrics.${metric} 必须显式 unavailable`);
  failures.push(...collectEvolutionSensitiveFieldFailures(experiment, label));
  return failures;
};

export const readEvolutionExperiments = (filePath, { casesById, maxDate }) => {
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (error) {
    return { manifest: {}, experiments: [], failures: [`experiments.json: 无法解析（${error.message}）`] };
  }
  const failures = unexpectedFields(manifest, ROOT_FIELDS, 'experiments.json');
  if (manifest.schemaVersion !== 1 || manifest.manifestVersion !== '1.0.0') failures.push('experiments.json: schemaVersion/manifestVersion 非法');
  failures.push(...collectEvolutionIsoDateFailures('experiments.json: updatedAt', manifest.updatedAt, maxDate));
  const experiments = Array.isArray(manifest.experiments) ? manifest.experiments : [];
  if (experiments.length === 0) failures.push('experiments.json: experiments 不能为空');
  experiments.forEach((experiment, index) => failures.push(...collectExperimentFailures({ experiment, index, casesById })));
  const ids = experiments.map(item => item?.id);
  if (new Set(ids).size !== ids.length) failures.push('experiments.json: experiment id 必须唯一');
  failures.push(...collectEvolutionSensitiveFieldFailures(manifest, 'experiments.json'));
  return { manifest, experiments, failures };
};
