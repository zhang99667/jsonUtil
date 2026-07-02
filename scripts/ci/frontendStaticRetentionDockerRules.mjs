export const dockerStaticRetentionSnippets = [
  { file: 'frontend/Dockerfile', snippets: [
    'COPY --from=build /app/dist /opt/jsonutils-dist',
    'COPY docker-entrypoint.d/40-sync-static-assets.sh /docker-entrypoint.d/40-sync-static-assets.sh',
    'RUN chmod +x /docker-entrypoint.d/40-sync-static-assets.sh',
  ] },
  { file: 'frontend/Dockerfile.prebuilt', snippets: [
    'COPY dist /opt/jsonutils-dist',
    'COPY docker-entrypoint.d/40-sync-static-assets.sh /docker-entrypoint.d/40-sync-static-assets.sh',
    'RUN chmod +x /docker-entrypoint.d/40-sync-static-assets.sh',
  ] },
];
