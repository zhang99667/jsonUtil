const CMD_FIELD_NAMES = new Set([
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
  'scheme',
  'schema_url',
  'schemaurl',
  'scheme_url',
  'schemeurl',
  'convert_cmd',
  'panel_cmd',
  'webpanel_cmd',
  'stay_cmd',
  'reward_cmd',
  'strong_guide_cmd',
  'button_cmd',
  'convert_btn',
  'main_btn',
  'bottom_left_btn',
  'bottom_right_btn',
  'button_scheme',
  'bottom_button_scheme',
  'panel_scheme',
  'click_event_cmd',
  'webpanel_event_cmd',
]);

const CMD_FIELD_SUFFIXES = ['_cmd', 'cmd', '_scheme', 'scheme'];

const URL_FIELD_NAMES = new Set([
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
  'landing_page_url',
  'h5_url',
  'page_url',
  'web_url',
  'detail_url',
  'lp_real_url',
  'app_url',
  'appurl',
  'open_app_url',
  'download_url',
  'apk_url',
  'deeplink_url',
  'deep_link_url',
  'callback_url',
  'callback',
  'open_url',
  'ad_monitor_url',
  'monitor_url',
  'click_url',
  'weburl',
  'openurl',
]);

const URL_FIELD_SUFFIXES = ['_url', 'url'];

const RESOURCE_FIELD_NAMES = new Set([
  'avatar',
  'avatarurl',
  'audio_url',
  'audiourl',
  'bg_lottie_url',
  'bottom_button_icon',
  'button_icon',
  'button_image',
  'close_image',
  'cover',
  'coverurl',
  'fail_lottie',
  'icon',
  'image',
  'imageurl',
  'image_url',
  'icon_url',
  'iconurl',
  'logo',
  'logo_url',
  'logourl',
  'lottie',
  'lottieurl',
  'media_url',
  'mediaurl',
  'poster',
  'poster_image',
  'poster_url',
  'posterurl',
  'portrait',
  'portrait_url',
  'portraiturl',
  'success_lottie',
  'swipe_up_lottie',
  'time_complete_lottie_url',
  'timer_front_icon',
  'top_image',
  'user_portrait',
  'video_url',
  'videourl',
]);

const RESOURCE_FIELD_SUFFIXES = [
  '_avatar',
  '_avatar_url',
  '_cover',
  '_cover_url',
  '_icon',
  '_icon_url',
  '_image',
  '_image_url',
  '_lottie',
  '_lottie_url',
  '_logo',
  '_logo_url',
  '_poster',
  '_poster_url',
  '_portrait',
  '_portrait_url',
];

const EXT_FIELD_NAMES = new Set([
  'ad_extra_param',
  'extinfo',
  'ext_info',
  'adflag',
]);

const PRIMARY_COMMAND_FIELD_PRIORITIES = new Map<string, number>([
  ['scheme', 100],
  ['cmd', 100],
  ['schema', 98],
  ['action_cmd', 96],
  ['actioncmd', 96],
  ['command', 94],
  ['convert_cmd', 92],
  ['panel_cmd', 90],
  ['webpanel_cmd', 90],
  ['panel_scheme', 88],
  ['stay_cmd', 86],
  ['reward_cmd', 86],
  ['strong_guide_cmd', 86],
  ['button_scheme', 82],
  ['bottom_button_scheme', 82],
  ['button_cmd', 78],
  ['callbackurl', 40],
  ['callback_url', 40],
  ['url', 30],
  ['page_url', 28],
  ['lp_real_url', 28],
  ['click_url', 24],
  ['video_url', 10],
]);

const normalizeFieldName = (key: string): string => key.trim().toLowerCase();

const matchesFieldRule = (
  key: string,
  names: ReadonlySet<string>,
  suffixes: readonly string[],
): boolean => {
  const normalizedKey = normalizeFieldName(key);
  return names.has(normalizedKey) ||
    suffixes.some(suffix => normalizedKey.endsWith(suffix));
};

export const isCmdInsightField = (key: string): boolean => (
  matchesFieldRule(key, CMD_FIELD_NAMES, CMD_FIELD_SUFFIXES)
);

export const isUrlInsightField = (key: string): boolean => (
  matchesFieldRule(key, URL_FIELD_NAMES, URL_FIELD_SUFFIXES)
);

export const isResourceInsightField = (key: string): boolean => (
  matchesFieldRule(key, RESOURCE_FIELD_NAMES, RESOURCE_FIELD_SUFFIXES)
);

export const isCommandInsightField = (key: string): boolean => (
  isCmdInsightField(key) || isUrlInsightField(key)
);

export const isExtInsightField = (key: string): boolean => (
  EXT_FIELD_NAMES.has(normalizeFieldName(key))
);

export const getPrimaryCommandFieldPriority = (key: string): number => {
  const normalizedKey = normalizeFieldName(key);
  return PRIMARY_COMMAND_FIELD_PRIORITIES.get(normalizedKey) ??
    (isCmdInsightField(normalizedKey) ? 70 : isUrlInsightField(normalizedKey) ? 20 : 0);
};
