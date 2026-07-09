const SENSITIVE_NAME_SOURCE = '(?:authorization|[A-Za-z0-9_-]*(?:token|secret|password|api[_-]?key|access[_-]?key|credential)[A-Za-z0-9_-]*)';
const SENSITIVE_KEY_PATTERN = new RegExp(SENSITIVE_NAME_SOURCE, 'i');
const VARIABLE_REFERENCE_PATTERN = /^(\$\{[^}]+\}|\$[A-Z_][A-Z0-9_]*)$/;
const STRING_SECRET_PATTERNS = [
  new RegExp(`[?&](${SENSITIVE_NAME_SOURCE})=([^&\\s]+)`, 'gi'),
  new RegExp(`(?:^|\\s)--?(${SENSITIVE_NAME_SOURCE})=([^\\s]+)`, 'gi'),
  new RegExp(`(?:^|\\s)(${SENSITIVE_NAME_SOURCE})\\s*:\\s*(?:Bearer\\s+)?([^\\s]+)`, 'gi'),
];

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const stripWrappingQuotes = value => value.replace(/^["']|["']$/g, '');
const normalizeSecretValue = value => stripWrappingQuotes(value.trim()).replace(/^Bearer\s+/i, '');
const isVariableReference = value => VARIABLE_REFERENCE_PATTERN.test(normalizeSecretValue(value));
const failure = (file, keyPath) => `${file}: 敏感字段 "${keyPath}" 不能写入明文值，请改用环境变量引用`;

const collectSensitiveStringFailures = (file, text, trail) => (
  STRING_SECRET_PATTERNS.flatMap(pattern => [...text.matchAll(pattern)]
    .filter(([, , secretValue]) => !isVariableReference(secretValue))
    .map(([, key]) => failure(file, [...trail, key].join('.'))))
);

export const collectMcpSensitiveValueFailures = (file, value, trail = []) => {
  if (typeof value === 'string') return collectSensitiveStringFailures(file, value, trail);
  if (Array.isArray(value)) return value.flatMap((item, index) => collectMcpSensitiveValueFailures(file, item, [...trail, String(index)]));
  if (!isObject(value)) return [];

  return Object.entries(value).flatMap(([key, child]) => {
    const childTrail = [...trail, key];
    const keyPath = childTrail.join('.');
    const keyFailures = SENSITIVE_KEY_PATTERN.test(key) && typeof child === 'string' && !isVariableReference(child)
      ? [failure(file, keyPath)]
      : [];
    return [...keyFailures, ...collectMcpSensitiveValueFailures(file, child, childTrail)];
  });
};
