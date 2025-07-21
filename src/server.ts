import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import logger from './utils/logger';
import fs from 'fs';
import { getConnectionPoolService } from './services/connectionPoolService';

const PORT = process.env.PORT || 3200;

// 导入数据库实例
const db = require('./models/index.js');
const poolService = getConnectionPoolService(db.sequelize);

// 确保必要的目录存在
const createDirectories = () => {
  const dirs = ['uploads', 'logs'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`创建目录: ${dir}`);
    }
  });
};

(async () => {
  try {
    logger.info('开始启动服务器...', {
      port: PORT,
      nodeEnv: process.env.NODE_ENV || 'development'
    });

    // 创建必要目录
    logger.info('创建必要目录...');
    createDirectories();
    
    // 测试数据库连接
    logger.info('测试数据库连接...');
    const isDbConnected = await poolService.testConnection();
    if (!isDbConnected) {
      logger.error('数据库连接失败，服务器启动中止');
      process.exit(1);
    }
    logger.info('数据库连接测试成功');

    // 初始化连接池监控
    logger.info('初始化连接池监控...');
    poolService.initializePoolMonitoring();
    
    // 启动服务器
    logger.info('启动HTTP服务器...');
    const server = app.listen(PORT, () => {
      logger.info(`服务器启动成功`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        url: `http://localhost:${PORT}`,
        connectionPool: poolService.getPoolStats()
      });
    });

    // 监听服务器错误
    server.on('error', (error: any) => {
      logger.error('HTTP服务器错误', { error: error.message });
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('服务器启动失败', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
})();

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号，准备关闭服务器');
  await poolService.gracefulShutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('收到SIGINT信号，准备关闭服务器');
  await poolService.gracefulShutdown();
  process.exit(0);
});

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', { reason, promise });
  process.exit(1);
});
