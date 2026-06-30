# ── Stage 1: Build backend ──────────────────────────────────────
FROM node:24-slim AS backend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY backend/ backend/
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
RUN npm run build

# ── Stage 2: Build frontend ─────────────────────────────────────
FROM node:24-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
# Empty = relative URLs (same-origin).  External reverse proxy handles routing.
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ── Stage 3: Production image ───────────────────────────────────
FROM node:24-slim
RUN groupadd -r appuser && useradd -r -g appuser -s /usr/sbin/nologin appuser
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=backend-build /app/dist ./dist
COPY --from=frontend-build /app/dist ./public
USER appuser
EXPOSE 3000
CMD ["node", "dist/main.js"]
