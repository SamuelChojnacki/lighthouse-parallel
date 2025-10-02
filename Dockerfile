FROM node:20-bullseye

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set Chrome environment
ENV CHROME_PATH=/usr/bin/chromium
ENV LIGHTHOUSE_CHROMIUM_PATH=/usr/bin/chromium

WORKDIR /app

# Copy and install backend dependencies
COPY package*.json ./
RUN npm ci

# Copy and install frontend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Copy all source code
COPY . .

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]