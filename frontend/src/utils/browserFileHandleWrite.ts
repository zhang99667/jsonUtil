interface ActiveFileWriteQueue {
  handle: FileSystemFileHandle;
  pendingWrites: number;
  tail: Promise<void>;
}

interface RegisteredFileWrite {
  currentWrite: Promise<void>;
}

const activeFileWriteQueues = new Set<ActiveFileWriteQueue>();
let fileWriteRegistrationTail = Promise.resolve();

export const FILE_HANDLE_ENTRY_COMPARISON_TIMEOUT_MS = 10_000;

export const writeTextToFileHandle = async (
  handle: FileSystemFileHandle,
  text: string,
): Promise<void> => {
  const writable = await handle.createWritable();

  try {
    await writable.write(text);
    await writable.close();
  } catch (error) {
    try {
      await writable.abort(error);
    } catch (abortError) {
      console.warn('文件写入失败后中止临时写入流也失败:', abortError);
    }
    throw error;
  }
};

const enqueueFileWriteRegistration = <Result>(
  task: () => Promise<Result> | Result,
): Promise<Result> => {
  const result = fileWriteRegistrationTail.then(task, task);
  fileWriteRegistrationTail = result.then(() => undefined, () => undefined);
  return result;
};

const isSameFileEntry = async (
  handle: FileSystemFileHandle,
  candidate: FileSystemFileHandle,
): Promise<boolean> => {
  if (typeof handle.isSameEntry !== 'function') return false;

  const comparison = handle.isSameEntry(candidate);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      comparison,
      new Promise<never>((_, reject) => {
        timeoutId = globalThis.setTimeout(() => {
          reject(new DOMException('文件句柄入口比较超时', 'TimeoutError'));
        }, FILE_HANDLE_ENTRY_COMPARISON_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId);
  }
};

const findActiveFileWriteQueue = async (
  handle: FileSystemFileHandle,
): Promise<ActiveFileWriteQueue | undefined> => {
  for (const queue of activeFileWriteQueues) {
    if (queue.handle === handle) return queue;
  }
  for (const queue of activeFileWriteQueues) {
    if (await isSameFileEntry(handle, queue.handle)) return queue;
  }
  return undefined;
};

const registerFileWrite = async (
  handle: FileSystemFileHandle,
  text: string,
): Promise<RegisteredFileWrite> => {
  const existingQueue = await findActiveFileWriteQueue(handle);
  const queue = existingQueue ?? {
    handle,
    pendingWrites: 0,
    tail: Promise.resolve(),
  };
  if (!existingQueue) activeFileWriteQueues.add(queue);

  const currentWrite = queue.tail.then(() => writeTextToFileHandle(handle, text));
  queue.pendingWrites += 1;
  queue.tail = currentWrite.catch(() => undefined);

  // 清理也进入登记队列，避免写入结束与新别名句柄登记交错后误删队列。
  const releaseQueue = () => {
    void enqueueFileWriteRegistration(() => {
      queue.pendingWrites -= 1;
      if (queue.pendingWrites === 0) activeFileWriteQueues.delete(queue);
    });
  };
  void currentWrite.then(releaseQueue, releaseQueue);
  return { currentWrite };
};

export const writeTextToFileHandleQueued = (
  handle: FileSystemFileHandle,
  text: string,
): Promise<void> => enqueueFileWriteRegistration(
  () => registerFileWrite(handle, text),
).then(({ currentWrite }) => currentWrite);
