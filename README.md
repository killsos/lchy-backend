# App ROI Tracker 后端服务

一个基于 Node.js + TypeScript + MySQL 的应用ROI数据追踪系统，提供CSV数据导入、数据筛选和图表展示功能。

## 📋 项目概述

### 主要功能
- 📊 CSV文件上传和数据解析
- 🔍 多维度数据筛选（应用名称、国家、出价类型、日期）
- 📈 ROI数据图表展示（1日、3日、7日、14日、30日、60日、90日ROI）
- 🔄 数据批量导入和去重处理
- 🌐 RESTful API接口
- 🐳 Docker容器化部署
- 📝 完整的日志记录和监控

### 技术栈
- **后端框架**: Node.js + Express.js
- **编程语言**: TypeScript
- **数据库**: MySQL 8.0
- **ORM**: Sequelize
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **日志**: Winston
- **文件上传**: Multer
- **数据解析**: csv-parse

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Docker & Docker Compose
- MySQL 8.0+ (如果本地开发)

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd be
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接信息
```

4. **启动MySQL数据库**
```bash
# 使用Docker启动MySQL
docker compose up -d mysql
```

5. **运行数据库迁移**
```bash
npm run migrate
```

6. **启动开发服务器**
```bash
npm run dev
```

服务将在 `http://localhost:3200` 启动

### 生产环境部署

#### 方法一：使用自动化部署脚本（推荐）

1. **配置生产环境变量**
```bash
cp .env.server .env
# 编辑 .env 文件，配置生产环境参数
```

2. **一键部署**
```bash
# 首次部署（构建镜像 + 运行迁移）
./deploy-prod.sh --build --migrate

# 带备份的完整部署
./deploy-prod.sh --backup --build --migrate --force
```

#### 方法二：手动部署

1. **配置环境变量**
```bash
cp .env.server .env
nano .env  # 修改为生产环境配置
```

2. **启动服务**
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

3. **运行数据库迁移**
```bash
docker compose -f docker-compose.prod.yml exec app npm run migrate
```

## 📁 项目结构

```
be/
├── src/                          # 源代码目录
│   ├── controllers/              # 控制器层
│   │   ├── filters.controller.ts # 筛选器接口
│   │   ├── health.controller.ts  # 健康检查
│   │   └── uploadCsv.controller.ts # CSV上传处理
│   ├── models/                   # 数据模型
│   │   ├── index.ts             # 模型初始化
│   │   └── appRoiData.model.ts  # AppRoiData模型定义
│   ├── routes/                   # 路由定义
│   │   ├── api.routes.ts        # API路由
│   │   ├── health.routes.ts     # 健康检查路由
│   │   ├── index.ts             # 主路由
│   │   └── upload.routes.ts     # 上传路由
│   ├── services/                 # 业务逻辑层
│   │   ├── appRoiDataService.ts # 数据服务
│   │   ├── connectionPoolService.ts # 连接池服务
│   │   └── csvService.ts        # CSV处理服务
│   ├── types/                    # TypeScript类型定义
│   │   └── appRoi.types.ts      # 数据类型
│   ├── utils/                    # 工具函数
│   │   └── logger.ts            # 日志工具
│   ├── config/                   # 配置文件
│   │   └── config.ts            # 数据库配置
│   ├── migrations/               # 数据库迁移
│   └── views/                    # 视图文件
├── docker/                       # Docker配置
│   ├── nginx/                   # Nginx配置
│   └── mysql/                   # MySQL初始化脚本
├── dist/                        # 编译输出目录
├── logs/                        # 日志文件
├── uploads/                     # 上传文件存储
├── docker-compose.yml           # 开发环境容器编排
├── docker-compose.prod.yml      # 生产环境容器编排
├── Dockerfile                   # Docker镜像构建
├── deploy-prod.sh              # 生产环境部署脚本
└── package.json                # 项目依赖配置
```

## 🔧 配置说明

### 环境变量配置

#### 开发环境 (.env)
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3307
DB_USERNAME=appuser
DB_PASSWORD=apppassword123
DB_NAME=lchy

# 应用端口
PORT=3200

# 日志级别
LOG_LEVEL=debug
```

#### 生产环境 (.env.server)
```env
# 数据库配置 - 请使用强密码
DB_ROOT_PASSWORD=your_secure_root_password
DB_USERNAME=app_user_prod
DB_PASSWORD=your_secure_db_password
DB_NAME=lchy_prod

# 应用端口
APP_PORT=3200

# 连接池配置
DB_POOL_MAX=30
DB_POOL_MIN=10

# 安全配置
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# 日志级别
LOG_LEVEL=warn
```

### Docker配置

项目提供了多个Docker配置文件：

- `docker-compose.yml` - 开发环境
- `docker-compose.prod.yml` - 生产环境
- `docker-compose.dev.yml` - 开发环境（带热重载）

## 🛠 NPM 脚本

```bash
# 开发
npm run dev              # 启动开发服务器
npm run dev:watch        # 启动开发服务器（热重载）
npm run dev:debug        # 启动调试模式

# 构建
npm run build            # 编译TypeScript
npm run start            # 启动生产服务器

# 数据库
npm run migrate          # 运行数据库迁移
npm run migrate:undo     # 撤销迁移
npm run db:create        # 创建数据库
npm run db:drop          # 删除数据库

# 代码质量
npm run lint             # 代码检查
npm run lint:fix         # 自动修复代码问题

# 测试
npm run test             # 运行测试
npm run test:watch       # 监听模式运行测试
npm run test:coverage    # 运行测试并生成覆盖率报告
```

## 📡 API 接口

### 健康检查
```http
GET /health
```

### 数据筛选器
```http
# 获取所有筛选器选项
GET /api/filters

# 根据应用名称获取筛选器
GET /api/filters/:appName

# 获取日期列表
GET /api/dates?appName=xxx&country=xxx
```

### 数据上传
```http
# 上传CSV文件
POST /upload/csv
Content-Type: multipart/form-data

# 获取上传页面
GET /upload
```

### 图表数据
```http
# 获取图表数据
GET /api/chart-data?appName=xxx&country=xxx
```

## 🔍 数据库设计

### AppRoiData 表结构

| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | INTEGER | 主键 |
| date | DATEONLY | 日期 |
| app_name | STRING(50) | 应用名称 |
| bid_type | STRING(10) | 出价类型 |
| country | STRING(50) | 国家地区 |
| install_count | INTEGER | 安装次数 |
| roi_1d | DECIMAL(10,2) | 1日ROI |
| roi_3d | DECIMAL(10,2) | 3日ROI |
| roi_7d | DECIMAL(10,2) | 7日ROI |
| roi_14d | DECIMAL(10,2) | 14日ROI |
| roi_30d | DECIMAL(10,2) | 30日ROI |
| roi_60d | DECIMAL(10,2) | 60日ROI |
| roi_90d | DECIMAL(10,2) | 90日ROI |
| roi_current | DECIMAL(10,2) | 当日ROI |
| createdAt | DATE | 创建时间 |
| updatedAt | DATE | 更新时间 |

## 📊 监控和日志

### 日志级别
- `error` - 错误信息
- `warn` - 警告信息
- `info` - 一般信息
- `debug` - 调试信息

### 日志文件
- `logs/combined.log` - 所有日志
- `logs/error.log` - 错误日志

### 健康检查端点
- `GET /health` - 应用健康状态
- 数据库连接检查
- 内存使用情况

## 🚀 部署脚本使用

### deploy-prod.sh 参数

```bash
# 显示帮助
./deploy-prod.sh --help

# 构建镜像并运行迁移
./deploy-prod.sh --build --migrate

# 备份数据库并强制重新部署
./deploy-prod.sh --backup --force

# 仅更新应用（不重新构建）
./deploy-prod.sh --migrate
```

## 🔒 安全考虑

### 生产环境安全配置

1. **数据库安全**
   - 使用强密码
   - 限制数据库访问IP
   - 定期备份数据

2. **应用安全**
   - 设置CORS白名单
   - 使用HTTPS
   - 限制文件上传大小

3. **容器安全**
   - 使用非root用户运行
   - 定期更新基础镜像
   - 限制容器资源使用

## 📚 故障排除

### 常见问题

1. **数据库连接失败**
```bash
# 检查数据库状态
docker compose logs mysql

# 测试连接
docker compose exec mysql mysql -u appuser -papppassword123 lchy -e "SELECT 1;"
```

2. **应用启动失败**
```bash
# 查看应用日志
docker compose logs app

# 进入容器调试
docker compose exec app sh
```

3. **端口占用**
```bash
# 检查端口使用
netstat -tlnp | grep 3200
lsof -i :3200
```

### 性能优化

1. **数据库优化**
   - 适当调整连接池大小
   - 添加必要的数据库索引
   - 定期清理老数据

2. **应用优化**
   - 使用Redis缓存热点数据
   - 实现分页查询
   - 优化SQL查询

## 📞 支持

如遇到问题，请：

1. 查看应用日志：`docker compose logs -f app`
2. 检查健康状态：访问 `/health` 端点
3. 检查系统资源：`docker stats` 和 `df -h`

## 📄 许可证

MIT License

---

**⚠️ 重要提醒：**
- 生产环境请使用强密码
- 定期备份数据库和重要文件
- 监控服务器资源使用情况
- 保持Docker和系统更新