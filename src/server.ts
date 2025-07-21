import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import logger from './utils/logger';
import fs from 'fs';
import { getConnectionPoolService } from './services/connectionPoolService';

const PORT = process.env.PORT || 3200;

// 导入数据库实例
console.log('正在加载数据库模型...');
const db = require('./models/index.js');
console.log('数据库模型加载完成');
const poolService = getConnectionPoolService(db.sequelize);
console.log('连接池服务初始化完成');

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
    
    // 测试数据库连接（带重试机制）
    logger.info('测试数据库连接...');
    let isDbConnected = false;
    const maxRetries = 10;
    const retryDelay = 5000; // 5秒
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      logger.info(`数据库连接尝试 ${attempt}/${maxRetries}`);
      
      try {
        isDbConnected = await poolService.testConnection();
        if (isDbConnected) {
          logger.info('数据库连接测试成功');
          break;
        }
      } catch (error) {
        logger.warn(`连接尝试 ${attempt} 失败`, {
          error: error instanceof Error ? error.message : error
        });
      }
      
      if (attempt < maxRetries) {
        logger.info(`等待 ${retryDelay/1000} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    if (!isDbConnected) {
      logger.error('所有数据库连接尝试都失败，服务器启动中止');
      process.exit(1);
    }

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
