import type { ActionPanelPanelItem } from './actionPanelPanelItemTypes';

export type {
  ActionPanelPanelIconId,
  ActionPanelPanelItem,
  ActionPanelPanelItemId,
} from './actionPanelPanelItemTypes';

export const ACTION_PANEL_PANEL_GROUP = {
  title: '查询 / 解析',
  items: [
    {
      id: 'jsonPath',
      label: 'JSONPath 查询',
      iconId: 'search',
      iconClass: 'text-emerald-400',
      hoverIconClass: 'group-hover:text-emerald-400',
      dataTour: 'jsonpath-button',
    },
    {
      id: 'jsonCompare',
      label: 'JSON 对比',
      iconId: 'compare',
      iconClass: 'text-amber-400',
      hoverIconClass: 'group-hover:text-amber-400',
      dataTour: 'json-compare-button',
    },
    {
      id: 'jsonTree',
      label: '结构导航',
      iconId: 'structure',
      iconClass: 'text-cyan-400',
      hoverIconClass: 'group-hover:text-cyan-400',
      dataTour: 'structure-nav-button',
    },
    {
      id: 'jsonSchema',
      label: 'Schema 校验',
      iconId: 'schema',
      iconClass: 'text-lime-400',
      hoverIconClass: 'group-hover:text-lime-400',
      dataTour: 'json-schema-button',
    },
    {
      id: 'scheme',
      label: 'Scheme 解析',
      iconId: 'link',
      iconClass: 'text-emerald-400',
      hoverIconClass: 'group-hover:text-emerald-400',
      dataTour: 'scheme-button',
    },
    {
      id: 'template',
      label: '模板填充',
      iconId: 'template',
      iconClass: 'text-orange-400',
      hoverIconClass: 'group-hover:text-orange-400',
      dataTour: 'template-fill-button',
    },
  ] satisfies ActionPanelPanelItem[],
};
