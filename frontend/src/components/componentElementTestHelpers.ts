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

export const assertElementLike = (
  node: unknown,
  message = 'expected React element-like node'
): ElementLike => {
  if (!isElementLike(node)) throw new Error(message);
  return node;
};

export const collectText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isElementLike(node)) return collectText(node.props.children);
  return '';
};

const findElements = (node: unknown, matchesElement: (element: ElementLike) => boolean): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(child => findElements(child, matchesElement));
  if (!isElementLike(node)) return [];
  return (matchesElement(node) ? [node] : []).concat(findElements(node.props.children, matchesElement));
};

export const findByType = (node: unknown, type: unknown): ElementLike[] => (
  findElements(node, element => element.type === type)
);

export const findByTour = (node: unknown, dataTour: string): ElementLike[] => (
  findElements(node, element => element.props['data-tour'] === dataTour)
);

export const findByTourOrNull = (node: unknown, dataTour: string): ElementLike | null => (
  findByTour(node, dataTour)[0] || null
);

export const findByTypeOrNull = (node: unknown, type: unknown): ElementLike | null => (
  findByType(node, type)[0] || null
);

export const findByTypeAndText = (node: unknown, type: unknown, label: string): ElementLike[] => (
  findByType(node, type).filter(element => collectText(element).includes(label))
);

export const clickElement = (node: ElementLike) => {
  const onClick = node.props.onClick;
  if (typeof onClick !== 'function') throw new Error('expected clickable element');
  onClick();
};
