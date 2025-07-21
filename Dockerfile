# 使用官方Node.js 18 Alpine镜像作为基础镜像
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 设置阿里云镜像源
RUN echo "https://mirrors.aliyun.com/alpine/v3.18/main/" > /etc/apk/repositories && \
    echo "https://mirrors.aliyun.com/alpine/v3.18/community/" >> /etc/apk/repositories

# 安装系统依赖
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# 复制package文件
COPY package*.json ./

# 设置npm阿里云镜像源并安装依赖
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci --only=production && npm cache clean --force

# 开发构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 设置阿里云镜像源
RUN echo "https://mirrors.aliyun.com/alpine/v3.18/main/" > /etc/apk/repositories && \
    echo "https://mirrors.aliyun.com/alpine/v3.18/community/" >> /etc/apk/repositories

# 复制package文件
COPY package*.json ./
COPY tsconfig.json ./

# 设置npm阿里云镜像源并安装所有依赖（包括开发依赖）
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci

# 复制源代码和配置文件
COPY src/ ./src/

# 构建TypeScript代码
RUN npm run build

# 生产运行阶段
FROM node:18-alpine AS production

# 设置阿里云镜像源
RUN echo "https://mirrors.aliyun.com/alpine/v3.18/main/" > /etc/apk/repositories && \
    echo "https://mirrors.aliyun.com/alpine/v3.18/community/" >> /etc/apk/repositories

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

# 从base阶段复制node_modules
COPY --from=base --chown=appuser:nodejs /app/node_modules ./node_modules

# 从builder阶段复制构建后的代码
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist

# 复制其他必要文件（包括models和config）
COPY --chown=appuser:nodejs package*.json ./
COPY --from=builder --chown=appuser:nodejs /app/src/models ./dist/models
COPY --from=builder --chown=appuser:nodejs /app/src/config ./src/config
COPY --from=builder --chown=appuser:nodejs /app/src/migrations ./src/migrations

# 创建日志和上传目录
RUN mkdir -p logs uploads && \
    chown -R appuser:nodejs logs uploads

# 切换到非root用户
USER appuser

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