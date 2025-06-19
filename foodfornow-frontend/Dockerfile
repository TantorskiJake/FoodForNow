# Stage 1: Build the frontend
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve using nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: add cache headers
# RUN echo 'add_header Cache-Control "public, max-age=31536000, immutable";' > /etc/nginx/conf.d/cache-control.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
