import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn((callback: unknown) => callback),
  useEffect: vi.fn<(_: () => void | (() => void)) => void>(),
  useLayoutEffect: vi.fn<(_: () => void | (() => void)) => void>(),
  useRef: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useLayoutEffect: reactMocks.useLayoutEffect,
  useRef: reactMocks.useRef,
}));
import { useFileOpenRequestGuard } from './useFileOpenRequestGuard';

const createGuardScenario = (input = '{"before":true}') => {
  const inputRef = { current: input };
  const stateRef = {
    current: { mode: TransformMode.NONE, requestSequence: 0, workspaceRevision: 0 },
  };

  const useGuard = (mode = TransformMode.NONE) => {
    reactMocks.useRef.mockReturnValue(stateRef);
    return useFileOpenRequestGuard({ inputRef, mode });
  };

  return { inputRef, useGuard };
};

describe('useFileOpenRequestGuard 文件打开请求守卫', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('后发请求会使更早请求失去激活资格', () => {
    const guard = createGuardScenario().useGuard();
    const [firstRequest, latestRequest] = [guard.beginRequest(), guard.beginRequest()];

    expect(guard.inspectRequest(firstRequest).shouldActivate).toBe(false);
    expect(guard.inspectRequest(latestRequest).shouldActivate).toBe(true);
  });

  it('输入变化会使读取中的请求失去激活资格', () => {
    const scenario = createGuardScenario();
    const guard = scenario.useGuard();
    const request = guard.beginRequest();
    scenario.inputRef.current = '{"after":true}';

    expect(guard.inspectRequest(request)).toMatchObject({
      currentInput: '{"after":true}',
      shouldActivate: false,
    });
  });

  it('工作区意图会使读取中的请求失效', () => {
    const guard = createGuardScenario().useGuard();
    const request = guard.beginRequest();

    guard.markWorkspaceIntent();

    expect(guard.inspectRequest(request).shouldActivate).toBe(false);
  });

  it('带模式的工作区意图会同步后续请求模式', () => {
    const guard = createGuardScenario().useGuard();

    guard.markWorkspaceIntent(TransformMode.FORMAT);
    const request = guard.beginRequest();

    expect(guard.captureWorkspaceMode()).toBe(TransformMode.FORMAT);
    expect(request.mode).toBe(TransformMode.FORMAT);
    expect(guard.inspectRequest(request).shouldActivate).toBe(true);
  });

  it('工作区修订号只接受当前值', () => {
    const guard = createGuardScenario().useGuard();
    const originalRevision = guard.captureWorkspaceRevision();

    expect(guard.isWorkspaceRevisionCurrent(originalRevision)).toBe(true);
    guard.markWorkspaceIntent();
    expect(guard.isWorkspaceRevisionCurrent(originalRevision)).toBe(false);
    expect(guard.isWorkspaceRevisionCurrent(guard.captureWorkspaceRevision())).toBe(true);
  });

  it('相同模式提交不改变修订号或请求资格', () => {
    const scenario = createGuardScenario();
    const guard = scenario.useGuard();
    const [request, revision] = [guard.beginRequest(), guard.captureWorkspaceRevision()];
    const currentGuard = scenario.useGuard();
    reactMocks.useLayoutEffect.mock.calls.at(-1)?.[0]();

    expect(currentGuard.captureWorkspaceRevision()).toBe(revision);
    expect(currentGuard.inspectRequest(request).shouldActivate).toBe(true);
  });

  it('模式提交恰好推进一次修订号并使旧请求失效', () => {
    const scenario = createGuardScenario();
    const previousGuard = scenario.useGuard();
    const request = previousGuard.beginRequest();
    const previousRevision = previousGuard.captureWorkspaceRevision();
    const currentGuard = scenario.useGuard(TransformMode.FORMAT);
    reactMocks.useLayoutEffect.mock.calls.at(-1)?.[0]();

    expect(currentGuard.captureWorkspaceRevision()).toBe(previousRevision + 1);
    expect(currentGuard.captureWorkspaceMode()).toBe(TransformMode.FORMAT);
    expect(currentGuard.inspectRequest(request).shouldActivate).toBe(false);
  });

  it('组件卸载后使读取中的请求失去激活资格', () => {
    const guard = createGuardScenario().useGuard();
    const request = guard.beginRequest();
    const cleanup = reactMocks.useEffect.mock.calls.at(-1)?.[0]();
    if (typeof cleanup === 'function') cleanup();

    expect(guard.inspectRequest(request).shouldActivate).toBe(false);
  });
});
