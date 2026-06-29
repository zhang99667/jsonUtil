export type StaticResourceType = 'image' | 'video' | 'lottie' | 'audio' | 'package' | 'other';

const STATIC_RESOURCE_SCHEMA_EXTENSION_RE = /\.(?:apng|avif|bmp|gif|ico|jpe?g|png|svg|webp|mp4|m4v|mov|webm|avi|m3u8|mp3|wav|aac|ogg|flac|m4a|lottie|apk|ipa|zip|rar|7z|tar|gz|tgz)$/i;
const STATIC_RESOURCE_PATH_RE = /(?:^|[.[\]"])(?:image|img|icon|logo|avatar|portrait|poster|cover|lottie|video_url|audio_url|media_url|swipe_up_lottie)(?:$|[.[\]"])/i;

const RESOURCE_TYPE_LABELS: Record<StaticResourceType, string> = {
  image: '图片',
  video: '视频',
  lottie: 'Lottie',
  audio: '音频',
  package: '包/压缩',
  other: '其他',
};

const VIDEO_RESOURCE_EXTENSION_RE = /\.(?:mp4|m4v|mov|webm|avi|m3u8)$/i;
const IMAGE_RESOURCE_EXTENSION_RE = /\.(?:apng|avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i;
const AUDIO_RESOURCE_EXTENSION_RE = /\.(?:mp3|wav|aac|ogg|flac|m4a)$/i;
const PACKAGE_RESOURCE_EXTENSION_RE = /\.(?:apk|ipa|zip|rar|7z|tar|gz|tgz)$/i;

const getStaticResourcePathname = (schema: string): string => {
  const normalizedSchema = schema.trim().replace(/\\\//g, '/');
  try {
    return new URL(normalizedSchema).pathname;
  } catch {
    return normalizedSchema.split(/[?#]/)[0] || normalizedSchema;
  }
};

export const getStaticResourceType = (
  schema: string,
  path: string
): StaticResourceType => {
  const pathname = getStaticResourcePathname(schema);
  const normalizedPath = path.toLowerCase();
  const compactPath = normalizedPath.replace(/[^a-z0-9]/g, '');
  const haystack = `${pathname} ${normalizedPath}`.toLowerCase();

  if (pathname.toLowerCase().endsWith('.lottie') || haystack.includes('lottie')) return 'lottie';
  if (VIDEO_RESOURCE_EXTENSION_RE.test(pathname) || compactPath.includes('videourl') || compactPath.includes('mediaurl')) {
    return 'video';
  }
  if (
    IMAGE_RESOURCE_EXTENSION_RE.test(pathname) ||
    ['image', 'img', 'icon', 'logo', 'avatar', 'portrait', 'poster', 'cover'].some(keyword => compactPath.includes(keyword))
  ) {
    return 'image';
  }
  if (AUDIO_RESOURCE_EXTENSION_RE.test(pathname) || compactPath.includes('audiourl') || compactPath.includes('audio')) {
    return 'audio';
  }
  if (PACKAGE_RESOURCE_EXTENSION_RE.test(pathname)) return 'package';

  return 'other';
};

export const getResourceTypeLabel = (resourceType: StaticResourceType): string => (
  RESOURCE_TYPE_LABELS[resourceType]
);

export const getResourceTypeQuery = (resourceType: StaticResourceType): string => (
  `资源类型:${getResourceTypeLabel(resourceType)}`
);

export const getResourceTypeSearchTokens = (resourceType: StaticResourceType): string[] => {
  const label = getResourceTypeLabel(resourceType);
  return [
    resourceType,
    label,
    getResourceTypeQuery(resourceType),
    `resource:${resourceType}`,
  ].map(token => token.toLowerCase());
};

export const isStaticResourceSchema = (schema: string, path: string): boolean => {
  const normalizedSchema = schema.trim().replace(/\\\//g, '/');
  try {
    const url = new URL(normalizedSchema);
    if (STATIC_RESOURCE_SCHEMA_EXTENSION_RE.test(url.pathname)) return true;
  } catch {
    if (STATIC_RESOURCE_SCHEMA_EXTENSION_RE.test(normalizedSchema.split(/[?#]/)[0] || '')) return true;
  }

  return STATIC_RESOURCE_PATH_RE.test(path);
};
