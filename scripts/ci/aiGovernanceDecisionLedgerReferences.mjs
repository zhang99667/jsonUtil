export const extractBacktickReferences = text => [...text.matchAll(/`([^`]+)`/g)].map(match => match[1]);
