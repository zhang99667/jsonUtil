import { Toaster } from 'react-hot-toast';
import { describe, expect, it } from 'vitest';
import { AppToastHost } from './AppToastHost';
import { assertElementLike } from './componentElementTestHelpers';

describe('AppToastHost', () => {
  it('保留主应用 toast 的位置和顶部偏移', () => {
    const tree = AppToastHost({});

    const toastHost = assertElementLike(tree, 'AppToastHost 应返回 React 元素');
    expect(toastHost.type).toBe(Toaster);
    expect(toastHost.props.position).toBe('top-center');
    expect(toastHost.props.toastOptions).toEqual({
      className: '',
      style: {
        marginTop: '16px',
      },
    });
  });
});
