# Build stage
FROM node:22-bookworm AS builder

WORKDIR /app

# Copy only package.json files (not lock files) to force fresh install for linux
COPY package.json ./
COPY frontend/package.json ./frontend/

# Install dependencies - fresh install to get correct native modules for linux
RUN npm install && \
    cd frontend && npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-bookworm-slim

# Install Chromium and required dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxss1 \
    xdg-utils \
    wget \
    ca-certificates \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only package.json (not lock file) for fresh install
COPY package.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/src/lighthouse/workers ./src/lighthouse/workers

# Create a non-root user for security
RUN groupadd -r lighthouse && \
    useradd -r -g lighthouse -G audio,video lighthouse && \
    mkdir -p /home/lighthouse/Downloads && \
    chown -R lighthouse:lighthouse /home/lighthouse && \
    chown -R lighthouse:lighthouse /app

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    CHROME_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Switch to non-root user
USER lighthouse

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start the application
CMD ["node", "dist/main"]