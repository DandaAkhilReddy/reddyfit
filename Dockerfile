# ReddyTalk.ai Production Dockerfile
FROM node:20-alpine AS base

# Install system dependencies for audio processing
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Copy package files
COPY package*.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reddytalk -u 1001

# Change ownership and switch to non-root user
RUN chown -R reddytalk:nodejs /app
USER reddytalk

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health/live || exit 1

# Expose ports
EXPOSE 8080 8081 9090

# Start the application
CMD ["node", "src/app-comprehensive.js"]