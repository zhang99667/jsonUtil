import { describe, expect, it, vi } from 'vitest';
import {
  createAdminListRequestController,
} from './listRequestController';
import type {
  AdminListPage,
} from './listRequestController';
import type { AdminListQuery } from './listQuery';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

const createDeferred = <T>(): Deferred<T> => {
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (error: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
  };
};

const createPage = (
  query: AdminListQuery,
  total = 1,
): AdminListPage<string> => ({
  items: [`第${query.page}页`],
  total,
  query,
});

const INITIAL_QUERY: AdminListQuery = {
  page: 1,
  pageSize: 10,
  keyword: '',
};

describe('createAdminListRequestController', () => {
  it('忽略旧响应并保留最新搜索条件', async () => {
    const first = createDeferred<AdminListPage<string>>();
    const second = createDeferred<AdminListPage<string>>();
    const loadPage = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const onCommit = vi.fn();
    const controller = createAdminListRequestController({
      initialQuery: INITIAL_QUERY,
      loadPage,
      onCommit,
      onLoadingChange: vi.fn(),
      onError: vi.fn(),
    });

    const initialLoad = controller.mount();
    const searchLoad = controller.search('最新条件');
    second.resolve(createPage({ ...INITIAL_QUERY, keyword: '最新条件' }));
    await searchLoad;
    first.resolve(createPage(INITIAL_QUERY));
    await initialLoad;

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(createPage({
      ...INITIAL_QUERY,
      keyword: '最新条件',
    }));
    expect(controller.getLatestQuery()).toEqual({
      ...INITIAL_QUERY,
      keyword: '最新条件',
    });
  });

  it('卸载后忽略响应且不结束页面加载状态', async () => {
    const pending = createDeferred<AdminListPage<string>>();
    const onCommit = vi.fn();
    const onLoadingChange = vi.fn();
    const controller = createAdminListRequestController({
      initialQuery: INITIAL_QUERY,
      loadPage: () => pending.promise,
      onCommit,
      onLoadingChange,
      onError: vi.fn(),
    });

    const load = controller.mount();
    controller.dispose();
    pending.resolve(createPage(INITIAL_QUERY));
    await load;

    expect(controller.isMounted()).toBe(false);
    expect(onCommit).not.toHaveBeenCalled();
    expect(onLoadingChange).toHaveBeenCalledTimes(1);
    expect(onLoadingChange).toHaveBeenCalledWith(true);
  });

  it('旧请求结束时不覆盖当前请求的加载状态', async () => {
    const first = createDeferred<AdminListPage<string>>();
    const second = createDeferred<AdminListPage<string>>();
    const onLoadingChange = vi.fn();
    const controller = createAdminListRequestController({
      initialQuery: INITIAL_QUERY,
      loadPage: vi.fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
      onCommit: vi.fn(),
      onLoadingChange,
      onError: vi.fn(),
    });

    const firstLoad = controller.mount();
    const secondLoad = controller.changePage(2, 20);
    first.resolve(createPage(INITIAL_QUERY));
    await firstLoad;
    expect(onLoadingChange.mock.calls).toEqual([[true], [true]]);

    second.resolve(createPage({ ...INITIAL_QUERY, page: 2, pageSize: 20 }, 40));
    await secondLoad;
    expect(onLoadingChange.mock.calls).toEqual([[true], [true], [false]]);
  });

  it('只上报当前请求错误', async () => {
    const first = createDeferred<AdminListPage<string>>();
    const second = createDeferred<AdminListPage<string>>();
    const onError = vi.fn();
    const controller = createAdminListRequestController({
      initialQuery: INITIAL_QUERY,
      loadPage: vi.fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
      onCommit: vi.fn(),
      onLoadingChange: vi.fn(),
      onError,
    });

    const firstLoad = controller.mount();
    const secondLoad = controller.refresh();
    first.reject(new Error('旧错误'));
    await firstLoad;
    expect(onError).not.toHaveBeenCalled();

    const currentError = new Error('当前错误');
    second.reject(currentError);
    await secondLoad;
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(currentError);
  });

  it('总数连续缩小时持续回退到可用页', async () => {
    const loadPage = vi.fn(async (query: AdminListQuery) => {
      const totals = new Map([[3, 15], [2, 5], [1, 1]]);
      return createPage(query, totals.get(query.page) ?? 0);
    });
    const onCommit = vi.fn();
    const controller = createAdminListRequestController({
      initialQuery: { ...INITIAL_QUERY, page: 3, keyword: '保留条件' },
      loadPage,
      onCommit,
      onLoadingChange: vi.fn(),
      onError: vi.fn(),
    });

    await controller.mount();

    expect(loadPage.mock.calls.map(([query]) => query.page)).toEqual([3, 2, 1]);
    expect(onCommit).toHaveBeenCalledWith(createPage({
      ...INITIAL_QUERY,
      page: 1,
      keyword: '保留条件',
    }));
    expect(controller.getLatestQuery()).toEqual({
      ...INITIAL_QUERY,
      page: 1,
      keyword: '保留条件',
    });
  });

  it('分页基数由页面适配器负责转换', async () => {
    const oneBasedService = vi.fn(async (page: number, pageSize: number) => ({
      list: [`文件${page}`],
      total: 12,
      pageSize,
    }));
    const zeroBasedService = vi.fn(async (page: number, pageSize: number) => ({
      content: [`用户${page}`],
      totalElements: 12,
      number: page,
      size: pageSize,
    }));
    const fileController = createAdminListRequestController({
      initialQuery: { ...INITIAL_QUERY, page: 2 },
      loadPage: async (query) => {
        const result = await oneBasedService(query.page, query.pageSize);
        return {
          items: result.list,
          total: result.total,
          query,
        };
      },
      onCommit: vi.fn(),
      onLoadingChange: vi.fn(),
      onError: vi.fn(),
    });
    const userController = createAdminListRequestController({
      initialQuery: { ...INITIAL_QUERY, page: 2 },
      loadPage: async (query) => {
        const result = await zeroBasedService(query.page - 1, query.pageSize);
        return {
          items: result.content,
          total: result.totalElements,
          query: {
            ...query,
            page: result.number + 1,
            pageSize: result.size,
          },
        };
      },
      onCommit: vi.fn(),
      onLoadingChange: vi.fn(),
      onError: vi.fn(),
    });

    await Promise.all([fileController.mount(), userController.mount()]);

    expect(oneBasedService).toHaveBeenCalledWith(2, 10);
    expect(zeroBasedService).toHaveBeenCalledWith(1, 10);
    expect(fileController.getLatestQuery().page).toBe(2);
    expect(userController.getLatestQuery().page).toBe(2);
  });
});
