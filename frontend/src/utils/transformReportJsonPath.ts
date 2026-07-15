export {
  appendJsonPathIndex as appendTransformJsonPathIndex,
  appendJsonPathKey as appendTransformJsonPathKey,
} from './jsonPathSegments';

export const joinTransformJsonPath = (basePath: string, relativePath: string): string => (
  relativePath === '$'
    ? basePath
    : `${basePath}${relativePath.slice(1)}`
);
