import type { ComponentProps } from 'react';
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

export type JsonPathPanelProps = ComponentProps<typeof LazyJsonPathPanel>;
export type JsonTreePanelProps = ComponentProps<typeof LazyJsonTreePanel>;
export type JsonComparePanelProps = ComponentProps<typeof LazyJsonComparePanel>;
export type JsonSchemaPanelProps = ComponentProps<typeof LazyJsonSchemaPanel>;
export type TransformReportPanelProps = ComponentProps<typeof LazyTransformReportPanel>;
export type SchemeViewerModalProps = ComponentProps<typeof LazySchemeViewerModal>;
export type TemplateFillPanelProps = ComponentProps<typeof LazyTemplateFillPanel>;

export interface AppLazyToolPanelsProps {
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
