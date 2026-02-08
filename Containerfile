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

# Stage 2: Production with nginx
FROM docker.io/nginx:alpine AS production

# Copy built assets from build stage
COPY --from=build /app/dist/poopyfeed/browser /usr/share/nginx/html

# Copy nginx configuration if exists
COPY poopyfeed/nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || true

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

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
