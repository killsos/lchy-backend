# Docker 部署指南

App ROI 跟踪系统的完整 Docker 部署方案，包括应用服务、MySQL 数据库、Redis 缓存和 Nginx 反向代理。

## 🚀 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- Git
- 至少 2GB 可用内存

### 一键部署

```bash
# 克隆项目
git clone <your-repo-url>
cd project-lchy/be

# 运行部署脚本
./deploy.sh
```

部署完成后访问：
- 应用: http://localhost:3200
- 健康检查: http://localhost:3200/health
- Nginx代理: http://localhost

## 📁 项目结构

```
project-lchy/be/
├── docker/                    # Docker配置文件
│   ├── mysql/init/           # MySQL初始化脚本
│   ├── nginx/                # Nginx配置
│   └── ssl/                  # SSL证书目录
├── src/                      # 应用源码
├── logs/                     # 日志目录
├── uploads/                  # 文件上传目录
├── Dockerfile               # 生产环境镜像
├── Dockerfile.dev           # 开发环境镜像
├── docker-compose.yml       # 生产环境编排
├── docker-compose.dev.yml   # 开发环境编排
├── .dockerignore           # Docker忽略文件
├── .env.docker             # 环境变量模板
├── deploy.sh               # 部署脚本
└── DOCKER_DEPLOYMENT.md    # 本文档
```

## 🔧 环境配置

### 环境变量配置

复制环境变量模板并修改：

```bash
cp .env.docker .env
```

重要配置项：

```bash
# 数据库安全配置
DB_ROOT_PASSWORD=your_secure_root_password
DB_USERNAME=your_app_user
DB_PASSWORD=your_secure_password
DB_NAME=your_database_name

# 应用配置
PORT=3200
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# 连接池优化
DB_POOL_MAX=20
DB_POOL_MIN=5

# 日志级别
LOG_LEVEL=info
```

### 生产环境安全配置

生产环境请务必修改以下配置：

1. **数据库密码**: 使用强密码
2. **CORS源**: 限制为实际域名
3. **SSL证书**: 配置HTTPS
4. **防火墙**: 限制端口访问

## 🐳 部署方式

### 方式1: 一键部署脚本

```bash
./deploy.sh
```

脚本会自动执行：
- ✅ 检查依赖
- ✅ 创建环境配置
- ✅ 构建镜像
- ✅ 启动服务
- ✅ 运行数据库迁移
- ✅ 健康检查

### 方式2: 手动部署

```bash
# 1. 创建环境文件
cp .env.docker .env

# 2. 构建和启动服务
docker-compose up -d --build

# 3. 查看服务状态
docker-compose ps

# 4. 运行数据库迁移
docker-compose exec app npm run migrate

# 5. 查看日志
docker-compose logs -f app
```

### 方式3: 开发环境部署

```bash
# 使用开发环境配置
docker-compose -f docker-compose.dev.yml up -d

# 查看开发日志
docker-compose -f docker-compose.dev.yml logs -f app-dev
```

## 🔍 服务管理

### 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f app
docker-compose logs -f mysql

# 重启服务
docker-compose restart app

# 停止所有服务
docker-compose down

# 停止并删除数据卷（⚠️ 会删除数据库数据）
docker-compose down -v

# 重新构建镜像
docker-compose build --no-cache app

# 扩展应用实例
docker-compose up -d --scale app=3
```

### 进入容器

```bash
# 进入应用容器
docker-compose exec app sh

# 进入MySQL容器
docker-compose exec mysql mysql -u appuser -p

# 查看容器资源使用
docker stats
```

## 📊 监控和健康检查

### 健康检查端点

| 端点 | 说明 | 响应 |
|------|------|------|
| `/health` | 基础健康检查 | 应用状态、数据库连接、内存使用 |
| `/health/pool` | 连接池状态 | 连接池详细统计和建议 |

### 监控指标

```bash
# 检查应用健康状态
curl http://localhost:3200/health | jq

# 检查连接池状态
curl http://localhost:3200/health/pool | jq

# 查看容器资源使用
docker stats app-roi-backend app-roi-mysql

# 查看服务日志
docker-compose logs --tail=100 app
```

### 日志管理

```bash
# 实时查看应用日志
docker-compose logs -f app

# 查看最近100行日志
docker-compose logs --tail=100 app

# 查看特定时间日志
docker-compose logs --since=2024-01-01T00:00:00 app

# 导出日志到文件
docker-compose logs app > app.log
```

## 🔒 安全配置

### 网络安全

1. **防火墙设置**:
```bash
# 只允许必要端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3306/tcp  # 禁止外部访问数据库
```

2. **Nginx安全头**:
已在配置中包含安全头：
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block

### SSL/HTTPS配置

1. **生成SSL证书**:
```bash
# 自签名证书（开发环境）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/ssl/privkey.pem \
  -out docker/ssl/fullchain.pem

# 生产环境建议使用Let's Encrypt
```

2. **更新Nginx配置**:
```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    # ... 其他配置
}
```

## 🎯 性能优化

### 连接池调优

根据负载调整连接池参数：

```bash
# 高并发环境
DB_POOL_MAX=50
DB_POOL_MIN=10
DB_POOL_ACQUIRE=30000

# 低并发环境
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_POOL_ACQUIRE=60000
```

### 容器资源限制

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### 数据库优化

```sql
-- MySQL配置优化
SET GLOBAL innodb_buffer_pool_size = 256M;
SET GLOBAL max_connections = 200;
SET GLOBAL query_cache_size = 32M;
```

## 🔄 数据备份

### 数据库备份

```bash
# 创建备份
docker-compose exec mysql mysqldump -u root -p lchy > backup.sql

# 恢复备份
docker-compose exec -T mysql mysql -u root -p lchy < backup.sql

# 自动备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec mysql mysqldump -u root -p${DB_ROOT_PASSWORD} lchy > backup_${DATE}.sql
gzip backup_${DATE}.sql
echo "Backup completed: backup_${DATE}.sql.gz"
EOF
chmod +x backup.sh
```

### 数据卷备份

```bash
# 备份数据卷
docker run --rm -v app-roi-mysql-data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm -v app-roi-mysql-data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql-backup.tar.gz -C /data
```

## 🚨 故障排除

### 常见问题

1. **端口被占用**:
```bash
# 查看端口占用
lsof -i :3200
netstat -tulpn | grep :3200

# 修改端口
echo "PORT=3201" >> .env
```

2. **数据库连接失败**:
```bash
# 检查MySQL状态
docker-compose logs mysql

# 测试数据库连接
docker-compose exec mysql mysql -u appuser -p
```

3. **内存不足**:
```bash
# 查看系统资源
free -h
df -h

# 查看容器资源使用
docker stats
```

4. **应用启动失败**:
```bash
# 查看应用日志
docker-compose logs app

# 检查环境变量
docker-compose exec app printenv

# 重新构建镜像
docker-compose build --no-cache app
```

### 调试模式

```bash
# 启用详细日志
echo "LOG_LEVEL=debug" >> .env
docker-compose restart app

# 进入容器调试
docker-compose exec app sh
```

## 📈 扩展部署

### 水平扩展

```bash
# 启动多个应用实例
docker-compose up -d --scale app=3

# 配置负载均衡（需要更新nginx配置）
upstream app_backend {
    server app_1:3200;
    server app_2:3200;
    server app_3:3200;
}
```

### 集群部署

```bash
# 使用Docker Swarm
docker swarm init
docker stack deploy -c docker-compose.yml app-roi-stack
```

## 🛠️ 开发环境

### 本地开发

```bash
# 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 代码热重载
# 源码会挂载到容器，修改后自动重启
```

### 调试配置

```bash
# 启用调试模式
docker-compose -f docker-compose.dev.yml exec app-dev npm run dev:debug

# VSCode连接调试
# 配置launch.json连接到localhost:9229
```

## 📚 更多资源

- [Docker官方文档](https://docs.docker.com/)
- [Docker Compose参考](https://docs.docker.com/compose/)
- [MySQL Docker镜像](https://hub.docker.com/_/mysql)
- [Nginx Docker镜像](https://hub.docker.com/_/nginx)

---

## 🆘 技术支持

如果遇到问题，请：

1. 查看应用日志: `docker-compose logs app`
2. 检查服务状态: `docker-compose ps`
3. 验证健康检查: `curl http://localhost:3200/health`
4. 查看系统资源: `docker stats`

**部署完成后，你的App ROI跟踪系统将通过Docker容器运行，具备高可用性、可扩展性和易维护性！** 🎉