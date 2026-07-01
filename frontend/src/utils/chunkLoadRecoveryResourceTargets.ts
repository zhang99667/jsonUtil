const FRONTEND_ASSET_RESOURCE_PATTERN = /(?:^|\/)assets\/[^?#]+\.(?:js|css)(?:[?#].*)?$/i;

export const getChunkLoadResourceTargetUrl = (
  target: EventTarget | null
): string | undefined => {
  const resourceTarget = target as { src?: unknown; href?: unknown } | null;
  const url = resourceTarget?.src ?? resourceTarget?.href;
  return typeof url === 'string' && FRONTEND_ASSET_RESOURCE_PATTERN.test(url) ? url : undefined;
};
