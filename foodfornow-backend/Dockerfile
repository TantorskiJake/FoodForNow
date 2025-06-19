# Install dependencies with necessary build tools
FROM node:22-alpine AS deps
WORKDIR /app

# Install system dependencies for bcrypt and native modules
RUN apk add --no-cache python3 make g++ \
  && npm config set python python3

COPY package*.json ./
RUN npm install --omit=dev

# Final production image
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy only the built node_modules and app code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3001
CMD ["node", "server.js"]
