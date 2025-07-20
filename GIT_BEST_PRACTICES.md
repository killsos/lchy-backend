# Git 版本控制最佳实践

本文档说明了 App ROI 跟踪系统项目的 Git 版本控制最佳实践。

## 📁 文件管理策略

### ✅ 应该提交的文件

**源代码文件：**
- `src/` - 所有 TypeScript 源代码
- `package.json` & `package-lock.json` - 依赖管理
- `tsconfig.json` - TypeScript 配置

**配置文件：**
- `.env.example` - 环境变量模板（不含敏感信息）
- `docker/` - Docker 配置文件
- `Dockerfile*` & `docker-compose*.yml` - 容器化配置

**文档文件：**
- `README.md` - 项目说明
- `*.md` - 所有文档文件
- `API_DOCUMENTATION.md` - API 文档

**目录结构：**
- `logs/.gitkeep` - 确保日志目录存在
- `uploads/.gitkeep` - 确保上传目录存在

### ❌ 不应该提交的文件

**敏感信息：**
```
.env                    # 环境变量（含密码等敏感信息）
.env.production        # 生产环境配置
.env.local             # 本地环境配置
*.key, *.pem           # SSL 证书和私钥
secrets/               # 密钥目录
```

**构建产物：**
```
dist/                  # TypeScript 编译输出
build/                 # 构建目录
node_modules/          # npm 依赖包
*.tsbuildinfo         # TypeScript 增量构建信息
```

**日志和临时文件：**
```
logs/*.log            # 应用日志文件
uploads/*             # 用户上传的文件
tmp/, temp/           # 临时目录
*.tmp                 # 临时文件
```

**开发工具文件：**
```
.vscode/              # VSCode 配置
.idea/                # IntelliJ IDEA 配置
.DS_Store             # macOS 系统文件
Thumbs.db             # Windows 缩略图
```

## 🔧 Git 配置建议

### 初始化项目

```bash
# 克隆项目
git clone <repository-url>
cd project-lchy/be

# 设置用户信息
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 创建环境配置
cp .env.example .env
# 编辑 .env 文件，填入实际配置
```

### 分支管理策略

**主要分支：**
- `main/master` - 生产环境代码
- `develop` - 开发环境代码
- `staging` - 预发布环境代码

**功能分支：**
```bash
# 创建功能分支
git checkout -b feature/add-new-api develop

# 完成功能后合并
git checkout develop
git merge feature/add-new-api
git branch -d feature/add-new-api
```

**修复分支：**
```bash
# 从 main 创建修复分支
git checkout -b hotfix/fix-critical-bug main

# 修复完成后合并到 main 和 develop
git checkout main
git merge hotfix/fix-critical-bug
git checkout develop
git merge hotfix/fix-critical-bug
git branch -d hotfix/fix-critical-bug
```

## 📝 提交消息规范

### 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)：**
- `feat` - 新功能
- `fix` - 修复 bug
- `docs` - 文档更新
- `style` - 代码格式调整
- `refactor` - 重构代码
- `test` - 添加或修改测试
- `chore` - 构建过程或辅助工具的变动
- `perf` - 性能优化
- `ci` - CI/CD 相关

**范围 (scope)：**
- `api` - API 相关
- `auth` - 认证相关
- `db` - 数据库相关
- `docker` - Docker 相关
- `config` - 配置相关

**示例：**
```bash
feat(api): add ROI data filtering endpoint

- Add new API endpoint for filtering ROI data by date range
- Implement query validation and error handling
- Add unit tests for the new functionality

Closes #123
```

### 常用提交命令

```bash
# 查看状态
git status

# 添加文件
git add .                # 添加所有文件
git add src/             # 添加特定目录
git add package.json     # 添加特定文件

# 提交更改
git commit -m "feat(api): add new endpoint"

# 查看提交历史
git log --oneline
git log --graph --oneline --all

# 推送到远程
git push origin feature/branch-name
```

## 🔒 安全最佳实践

### 1. 敏感信息处理

**永远不要提交：**
- 数据库密码
- API 密钥
- SSL 证书私钥
- 第三方服务令牌

**使用环境变量：**
```bash
# .env.example (可以提交)
DB_PASSWORD=your_password_here
API_KEY=your_api_key_here

# .env (不要提交)
DB_PASSWORD=actual_production_password
API_KEY=actual_api_key
```

### 2. 意外提交敏感信息的处理

如果不小心提交了敏感信息：

```bash
# 从暂存区移除文件
git reset HEAD .env

# 从历史中完全移除文件
git filter-branch --index-filter 'git rm --cached --ignore-unmatch .env' HEAD

# 强制推送（谨慎使用）
git push --force-with-lease
```

### 3. 预提交检查

创建 pre-commit hook：

```bash
# .git/hooks/pre-commit
#!/bin/sh
# 检查是否包含敏感信息
if git diff --cached --name-only | grep -q "\.env$"; then
    echo "Error: .env file should not be committed"
    exit 1
fi

# 运行测试
npm test
```

## 📋 工作流程示例

### 日常开发流程

```bash
# 1. 更新本地代码
git checkout develop
git pull origin develop

# 2. 创建功能分支
git checkout -b feature/improve-connection-pool

# 3. 开发和测试
# ... 编写代码 ...
npm test
npm run build

# 4. 提交更改
git add .
git commit -m "feat(db): improve connection pool performance"

# 5. 推送分支
git push origin feature/improve-connection-pool

# 6. 创建 Pull Request
# 通过 GitHub/GitLab 界面创建 PR

# 7. 合并后清理
git checkout develop
git pull origin develop
git branch -d feature/improve-connection-pool
```

### 发布流程

```bash
# 1. 从 develop 创建 release 分支
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. 更新版本号
npm version patch  # 或 minor, major

# 3. 构建和测试
npm run build
npm test

# 4. 合并到 main
git checkout main
git merge release/v1.2.0

# 5. 创建标签
git tag -a v1.2.0 -m "Release version 1.2.0"

# 6. 推送
git push origin main
git push origin --tags

# 7. 合并回 develop
git checkout develop
git merge release/v1.2.0
git push origin develop

# 8. 清理分支
git branch -d release/v1.2.0
```

## 🔍 常用 Git 命令

### 查看和比较

```bash
# 查看文件更改
git diff                    # 工作区 vs 暂存区
git diff --cached          # 暂存区 vs 最新提交
git diff HEAD              # 工作区 vs 最新提交
git diff main..develop     # 比较分支差异

# 查看提交历史
git log --oneline          # 简洁格式
git log --graph            # 图形化显示
git log --author="name"    # 特定作者的提交
git log --since="2 weeks"  # 时间范围
```

### 撤销和修改

```bash
# 撤销工作区更改
git checkout -- file.txt

# 撤销暂存区更改
git reset HEAD file.txt

# 修改最后一次提交
git commit --amend

# 回退到特定提交
git reset --hard commit-hash
```

### 分支操作

```bash
# 分支管理
git branch                 # 查看本地分支
git branch -r             # 查看远程分支
git branch -a             # 查看所有分支
git branch -d branch-name # 删除分支

# 远程分支操作
git fetch origin          # 获取远程更新
git push origin --delete branch-name  # 删除远程分支
```

## 🚨 故障排除

### 常见问题和解决方案

1. **合并冲突**：
```bash
# 解决冲突后
git add .
git commit -m "resolve merge conflict"
```

2. **误删除分支**：
```bash
# 查找分支
git reflog
# 恢复分支
git checkout -b recovered-branch commit-hash
```

3. **撤销推送**：
```bash
# 撤销最后一次推送（谨慎使用）
git reset --hard HEAD~1
git push --force-with-lease
```

---

遵循这些最佳实践可以确保项目的版本控制清晰、安全且易于维护。