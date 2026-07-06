# ============================================
# frontend/Dockerfile — Vue 3 前端构建与运行
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@9

# workspace 配置
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# 安装前端依赖
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile --filter xxsy-admin-frontend

# 复制前端源码
COPY frontend/index.html ./frontend/
COPY frontend/vite.config.ts ./frontend/
COPY frontend/tsconfig*.json ./frontend/
COPY frontend/src ./frontend/src

# 构建
WORKDIR /app/frontend
RUN npx vite build

# ---- 运行阶段 ----
FROM nginx:alpine AS runner

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
