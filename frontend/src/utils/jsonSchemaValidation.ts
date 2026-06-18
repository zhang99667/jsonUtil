import Ajv, { type AnySchema, type ErrorObject } from 'ajv';
import Ajv2019 from 'ajv/dist/2019';
import Ajv2020 from 'ajv/dist/2020';

export type JsonSchemaValidationStatus = 'empty' | 'valid' | 'invalid' | 'input-error' | 'schema-error';

export interface JsonSchemaIssue {
  path: string;
  keyword: string;
  message: string;
  schemaPath: string;
}

export interface JsonSchemaValidationResult {
  status: JsonSchemaValidationStatus;
  isValid: boolean;
  summary: string;
  issues: JsonSchemaIssue[];
  issueCount: number;
  shownIssueCount: number;
}

const MAX_VISIBLE_SCHEMA_ISSUES = 20;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const parseJson = (value: string, label: string): { value?: unknown; error?: string } => {
  try {
    return { value: JSON.parse(value) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `${label} 不是合法 JSON: ${message}` };
  }
};

const decodeJsonPointerSegment = (segment: string): string => (
  segment.replace(/~1/g, '/').replace(/~0/g, '~')
);

const escapeJsonPathKey = (key: string): string => (
  key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
);

export const jsonPointerToJsonPath = (pointer: string): string => {
  if (!pointer) return '$';

  return pointer
    .split('/')
    .slice(1)
    .map(decodeJsonPointerSegment)
    .reduce((path, segment) => {
      if (/^(0|[1-9]\d*)$/.test(segment)) {
        return `${path}[${segment}]`;
      }
      if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(segment)) {
        return `${path}.${segment}`;
      }
      return `${path}["${escapeJsonPathKey(segment)}"]`;
    }, '$');
};

const getAjvForSchema = (schema: unknown) => {
  const schemaVersion = isRecord(schema) && typeof schema.$schema === 'string'
    ? schema.$schema
    : '';

  const options = {
    allErrors: true,
    strict: false,
    validateFormats: false,
    allowUnionTypes: true,
  } as const;

  if (schemaVersion.includes('2020-12')) {
    return new Ajv2020(options);
  }

  if (schemaVersion.includes('2019-09')) {
    return new Ajv2019(options);
  }

  return new Ajv(options);
};

const toIssue = (error: ErrorObject): JsonSchemaIssue => ({
  path: jsonPointerToJsonPath(error.instancePath),
  keyword: error.keyword,
  message: error.message || '不符合 JSON Schema 约束',
  schemaPath: error.schemaPath,
});

export const validateJsonAgainstSchema = (
  jsonText: string,
  schemaText: string
): JsonSchemaValidationResult => {
  if (!jsonText.trim() && !schemaText.trim()) {
    return {
      status: 'empty',
      isValid: false,
      summary: '请先输入 JSON 和 JSON Schema',
      issues: [],
      issueCount: 0,
      shownIssueCount: 0,
    };
  }

  if (!jsonText.trim()) {
    return {
      status: 'input-error',
      isValid: false,
      summary: '请先在 SOURCE 输入 JSON',
      issues: [],
      issueCount: 0,
      shownIssueCount: 0,
    };
  }

  if (!schemaText.trim()) {
    return {
      status: 'schema-error',
      isValid: false,
      summary: '请先粘贴 JSON Schema',
      issues: [],
      issueCount: 0,
      shownIssueCount: 0,
    };
  }

  const parsedData = parseJson(jsonText, 'SOURCE');
  if (parsedData.error) {
    return {
      status: 'input-error',
      isValid: false,
      summary: parsedData.error,
      issues: [],
      issueCount: 0,
      shownIssueCount: 0,
    };
  }

  const parsedSchema = parseJson(schemaText, 'Schema');
  if (parsedSchema.error) {
    return {
      status: 'schema-error',
      isValid: false,
      summary: parsedSchema.error,
      issues: [],
      issueCount: 0,
      shownIssueCount: 0,
    };
  }

  try {
    const ajv = getAjvForSchema(parsedSchema.value);
    const validate = ajv.compile(parsedSchema.value as AnySchema);
    const isValid = validate(parsedData.value);

    if (isValid) {
      return {
        status: 'valid',
        isValid: true,
        summary: '当前 JSON 符合 Schema',
        issues: [],
        issueCount: 0,
        shownIssueCount: 0,
      };
    }

    const allIssues = (validate.errors || []).map(toIssue);
    const visibleIssues = allIssues.slice(0, MAX_VISIBLE_SCHEMA_ISSUES);

    return {
      status: 'invalid',
      isValid: false,
      summary: `当前 JSON 不符合 Schema，共 ${allIssues.length} 个问题`,
      issues: visibleIssues,
      issueCount: allIssues.length,
      shownIssueCount: visibleIssues.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'schema-error',
      isValid: false,
      summary: `Schema 无法编译: ${message}`,
      issues: [],
      issueCount: 0,
      shownIssueCount: 0,
    };
  }
};

export const formatJsonSchemaValidationReport = (
  result: JsonSchemaValidationResult
): string => {
  const lines = [
    'JSON Schema 校验报告',
    `状态: ${result.isValid ? '通过' : '未通过'}`,
    `摘要: ${result.summary}`,
  ];

  if (result.issues.length > 0) {
    lines.push('问题:');
    result.issues.forEach((issue, index) => {
      lines.push(`${index + 1}. ${issue.path} [${issue.keyword}] ${issue.message}`);
    });
  }

  if (result.issueCount > result.shownIssueCount) {
    lines.push(`还有 ${result.issueCount - result.shownIssueCount} 个问题未展示`);
  }

  return `${lines.join('\n')}\n`;
};
