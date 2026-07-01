import React, { type MutableRefObject } from 'react';
import { AppLazyToolPanels } from './AppLazyToolPanels';
import type { AppLazyToolPanelsProps } from './AppLazyToolPanelsTypes';
import { TransformMode, type TransformContext } from '../types';

type JsonPathPanelConfig = AppLazyToolPanelsProps['jsonPathPanel'];
type JsonTreePanelConfig = AppLazyToolPanelsProps['jsonTreePanel'];
type JsonComparePanelConfig = AppLazyToolPanelsProps['jsonComparePanel'];
type JsonSchemaPanelConfig = AppLazyToolPanelsProps['jsonSchemaPanel'];
type TransformReportPanelConfig = AppLazyToolPanelsProps['transformReportPanel'];
type SchemePanelConfig = AppLazyToolPanelsProps['schemePanel'];
type TemplatePanelConfig = AppLazyToolPanelsProps['templatePanel'];

export interface AppToolPanelsControllerProps {
  lazyPanelsLoaded: AppLazyToolPanelsProps['lazyPanelsLoaded'];
  mode: TransformMode;
  input: string;
  jsonPathDataSource: string;
  isOutputTransforming: boolean;
  transformReportContext: TransformContext | null;
  inputRef: MutableRefObject<string>;
  jsonPathQueryRequest: JsonPathPanelConfig['externalQueryRequest'];
  jsonTreeFocusRequest: JsonTreePanelConfig['externalFocusRequest'];
  schemeInputRequest: {
    id: number;
    value: string;
  } | null;
  templateFillRequest: {
    id: number;
    template: string;
  } | null;
  isJsonPathPanelOpen: boolean;
  isJsonTreePanelOpen: boolean;
  isJsonComparePanelOpen: boolean;
  isJsonSchemaPanelOpen: boolean;
  isTransformReportOpen: boolean;
  isSchemeDecodeOpen: boolean;
  isTemplatePanelOpen: boolean;
  templateApplyQualityDelta: string;
  templateTargetError: string;
  onSetSourceText: (value: string) => void;
  onUpdateActiveFileContent: (value: string) => void;
  onSetJsonTreePanelOpen: (isOpen: boolean) => void;
  onSetJsonComparePanelOpen: (isOpen: boolean) => void;
  onSetJsonSchemaPanelOpen: (isOpen: boolean) => void;
  onSetTransformReportOpen: (isOpen: boolean) => void;
  onSetSchemeDecodeOpen: (isOpen: boolean) => void;
  onSetTemplatePanelOpen: (isOpen: boolean) => void;
  onSetJsonSchemaValidationResult: JsonSchemaPanelConfig['onValidationResult'];
  onCloseJsonPathPanel: JsonPathPanelConfig['onClose'];
  onLocateJsonPath: JsonPathPanelConfig['onLocateStructure'];
  onLocateJsonPathResultInStructure: JsonPathPanelConfig['onLocateStructure'];
  onJsonPathHighlight: JsonPathPanelConfig['onHighlightRange'];
  onOpenSchemeFromStructure: JsonTreePanelConfig['onOpenSchemeValue'];
  onOpenSchemeFromReport: TransformReportPanelConfig['onOpenSchemeValue'];
  onOpenTemplateFillFromReport: TransformReportPanelConfig['onOpenTemplateFill'];
  onApplySchemaExampleToSource: JsonSchemaPanelConfig['onApplyExampleToSource'];
  onInspectSourceFromScheme: SchemePanelConfig['onInspectOriginal'];
  onApplyTemplate: TemplatePanelConfig['onApplyTemplate'];
}

export const AppToolPanelsController: React.FC<AppToolPanelsControllerProps> = ({
  lazyPanelsLoaded,
  mode,
  input,
  jsonPathDataSource,
  isOutputTransforming,
  transformReportContext,
  inputRef,
  jsonPathQueryRequest,
  jsonTreeFocusRequest,
  schemeInputRequest,
  templateFillRequest,
  isJsonPathPanelOpen,
  isJsonTreePanelOpen,
  isJsonComparePanelOpen,
  isJsonSchemaPanelOpen,
  isTransformReportOpen,
  isSchemeDecodeOpen,
  isTemplatePanelOpen,
  templateApplyQualityDelta,
  templateTargetError,
  onSetSourceText,
  onUpdateActiveFileContent,
  onSetJsonTreePanelOpen,
  onSetJsonComparePanelOpen,
  onSetJsonSchemaPanelOpen,
  onSetTransformReportOpen,
  onSetSchemeDecodeOpen,
  onSetTemplatePanelOpen,
  onSetJsonSchemaValidationResult,
  onCloseJsonPathPanel,
  onLocateJsonPath,
  onLocateJsonPathResultInStructure,
  onJsonPathHighlight,
  onOpenSchemeFromStructure,
  onOpenSchemeFromReport,
  onOpenTemplateFillFromReport,
  onApplySchemaExampleToSource,
  onInspectSourceFromScheme,
  onApplyTemplate,
}) => (
  <AppLazyToolPanels
    lazyPanelsLoaded={lazyPanelsLoaded}
    jsonPathPanel={{
      jsonData: jsonPathDataSource,
      isDataPreparing: mode === TransformMode.DEEP_FORMAT && isOutputTransforming,
      externalQueryRequest: jsonPathQueryRequest,
      isOpen: isJsonPathPanelOpen,
      onClose: onCloseJsonPathPanel,
      onHighlightRange: onJsonPathHighlight,
      onLocateStructure: onLocateJsonPathResultInStructure,
    }}
    jsonTreePanel={{
      jsonData: jsonPathDataSource,
      isDataPreparing: mode === TransformMode.DEEP_FORMAT && isOutputTransforming,
      isOpen: isJsonTreePanelOpen,
      externalFocusRequest: jsonTreeFocusRequest,
      onClose: () => onSetJsonTreePanelOpen(false),
      onLocatePath: onLocateJsonPath,
      onOpenSchemeValue: onOpenSchemeFromStructure,
    }}
    jsonComparePanel={{
      sourceText: input,
      isOpen: isJsonComparePanelOpen,
      onClose: () => onSetJsonComparePanelOpen(false),
      onLocatePath: onLocateJsonPath,
    }}
    jsonSchemaPanel={{
      jsonData: input,
      isOpen: isJsonSchemaPanelOpen,
      onClose: () => {
        onSetJsonSchemaPanelOpen(false);
        onSetJsonSchemaValidationResult?.(null);
      },
      onLocatePath: onLocateJsonPath,
      onApplyExampleToSource: onApplySchemaExampleToSource,
      onValidationResult: onSetJsonSchemaValidationResult,
    }}
    transformReportPanel={{
      isOpen: isTransformReportOpen,
      onClose: () => onSetTransformReportOpen(false),
      context: transformReportContext,
      onLocatePath: onLocateJsonPath,
      onOpenSchemeValue: onOpenSchemeFromReport,
      onOpenTemplateFill: onOpenTemplateFillFromReport,
    }}
    schemePanel={{
      isOpen: isSchemeDecodeOpen,
      onClose: () => onSetSchemeDecodeOpen(false),
      standalone: true,
      initialStandaloneInput: schemeInputRequest?.value,
      initialStandaloneInputKey: schemeInputRequest?.id,
      onApply: (encodedValue: string) => {
        onSetSourceText(encodedValue);
        inputRef.current = encodedValue;
        onUpdateActiveFileContent(encodedValue);
      },
      onInspectOriginal: onInspectSourceFromScheme,
    }}
    templatePanel={{
      isOpen: isTemplatePanelOpen,
      onClose: () => onSetTemplatePanelOpen(false),
      onApplyTemplate,
      targetError: templateTargetError,
      initialTemplate: templateFillRequest?.template,
      initialTemplateKey: templateFillRequest?.id,
      applyQualityDelta: templateApplyQualityDelta,
    }}
  />
);
