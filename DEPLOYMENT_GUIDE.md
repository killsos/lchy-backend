# 生产环境部署指南

本指南介绍如何将 App ROI Tracker 应用部署到生产服务器。

## 📋 部署前准备

### 1. 服务器要求
- Ubuntu 20.04+ 或 CentOS 8+
- Docker 20.10+
- Docker Compose 2.0+
- 最少 2GB RAM，4GB 推荐
- 最少 20GB 磁盘空间

### 2. 安装 Docker 和 Docker Compose

```bash
# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. 克隆项目到服务器

```bash
git clone <your-repository-url>
cd be
```

## 🔧 配置环境变量

### 1. 复制环境变量模板

```bash
cp .env.server .env
```

### 2. 编辑环境变量

```bash
nano .env
```

**重要配置项：**

```env
# 数据库配置 - 请使用强密码
DB_ROOT_PASSWORD=your_very_secure_root_password
DB_USERNAME=app_user_prod
DB_PASSWORD=your_very_secure_db_password
DB_NAME=lchy_prod

# 应用端口
APP_PORT=3200

# 安全配置 - 替换为你的域名
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# 连接池配置（生产环境优化）
DB_POOL_MAX=30
DB_POOL_MIN=10
```

## 🚀 部署方式

### 方式一：使用部署脚本（推荐）

```bash
# 首次部署（构建镜像 + 运行迁移）
./deploy-prod.sh --build --migrate

# 带备份的完整部署
./deploy-prod.sh --backup --build --migrate --force

# 仅更新应用（不重新构建）
./deploy-prod.sh --migrate

# 查看所有选项
./deploy-prod.sh --help
```

### 方式二：手动部署

```bash
# 1. 构建并启动服务
docker-compose -f docker-compose.prod.yml up -d --build

# 2. 等待数据库启动（约30秒）
sleep 30

# 3. 运行数据库迁移
docker-compose -f docker-compose.prod.yml exec app npm run migrate

# 4. 检查服务状态
docker-compose -f docker-compose.prod.yml ps
```

## 📊 服务管理

### 查看服务状态
```bash
docker-compose -f docker-compose.prod.yml ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f app
docker-compose -f docker-compose.prod.yml logs -f mysql
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 重启服务
```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启特定服务
docker-compose -f docker-compose.prod.yml restart app
```

### 停止服务
```bash
docker-compose -f docker-compose.prod.yml down
```

## 🔒 SSL/HTTPS 配置（可选）

### 1. 准备SSL证书

将SSL证书文件放置在：
- `docker/ssl/cert.pem` - 证书文件
- `docker/ssl/key.pem` - 私钥文件

### 2. 启用HTTPS配置

```bash
# 复制HTTPS Nginx配置
cp docker/nginx/conf.d/default.prod.conf docker/nginx/conf.d/default.conf

# 重启Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 💾 数据备份

### 自动备份
部署脚本支持自动备份：
```bash
./deploy-prod.sh --backup
```

### 手动备份
```bash
# 备份数据库
docker exec app-roi-mysql-prod mysqldump -u root -p"$DB_ROOT_PASSWORD" lchy_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份上传文件
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/
```

### 恢复数据库
```bash
# 恢复数据库
docker exec -i app-roi-mysql-prod mysql -u root -p"$DB_ROOT_PASSWORD" lchy_prod < backup_file.sql
```

## 📈 监控和健康检查

### 健康检查端点
- 应用健康检查：`http://your-server:3200/health`
- 通过Nginx：`http://your-server/health`

### 查看容器健康状态
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 性能监控
```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用情况
df -h

# 查看日志大小
du -sh logs/
```

## 🚨 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose -f docker-compose.prod.yml logs mysql
   
   # 检查网络连接
   docker-compose -f docker-compose.prod.yml exec app ping mysql
   ```

2. **应用启动失败**
   ```bash
   # 查看应用日志
   docker-compose -f docker-compose.prod.yml logs app
   
   # 检查环境变量
   docker-compose -f docker-compose.prod.yml exec app env
   ```

3. **Nginx配置错误**
   ```bash
   # 测试Nginx配置
   docker-compose -f docker-compose.prod.yml exec nginx nginx -t
   
   # 重新加载配置
   docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
   ```

### 完全重置
```bash
# 停止并删除所有容器、网络
docker-compose -f docker-compose.prod.yml down

# 删除数据卷（注意：这会删除所有数据！）
docker volume rm app-roi-mysql-data-prod app-roi-redis-data-prod

# 重新部署
./deploy-prod.sh --build --migrate
```

## 🔄 更新应用

### 常规更新
```bash
# 拉取最新代码
git pull origin main

# 重新部署
./deploy-prod.sh --build --migrate
```

### 零停机更新
```bash
# 构建新镜像
docker-compose -f docker-compose.prod.yml build app

# 滚动更新（如果使用多个实例）
docker-compose -f docker-compose.prod.yml up -d --no-deps app
```

## 📞 支持

如遇到问题，请：
1. 查看服务日志：`docker-compose -f docker-compose.prod.yml logs -f`
2. 检查健康状态：访问 `/health` 端点
3. 检查系统资源：`docker stats` 和 `df -h`

---

**⚠️ 重要提醒：**
- 在生产环境中，请确保使用强密码
- 定期备份数据库和重要文件
- 监控服务器资源使用情况
- 保持Docker和系统更新