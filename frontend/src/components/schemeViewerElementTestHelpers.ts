export interface ElementLike {
  type?: unknown;
  props: Record<string, unknown>;
}

export const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

export const collectText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isElementLike(node)) return collectText(node.props.children);
  return '';
};

export const findByTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(child => findByTour(child, dataTour));
  if (!isElementLike(node)) return [];

  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  return matches.concat(findByTour(node.props.children, dataTour));
};

export const findByTourOrNull = (node: unknown, dataTour: string): ElementLike | null => (
  findByTour(node, dataTour)[0] || null
);

export const findByTypeOrNull = (node: unknown, type: unknown): ElementLike | null => {
  if (Array.isArray(node)) {
    return node.map(child => findByTypeOrNull(child, type)).find(Boolean) || null;
  }
  if (!isElementLike(node)) return null;
  if (node.type === type) return node;
  return findByTypeOrNull(node.props.children, type);
};
