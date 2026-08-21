import type { ChangeEvent, ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { JsonComparePanel } from './JsonComparePanel';

vi.mock('./DraggablePanel', () => ({
  PanelIcons: { Code: <span aria-hidden="true" /> },
  DraggablePanel: ({
    isOpen,
    ariaLabel,
    children,
    footer,
  }: {
    isOpen: boolean;
    ariaLabel?: string;
    children: ReactNode;
    footer?: ReactNode;
  }) => isOpen ? (
    <div role="dialog" aria-label={ariaLabel}>
      {children}
      {footer}
    </div>
  ) : null,
}));

vi.mock('./SimpleEditor', () => ({
  SimpleEditor: ({
    value,
    onChange,
    ariaLabel,
    path,
  }: {
    value: string;
    onChange?: (value: string) => void;
    ariaLabel?: string;
    path?: string;
  }) => (
    <textarea
      aria-label={ariaLabel}
      data-editor-path={path}
      value={value}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange?.(event.target.value)}
    />
  ),
}));

vi.mock('../utils/toast', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

afterEach(cleanup);

describe('JsonComparePanel', () => {
  it('将 SOURCE 仅作为首次基准，两侧保持独立可编辑模型', () => {
    const { rerender } = render(
      <JsonComparePanel
        sourceText={'{"id":1}'}
        isOpen
        onClose={vi.fn()}
      />,
    );

    const leftEditor = screen.getByRole('textbox', { name: '基准 JSON 编辑器' });
    const rightEditor = screen.getByRole('textbox', { name: '对比 JSON 编辑器' });
    expect(leftEditor.getAttribute('data-editor-path')).toBe('json-compare-left.json');
    expect(rightEditor.getAttribute('data-editor-path')).toBe('json-compare-right.json');
    expect((leftEditor as HTMLTextAreaElement).value).toBe('{"id":1}');

    rerender(
      <JsonComparePanel
        sourceText={'{"id":99}'}
        isOpen
        onClose={vi.fn()}
      />,
    );
    expect((leftEditor as HTMLTextAreaElement).value).toBe('{"id":1}');

    fireEvent.change(leftEditor, { target: { value: '{"id":2}' } });
    fireEvent.change(rightEditor, { target: { value: '{"id":3,"extra":true}' } });
    expect(screen.getByText(/新增 1 \/ 删除 0 \/ 修改 1/)).toBeTruthy();
  });

  it('标记解析失败的一侧，并支持键盘调整输入区高度', () => {
    render(
      <JsonComparePanel
        sourceText={'{"id":1}'}
        isOpen
        onClose={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: '对比 JSON 编辑器' }), {
      target: { value: '{invalid' },
    });
    expect(screen.getAllByText(/对比 JSON：/)).toHaveLength(2);

    const separator = screen.getByRole('separator', { name: '调整 JSON 输入区高度' });
    expect(separator.getAttribute('aria-valuenow')).toBe('58');
    fireEvent.keyDown(separator, { key: 'ArrowDown' });
    expect(separator.getAttribute('aria-valuenow')).toBe('62');
    fireEvent.keyDown(separator, { key: 'Home' });
    expect(separator.getAttribute('aria-valuenow')).toBe('38');
  });
});
