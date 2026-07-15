const SENSITIVE_FIELD_PATTERN = /(rawprompt|secret|token|password|authorization|apikey|credential|cookie)/i;
const SENSITIVE_VALUE_PATTERNS = [
  /\bBearer\s+[A-Za-z0-9._~+/-]{8,}={0,2}\b/i,
  /\b(?:api[_-]?key|token|password|authorization|cookie)\s*[:=]\s*\S+/i,
  /\b(?:sk-[-_A-Za-z0-9]{12,}|AIza[-_A-Za-z0-9]{12,})\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
const MAX_DEPTH = 64;
const MAX_NODES = 10_000;

const scanSensitiveData = (value, includeFields) => {
  const stack = [{ value, depth: 0 }];
  const visited = new WeakSet();
  let nodes = 0;
  let sensitiveField = false;
  let sensitiveValue = false;
  while (stack.length > 0) {
    const current = stack.pop();
    nodes += 1;
    if (nodes > MAX_NODES || current.depth > MAX_DEPTH) {
      return { bounded: false, sensitiveField, sensitiveValue };
    }
    if (typeof current.value === 'string') {
      sensitiveValue ||= SENSITIVE_VALUE_PATTERNS.some(pattern => pattern.test(current.value));
      continue;
    }
    if (!current.value || typeof current.value !== 'object' || visited.has(current.value)) continue;
    visited.add(current.value);
    const array = Array.isArray(current.value);
    for (const [fieldName, childValue] of Object.entries(current.value)) {
      if (includeFields && !array) {
        const normalizedName = fieldName.replace(/[^a-z0-9]/gi, '').toLowerCase();
        sensitiveField ||= SENSITIVE_FIELD_PATTERN.test(normalizedName);
      }
      stack.push({ value: childValue, depth: current.depth + 1 });
    }
  }
  return { bounded: true, sensitiveField, sensitiveValue };
};

const projectFailures = (scan, label, includeFields) => [
  ...(!scan.bounded ? [`${label}: 隐私扫描结构超过 64 层或 10000 节点`] : []),
  ...(includeFields && scan.sensitiveField ? [`${label}: 禁止敏感字段名`] : []),
  ...(scan.sensitiveValue ? [`${label}: 禁止疑似凭据值`] : []),
];

export const collectEvolutionSensitiveValueFailures = (value, label) => (
  projectFailures(scanSensitiveData(value, false), label, false)
);

export const collectEvolutionSensitiveFieldFailures = (value, label) => (
  projectFailures(scanSensitiveData(value, true), label, true)
);
