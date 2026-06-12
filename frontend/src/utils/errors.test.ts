import { describe, expect, it } from 'vitest';
import { getDetailedErrorMessage, getErrorMessage, isAbortError } from './errors';

describe('getErrorMessage', () => {
  it('优先展示 Error 中的具体原因', () => {
    expect(getErrorMessage(new Error('权限已失效'), '操作失败')).toBe('权限已失效');
  });

  it('空消息和非 Error 使用兜底文案', () => {
    expect(getErrorMessage(new Error('   '), '操作失败')).toBe('操作失败');
    expect(getErrorMessage('blocked', '操作失败')).toBe('操作失败');
  });
});

describe('getDetailedErrorMessage', () => {
  it('组合操作上下文和底层错误原因', () => {
    expect(getDetailedErrorMessage(new Error('权限已失效'), '打开文件失败')).toBe('打开文件失败：权限已失效');
  });

  it('避免重复追加相同上下文', () => {
    expect(getDetailedErrorMessage(new Error('打开文件失败：权限已失效'), '打开文件失败')).toBe('打开文件失败：权限已失效');
  });

  it('没有底层原因时使用兜底文案', () => {
    expect(getDetailedErrorMessage(undefined, '保存文件失败')).toBe('保存文件失败');
  });
});

describe('isAbortError', () => {
  it('识别 Error 形式的 AbortError', () => {
    const error = new Error('cancelled');
    error.name = 'AbortError';

    expect(isAbortError(error)).toBe(true);
  });

  it('非取消错误返回 false', () => {
    expect(isAbortError(new Error('denied'))).toBe(false);
  });
});
