import React, { type ComponentProps } from 'react';
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
import type { AppLazyPanelLoadState } from '../utils/appLazyPanelLoadState';

type JsonPathPanelProps = ComponentProps<typeof LazyJsonPathPanel>;
type JsonTreePanelProps = ComponentProps<typeof LazyJsonTreePanel>;
type JsonComparePanelProps = ComponentProps<typeof LazyJsonComparePanel>;
type JsonSchemaPanelProps = ComponentProps<typeof LazyJsonSchemaPanel>;
type TransformReportPanelProps = ComponentProps<typeof LazyTransformReportPanel>;
type SchemeViewerModalProps = ComponentProps<typeof LazySchemeViewerModal>;
type TemplateFillPanelProps = ComponentProps<typeof LazyTemplateFillPanel>;

interface AppLazyToolPanelsProps {
  lazyPanelsLoaded: Pick<
    AppLazyPanelLoadState,
    'jsonPath' | 'jsonTree' | 'jsonCompare' | 'jsonSchema' | 'transformReport' | 'scheme' | 'template'
  >;
  jsonPathPanel: JsonPathPanelProps;
  jsonTreePanel: JsonTreePanelProps;
  jsonComparePanel: JsonComparePanelProps;
  jsonSchemaPanel: JsonSchemaPanelProps;
  transformReportPanel: TransformReportPanelProps;
  schemePanel: SchemeViewerModalProps;
  templatePanel: TemplateFillPanelProps;
}

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
