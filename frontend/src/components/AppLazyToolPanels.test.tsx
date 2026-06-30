import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { AppLazyPanelSlot } from './AppLazyPanelSlot';
import { AppLazyToolPanels } from './AppLazyToolPanels';
import {
  LazyJsonComparePanel,
  LazyJsonPathPanel,
  LazyJsonSchemaPanel,
  LazyJsonTreePanel,
  LazySchemeViewerModal,
  LazyTemplateFillPanel,
  LazyTransformReportPanel,
} from './appLazyPanels';

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

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

describe('AppLazyToolPanels', () => {
  it('为所有懒加载工具面板装配统一插槽', () => {
    const tree = AppLazyToolPanels({
      lazyPanelsLoaded: {
        jsonPath: true,
        jsonTree: false,
        jsonCompare: true,
        jsonSchema: false,
        transformReport: true,
        scheme: false,
        template: true,
      },
      jsonPathPanel: {} as ComponentProps<typeof LazyJsonPathPanel>,
      jsonTreePanel: {} as ComponentProps<typeof LazyJsonTreePanel>,
      jsonComparePanel: {} as ComponentProps<typeof LazyJsonComparePanel>,
      jsonSchemaPanel: {} as ComponentProps<typeof LazyJsonSchemaPanel>,
      transformReportPanel: {} as ComponentProps<typeof LazyTransformReportPanel>,
      schemePanel: {} as ComponentProps<typeof LazySchemeViewerModal>,
      templatePanel: {} as ComponentProps<typeof LazyTemplateFillPanel>,
    });

    const slots = findByType(tree, AppLazyPanelSlot);
    expect(slots).toHaveLength(7);
    expect(slots.map(slot => slot.props.isLoaded)).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
      true,
    ]);
    expect(findByType(slots[0].props.children, LazyJsonPathPanel)).toHaveLength(1);
    expect(findByType(slots[5].props.children, LazySchemeViewerModal)).toHaveLength(1);
  });
});
