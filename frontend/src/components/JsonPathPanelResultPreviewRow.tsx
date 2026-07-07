import React from 'react';
import type { JsonPathResultPreviewItem } from '../utils/jsonPathPanelPreviewItems';
import { JsonPathPanelResultPreviewFocusButton } from './JsonPathPanelResultPreviewFocusButton';
import { JsonPathPanelResultPreviewLocateButton } from './JsonPathPanelResultPreviewLocateButton';
import { getJsonPathResultPreviewRowClassName } from './JsonPathPanelResultPreviewRowClassName';

interface JsonPathPanelResultPreviewRowProps {
  item: JsonPathResultPreviewItem;
  isActive: boolean;
  showLocateStructure: boolean;
  onFocusResult: (index: number) => void;
  onLocateStructureResult: (index: number) => void;
}

export const JsonPathPanelResultPreviewRow: React.FC<JsonPathPanelResultPreviewRowProps> = ({
  item,
  isActive,
  showLocateStructure,
  onFocusResult,
  onLocateStructureResult,
}) => (
  <div className={getJsonPathResultPreviewRowClassName(isActive)}>
    <JsonPathPanelResultPreviewFocusButton item={item} onFocusResult={onFocusResult} />
    {showLocateStructure && (
      <JsonPathPanelResultPreviewLocateButton item={item} onLocateStructureResult={onLocateStructureResult} />
    )}
  </div>
);
