export const composeStaticRetentionSnippets = [
  { file: 'docker-compose.yml', snippets: [
    'STATIC_ASSET_RETENTION_DAYS=${STATIC_ASSET_RETENTION_DAYS:-14}',
    'frontend-static:/usr/share/nginx/html',
    '${ZHANGJIHAO_STATIC_ROOT:-/home/markz/code/jihao}:/usr/share/nginx/zhangjihao:ro',
    'frontend-static:',
  ] },
  { file: 'docker-compose.local.yml', snippets: [
    'STATIC_ASSET_RETENTION_DAYS=${STATIC_ASSET_RETENTION_DAYS:-14}',
    'frontend-static:/usr/share/nginx/html',
    'frontend-static:',
  ] },
];
