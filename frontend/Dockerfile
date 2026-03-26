# ============================================
# Stage 1: Build the React/Vite application
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json package-lock.json* ./

RUN npm ci --no-audit --no-fund

# Copy source code and build
COPY . .

RUN npm run build

# ============================================
# Stage 2: Serve with Nginx
# ============================================
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Use non-root user (nginx alpine image supports this)
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid

EXPOSE 80

# Nginx runs in the foreground
CMD ["nginx", "-g", "daemon off;"]
