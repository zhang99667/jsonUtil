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
    <AppLazyPanelSlot isLoaded={lazyPanelsLoaded.jsonPath}>
      <LazyJsonPathPanel {...jsonPathPanel} />
    </AppLazyPanelSlot>

    <AppLazyPanelSlot isLoaded={lazyPanelsLoaded.jsonTree}>
      <LazyJsonTreePanel {...jsonTreePanel} />
    </AppLazyPanelSlot>

    <AppLazyPanelSlot isLoaded={lazyPanelsLoaded.jsonCompare}>
      <LazyJsonComparePanel {...jsonComparePanel} />
    </AppLazyPanelSlot>

    <AppLazyPanelSlot isLoaded={lazyPanelsLoaded.jsonSchema}>
      <LazyJsonSchemaPanel {...jsonSchemaPanel} />
    </AppLazyPanelSlot>

    <AppLazyPanelSlot isLoaded={lazyPanelsLoaded.transformReport}>
      <LazyTransformReportPanel {...transformReportPanel} />
    </AppLazyPanelSlot>

    <AppLazyPanelSlot isLoaded={lazyPanelsLoaded.scheme}>
      <LazySchemeViewerModal {...schemePanel} />
    </AppLazyPanelSlot>

    <AppLazyPanelSlot isLoaded={lazyPanelsLoaded.template}>
      <LazyTemplateFillPanel {...templatePanel} />
    </AppLazyPanelSlot>
  </>
);
