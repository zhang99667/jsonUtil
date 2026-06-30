# 构建阶段
FROM node:20-alpine AS build
WORKDIR /app
COPY .npmrc package*.json ./
ARG NPM_REGISTRY=https://registry.npmmirror.com
RUN npm ci --include=optional --registry="${NPM_REGISTRY}"
COPY . .
ARG VITE_GA_MEASUREMENT_ID=
ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
ENV NODE_OPTIONS=--max-old-space-size=1200
RUN npm run build
RUN npm run check:preloads

# 运行阶段
FROM nginx:1.28.0-alpine
COPY --from=build /app/dist /opt/jsonutils-dist
COPY docker-entrypoint.d/40-sync-static-assets.sh /docker-entrypoint.d/40-sync-static-assets.sh
RUN chmod +x /docker-entrypoint.d/40-sync-static-assets.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
