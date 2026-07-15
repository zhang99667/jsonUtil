import path from 'node:path';

import { parseUniqueJsonAuthority } from './aiGovernanceJsonAuthority.mjs';
import { readStableUtf8File } from './aiGovernanceStableUtf8File.mjs';

export const CODEX_SKILL_EVAL_MAX_BYTES = 256 * 1024;

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
  const source = readStableUtf8File(rootDir, evalFile, CODEX_SKILL_EVAL_MAX_BYTES);
  if (source.status === 'missing') return required ? [`${evalFile}: 缺少必需 evals/evals.json`] : [];
  if (source.status === 'too-large') return [`${evalFile}: 不能超过 ${CODEX_SKILL_EVAL_MAX_BYTES} bytes`];
  if (source.status === 'invalid-utf8') return [`${evalFile}: 必须是严格 UTF-8`];
  if (source.status !== 'ok') return [`${evalFile}: 必须是可读的非 symlink 普通文件`];
  let document;
  try {
    document = parseUniqueJsonAuthority(source.content);
  } catch {
    return [`${evalFile}: 无法解析 JSON`];
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
