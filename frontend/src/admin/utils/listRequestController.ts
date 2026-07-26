import {
  resolveAvailableListQuery,
} from './listQuery';
import type { AdminListQuery } from './listQuery';

export interface AdminListPage<T> {
  items: T[];
  total: number;
  query: AdminListQuery;
}

interface AdminListRequestControllerOptions<T> {
  initialQuery: AdminListQuery;
  loadPage: (query: AdminListQuery) => Promise<AdminListPage<T>>;
  onCommit: (page: AdminListPage<T>) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: unknown) => void;
}

export interface AdminListRequestController {
  mount: () => Promise<void>;
  dispose: () => void;
  refresh: (
    updateQuery?: (query: AdminListQuery) => AdminListQuery,
  ) => Promise<void>;
  search: (keyword: string) => Promise<void>;
  changePage: (page: number, pageSize: number) => Promise<void>;
  getLatestQuery: () => AdminListQuery;
  isMounted: () => boolean;
}

export const createAdminListRequestController = <T>({
  initialQuery,
  loadPage,
  onCommit,
  onLoadingChange,
  onError,
}: AdminListRequestControllerOptions<T>): AdminListRequestController => {
  let mounted = false;
  let requestId = 0;
  let latestQuery = initialQuery;

  const isCurrentRequest = (currentRequestId: number): boolean => (
    mounted && requestId === currentRequestId
  );

  const load = async (query: AdminListQuery): Promise<void> => {
    if (!mounted) return;

    latestQuery = query;
    const currentRequestId = ++requestId;
    onLoadingChange(true);

    try {
      let resolvedQuery = query;
      while (true) {
        const result = await loadPage(resolvedQuery);
        if (!isCurrentRequest(currentRequestId)) return;

        const availableQuery = resolveAvailableListQuery(resolvedQuery, result.total);
        if (availableQuery !== resolvedQuery) {
          resolvedQuery = availableQuery;
          latestQuery = resolvedQuery;
          continue;
        }

        latestQuery = result.query;
        onCommit(result);
        return;
      }
    } catch (error) {
      if (isCurrentRequest(currentRequestId)) {
        onError(error);
      }
    } finally {
      if (isCurrentRequest(currentRequestId)) {
        onLoadingChange(false);
      }
    }
  };

  return {
    mount: () => {
      if (mounted) return Promise.resolve();
      mounted = true;
      return load(latestQuery);
    },
    dispose: () => {
      mounted = false;
      requestId += 1;
    },
    refresh: (updateQuery) => {
      const query = updateQuery ? updateQuery(latestQuery) : latestQuery;
      return load(query);
    },
    search: (keyword) => load({
      ...latestQuery,
      page: 1,
      keyword,
    }),
    changePage: (page, pageSize) => load({
      ...latestQuery,
      page,
      pageSize,
    }),
    getLatestQuery: () => latestQuery,
    isMounted: () => mounted,
  };
};
