const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const nullableSha256 = value => value === null || (typeof value === 'string' && SHA256_PATTERN.test(value));
const booleans = (value, fields) => fields.every(field => typeof value[field] === 'boolean');

export const collectSeatbeltSentinelReportShapeFailures = ({ observations, claims }) => {
  const booleanGroups = [
    [observations.codexPreflight, ['staticBindingsMatched', 'codeIdentityMatched', 'versionMatched',
      'sandboxHelpMatched', 'seatbeltProfileObserved', 'postflightBindingsMatched']],
    [observations.syntheticSecret, ['baselineReadObserved', 'sandboxReadDenied']],
    [observations.liveCheckout, ['baselineReadObserved', 'sandboxReadDenied']],
    [observations.snapshot, ['sourceMutationAttempted', 'manifestReadObserved', 'ledgerCopiesPresent',
      'disposableMirrorBaselineChmodObserved', 'disposableMirrorBaselineWriteObserved',
      'disposableMirrorChmodDenied', 'disposableMirrorWriteDenied']],
    [observations.network, ['loopbackBaselineConnected', 'sandboxLoopbackDenied']],
    [observations.processInfo, ['siblingBaselineVisible', 'sandboxSiblingInfoDenied', 'sameUidObserved']],
    [observations.cleanup, ['childrenExited', 'tempEntriesRemoved']],
  ];
  const digestValues = [observations.syntheticSecret.canarySha256,
    observations.snapshot.sourceDigestBefore, observations.snapshot.sourceDigestAfter,
    observations.snapshot.manifestReadSha256, observations.snapshot.disposableMirrorDigestBefore,
    observations.snapshot.disposableMirrorDigestAfter];
  const claimFields = Object.keys(claims).filter(field => field !== 'trustedSigners');
  if (booleanGroups.some(([value, fields]) => !booleans(value, fields))
    || observations.snapshot.sourceMutationAttempted !== false
    || digestValues.some(value => !nullableSha256(value))
    || !Number.isSafeInteger(observations.cleanup.residualNonceObjects)
    || observations.cleanup.residualNonceObjects < 0 || observations.cleanup.residualNonceObjects > 1_000
    || !booleans(claims, claimFields) || !Number.isSafeInteger(claims.trustedSigners)
    || claims.trustedSigners < 0) return ['report-value-shape-invalid'];
  return [];
};
