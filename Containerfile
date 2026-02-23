# Containerfile
# Multi-stage build for Angular application

# Stage 1: Build
FROM docker.io/node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY poopyfeed/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY poopyfeed/. .

# Build the application
RUN npm run build

# Stage 2: Production with Node SSR server
FROM docker.io/node:20-alpine AS production

WORKDIR /app

# Copy package files and install production deps only
COPY poopyfeed/package*.json ./
RUN npm ci --omit=dev

# Copy built dist from build stage (both browser + server bundles)
COPY --from=build /app/dist ./dist

ENV PORT=80
EXPOSE 80

CMD ["node", "dist/poopyfeed/server/server.mjs"]

# Stage 3: Development
FROM docker.io/node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY poopyfeed/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY poopyfeed/. .

EXPOSE 4200

CMD ["npm", "start", "--", "--host", "0.0.0.0"]
