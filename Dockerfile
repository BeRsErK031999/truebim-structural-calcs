FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_APP_VERSION
ARG VITE_GIT_COMMIT
ARG VITE_BUILD_TIME
ARG VITE_APP_ENV=production
ARG VITE_BASE_PATH=/

ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_GIT_COMMIT=$VITE_GIT_COMMIT
ENV VITE_BUILD_TIME=$VITE_BUILD_TIME
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN npm run build

FROM nginx:1.29-alpine AS runtime

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
