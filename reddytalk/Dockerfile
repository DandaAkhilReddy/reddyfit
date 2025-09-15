# ReddyTalk.ai Production Dockerfile
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code and scripts
COPY src/ ./src/
COPY quick-start.js ./
COPY test-backend.js ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reddytalk -u 1001

# Change ownership and switch to non-root user
RUN chown -R reddytalk:nodejs /app
USER reddytalk

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "src/app-comprehensive.js"]