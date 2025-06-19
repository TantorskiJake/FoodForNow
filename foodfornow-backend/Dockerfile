# Build a lightweight production image
FROM node:18-alpine as base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

EXPOSE 3001
CMD ["node", "server.js"]
