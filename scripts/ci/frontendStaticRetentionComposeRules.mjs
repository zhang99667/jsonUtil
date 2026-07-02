export const composeStaticRetentionSnippets = [
  { file: 'docker-compose.yml', snippets: [
    'STATIC_ASSET_RETENTION_DAYS=${STATIC_ASSET_RETENTION_DAYS:-14}',
    'frontend-static:/usr/share/nginx/html',
    'frontend-static:',
  ] },
  { file: 'docker-compose.local.yml', snippets: [
    'STATIC_ASSET_RETENTION_DAYS=${STATIC_ASSET_RETENTION_DAYS:-14}',
    'frontend-static:/usr/share/nginx/html',
    'frontend-static:',
  ] },
];
