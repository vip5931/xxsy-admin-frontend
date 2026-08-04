# ============================================
# Dockerfile — Vue 3 前端构建与运行
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com && npm install -g pnpm@9

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY index.html vite.config.ts tsconfig*.json ./
COPY src ./src

RUN npx vite build

# ---- 运行阶段 ----
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
