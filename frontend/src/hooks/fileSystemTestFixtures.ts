import { vi } from 'vitest';
import { TransformMode, type FileTab } from '../types';

export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
}

export const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: Deferred<T>['resolve'];
  const promise = new Promise<T>(finish => {
    resolve = finish;
  });
  return { promise, resolve };
};

export const createFileSystemTestTab = (id: string, content: string): FileTab => ({
  id,
  name: `${id}.json`,
  content,
  savedContent: content,
  isDirty: false,
  mode: TransformMode.NONE,
});

export const createOpenedTextFile = (
  name: string,
  content: string | Promise<string>,
): File => ({
  name,
  size: 20,
  type: 'application/json',
  text: vi.fn(() => Promise.resolve(content)),
}) as unknown as File;
