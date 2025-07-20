#!/bin/bash

# App ROI Tracker Docker部署脚本
# 作者: Claude Code Assistant
# 版本: 1.0.0

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数定义
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

# 检查Docker和Docker Compose是否安装
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 创建环境文件
setup_environment() {
    log_info "设置环境配置..."
    
    if [ ! -f .env ]; then
        log_warning ".env文件不存在，从模板创建..."
        cp .env.docker .env
        log_info "请编辑 .env 文件配置数据库密码等敏感信息"
        log_info "当前使用默认配置继续部署..."
    fi
    
    # 创建必要的目录
    mkdir -p logs uploads
    chmod 755 logs uploads
    
    log_success "环境配置完成"
}

# 构建和启动服务
deploy_services() {
    log_info "开始部署服务..."
    
    # 停止现有服务
    log_info "停止现有服务..."
    docker-compose down --remove-orphans
    
    # 构建镜像
    log_info "构建应用镜像..."
    docker-compose build --no-cache app
    
    # 启动服务
    log_info "启动服务..."
    docker-compose up -d
    
    log_success "服务部署完成"
}

# 等待服务启动
wait_for_services() {
    log_info "等待服务启动..."
    
    # 等待MySQL启动
    log_info "等待MySQL服务启动..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose exec -T mysql mysqladmin ping -h localhost --silent; then
            log_success "MySQL服务已启动"
            break
        fi
        sleep 2
        ((timeout-=2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "MySQL服务启动超时"
        return 1
    fi
    
    # 等待应用启动
    log_info "等待应用服务启动..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:3200/health > /dev/null; then
            log_success "应用服务已启动"
            break
        fi
        sleep 2
        ((timeout-=2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "应用服务启动超时"
        return 1
    fi
}

# 运行数据库迁移
run_migrations() {
    log_info "运行数据库迁移..."
    
    # 等待一下确保数据库完全就绪
    sleep 5
    
    # 运行迁移
    if docker-compose exec -T app npm run migrate; then
        log_success "数据库迁移完成"
    else
        log_warning "数据库迁移失败，可能是表已存在"
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查应用健康状态
    local health_response=$(curl -s http://localhost:3200/health)
    if echo "$health_response" | grep -q '"success":true'; then
        log_success "应用健康检查通过"
    else
        log_error "应用健康检查失败"
        echo "$health_response"
        return 1
    fi
    
    # 检查连接池状态
    local pool_response=$(curl -s http://localhost:3200/health/pool)
    if echo "$pool_response" | grep -q '"success":true'; then
        log_success "连接池健康检查通过"
    else
        log_warning "连接池健康检查失败"
        echo "$pool_response"
    fi
}

# 显示部署信息
show_deployment_info() {
    log_success "🎉 部署完成!"
    echo
    echo "=== 服务信息 ==="
    echo "应用地址: http://localhost:3200"
    echo "健康检查: http://localhost:3200/health"
    echo "连接池状态: http://localhost:3200/health/pool"
    echo "Nginx代理: http://localhost (如果启用)"
    echo
    echo "=== 管理命令 ==="
    echo "查看日志: docker-compose logs -f app"
    echo "查看状态: docker-compose ps"
    echo "停止服务: docker-compose down"
    echo "重启服务: docker-compose restart"
    echo
    echo "=== 数据库信息 ==="
    echo "MySQL端口: localhost:3306"
    echo "数据库名: lchy"
    echo "用户名: appuser"
    echo
}

# 主执行流程
main() {
    echo "🚀 App ROI Tracker Docker部署脚本"
    echo "=================================="
    
    check_dependencies
    setup_environment
    deploy_services
    wait_for_services
    run_migrations
    health_check
    show_deployment_info
    
    log_success "部署流程完成!"
}

# 错误处理
trap 'log_error "部署过程中发生错误"; exit 1' ERR

# 执行主流程
main "$@"