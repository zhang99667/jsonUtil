import { getResourcePathType } from './resourcePathType';

export type StaticResourceType = 'image' | 'video' | 'lottie' | 'audio' | 'package' | 'other';

const STATIC_RESOURCE_PATH_RE = /(?:^|[.[\]"])(?:image|img|icon|logo|avatar|portrait|poster|cover|lottie|video_url|audio_url|media_url|swipe_up_lottie)(?:$|[.[\]"])/i;
const LOTTIE_RESOURCE_EXTENSION_RE = /\.lottie$/i;

const RESOURCE_TYPE_LABELS: Record<StaticResourceType, string> = {
  image: '图片',
  video: '视频',
  lottie: 'Lottie',
  audio: '音频',
  package: '包/压缩',
  other: '其他',
};

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
  const resourcePathType = getResourcePathType(pathname);

  if (pathname.toLowerCase().endsWith('.lottie') || haystack.includes('lottie')) return 'lottie';
  if (resourcePathType === 'video' || compactPath.includes('videourl') || compactPath.includes('mediaurl')) {
    return 'video';
  }
  if (
    resourcePathType === 'image' ||
    ['image', 'img', 'icon', 'logo', 'avatar', 'portrait', 'poster', 'cover'].some(keyword => compactPath.includes(keyword))
  ) {
    return 'image';
  }
  if (resourcePathType === 'audio' || compactPath.includes('audiourl') || compactPath.includes('audio')) {
    return 'audio';
  }
  if (resourcePathType === 'package') return 'package';

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
  const pathname = getStaticResourcePathname(schema);
  if (getResourcePathType(pathname) || LOTTIE_RESOURCE_EXTENSION_RE.test(pathname)) return true;

  return STATIC_RESOURCE_PATH_RE.test(path);
};
