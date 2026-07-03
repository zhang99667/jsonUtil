import { describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import { applyWorkspaceSourceState } from './workspaceSourceState';

describe('workspaceSourceState', () => {
  it('替换 SOURCE 和模式前先执行取消回调', () => {
    const events: string[] = [];
    const inputRef = { current: '{"old":true}' };
    const onBeforeSourceWorkspaceChange = vi.fn(() => events.push('before'));
    const setInput = vi.fn(() => events.push('input'));
    const setMode = vi.fn(() => events.push('mode'));

    applyWorkspaceSourceState({
      content: '{"next":true}',
      mode: TransformMode.DEEP_FORMAT,
      inputRef,
      onBeforeSourceWorkspaceChange,
      setInput,
      setMode,
    });

    expect(onBeforeSourceWorkspaceChange).toHaveBeenCalledTimes(1);
    expect(setInput).toHaveBeenCalledWith('{"next":true}');
    expect(inputRef.current).toBe('{"next":true}');
    expect(setMode).toHaveBeenCalledWith(TransformMode.DEEP_FORMAT);
    expect(events).toEqual(['before', 'input', 'mode']);
  });

  it('未传模式时只替换 SOURCE', () => {
    const inputRef = { current: 'old' };
    const setMode = vi.fn();

    applyWorkspaceSourceState({
      content: 'next',
      inputRef,
      setInput: vi.fn(),
      setMode,
    });

    expect(inputRef.current).toBe('next');
    expect(setMode).not.toHaveBeenCalled();
  });
});
