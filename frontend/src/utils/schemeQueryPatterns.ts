export const QUERY_KEY_PATTERN = '[A-Za-z0-9_.\\-[\\]%]+';
export const QUERY_PAIR_START_RE = new RegExp(`^${QUERY_KEY_PATTERN}=`);
export const QUERY_PAIR_DELIMITER_RE = new RegExp(`[&;](?=${QUERY_KEY_PATTERN}=)`);
