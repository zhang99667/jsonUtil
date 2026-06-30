import { describe, expect, it } from 'vitest';
import { TransformMode } from '../types';
import { deepParseWithContext } from './transformations';
import {
  resolveAppPreviewOutputSource,
  shouldValidatePreviewOutputBeforeSync,
} from './appPreviewOutputSync';

describe('appPreviewOutputSync', () => {
  it('仅格式化类 PREVIEW 编辑需要同步前 JSON 校验', () => {
    expect(shouldValidatePreviewOutputBeforeSync(TransformMode.FORMAT)).toBe(true);
    expect(shouldValidatePreviewOutputBeforeSync(TransformMode.DEEP_FORMAT)).toBe(true);
    expect(shouldValidatePreviewOutputBeforeSync(TransformMode.MINIFY)).toBe(true);
    expect(shouldValidatePreviewOutputBeforeSync(TransformMode.NONE)).toBe(false);
    expect(shouldValidatePreviewOutputBeforeSync(TransformMode.URL_ENCODE)).toBe(false);
  });

  it('深度格式化有上下文时使用 context 精确回写嵌套字符串', () => {
    const source = '{"payload":"{\\"a\\":1}"}';
    const { output, context } = deepParseWithContext(source);
    const edited = output.replace('"a": 1', '"a": 2');

    const restored = resolveAppPreviewOutputSource({
      previewText: edited,
      mode: TransformMode.DEEP_FORMAT,
      originalInput: source,
      context,
    });

    expect(JSON.parse(restored)).toEqual({ payload: '{"a":2}' });
  });

  it('无上下文时回退到普通反向转换并保留原始包装', () => {
    const restored = resolveAppPreviewOutputSource({
      previewText: '{\n  "a": 2\n}',
      mode: TransformMode.FORMAT,
      originalInput: 'while(1);{"a":1}',
      context: null,
    });

    expect(restored).toBe('while(1);{"a":2}');
  });
});
