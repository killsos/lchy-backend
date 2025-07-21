# 共享基础镜像配置
FROM node:18-alpine AS alpine-base

# 设置阿里云镜像源（所有阶段共享）
RUN echo "https://mirrors.aliyun.com/alpine/v3.18/main/" > /etc/apk/repositories && \
    echo "https://mirrors.aliyun.com/alpine/v3.18/community/" >> /etc/apk/repositories

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 生产依赖安装阶段
FROM alpine-base AS dependencies

WORKDIR /app

# 复制package文件并安装生产依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 构建阶段
FROM alpine-base AS builder

WORKDIR /app

# 复制package文件和配置
COPY package*.json ./
COPY tsconfig.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制源代码
COPY src/ ./src/

# 构建TypeScript代码
RUN npm run build

# 生产运行阶段
FROM alpine-base AS production

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# 设置工作目录
WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# 复制生产依赖
COPY --from=dependencies --chown=appuser:nodejs /app/node_modules ./node_modules

# 复制构建后的代码
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist

# 复制必要配置文件
COPY --chown=appuser:nodejs package*.json ./
COPY --chown=appuser:nodejs .sequelizerc ./

# 复制源码文件（用于migrations和views）
COPY --from=builder --chown=appuser:nodejs /app/src/views ./src/views
COPY --from=builder --chown=appuser:nodejs /app/src/migrations ./src/migrations

# 切换到非root用户
USER appuser

# 创建日志和上传目录（用户权限）
RUN mkdir -p logs uploads

# 暴露端口
EXPOSE 3200

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3200/health || exit 1

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3200

# 使用dumb-init作为init进程
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["node", "dist/server.js"]