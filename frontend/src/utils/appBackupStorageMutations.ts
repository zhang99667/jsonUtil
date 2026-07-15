export interface AppBackupStorageMutation {
  key: string;
  value: string | null;
}

const applyStorageMutation = (
  storage: Storage,
  { key, value }: AppBackupStorageMutation
): void => {
  if (value === null) {
    storage.removeItem(key);
    return;
  }

  storage.setItem(key, value);
};

const restoreStorageValue = (
  storage: Storage,
  key: string,
  previousValue: string | null
): void => {
  if (previousValue === null) {
    storage.removeItem(key);
    return;
  }

  storage.setItem(key, previousValue);
};

export const applyAppBackupStorageMutations = (
  storage: Storage,
  mutations: readonly AppBackupStorageMutation[]
): void => {
  // 浏览器本地存储没有跨键事务，这里只补偿本次同步调用中已完成的变更。
  const previousValues = new Map<string, string | null>();

  // 快照保留原始字符串和缺失状态，避免恢复时改变旧数据格式。
  for (const { key } of mutations) {
    if (!previousValues.has(key)) {
      previousValues.set(key, storage.getItem(key));
    }
  }

  const appliedKeys: string[] = [];

  try {
    for (const mutation of mutations) {
      applyStorageMutation(storage, mutation);
      appliedKeys.push(mutation.key);
    }
  } catch (applyError) {
    const rollbackErrors: unknown[] = [];
    const restoredKeys = new Set<string>();

    for (let index = appliedKeys.length - 1; index >= 0; index -= 1) {
      const key = appliedKeys[index];
      if (restoredKeys.has(key)) continue;
      restoredKeys.add(key);

      try {
        restoreStorageValue(storage, key, previousValues.get(key) ?? null);
      } catch (rollbackError) {
        // 单个恢复失败不能阻断其余已变更键的补偿。
        rollbackErrors.push(rollbackError);
      }
    }

    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [applyError, ...rollbackErrors],
        '配置备份导入失败，部分设置可能已变更，请重新加载页面后检查配置'
      );
    }

    throw applyError;
  }
};
