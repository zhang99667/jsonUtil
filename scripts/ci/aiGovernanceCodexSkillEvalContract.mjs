import fs from 'node:fs';
import path from 'node:path';

const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isString = value => typeof value === 'string' && value.trim().length > 0;
const isEvalId = value => (Number.isInteger(value) && value > 0) || isString(value);

const collectStringArrayFailures = (label, value, { allowEmpty = false } = {}) => {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || !value.every(isString)) {
    return [`${label} 必须是${allowEmpty ? '' : '非空'}字符串数组`];
  }
  return new Set(value).size === value.length ? [] : [`${label} 不能包含重复项`];
};

const collectEvalFailures = (item, index) => {
  const label = `evals[${index}]`;
  if (!isRecord(item)) return [`${label} 必须是对象`];
  return [
    ...(!isEvalId(item.id) ? [`${label}.id 必须是正整数或非空字符串`] : []),
    ...(!isString(item.prompt) ? [`${label}.prompt 不能为空`] : []),
    ...(!isString(item.expected_output) ? [`${label}.expected_output 不能为空`] : []),
    ...collectStringArrayFailures(`${label}.files`, item.files, { allowEmpty: true }),
    ...collectStringArrayFailures(`${label}.assertions`, item.assertions),
  ];
};

export const collectSkillEvalContractFailures = (rootDir, skillFile, { required = false } = {}) => {
  const evalFile = path.posix.join(path.posix.dirname(skillFile), 'evals/evals.json');
  const absoluteEvalFile = path.join(rootDir, evalFile);
  if (!fs.existsSync(absoluteEvalFile)) return required ? [`${evalFile}: 缺少必需 evals/evals.json`] : [];

  let document;
  try {
    document = JSON.parse(fs.readFileSync(absoluteEvalFile, 'utf8'));
  } catch (error) {
    return [`${evalFile}: 无法解析 JSON（${error.message}）`];
  }

  const failures = [];
  const expectedSkillName = path.posix.basename(path.posix.dirname(skillFile));
  if (!isRecord(document)) return [`${evalFile}: 根节点必须是对象`];
  if (document.skill_name !== expectedSkillName) {
    failures.push(`${evalFile}: skill_name 必须与 skill 目录名一致`);
  }
  const evals = Array.isArray(document.evals) ? document.evals : [];
  if (!Array.isArray(document.evals) || evals.length === 0) failures.push(`${evalFile}: evals 必须是非空数组`);
  evals.forEach((item, index) => failures.push(...collectEvalFailures(item, index)));
  const ids = evals.map(item => item?.id).filter(isEvalId).map(String);
  const prompts = evals.map(item => item?.prompt).filter(isString);
  if (new Set(ids).size !== ids.length) failures.push(`${evalFile}: eval id 必须唯一`);
  if (new Set(prompts).size !== prompts.length) failures.push(`${evalFile}: prompt 必须唯一`);
  return failures;
};
