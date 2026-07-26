export type ResourcePathType = 'image' | 'video' | 'audio' | 'package';

const RESOURCE_PATH_TYPE_PATTERNS: ReadonlyArray<readonly [ResourcePathType, RegExp]> = [
  ['video', /\.(?:mp4|m4v|mov|webm|avi|m3u8)$/i],
  ['image', /\.(?:apng|avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i],
  ['audio', /\.(?:mp3|wav|aac|ogg|flac|m4a)$/i],
  ['package', /\.(?:apk|ipa|zip|rar|7z|tar|gz|tgz)$/i],
];

export const getResourcePathType = (pathname: string): ResourcePathType | null => (
  RESOURCE_PATH_TYPE_PATTERNS.find(([, pattern]) => pattern.test(pathname))?.[0] ?? null
);
