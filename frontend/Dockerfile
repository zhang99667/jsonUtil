# Build stage
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_GA_MEASUREMENT_ID=
ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build
RUN npm run check:preloads

# Run stage
FROM nginx:latest
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
