import { isElementLike, type ElementLike } from './schemeViewerElementTestHelpers';

const renderFunctionElement = (node: ElementLike): unknown | null => typeof node.type === 'function'
  ? node.type(node.props)
  : null;

export const collectRenderedText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectRenderedText).join('');
  if (isElementLike(node)) return collectRenderedText(renderFunctionElement(node) ?? node.props.children);
  return '';
};

export const findRenderedByTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(child => findRenderedByTour(child, dataTour));
  if (!isElementLike(node)) return [];

  const renderedNode = renderFunctionElement(node);
  if (renderedNode) return findRenderedByTour(renderedNode, dataTour);

  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  return matches.concat(findRenderedByTour(node.props.children, dataTour));
};
