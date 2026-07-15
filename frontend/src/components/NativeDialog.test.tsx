import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ChangelogModal } from './ChangelogModal';
import { ConfirmDialog } from './ConfirmDialog';

describe('原生模态框', () => {
  it('确认框使用原生 dialog 并声明初始焦点', () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        isOpen
        title="确认操作"
        message="请确认是否继续。"
        confirmLabel="继续"
        cancelLabel="取消"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(html).toMatch(/^<dialog\b/);
    expect(html).toContain('autofocus=""');
  });

  it('版本更新框使用原生 dialog 并声明初始焦点', () => {
    const html = renderToStaticMarkup(
      <ChangelogModal
        isOpen
        onClose={vi.fn()}
      />
    );

    expect(html).toMatch(/^<dialog\b/);
    expect(html).toContain('autofocus=""');
  });
});
