import Ajv, { type AnySchema, type ErrorObject } from 'ajv';
import Ajv2019 from 'ajv/dist/2019';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { formatUnknownError } from './errors';
import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments';
import { isLikelyJsonLinesInput, parseJsonLinesDetailed } from './jsonLines';
import { appendJsonPointerSegment, decodeJsonPointerSegment } from './jsonPointer';
import { isRecord } from './storage';

export type JsonSchemaValidationStatus = 'empty' | 'valid' | 'invalid' | 'input-error' | 'schema-error';

export interface JsonSchemaIssue {
  path: string;
  pointer: string;
  keyword: string;
  message: string;
  schemaPath: string;
  suggestion: string;
}

export interface JsonSchemaIssueGroup {
  key: string;
  count: number;
}

export interface JsonSchemaValidationResult {
  status: JsonSchemaValidationStatus;
  isValid: boolean;
  summary: string;
  issues: JsonSchemaIssue[];
  issueCount: number;
  shownIssueCount: number;
  issueKeywordGroups: JsonSchemaIssueGroup[];
  issuePathList: string[];
}

const MAX_VISIBLE_SCHEMA_ISSUES = 20;

type ParsedJsonSourceKind = 'json' | 'json-lines';

const parseJson = (
  value: string,
  label: string,
  options: { allowJsonLines?: boolean } = {}
): { value?: unknown; sourceKind?: ParsedJsonSourceKind; error?: string } => {
  try {
    return { value: JSON.parse(value), sourceKind: 'json' };
  } catch (error) {
    const message = formatUnknownError(error);

    if (options.allowJsonLines && isLikelyJsonLinesInput(value)) {
      const jsonLines = parseJsonLinesDetailed(value);
      if (jsonLines.records) {
        return {
          value: jsonLines.records.map(record => record.value),
          sourceKind: 'json-lines',
        };
      }

      if (jsonLines.error) {
        return { error: `${label} 不是合法 JSON / JSON Lines: ${message}；${jsonLines.error}` };
      }
    }

    return { error: `${label} 不是合法 JSON: ${message}` };
  }
};

export const jsonPointerToJsonPath = (pointer: string): string => {
  if (!pointer) return '$';

  return pointer
    .split('/')
    .slice(1)
    .map(decodeJsonPointerSegment)
    .reduce((path, segment) => {
      if (/^(0|[1-9]\d*)$/.test(segment)) {
        return appendJsonPathIndex(path, Number(segment));
      }
      return appendJsonPathKey(path, segment);
    }, '$');
};

const getAjvForSchema = (schema: unknown) => {
  const schemaVersion = isRecord(schema) && typeof schema.$schema === 'string'
    ? schema.$schema
    : '';

  const options = {
    allErrors: true,
    strict: false,
    validateFormats: true,
    allowUnionTypes: true,
  } as const;

  if (schemaVersion.includes('2020-12')) {
    return addFormats(new Ajv2020(options));
  }

  if (schemaVersion.includes('2019-09')) {
    return addFormats(new Ajv2019(options));
  }

  return addFormats(new Ajv(options));
};

const getIssuePointer = (error: ErrorObject): string => {
  const pointer = error.instancePath || '';

  if (error.keyword === 'required') {
    const missingProperty = (error.params as { missingProperty?: unknown }).missingProperty;
    if (typeof missingProperty === 'string') {
      return appendJsonPointerSegment(pointer, missingProperty);
    }
  }

  if (error.keyword === 'additionalProperties') {
    const additionalProperty = (error.params as { additionalProperty?: unknown }).additionalProperty;
    if (typeof additionalProperty === 'string') {
      return appendJsonPointerSegment(pointer, additionalProperty);
    }
  }

  return pointer;
};

const getErrorParamText = (error: ErrorObject, key: string): string => {
  const value = (error.params as Record<string, unknown>)[key];

  if (Array.isArray(value)) return value.map(item => String(item)).join(', ');
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
};

const getIssueSuggestion = (error: ErrorObject): string => {
  const missingProperty = getErrorParamText(error, 'missingProperty');
  const additionalProperty = getErrorParamText(error, 'additionalProperty');
  const expectedType = getErrorParamText(error, 'type');

  if (error.keyword === 'required') {
    return missingProperty
      ? `补齐必填字段 ${missingProperty}，或从 Schema required 中移除该字段。`
      : '补齐缺失的必填字段，或放宽 Schema required 约束。';
  }

  if (error.keyword === 'type') {
    return expectedType
      ? `将该路径调整为 ${expectedType} 类型，或放宽 Schema type 约束。`
      : '将该路径调整为 Schema 要求的类型，或放宽 type 约束。';
  }

  if (error.keyword === 'additionalProperties') {
    return additionalProperty
      ? `移除未声明字段 ${additionalProperty}，或在 Schema properties 中声明它。`
      : '移除未声明字段，或在 Schema properties / patternProperties 中声明它。';
  }

  if (['enum', 'const'].includes(error.keyword)) {
    return '改成 Schema 允许的取值，或确认业务允许后扩展枚举/常量约束。';
  }

  if (['minimum', 'exclusiveMinimum', 'maximum', 'exclusiveMaximum', 'multipleOf'].includes(error.keyword)) {
    return '调整该路径的数值到 Schema 允许范围，或放宽数值边界约束。';
  }

  if (['minLength', 'maxLength', 'pattern', 'format'].includes(error.keyword)) {
    return '调整该路径的字符串内容以符合长度、格式或正则约束。';
  }

  if (['minItems', 'maxItems', 'uniqueItems', 'contains'].includes(error.keyword)) {
    return '调整数组元素数量、唯一性或必含元素，或放宽数组约束。';
  }

  if (['minProperties', 'maxProperties', 'propertyNames'].includes(error.keyword)) {
    return '调整对象字段数量或字段名，或放宽对象结构约束。';
  }

  if (['oneOf', 'anyOf', 'allOf', 'not'].includes(error.keyword)) {
    return '检查组合 Schema 分支，确保该路径只匹配业务期望的约束组合。';
  }

  if (['dependentRequired', 'dependencies'].includes(error.keyword)) {
    return '补齐依赖字段，或调整 Schema 中的字段依赖约束。';
  }

  return '按 Schema 路径检查对应约束，确认应修正 JSON 数据还是放宽 Schema。';
};

const toIssue = (error: ErrorObject): JsonSchemaIssue => {
  const pointer = getIssuePointer(error);
  return {
    pointer,
    path: jsonPointerToJsonPath(pointer),
    keyword: error.keyword,
    message: error.message || '不符合 JSON Schema 约束',
    schemaPath: error.schemaPath,
    suggestion: getIssueSuggestion(error),
  };
};

const createEmptyIssueInsights = () => ({
  issueKeywordGroups: [],
  issuePathList: [],
});

const groupIssueKeywords = (issues: JsonSchemaIssue[]): JsonSchemaIssueGroup[] => {
  const keywordCounts = new Map<string, number>();

  issues.forEach((issue) => {
    keywordCounts.set(issue.keyword, (keywordCounts.get(issue.keyword) || 0) + 1);
  });

  return Array.from(keywordCounts.entries())
    .sort(([leftKey, leftCount], [rightKey, rightCount]) => (
      rightCount - leftCount || leftKey.localeCompare(rightKey)
    ))
    .map(([key, count]) => ({ key, count }));
};

const getIssuePathList = (issues: JsonSchemaIssue[]): string[] => (
  Array.from(new Set(issues.map(issue => issue.path))).slice(0, MAX_VISIBLE_SCHEMA_ISSUES)
);

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
      ...createEmptyIssueInsights(),
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
      ...createEmptyIssueInsights(),
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
      ...createEmptyIssueInsights(),
    };
  }

  const parsedData = parseJson(jsonText, 'SOURCE', { allowJsonLines: true });
  if (parsedData.error) {
    return {
      status: 'input-error',
      isValid: false,
      summary: parsedData.error,
      issues: [],
      issueCount: 0,
      shownIssueCount: 0,
      ...createEmptyIssueInsights(),
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
      ...createEmptyIssueInsights(),
    };
  }

  try {
    const ajv = getAjvForSchema(parsedSchema.value);
    const validate = ajv.compile(parsedSchema.value as AnySchema);
    const isValid = validate(parsedData.value);
    const sourceLabel = parsedData.sourceKind === 'json-lines' ? 'JSON Lines' : 'JSON';

    if (isValid) {
      return {
        status: 'valid',
        isValid: true,
        summary: `当前 ${sourceLabel} 符合 Schema`,
        issues: [],
        issueCount: 0,
        shownIssueCount: 0,
        ...createEmptyIssueInsights(),
      };
    }

    const allIssues = (validate.errors || []).map(toIssue);
    const visibleIssues = allIssues.slice(0, MAX_VISIBLE_SCHEMA_ISSUES);

    return {
      status: 'invalid',
      isValid: false,
      summary: `当前 ${sourceLabel} 不符合 Schema，共 ${allIssues.length} 个问题`,
      issues: visibleIssues,
      issueCount: allIssues.length,
      shownIssueCount: visibleIssues.length,
      issueKeywordGroups: groupIssueKeywords(allIssues),
      issuePathList: getIssuePathList(allIssues),
    };
  } catch (error) {
    const message = formatUnknownError(error);
    return {
      status: 'schema-error',
      isValid: false,
      summary: `Schema 无法编译: ${message}`,
      issues: [],
      issueCount: 0,
      shownIssueCount: 0,
      ...createEmptyIssueInsights(),
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

  if (result.issueKeywordGroups.length > 0) {
    lines.push('问题分布:');
    result.issueKeywordGroups.forEach((group) => {
      lines.push(`- ${group.key}: ${group.count}`);
    });
  }

  if (result.issuePathList.length > 0) {
    lines.push('路径清单:');
    result.issuePathList.forEach((path, index) => {
      lines.push(`${index + 1}. ${path}`);
    });
  }

  if (result.issues.length > 0) {
    lines.push('问题:');
    result.issues.forEach((issue, index) => {
      lines.push(`${index + 1}. ${issue.path} [${issue.keyword}] ${issue.message}`);
      lines.push(`   建议: ${issue.suggestion}`);
      lines.push(`   Schema: ${issue.schemaPath}`);
    });
  }

  if (result.issueCount > result.shownIssueCount) {
    lines.push(`还有 ${result.issueCount - result.shownIssueCount} 个问题未展示`);
  }

  return `${lines.join('\n')}\n`;
};

export const formatJsonSchemaIssueChecklistText = (
  result: JsonSchemaValidationResult
): string => {
  const lines = [
    'JSON Schema 修复清单',
    `摘要: ${result.summary}`,
  ];

  if (result.issueKeywordGroups.length > 0) {
    lines.push(`问题分布: ${result.issueKeywordGroups.map(group => `${group.key} ${group.count}`).join('，')}`);
  }

  if (result.issues.length === 0) {
    lines.push('暂无可处理的问题');
    return `${lines.join('\n')}\n`;
  }

  result.issues.forEach((issue) => {
    lines.push(`- [ ] ${issue.path} [${issue.keyword}] ${issue.message}`);
    lines.push(`  - 建议: ${issue.suggestion}`);
    lines.push(`  - Schema: ${issue.schemaPath}`);
  });

  if (result.issueCount > result.shownIssueCount) {
    lines.push(`- [ ] 还有 ${result.issueCount - result.shownIssueCount} 个问题未展示，请在工具内继续查看`);
  }

  return `${lines.join('\n')}\n`;
};
