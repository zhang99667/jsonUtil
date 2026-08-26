import type { editor } from 'monaco-editor';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSynchronizedScrollTop, useEditorScrollSync } from './useEditorScrollSync';

const reactMocks = vi.hoisted(() => ({
  effectCleanups: [] as Array<() => void>,
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => void | (() => void)) => {
    const cleanupEffect = effect();
    if (typeof cleanupEffect === 'function') reactMocks.effectCleanups.push(cleanupEffect);
  },
  useRef: (initialValue: unknown) => ({ current: initialValue }),
  useState: (initialValue: unknown) => {
    let currentValue = initialValue;
    const setValue = (nextValue: unknown) => {
      currentValue = typeof nextValue === 'function'
        ? (nextValue as (value: unknown) => unknown)(currentValue)
        : nextValue;
    };
    return [currentValue, setValue];
  },
}));

interface ScrollEventLike {
  scrollTop: number;
  scrollTopChanged: boolean;
}

class FakeDomNode {
  private readonly wheelListeners = new Set<EventListenerOrEventListenerObject>();

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type === 'wheel') this.wheelListeners.add(listener);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type === 'wheel') this.wheelListeners.delete(listener);
  }

  emitWheel(): void {
    const event = { type: 'wheel' } as Event;
    this.wheelListeners.forEach(listener => {
      if (typeof listener === 'function') listener(event);
      else listener.handleEvent(event);
    });
  }
}

class FakeEditor {
  private readonly scrollListeners = new Set<(event: ScrollEventLike) => void>();
  private readonly modelChangeListeners = new Set<() => void>();
  private readonly keyDownListeners = new Set<() => void>();
  private readonly mouseDownListeners = new Set<() => void>();
  private readonly domNode = new FakeDomNode();
  private scrollTop = 0;

  readonly setScrollTopSpy = vi.fn((scrollTop: number) => {
    this.scrollTop = scrollTop;
    this.emitScroll(scrollTop);
  });

  constructor(
    private readonly scrollHeight: number,
    private readonly height: number,
  ) {}

  asMonacoEditor(): editor.IStandaloneCodeEditor {
    return this as unknown as editor.IStandaloneCodeEditor;
  }

  getScrollTop(): number {
    return this.scrollTop;
  }

  getScrollHeight(): number {
    return this.scrollHeight;
  }

  getLayoutInfo(): { height: number } {
    return { height: this.height };
  }

  getDomNode(): HTMLElement {
    return this.domNode as unknown as HTMLElement;
  }

  setScrollTop(scrollTop: number): void {
    this.setScrollTopSpy(scrollTop);
  }

  onDidScrollChange(listener: (event: ScrollEventLike) => void) {
    return this.addListener(this.scrollListeners, listener);
  }

  onDidChangeModel(listener: () => void) {
    return this.addListener(this.modelChangeListeners, listener);
  }

  onKeyDown(listener: () => void) {
    return this.addListener(this.keyDownListeners, listener);
  }

  onMouseDown(listener: () => void) {
    return this.addListener(this.mouseDownListeners, listener);
  }

  emitScroll(scrollTop: number, scrollTopChanged = true): void {
    this.scrollTop = scrollTop;
    this.scrollListeners.forEach(listener => listener({ scrollTop, scrollTopChanged }));
  }

  emitModelChange(): void {
    this.modelChangeListeners.forEach(listener => listener());
  }

  emitKeyDown(): void {
    this.keyDownListeners.forEach(listener => listener());
  }

  emitMouseDown(): void {
    this.mouseDownListeners.forEach(listener => listener());
  }

  emitWheel(): void {
    this.domNode.emitWheel();
  }

  get scrollListenerCount(): number {
    return this.scrollListeners.size;
  }

  private addListener<T>(listeners: Set<T>, listener: T) {
    listeners.add(listener);
    return { dispose: () => listeners.delete(listener) };
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  reactMocks.effectCleanups.length = 0;
});

afterEach(() => {
  reactMocks.effectCleanups.splice(0).reverse().forEach(cleanupEffect => cleanupEffect());
});

describe('getSynchronizedScrollTop', () => {
  it('按源窗口可滚动比例映射目标 scrollTop', () => {
    expect(getSynchronizedScrollTop({
      sourceScrollTop: 450,
      sourceScrollHeight: 1000,
      sourceHeight: 100,
      targetScrollHeight: 500,
      targetHeight: 100,
    })).toBe(200);
  });

  it('将超出源窗口范围的 scrollTop 限制到目标边界', () => {
    const dimensions = {
      sourceScrollHeight: 1000,
      sourceHeight: 100,
      targetScrollHeight: 500,
      targetHeight: 100,
    };

    expect(getSynchronizedScrollTop({ ...dimensions, sourceScrollTop: -20 })).toBe(0);
    expect(getSynchronizedScrollTop({ ...dimensions, sourceScrollTop: 1200 })).toBe(400);
  });

  it('任一侧没有可滚动范围时返回顶部', () => {
    expect(getSynchronizedScrollTop({
      sourceScrollTop: 50,
      sourceScrollHeight: 100,
      sourceHeight: 100,
      targetScrollHeight: 500,
      targetHeight: 100,
    })).toBe(0);
    expect(getSynchronizedScrollTop({
      sourceScrollTop: 450,
      sourceScrollHeight: 1000,
      sourceHeight: 100,
      targetScrollHeight: 100,
      targetHeight: 100,
    })).toBe(0);
  });
});

describe('useEditorScrollSync', () => {
  it('默认关闭，启用后双向同步且不回环写入', () => {
    const source = new FakeEditor(1000, 100);
    const preview = new FakeEditor(500, 100);
    const hook = useEditorScrollSync();

    hook.onSourceEditorMount(source.asMonacoEditor());
    hook.onPreviewEditorMount(preview.asMonacoEditor());
    source.emitScroll(450);
    expect(hook.isScrollSyncEnabled).toBe(false);
    expect(preview.setScrollTopSpy).not.toHaveBeenCalled();

    hook.toggleScrollSync();
    source.emitScroll(450);
    expect(preview.setScrollTopSpy).toHaveBeenLastCalledWith(200);
    expect(source.setScrollTopSpy).not.toHaveBeenCalled();

    preview.emitScroll(100);
    expect(source.setScrollTopSpy).toHaveBeenLastCalledWith(225);
    expect(preview.setScrollTopSpy).toHaveBeenCalledTimes(1);
  });

  it('模型切换后抑制程序化滚动，直到侧边收到用户意图', () => {
    const source = new FakeEditor(1000, 100);
    const preview = new FakeEditor(500, 100);
    const hook = useEditorScrollSync();

    hook.onSourceEditorMount(source.asMonacoEditor());
    hook.onPreviewEditorMount(preview.asMonacoEditor());
    hook.toggleScrollSync();

    source.emitModelChange();
    source.emitScroll(450);
    expect(preview.setScrollTopSpy).not.toHaveBeenCalled();

    source.emitKeyDown();
    source.emitScroll(450);
    expect(preview.setScrollTopSpy).toHaveBeenLastCalledWith(200);

    source.emitModelChange();
    source.emitMouseDown();
    source.emitScroll(225);
    expect(preview.setScrollTopSpy).toHaveBeenLastCalledWith(100);

    source.emitModelChange();
    source.emitWheel();
    source.emitScroll(90);
    expect(preview.setScrollTopSpy).toHaveBeenLastCalledWith(40);
  });

  it('重复 mount 和 hook 卸载时清理旧监听', () => {
    const firstSource = new FakeEditor(1000, 100);
    const nextSource = new FakeEditor(1000, 100);
    const preview = new FakeEditor(500, 100);
    const hook = useEditorScrollSync();

    hook.onSourceEditorMount(firstSource.asMonacoEditor());
    hook.onPreviewEditorMount(preview.asMonacoEditor());
    hook.onSourceEditorMount(nextSource.asMonacoEditor());
    hook.toggleScrollSync();

    expect(firstSource.scrollListenerCount).toBe(0);
    expect(nextSource.scrollListenerCount).toBe(1);
    firstSource.emitScroll(450);
    expect(preview.setScrollTopSpy).not.toHaveBeenCalled();

    reactMocks.effectCleanups.splice(0).reverse().forEach(cleanupEffect => cleanupEffect());
    expect(nextSource.scrollListenerCount).toBe(0);
  });
});
