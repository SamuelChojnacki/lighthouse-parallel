FROM node:20-bullseye

# Install Chrome dependencies and curl for health checks
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    wget \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set Chrome environment variables
ENV CHROME_PATH=/usr/bin/chromium
ENV LIGHTHOUSE_CHROMIUM_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files for backend
COPY package*.json ./

# Install backend dependencies (including dev for tests)
RUN npm ci --include=dev

# Copy frontend package files
COPY frontend/package*.json ./frontend/

# Install frontend dependencies
RUN cd frontend && npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]