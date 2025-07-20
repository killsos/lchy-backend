# App ROI Tracker - API 接口文档

## 概述
App ROI 数据跟踪系统的后端 API 接口文档，基于 Node.js + TypeScript + Express.js + MySQL + Sequelize 构建。

## 基础信息
- **Base URL**: `http://localhost:3200`
- **API 前缀**: `/api`
- **数据格式**: JSON
- **字符编码**: UTF-8

---

## 数据模型

### AppRoiData 表结构
```typescript
interface AppRoiData {
  id: number;                    // 主键（自增）
  date: string;                  // 日期 (YYYY-MM-DD)
  app_name: string;              // 应用名称 (最大50字符)
  bid_type: string;              // 出价类型 (最大10字符)
  country: string;               // 国家地区 (最大50字符)
  install_count: number;         // 安装次数
  roi_current?: number;          // 当日ROI (精度10,2)
  roi_1d?: number;              // 1日ROI (精度10,2)
  roi_3d?: number;              // 3日ROI (精度10,2)
  roi_7d?: number;              // 7日ROI (精度10,2)
  roi_14d?: number;             // 14日ROI (精度10,2)
  roi_30d?: number;             // 30日ROI (精度10,2)
  roi_60d?: number;             // 60日ROI (精度10,2)
  roi_90d?: number;             // 90日ROI (精度10,2)
  createdAt: Date;              // 创建时间
  updatedAt: Date;              // 更新时间
}
```

---

## API 接口

### 1. 健康检查

#### `GET /`
获取系统状态

**响应示例:**
```json
{
  "message": "Hello world"
}
```

---

### 2. 文件上传

#### `GET /upload`
获取 CSV 文件上传页面

**响应**: HTML 上传页面

#### `POST /upload/csv`
上传并处理 CSV 文件

**请求参数:**
- `file`: CSV 文件 (multipart/form-data)

**文件限制:**
- 格式: 仅支持 .csv 文件
- 大小: 最大 5MB
- MIME 类型: text/csv

**CSV 文件格式要求:**
```csv
date,app_name,bid_type,country,install_count,roi_1d,roi_3d,roi_7d,roi_14d,roi_30d,roi_60d,roi_90d,roi_current
2024-01-01,TestApp,CPC,US,100,1.5,2.0,2.5,3.0,3.5,4.0,4.5,1.2
```

**成功响应:**
```json
{
  "success": true,
  "message": "CSV文件解析并插入数据库成功",
  "details": {
    "csvRecords": 1000,
    "insertedRecords": 950,
    "totalRecords": 1000
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息"
}
```

**可能的错误状态码:**
- `400`: 文件格式错误、未上传文件、文件过大
- `500`: 数据库连接失败、CSV解析失败、数据插入失败

---

### 3. 筛选器数据

#### `GET /api/filters`
获取所有可用的筛选器选项

**功能描述:**
- 获取所有唯一的 app_name 值（无重复）
- 当 app_name 数据存在时，选择第一个 app_name 作为条件
- 查询该 app_name 对应的所有唯一 country 值（无重复）
- 查询该 app_name 对应的所有唯一 bid_type 值（无重复）
- 使用 Sequelize 参数化查询防止 SQL 注入

**响应示例:**
```json
{
  "success": true,
  "message": "获取筛选器数据成功",
  "data": {
    "app_names": [
      "App-1",
      "App-2", 
      "App-3"
    ],
    "countries": [
      "美国",
      "英国"
    ],
    "bid_types": [
      "CPI"
    ]
  }
}
```

**数据为空时的响应:**
```json
{
  "success": true,
  "message": "获取筛选器数据成功",
  "data": {
    "app_names": []
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "message": "获取筛选器数据失败",
  "error": "数据库连接失败"
}
```

**技术实现:**
- 使用 Sequelize 原生 SQL 查询
- 执行 `SELECT DISTINCT` 去重查询
- `Promise.all()` 并行执行提升性能
- 自动过滤空值和 NULL 值
- 按字母顺序升序排列

---

## 错误处理

### 通用错误格式
```json
{
  "success": false,
  "message": "错误描述",
  "error": "具体错误信息",
  "details": "详细错误信息（可选）"
}
```

### HTTP 状态码
- `200`: 请求成功
- `400`: 客户端请求错误
- `413`: 文件大小超出限制
- `500`: 服务器内部错误
- `502`: 网关错误
- `503`: 服务不可用
- `504`: 请求超时

---

## 开发信息

### 环境配置
```bash
# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 启动生产服务器
npm start
```

### 数据库迁移
```bash
# 创建数据库
npm run db:create

# 运行迁移
npm run migrate

# 生成新迁移
npm run generate:migration -- migration-name
```

### 日志系统
- 使用 Winston 日志库
- 开发环境: 控制台输出
- 生产环境: 文件日志
- 日志级别: error, warn, info, debug

### 环境变量
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=lchy

# 应用配置
NODE_ENV=development
PORT=3200
LOG_LEVEL=debug

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# CORS 配置
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

---

## 更新日志

### v1.0.0 (当前版本)
- ✅ 基础项目架构
- ✅ CSV 文件上传和解析
- ✅ 数据库存储和管理
- ✅ 筛选器数据接口
- ✅ 专业日志系统
- ✅ 完善错误处理
- ✅ TypeScript 类型安全
- ✅ 环境变量配置
- ✅ 事务支持
- ✅ CORS 和安全中间件

### 待实现功能
- 🔄 数据查询和分析接口
- 🔄 数据导出功能
- 🔄 数据可视化支持
- 🔄 API 认证和授权
- 🔄 接口缓存机制
- 🔄 API 限流保护

---

*文档最后更新: 2025-07-19*