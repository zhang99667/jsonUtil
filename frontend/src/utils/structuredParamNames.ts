const COMMON_CMD_PARAM_NAMES = new Set([
  'cmd',
  'action_cmd',
  'actioncmd',
  'actioncommand',
  'action-command',
  'command',
  'cmd_param',
  'cmd_params',
  'command_param',
  'command_params',
  'schema',
  'schema_url',
  'schemaurl',
  'scheme',
  'scheme_url',
  'schemeurl',
  'url',
  'uri',
  'link',
  'target',
  'target_url',
  'redirect',
  'redirect_url',
  'next',
  'next_url',
  'fallback_url',
  'deep_link',
  'deeplink',
  'jump_url',
  'landing_url',
  'h5_url',
  'page_url',
  'web_url',
  'detail_url',
  'lp_real_url',
  'locid',
  's_url',
  'app_url',
  'open_app_url',
  'download_url',
  'apk_url',
  'deeplink_url',
  'deep_link_url',
  'landing_page_url',
  'params',
  'param',
  'task_params',
  'reward',
  'ext_params',
  'ext_policy',
  'task_policy',
  'video_info',
  'ext_info',
  'rotation_component',
  'extra_param',
  'ubs_param',
  'sbox_param',
  'ad_tag',
  'toolbar_icons',
  'render_sbox',
  'ad_extra_param',
  'ad_flag',
  'convert_cmd',
  'panel_cmd',
  'webpanel_cmd',
  'stay_cmd',
  'reward_cmd',
  'strong_guide_cmd',
  'button_scheme',
  'bottom_button_scheme',
  'panel_scheme',
  'button_cmd',
  'convert_btn',
  'main_btn',
  'bottom_left_btn',
  'bottom_right_btn',
  'click_event_cmd',
  'webpanel_event_cmd',
  'ad_monitor_url',
  'monitor_url',
  'click_url',
  'data',
  'payload',
  'ext',
  'extra',
  'callback',
  'callback_url',
  'open_url',
]);

const STRUCTURED_PARAM_SUFFIX_RE = /(?:^|[_-])(?:cmd|command|schema|scheme|url|uri|link|params?|policy|info|data)$/i;
const STRUCTURED_CAMEL_PARAM_SUFFIX_RE = /[a-z0-9](?:Cmd|Command|Schema|Scheme|URL|Url|URI|Uri|Link|Params?|Policy|Info|Data)$/;

export const normalizeCmdParamName = (key: string): string => (
  key.toLowerCase().replace(/[_-]/g, '')
);

const COMMON_CMD_PARAM_NAME_ALIASES = new Set([
  ...COMMON_CMD_PARAM_NAMES,
  ...Array.from(COMMON_CMD_PARAM_NAMES, normalizeCmdParamName),
]);

export const isLikelyStructuredFieldName = (key: string): boolean => {
  const trimmed = key.trim();
  return STRUCTURED_PARAM_SUFFIX_RE.test(trimmed) || STRUCTURED_CAMEL_PARAM_SUFFIX_RE.test(trimmed);
};

export const isKnownDecodableParamName = (key: string): boolean => {
  const lowerKey = key.trim().toLowerCase();
  const normalizedKey = normalizeCmdParamName(lowerKey);
  return COMMON_CMD_PARAM_NAME_ALIASES.has(lowerKey) ||
    COMMON_CMD_PARAM_NAME_ALIASES.has(normalizedKey) ||
    isLikelyStructuredFieldName(key);
};
