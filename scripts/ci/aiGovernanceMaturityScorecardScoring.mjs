const STATUS_POINTS = { pass: 1, warn: 0.5, unknown: 0.5, fail: 0 };
const STATUS_RANK = { pass: 0, unknown: 1, warn: 2, fail: 3 };

export const scorecardDimension = (id, label, status, evidence, nextAction, details = undefined) => ({
  id,
  label,
  status,
  evidence,
  nextAction: status === 'pass' ? '' : nextAction,
  ...(details ? { details } : {}),
});

export const summarizeScorecardStatus = dimensions => dimensions.reduce(
  (worst, item) => (STATUS_RANK[item.status] > STATUS_RANK[worst] ? item.status : worst),
  'pass'
);

export const scoreScorecardDimensions = (dimensions) => {
  const points = dimensions.reduce((sum, item) => sum + STATUS_POINTS[item.status], 0);
  return Math.round((points / dimensions.length) * 100);
};
