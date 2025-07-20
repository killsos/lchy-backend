#!/bin/bash

# 生产环境部署脚本
# 使用方法: ./deploy-prod.sh [选项]
# 选项:
#   --build    重新构建镜像
#   --migrate  运行数据库迁移
#   --backup   部署前备份数据库
#   --force    强制重新部署
#   --help     显示帮助信息

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups"
PROJECT_NAME="app-roi-tracker"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "生产环境部署脚本"
    echo ""
    echo "使用方法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --build      重新构建镜像"
    echo "  --migrate    运行数据库迁移"
    echo "  --backup     部署前备份数据库"
    echo "  --force      强制重新部署（停止并删除现有容器）"
    echo "  --help       显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --build --migrate     # 构建镜像并运行迁移"
    echo "  $0 --backup --force      # 备份数据库并强制重新部署"
    echo ""
}

# 检查必要的文件
check_prerequisites() {
    log_info "检查必要的文件..."
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "环境文件 $ENV_FILE 不存在"
        log_info "请复制 .env.server 为 .env 并配置正确的环境变量"
        exit 1
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose 文件 $COMPOSE_FILE 不存在"
        exit 1
    fi
    
    # 检查Docker是否运行
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker 未运行，请启动 Docker 服务"
        exit 1
    fi
    
    log_success "必要文件检查完成"
}

# 备份数据库
backup_database() {
    log_info "开始备份数据库..."
    
    # 创建备份目录
    mkdir -p "$BACKUP_DIR"
    
    # 生成备份文件名
    BACKUP_FILE="$BACKUP_DIR/mysql_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # 从环境文件读取数据库配置
    source "$ENV_FILE"
    
    # 执行备份
    if docker exec app-roi-mysql-prod mysqldump -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
        log_success "数据库备份完成: $BACKUP_FILE"
    else
        log_warning "数据库备份失败，可能是容器未运行"
    fi
}

# 构建镜像
build_images() {
    log_info "开始构建 Docker 镜像..."
    
    docker-compose -f "$COMPOSE_FILE" build --no-cache app
    
    log_success "镜像构建完成"
}

# 运行数据库迁移
run_migrations() {
    log_info "运行数据库迁移..."
    
    # 等待数据库服务启动
    log_info "等待数据库服务启动..."
    sleep 30
    
    # 运行迁移
    docker-compose -f "$COMPOSE_FILE" exec app npm run migrate
    
    log_success "数据库迁移完成"
}

# 部署应用
deploy_application() {
    log_info "开始部署应用..."
    
    if [ "$FORCE_DEPLOY" = true ]; then
        log_warning "强制重新部署，停止并删除现有容器..."
        docker-compose -f "$COMPOSE_FILE" down
    fi
    
    # 启动服务
    log_info "启动服务..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 20
    
    # 检查服务状态
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_success "服务启动成功"
    else
        log_error "服务启动失败"
        docker-compose -f "$COMPOSE_FILE" logs
        exit 1
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查应用健康状态
    for i in {1..10}; do
        if curl -f http://localhost:3200/health >/dev/null 2>&1; then
            log_success "应用健康检查通过"
            return 0
        fi
        log_info "等待应用启动... ($i/10)"
        sleep 10
    done
    
    log_error "应用健康检查失败"
    return 1
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo ""
    echo "服务信息:"
    echo "  应用地址: http://localhost:3200"
    echo "  健康检查: http://localhost:3200/health"
    echo ""
    echo "管理命令:"
    echo "  查看日志: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  停止服务: docker-compose -f $COMPOSE_FILE down"
    echo "  重启服务: docker-compose -f $COMPOSE_FILE restart"
    echo ""
}

# 清理函数
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "部署过程中出现错误"
        log_info "查看日志: docker-compose -f $COMPOSE_FILE logs"
    fi
}

# 设置清理陷阱
trap cleanup EXIT

# 解析命令行参数
BUILD_IMAGES=false
RUN_MIGRATIONS=false
BACKUP_DB=false
FORCE_DEPLOY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD_IMAGES=true
            shift
            ;;
        --migrate)
            RUN_MIGRATIONS=true
            shift
            ;;
        --backup)
            BACKUP_DB=true
            shift
            ;;
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 主要部署流程
main() {
    log_info "开始生产环境部署..."
    
    # 检查先决条件
    check_prerequisites
    
    # 备份数据库
    if [ "$BACKUP_DB" = true ]; then
        backup_database
    fi
    
    # 构建镜像
    if [ "$BUILD_IMAGES" = true ]; then
        build_images
    fi
    
    # 部署应用
    deploy_application
    
    # 运行迁移
    if [ "$RUN_MIGRATIONS" = true ]; then
        run_migrations
    fi
    
    # 健康检查
    health_check
    
    # 显示部署信息
    show_deployment_info
}

# 执行主流程
main