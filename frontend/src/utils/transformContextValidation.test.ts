import { describe, expect, it } from 'vitest';
import { isTransformContext } from './transformContextValidation';
import { deepParseWithContext } from './transformations';

const createSchemeContext = () => deepParseWithContext(
  'sampleapp://v1/browser/open?from=feed',
  { autoExpandScheme: true },
).context;

describe('transformContextValidation', () => {
  it('接受协议头展示路径与编码层元数据', () => {
    expect(isTransformContext(createSchemeContext())).toBe(true);
  });

  it('拒绝非法协议头路径', () => {
    const context = createSchemeContext();
    const record = context.records.get('$');
    const invalidContext = {
      ...context,
      records: new Map([['$', {
        ...record,
        steps: record?.steps.map(step => ({
          ...step,
          schemeDisplayHeaders: step.schemeDisplayHeaders?.map(header => ({
            ...header,
            path: 'items/0',
          })),
        })),
      }]]),
    };

    expect(isTransformContext(invalidContext)).toBe(false);
  });

  it('拒绝非法协议头编码层', () => {
    const context = createSchemeContext();
    const record = context.records.get('$');
    const invalidContext = {
      ...context,
      records: new Map([['$', {
        ...record,
        steps: record?.steps.map(step => ({
          ...step,
          schemeDisplayHeaders: step.schemeDisplayHeaders?.map(header => ({
            ...header,
            layers: [{ ...header.layers[0], type: 'unknown' }],
          })),
        })),
      }]]),
    };

    expect(isTransformContext(invalidContext)).toBe(false);
  });

  it('根协议头展示字段使用共享命名校验', () => {
    const context = createSchemeContext();
    const record = context.records.get('$');
    const replaceHeaderKey = (schemeHeaderDisplayKey: string) => ({
      ...context,
      records: new Map([['$', {
        ...record,
        steps: record?.steps.map(step => ({
          ...step,
          schemeHeaderDisplayKey,
        })),
      }]]),
    });

    expect(isTransformContext(replaceHeaderKey('__scheme_header_2__'))).toBe(true);
    expect(isTransformContext(replaceHeaderKey('__scheme_header_1__'))).toBe(false);
    expect(isTransformContext(replaceHeaderKey('__scheme_header_any__'))).toBe(false);
  });
});
