import { Toaster } from 'react-hot-toast';
import { describe, expect, it } from 'vitest';
import { AppToastHost } from './AppToastHost';

interface ElementLike {
  type?: unknown;
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

describe('AppToastHost', () => {
  it('保留主应用 toast 的位置和顶部偏移', () => {
    const tree = AppToastHost({});

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('AppToastHost 应返回 React 元素');
    expect(tree.type).toBe(Toaster);
    expect(tree.props.position).toBe('top-center');
    expect(tree.props.toastOptions).toEqual({
      className: '',
      style: {
        marginTop: '16px',
      },
    });
  });
});
