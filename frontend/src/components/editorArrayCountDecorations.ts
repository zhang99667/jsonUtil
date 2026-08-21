import type { ArrayLocation } from '../utils/schemeScanner';

export interface EditorArrayCountDecorationSpec {
  line: number;
  column: number;
  content: string;
  hoverText: string;
}

export const buildEditorArrayCountDecorationSpecs = (
  locations: readonly ArrayLocation[],
): EditorArrayCountDecorationSpec[] => locations.map(location => ({
  line: location.line,
  column: location.column,
  content: `  ${location.itemCount} 项`,
  hoverText: `数组路径: ${location.path}\n\n共 ${location.itemCount} 项`,
}));
