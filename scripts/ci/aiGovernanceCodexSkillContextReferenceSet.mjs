import { isDeepStrictEqual } from 'node:util';

import {
  captureStableContextPathManifest,
  measureStableContextPathBytes,
} from './aiGovernanceCodexSkillContextPathMeasurement.mjs';

const captureReferenceSetManifest = references => references.map(({ reference, root, target }) => ({
  reference,
  entries: captureStableContextPathManifest(root, target, reference),
}));

export const measureStableContextReferenceSet = (references) => {
  const before = captureReferenceSetManifest(references);
  const measurements = references.map(({ reference, root, target }) => ({
    reference,
    bytes: measureStableContextPathBytes(root, target, reference),
  }));
  const after = captureReferenceSetManifest(references);
  if (!isDeepStrictEqual(before, after)) {
    throw new Error('必读上下文路径集合在读取期间发生整体漂移');
  }
  return measurements;
};
