# 服务器部署指南

本指南详细说明如何将项目从GitHub拉取到服务器并完成部署。

## 📋 服务器环境要求

### 最低配置
- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **内存**: 2GB RAM (推荐 4GB+)
- **存储**: 20GB 可用空间
- **CPU**: 2核心 (推荐 4核心+)

### 必需软件
```bash
# Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose v2
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Git
sudo apt-get install git

# 可选: Node.js (如果需要本地开发)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 🚀 部署步骤

### 1. 连接服务器并拉取代码

```bash
# 连接服务器
ssh user@your-server-ip

# 创建项目目录
sudo mkdir -p /opt/app-roi-tracker
sudo chown $USER:$USER /opt/app-roi-tracker
cd /opt/app-roi-tracker

# 克隆项目
git clone https://github.com/yourusername/project-lchy.git
cd project-lchy/be

# 检查代码
ls -la
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

**重要配置项：**
```bash
# 数据库配置
DB_HOST=mysql
DB_PORT=3306
DB_NAME=app_roi_tracker
DB_USER=app_user
DB_PASSWORD=your_secure_password

# 应用配置
NODE_ENV=production
PORT=3200
APP_SECRET=your_secret_key_here

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# 监控配置
ENABLE_MONITORING=true
LOG_LEVEL=info
```

### 3. 启动应用

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

### 4. 数据库初始化

```bash
# 运行数据库迁移
docker-compose exec app npm run migrate

# 可选: 运行种子数据
# docker-compose exec app npm run seed
```

### 5. 验证部署

```bash
# 检查健康状态
curl http://localhost:3200/health

# 检查数据库连接
curl http://localhost:3200/health/db

# 检查应用状态
curl http://localhost:3200/api/filters
```

## 🔧 常用管理命令

### 服务管理
```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启特定服务
docker-compose restart app

# 查看实时日志
docker-compose logs -f

# 进入应用容器
docker-compose exec app sh
```

### 更新部署
```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose down
docker-compose up --build -d

# 运行新的迁移（如果有）
docker-compose exec app npm run migrate
```

### 备份和恢复
```bash
# 备份数据库
docker-compose exec mysql mysqldump -u app_user -p app_roi_tracker > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
docker-compose exec -T mysql mysql -u app_user -p app_roi_tracker < backup_file.sql

# 备份上传的文件
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz docker-volumes/uploads/
```

## 🔍 故障排除

### 常见问题

1. **端口冲突**
```bash
# 检查端口占用
sudo netstat -tlnp | grep :3200
sudo netstat -tlnp | grep :3306

# 修改端口（在docker-compose.yml中）
```

2. **内存不足**
```bash
# 检查内存使用
free -h
docker stats

# 调整服务资源限制
# 编辑 docker-compose.yml 中的 mem_limit
```

3. **数据库连接失败**
```bash
# 检查数据库状态
docker-compose logs mysql

# 重启数据库
docker-compose restart mysql

# 检查网络连接
docker-compose exec app ping mysql
```

4. **应用启动失败**
```bash
# 查看详细日志
docker-compose logs app

# 检查配置文件
docker-compose exec app cat /app/.env

# 重新构建镜像
docker-compose build --no-cache app
```

### 性能优化

1. **增加数据库连接池**
```bash
# 在 .env 中调整
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000
```

2. **启用Redis缓存**
```bash
# 确保Redis配置正确
REDIS_ENABLE=true
CACHE_TTL=3600
```

3. **调整Nginx配置**
```bash
# 编辑 docker/nginx/nginx.conf
# 增加 worker_processes 和 worker_connections
```

## 🔐 安全配置

### 防火墙设置
```bash
# Ubuntu/Debian
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### SSL证书配置
```bash
# 使用 Let's Encrypt
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com

# 复制证书到Docker目录
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/ssl/
sudo chown $USER:$USER docker/ssl/*
```

### 定期维护
```bash
# 创建定期备份脚本
cat > /opt/app-roi-tracker/backup.sh << 'EOF'
#!/bin/bash
cd /opt/app-roi-tracker/project-lchy/be
docker-compose exec mysql mysqldump -u app_user -p${DB_PASSWORD} app_roi_tracker > /opt/backups/db_$(date +%Y%m%d_%H%M%S).sql
find /opt/backups -name "db_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/app-roi-tracker/backup.sh

# 添加到crontab（每天凌晨2点备份）
echo "0 2 * * * /opt/app-roi-tracker/backup.sh" | crontab -
```

## 📊 监控和日志

### 服务监控
```bash
# 实时查看服务状态
watch docker-compose ps

# 查看系统资源使用
htop
docker stats

# 查看磁盘使用
df -h
du -sh docker-volumes/
```

### 日志管理
```bash
# 查看应用日志
docker-compose logs -f --tail=100 app

# 查看数据库日志
docker-compose logs -f mysql

# 清理旧日志
docker system prune -f
```

## 🆘 紧急恢复

### 快速回滚
```bash
# 回滚到上一个版本
git log --oneline -10
git checkout <previous-commit-hash>
docker-compose down
docker-compose up --build -d
```

### 紧急重启
```bash
# 完全重启所有服务
docker-compose down
docker system prune -f
docker-compose up -d
```

---

## 📞 技术支持

- **日志位置**: `/opt/app-roi-tracker/project-lchy/be/docker-volumes/logs/`
- **配置文件**: `/opt/app-roi-tracker/project-lchy/be/.env`
- **数据目录**: `/opt/app-roi-tracker/project-lchy/be/docker-volumes/`

遇到问题时，请提供以下信息：
1. 错误日志（`docker-compose logs`）
2. 系统信息（`uname -a`, `docker version`）
3. 配置信息（隐藏敏感信息）