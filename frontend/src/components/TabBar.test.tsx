import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FileTab } from '../types';
import { TabBar } from './TabBar';
import { assertElementLike, findByTour, findByType, type ElementLike } from './componentElementTestHelpers';

const FILES: FileTab[] = [
  { id: 'first', name: 'first.json', content: '{}' },
  { id: 'second', name: 'second.ts', content: '', isDirty: true },
];

type TabBarProps = Parameters<typeof TabBar>[0];
type ElementHandler = (...args: unknown[]) => unknown;

const getHandler = (element: ElementLike, name: string): ElementHandler => {
  const handler = element.props[name];
  if (typeof handler !== 'function') throw new Error(`缺少 ${name} 处理器`);
  return handler as ElementHandler;
};

const createContainer = () => {
  const focusFirst = vi.fn();
  const focusSecond = vi.fn();
  const container = {
    scrollLeft: 0,
    querySelectorAll: vi.fn(() => [
      { focus: focusFirst },
      { focus: focusSecond },
    ]),
  } as unknown as HTMLDivElement;

  return { container, focusFirst, focusSecond };
};

const renderTabBar = (overrides: Partial<TabBarProps> = {}) => {
  const { container, focusFirst, focusSecond } = createContainer();
  const props: TabBarProps = {
    files: FILES,
    activeFileId: 'first',
    onTabClick: vi.fn(),
    onCloseFile: vi.fn(),
    onNewTab: vi.fn(),
    tabsContainerRef: { current: container },
    onScroll: vi.fn(),
    showScrollbar: true,
    thumbSize: 40,
    thumbOffset: 25,
    onScrollbarMouseDown: vi.fn(),
    ...overrides,
  };

  return {
    tree: assertElementLike(TabBar(props)),
    props,
    container,
    focusFirst,
    focusSecond,
  };
};

const installAnimationFrame = () => {
  vi.stubGlobal('window', {
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    },
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TabBar', () => {
  it('保留标签、关闭按钮和滚动条的可访问契约', () => {
    const { tree, props } = renderTabBar();
    const tabs = findByType(tree, 'div').filter(element => element.props.role === 'tab');
    const buttons = findByType(tree, 'button');
    const scrollbarThumb = findByType(tree, 'div').find(element => (
      element.props.className === 'h-full bg-scrollbar-bg hover:bg-scrollbar-hover rounded-full cursor-pointer relative'
    ));

    expect(tabs.map(tab => tab.props['aria-label'])).toEqual(['first.json', 'second.ts，未保存']);
    expect(tabs.map(tab => tab.props['aria-selected'])).toEqual([true, false]);
    expect(tabs.map(tab => tab.props.tabIndex)).toEqual([0, -1]);
    expect(buttons.map(button => button.props['aria-label'])).toEqual([
      '关闭标签 first.json',
      '关闭未保存标签 second.ts',
      '新建标签 (Cmd+N)',
    ]);
    expect(scrollbarThumb?.props.style).toEqual({ width: '40%', left: '25%' });
    expect(scrollbarThumb?.props.onMouseDown).toBe(props.onScrollbarMouseDown);
  });

  it('键盘导航循环激活标签并恢复焦点', () => {
    installAnimationFrame();
    const onTabClick = vi.fn();
    const { tree, focusSecond } = renderTabBar({ onTabClick });
    const firstTab = findByType(tree, 'div').find(element => element.props['aria-label'] === 'first.json');
    const preventDefault = vi.fn();

    getHandler(assertElementLike(firstTab), 'onKeyDown')({ key: 'ArrowLeft', preventDefault });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onTabClick).toHaveBeenCalledWith('second');
    expect(focusSecond).toHaveBeenCalledTimes(1);
  });

  it('关闭已保存标签后移动焦点，未保存标签交给上层确认', () => {
    installAnimationFrame();
    const onCloseFile = vi.fn();
    const { tree, focusFirst, focusSecond } = renderTabBar({ onCloseFile });
    const tabs = findByType(tree, 'div').filter(element => element.props.role === 'tab');

    getHandler(tabs[0], 'onKeyDown')({ key: 'Delete', preventDefault: vi.fn() });
    getHandler(tabs[1], 'onKeyDown')({ key: 'Delete', preventDefault: vi.fn() });

    expect(onCloseFile).toHaveBeenNthCalledWith(1, 'first');
    expect(onCloseFile).toHaveBeenNthCalledWith(2, 'second');
    expect(focusFirst).toHaveBeenCalledTimes(1);
    expect(focusSecond).not.toHaveBeenCalled();
  });

  it('忽略失效索引并将滚轮位移映射到横向滚动', () => {
    const files = [...FILES];
    const onTabClick = vi.fn();
    const { tree, container } = renderTabBar({ files, onTabClick });
    const tabs = findByType(tree, 'div').filter(element => element.props.role === 'tab');
    const tabListContainer = findByTour(tree, 'editor-tabs')[0];

    files.pop();
    getHandler(tabs[1], 'onKeyDown')({ key: 'Enter', preventDefault: vi.fn() });
    getHandler(tabListContainer, 'onWheel')({ deltaY: 12, deltaX: 0 });

    expect(onTabClick).not.toHaveBeenCalled();
    expect(container.scrollLeft).toBe(12);
  });
});
