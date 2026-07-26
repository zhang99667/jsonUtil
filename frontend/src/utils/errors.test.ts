import { describe, expect, it } from 'vitest';
import { formatUnknownError, getDetailedErrorMessage, getErrorMessage, isAbortError } from './errors';

describe('getErrorMessage', () => {
  it('优先展示 Error 中的具体原因', () => {
    expect(getErrorMessage(new Error('权限已失效'), '操作失败')).toBe('权限已失效');
  });

  it('空消息和非 Error 使用兜底文案', () => {
    expect(getErrorMessage(new Error('   '), '操作失败')).toBe('操作失败');
    expect(getErrorMessage('blocked', '操作失败')).toBe('操作失败');
  });

  it('读取跨上下文错误对象的消息', () => {
    const error = { name: 'Error', message: '权限已失效' };

    expect(getErrorMessage(error, '操作失败')).toBe('权限已失效');
    expect(formatUnknownError(error)).toBe('权限已失效');
  });

  it('错误消息属性读取失败时使用兜底文案', () => {
    const error = new Error('不可见');
    Object.defineProperty(error, 'message', {
      get: () => { throw new Error('读取失败'); },
    });

    expect(getErrorMessage(error, '操作失败')).toBe('操作失败');
    expect(formatUnknownError(error)).toBe('未知错误');
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

describe('formatUnknownError', () => {
  it('保持 Error.message 原样返回', () => {
    expect(formatUnknownError(new Error('权限已失效'))).toBe('权限已失效');
    expect(formatUnknownError(new Error(''))).toBe('');
  });

  it('非 Error 值使用 String 转换', () => {
    expect(formatUnknownError('blocked')).toBe('blocked');
    expect(formatUnknownError(null)).toBe('null');
    expect(formatUnknownError(undefined)).toBe('undefined');
    expect(formatUnknownError({ code: 500 })).toBe('[object Object]');
  });

  it('无法转换为字符串的异常值使用中文兜底', () => {
    expect(formatUnknownError(Object.create(null))).toBe('未知错误');
  });
});

describe('isAbortError', () => {
  it('识别 Error 形式的 AbortError', () => {
    const error = new Error('cancelled');
    error.name = 'AbortError';

    expect(isAbortError(error)).toBe(true);
  });

  it('识别跨上下文传入的 AbortError 结构', () => {
    expect(isAbortError({ name: 'AbortError' })).toBe(true);
  });

  it('错误名称读取失败时安全返回 false', () => {
    const error = new Proxy({}, {
      has: () => { throw new Error('读取失败'); },
    });

    expect(isAbortError(error)).toBe(false);
  });

  it('非取消错误返回 false', () => {
    expect(isAbortError(new Error('denied'))).toBe(false);
  });
});
