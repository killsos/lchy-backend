#!/bin/bash

# ===========================================
# App ROI Tracker - 服务器部署脚本
# ===========================================
# 此脚本用于在服务器上自动部署应用
# 使用方法: ./server-deploy.sh [选项]
# ===========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="app-roi-tracker"
REPO_URL="https://github.com/yourusername/project-lchy.git"
DEPLOY_DIR="/opt/${PROJECT_NAME}"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/${PROJECT_NAME}-deploy.log"

# 函数定义
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# 检查运行权限
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        error "请不要以root用户运行此脚本"
    fi
    
    if ! groups $USER | grep -q '\bdocker\b'; then
        error "当前用户不在docker组中，请运行: sudo usermod -aG docker $USER"
    fi
}

# 检查系统依赖
check_dependencies() {
    log "检查系统依赖..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        error "Docker未安装，请先安装Docker"
    fi
    
    # 检查Docker Compose
    if ! docker compose version &> /dev/null; then
        error "Docker Compose未安装，请先安装Docker Compose v2"
    fi
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        error "Git未安装，请先安装Git"
    fi
    
    # 检查curl
    if ! command -v curl &> /dev/null; then
        warn "curl未安装，将尝试安装..."
        sudo apt-get update && sudo apt-get install -y curl
    fi
    
    log "所有依赖检查完成"
}

# 创建必要目录
create_directories() {
    log "创建部署目录..."
    
    sudo mkdir -p "$DEPLOY_DIR"
    sudo mkdir -p "$BACKUP_DIR"
    sudo mkdir -p "$(dirname "$LOG_FILE")"
    
    # 设置目录权限
    sudo chown -R "$USER:$USER" "$DEPLOY_DIR"
    sudo chown -R "$USER:$USER" "$BACKUP_DIR"
    
    log "目录创建完成"
}

# 备份现有部署
backup_existing() {
    if [ -d "$DEPLOY_DIR/project-lchy" ]; then
        log "备份现有部署..."
        
        BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
        
        # 备份数据库
        if docker compose -f "$DEPLOY_DIR/project-lchy/be/docker-compose.yml" ps mysql | grep -q "Up"; then
            log "备份数据库..."
            docker compose -f "$DEPLOY_DIR/project-lchy/be/docker-compose.yml" exec -T mysql \
                mysqldump -u app_user -p"${DB_PASSWORD:-defaultpass}" app_roi_tracker \
                > "$BACKUP_DIR/db_$BACKUP_NAME.sql"
        fi
        
        # 备份应用文件
        tar -czf "$BACKUP_DIR/app_$BACKUP_NAME.tar.gz" \
            -C "$DEPLOY_DIR" project-lchy \
            --exclude='project-lchy/be/node_modules' \
            --exclude='project-lchy/be/docker-volumes' \
            2>/dev/null || warn "备份应用文件时出现警告"
        
        log "备份完成: $BACKUP_NAME"
    fi
}

# 克隆或更新代码
update_code() {
    log "更新代码..."
    
    cd "$DEPLOY_DIR"
    
    if [ -d "project-lchy" ]; then
        log "更新现有代码..."
        cd project-lchy
        git fetch origin
        git reset --hard origin/main  # 强制重置到最新版本
        cd ..
    else
        log "克隆新代码..."
        git clone "$REPO_URL"
    fi
    
    cd project-lchy/be
    log "代码更新完成"
}

# 配置环境变量
setup_environment() {
    log "配置环境变量..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.production.template" ]; then
            cp .env.production.template .env
            warn "已创建 .env 文件，请编辑其中的配置"
            warn "特别注意修改以下配置："
            echo "  - DB_PASSWORD (数据库密码)"
            echo "  - APP_SECRET (应用密钥)"
            echo "  - REDIS_PASSWORD (Redis密码)"
            echo "  - CORS_ORIGIN (允许的域名)"
            
            read -p "是否现在编辑 .env 文件? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                ${EDITOR:-nano} .env
            fi
        else
            error ".env.production.template 文件不存在"
        fi
    else
        info ".env 文件已存在，跳过创建"
    fi
}

# 构建和启动服务
deploy_services() {
    log "构建和启动服务..."
    
    # 停止现有服务
    if docker compose ps | grep -q "Up"; then
        log "停止现有服务..."
        docker compose down
    fi
    
    # 构建镜像
    log "构建Docker镜像..."
    docker compose build --no-cache
    
    # 启动服务
    log "启动服务..."
    docker compose up -d
    
    # 等待服务启动
    log "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_services_health
}

# 运行数据库迁移
run_migrations() {
    log "运行数据库迁移..."
    
    # 等待数据库准备就绪
    log "等待数据库准备就绪..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker compose exec -T mysql mysql -u app_user -p"${DB_PASSWORD:-defaultpass}" -e "SELECT 1" &>/dev/null; then
            break
        fi
        sleep 2
        ((timeout--))
    done
    
    if [ $timeout -eq 0 ]; then
        error "数据库连接超时"
    fi
    
    # 运行迁移
    log "执行数据库迁移..."
    docker compose exec app npm run migrate
    
    log "数据库迁移完成"
}

# 检查服务健康状态
check_services_health() {
    log "检查服务健康状态..."
    
    # 检查容器状态
    if ! docker compose ps | grep -q "Up"; then
        error "部分服务未正常启动"
    fi
    
    # 检查应用健康接口
    log "检查应用健康状态..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3200/health &>/dev/null; then
            log "应用健康检查通过"
            break
        fi
        sleep 2
        ((timeout--))
    done
    
    if [ $timeout -eq 0 ]; then
        error "应用健康检查失败"
    fi
    
    # 检查数据库连接
    log "检查数据库连接..."
    if curl -f http://localhost:3200/health/db &>/dev/null; then
        log "数据库连接正常"
    else
        warn "数据库连接检查失败"
    fi
    
    log "所有服务健康检查完成"
}

# 设置防火墙规则
setup_firewall() {
    if command -v ufw &> /dev/null; then
        log "配置防火墙规则..."
        
        # 允许SSH
        sudo ufw allow ssh
        
        # 允许HTTP和HTTPS
        sudo ufw allow 80
        sudo ufw allow 443
        
        # 允许应用端口（仅本地）
        sudo ufw allow from 127.0.0.1 to any port 3200
        
        # 启用防火墙
        echo "y" | sudo ufw enable
        
        log "防火墙配置完成"
    else
        warn "未找到ufw，跳过防火墙配置"
    fi
}

# 设置日志轮转
setup_log_rotation() {
    log "设置日志轮转..."
    
    sudo tee /etc/logrotate.d/${PROJECT_NAME} > /dev/null <<EOF
${LOG_FILE} {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 ${USER} ${USER}
}

${DEPLOY_DIR}/project-lchy/be/docker-volumes/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
    
    log "日志轮转配置完成"
}

# 设置定时任务
setup_cron_jobs() {
    log "设置定时任务..."
    
    # 创建备份脚本
    cat > "$DEPLOY_DIR/backup.sh" << 'EOF'
#!/bin/bash
DEPLOY_DIR="/opt/app-roi-tracker"
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

cd "${DEPLOY_DIR}/project-lchy/be"

# 备份数据库
docker compose exec -T mysql mysqldump -u app_user -p"${DB_PASSWORD}" app_roi_tracker > "${BACKUP_DIR}/db_${DATE}.sql"

# 备份上传文件
tar -czf "${BACKUP_DIR}/uploads_${DATE}.tar.gz" docker-volumes/uploads/

# 清理7天前的备份
find "${BACKUP_DIR}" -name "db_*.sql" -mtime +7 -delete
find "${BACKUP_DIR}" -name "uploads_*.tar.gz" -mtime +7 -delete
EOF
    
    chmod +x "$DEPLOY_DIR/backup.sh"
    
    # 添加定时任务
    (crontab -l 2>/dev/null; echo "0 2 * * * $DEPLOY_DIR/backup.sh >> $LOG_FILE 2>&1") | crontab -
    
    log "定时任务设置完成"
}

# 显示部署信息
show_deployment_info() {
    log "部署完成！"
    echo
    echo "======================================"
    echo "     部署信息"
    echo "======================================"
    echo "应用地址: http://$(curl -s ifconfig.me):3200"
    echo "健康检查: http://localhost:3200/health"
    echo "API文档: http://localhost:3200/api"
    echo
    echo "部署目录: $DEPLOY_DIR"
    echo "备份目录: $BACKUP_DIR"
    echo "日志文件: $LOG_FILE"
    echo
    echo "======================================"
    echo "     常用命令"
    echo "======================================"
    echo "查看服务状态: cd $DEPLOY_DIR/project-lchy/be && docker compose ps"
    echo "查看日志: cd $DEPLOY_DIR/project-lchy/be && docker compose logs -f"
    echo "重启服务: cd $DEPLOY_DIR/project-lchy/be && docker compose restart"
    echo "更新部署: $0 --update"
    echo
}

# 清理函数
cleanup() {
    log "清理资源..."
    
    # 清理未使用的Docker镜像
    docker image prune -f
    
    # 清理未使用的容器
    docker container prune -f
    
    log "清理完成"
}

# 主函数
main() {
    log "开始部署 $PROJECT_NAME..."
    
    check_permissions
    check_dependencies
    create_directories
    
    cd "$DEPLOY_DIR"
    
    case "${1:-}" in
        "--update"|"-u")
            log "执行更新部署..."
            backup_existing
            update_code
            deploy_services
            run_migrations
            check_services_health
            ;;
        "--backup"|"-b")
            log "执行备份..."
            backup_existing
            ;;
        "--cleanup"|"-c")
            log "执行清理..."
            cleanup
            ;;
        "--help"|"-h")
            echo "使用方法: $0 [选项]"
            echo "选项:"
            echo "  --update, -u    更新现有部署"
            echo "  --backup, -b    备份现有部署"
            echo "  --cleanup, -c   清理Docker资源"
            echo "  --help, -h      显示帮助信息"
            echo
            echo "首次部署: $0"
            echo "更新部署: $0 --update"
            exit 0
            ;;
        *)
            # 首次部署
            backup_existing
            update_code
            setup_environment
            deploy_services
            run_migrations
            check_services_health
            setup_firewall
            setup_log_rotation
            setup_cron_jobs
            show_deployment_info
            ;;
    esac
    
    log "部署流程完成"
}

# 捕获中断信号
trap 'error "部署被中断"' INT TERM

# 执行主函数
main "$@"