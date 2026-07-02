import React from 'react';
import { AppLazyPanelSlot } from './AppLazyPanelSlot';
import {
  LazyJsonComparePanel,
  LazyJsonPathPanel,
  LazyJsonSchemaPanel,
  LazyJsonTreePanel,
  LazySchemeViewerModal,
  LazyTemplateFillPanel,
  LazyTransformReportPanel,
} from './appLazyPanels';
import type { AppLazyToolPanelsProps } from './AppLazyToolPanelsTypes';

export type { AppLazyToolPanelsProps } from './AppLazyToolPanelsTypes';

const renderLazyPanelSlot = (isLoaded: boolean, children: React.ReactNode) => (
  <AppLazyPanelSlot isLoaded={isLoaded}>
    {children}
  </AppLazyPanelSlot>
);

export const AppLazyToolPanels: React.FC<AppLazyToolPanelsProps> = ({
  lazyPanelsLoaded,
  jsonPathPanel,
  jsonTreePanel,
  jsonComparePanel,
  jsonSchemaPanel,
  transformReportPanel,
  schemePanel,
  templatePanel,
}) => (
  <>
    {renderLazyPanelSlot(lazyPanelsLoaded.jsonPath, <LazyJsonPathPanel {...jsonPathPanel} />)}
    {renderLazyPanelSlot(lazyPanelsLoaded.jsonTree, <LazyJsonTreePanel {...jsonTreePanel} />)}
    {renderLazyPanelSlot(lazyPanelsLoaded.jsonCompare, <LazyJsonComparePanel {...jsonComparePanel} />)}
    {renderLazyPanelSlot(lazyPanelsLoaded.jsonSchema, <LazyJsonSchemaPanel {...jsonSchemaPanel} />)}
    {renderLazyPanelSlot(
      lazyPanelsLoaded.transformReport,
      <LazyTransformReportPanel {...transformReportPanel} />
    )}
    {renderLazyPanelSlot(lazyPanelsLoaded.scheme, <LazySchemeViewerModal {...schemePanel} />)}
    {renderLazyPanelSlot(lazyPanelsLoaded.template, <LazyTemplateFillPanel {...templatePanel} />)}
  </>
);
