import { describe, expect, it, vi } from 'vitest';
import { assertElementLike } from './componentElementTestHelpers';
import { JsonPathPanelQueryInputField } from './JsonPathPanelQueryInputField';

const renderInputField = (
  overrides: Partial<Parameters<typeof JsonPathPanelQueryInputField>[0]> = {}
) => JsonPathPanelQueryInputField({
  query: '$.store',
  error: '',
  descriptionId: 'jsonpath-query-desc',
  inputRef: vi.fn(),
  onQueryChange: vi.fn(),
  onKeyDown: vi.fn(),
  ...overrides,
});

const emitInputChange = (node: ReturnType<typeof assertElementLike>, value: string) => {
  const onChange = node.props.onChange;
  if (typeof onChange !== 'function') throw new Error('expected input change handler');
  onChange({ target: { value } });
};

describe('JsonPathPanelQueryInputField', () => {
  it('渲染 JSONPath 输入框的值、描述和错误状态', () => {
    const inputRef = vi.fn();
    const onKeyDown = vi.fn();
    const input = assertElementLike(renderInputField({
      error: 'JSONPath 语法错误',
      inputRef,
      onKeyDown,
    }));

    expect(input.type).toBe('input');
    expect(input.props).toMatchObject({
      ref: inputRef,
      value: '$.store',
      'data-tour': 'jsonpath-input',
      'aria-label': 'JSONPath 表达式',
      'aria-invalid': true,
      'aria-describedby': 'jsonpath-query-desc',
      onKeyDown,
    });
  });

  it('输入变化时只向上回传新的查询文本', () => {
    const onQueryChange = vi.fn();
    const input = assertElementLike(renderInputField({ onQueryChange }));

    emitInputChange(input, '$..policies');

    expect(onQueryChange).toHaveBeenCalledWith('$..policies');
  });
});
