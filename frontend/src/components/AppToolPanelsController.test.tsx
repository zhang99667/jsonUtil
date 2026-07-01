import { describe, expect, it, vi } from 'vitest';
import { AppLazyToolPanels } from './AppLazyToolPanels';
import {
  AppToolPanelsController,
  type AppToolPanelsControllerProps,
} from './AppToolPanelsController';
import { TransformMode, type TransformContext } from '../types';

interface ElementLike {
  type?: unknown;
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

const transformContext = {
  mode: TransformMode.DEEP_FORMAT,
  records: new Map(),
  timestamp: 1,
  originalIndentation: 2,
} satisfies TransformContext;

const buildProps = (overrides: Partial<AppToolPanelsControllerProps> = {}): AppToolPanelsControllerProps => ({
  lazyPanelsLoaded: {
    jsonPath: true,
    jsonTree: true,
    jsonCompare: true,
    jsonSchema: true,
    transformReport: true,
    scheme: true,
    template: true,
  },
  mode: TransformMode.DEEP_FORMAT,
  input: '{"source":true}',
  jsonPathDataSource: '{"preview":true}',
  isOutputTransforming: true,
  transformReportContext: transformContext,
  inputRef: { current: '{"source":true}' },
  jsonPathQueryRequest: { id: 1, query: '$.a' },
  jsonTreeFocusRequest: { id: 2, path: '$.a', pointer: '/a' },
  schemeInputRequest: { id: 3, value: 'baiduboxapp://v7/test' },
  templateFillRequest: { id: 4, template: '{"name":"{{name}}"}' },
  isJsonPathPanelOpen: true,
  isJsonTreePanelOpen: true,
  isJsonComparePanelOpen: true,
  isJsonSchemaPanelOpen: true,
  isTransformReportOpen: true,
  isSchemeDecodeOpen: true,
  isTemplatePanelOpen: true,
  templateApplyQualityDelta: 'delta',
  templateTargetError: '',
  onSetSourceText: vi.fn(),
  onUpdateActiveFileContent: vi.fn(),
  onSetJsonTreePanelOpen: vi.fn(),
  onSetJsonComparePanelOpen: vi.fn(),
  onSetJsonSchemaPanelOpen: vi.fn(),
  onSetTransformReportOpen: vi.fn(),
  onSetSchemeDecodeOpen: vi.fn(),
  onSetTemplatePanelOpen: vi.fn(),
  onSetJsonSchemaValidationResult: vi.fn(),
  onCloseJsonPathPanel: vi.fn(),
  onLocateJsonPath: vi.fn(),
  onLocateJsonPathResultInStructure: vi.fn(),
  onJsonPathHighlight: vi.fn(),
  onOpenSchemeFromStructure: vi.fn(),
  onOpenSchemeFromReport: vi.fn(),
  onOpenTemplateFillFromReport: vi.fn(),
  onApplySchemaExampleToSource: vi.fn(),
  onInspectSourceFromScheme: vi.fn(),
  onApplyTemplate: vi.fn(),
  ...overrides,
});

const renderLazyPanels = (props: AppToolPanelsControllerProps) => (
  findByType(AppToolPanelsController(props), AppLazyToolPanels)[0]
);

describe('AppToolPanelsController', () => {
  it('为 JSONPath、结构导航和报告面板透传 PREVIEW 数据与定位回调', () => {
    const props = buildProps();
    const lazyPanels = renderLazyPanels(props);

    expect(lazyPanels.props.lazyPanelsLoaded).toBe(props.lazyPanelsLoaded);
    expect(lazyPanels.props.jsonPathPanel).toMatchObject({
      jsonData: '{"preview":true}',
      isDataPreparing: true,
      externalQueryRequest: props.jsonPathQueryRequest,
      isOpen: true,
      onClose: props.onCloseJsonPathPanel,
      onHighlightRange: props.onJsonPathHighlight,
      onLocateStructure: props.onLocateJsonPathResultInStructure,
    });
    expect(lazyPanels.props.jsonTreePanel).toMatchObject({
      jsonData: '{"preview":true}',
      isDataPreparing: true,
      externalFocusRequest: props.jsonTreeFocusRequest,
      onLocatePath: props.onLocateJsonPath,
      onOpenSchemeValue: props.onOpenSchemeFromStructure,
    });
    expect(lazyPanels.props.transformReportPanel).toMatchObject({
      context: transformContext,
      onLocatePath: props.onLocateJsonPath,
      onOpenSchemeValue: props.onOpenSchemeFromReport,
      onOpenTemplateFill: props.onOpenTemplateFillFromReport,
    });
  });

  it('面板关闭回调只关闭对应面板并清理 Schema 校验结果', () => {
    const props = buildProps();
    const lazyPanels = renderLazyPanels(props);

    (lazyPanels.props.jsonTreePanel as { onClose: () => void }).onClose();
    (lazyPanels.props.jsonComparePanel as { onClose: () => void }).onClose();
    (lazyPanels.props.jsonSchemaPanel as { onClose: () => void }).onClose();
    (lazyPanels.props.transformReportPanel as { onClose: () => void }).onClose();

    expect(props.onSetJsonTreePanelOpen).toHaveBeenCalledWith(false);
    expect(props.onSetJsonComparePanelOpen).toHaveBeenCalledWith(false);
    expect(props.onSetJsonSchemaPanelOpen).toHaveBeenCalledWith(false);
    expect(props.onSetJsonSchemaValidationResult).toHaveBeenCalledWith(null);
    expect(props.onSetTransformReportOpen).toHaveBeenCalledWith(false);
  });

  it('Scheme 和模板面板复用 App 入口的 SOURCE 写入与模板应用回调', () => {
    const props = buildProps();
    const lazyPanels = renderLazyPanels(props);

    (lazyPanels.props.schemePanel as { onApply: (value: string) => void }).onApply('baiduboxapp://v7/new');
    expect(props.onSetSourceText).toHaveBeenCalledWith('baiduboxapp://v7/new');
    expect(props.inputRef.current).toBe('baiduboxapp://v7/new');
    expect(props.onUpdateActiveFileContent).toHaveBeenCalledWith('baiduboxapp://v7/new');
    expect(lazyPanels.props.schemePanel).toMatchObject({
      initialStandaloneInput: 'baiduboxapp://v7/test',
      initialStandaloneInputKey: 3,
      onInspectOriginal: props.onInspectSourceFromScheme,
    });
    expect(lazyPanels.props.templatePanel).toMatchObject({
      initialTemplate: '{"name":"{{name}}"}',
      initialTemplateKey: 4,
      applyQualityDelta: 'delta',
      onApplyTemplate: props.onApplyTemplate,
    });
  });

  it('非深度解析或未转换时不展示数据准备中', () => {
    const lazyPanels = renderLazyPanels(buildProps({
      mode: TransformMode.FORMAT,
      isOutputTransforming: true,
    }));

    expect(lazyPanels.props.jsonPathPanel).toMatchObject({ isDataPreparing: false });
    expect(lazyPanels.props.jsonTreePanel).toMatchObject({ isDataPreparing: false });
  });
});
