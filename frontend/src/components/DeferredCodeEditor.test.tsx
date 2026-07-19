import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DeferredCodeEditor } from './DeferredCodeEditor';

describe('DeferredCodeEditor', () => {
  it('在 Monaco 加载前保留可用的输入框和标题栏动作', () => {
    const html = renderToStaticMarkup(
      <DeferredCodeEditor
        label="SOURCE"
        value=""
        onChange={() => undefined}
        headerActions={<button data-tour="paste-source">paste</button>}
        info="待检查 1"
      />
    );

    expect(html).toContain('data-editor-fallback');
    expect(html).toContain('data-tour="paste-source"');
    expect(html).toContain('聚焦后启用高级编辑器');
    expect(html).toContain('待检查 1');
  });
});
