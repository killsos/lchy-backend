import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import logger from './utils/logger';
import fs from 'fs';
import { getConnectionPoolService } from './services/connectionPoolService';

const PORT = process.env.PORT || 3200;

// 导入数据库实例
console.log('正在加载数据库模型...');
import db from './models/index';
console.log('数据库模型加载完成');

// 初始化连接池服务（临时禁用监控）
console.log('正在初始化连接池服务...');
const poolService = getConnectionPoolService(db.sequelize);
// poolService.initializePoolMonitoring(); // 临时禁用
console.log('连接池服务初始化完成');

// 确保必要的目录存在并设置正确权限
const createDirectories = () => {
  const dirs = ['uploads', 'logs'];
  dirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
        logger.info(`创建目录: ${dir}`);
      }
      
      // 确保目录权限正确
      fs.chmodSync(dir, 0o755);
      
      // 测试写入权限
      const testFile = `${dir}/.write-test-${Date.now()}`;
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      logger.info(`目录权限检查通过: ${dir}`);
    } catch (error) {
      logger.error(`目录权限设置失败: ${dir}`, { 
        error: error instanceof Error ? error.message : error 
      });
      throw error;
    }
  });
};

const startServer = async () => {
  try {
    console.log('开始启动服务器...');
    logger.info('开始启动服务器...', {
      port: PORT,
      nodeEnv: process.env.NODE_ENV || 'development'
    });

    // 创建必要目录
    console.log('创建必要目录...');
    logger.info('创建必要目录...');
    createDirectories();
    
    // 测试数据库连接（带超时）
    console.log('测试数据库连接...');
    logger.info('测试数据库连接...');
    try {
      await Promise.race([
        db.sequelize.authenticate(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('数据库连接超时')), 10000)
        )
      ]);
      console.log('数据库连接测试成功');
      logger.info('数据库连接测试成功');
    } catch (error) {
      console.error('数据库连接失败:', error);
      logger.error('数据库连接失败', {
        error: error instanceof Error ? error.message : error
      });
      process.exit(1);
    }
    
    // 启动服务器
    console.log('启动HTTP服务器...');
    logger.info('启动HTTP服务器...');
    const server = app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`服务器启动成功 - 端口: ${PORT}`);
      logger.info(`服务器启动成功`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        url: `http://0.0.0.0:${PORT}`
      });
    });

    // 监听服务器错误
    server.on('error', (error: any) => {
      console.error('HTTP服务器错误:', error.message);
      logger.error('HTTP服务器错误', { error: error.message });
      process.exit(1);
    });
    
  } catch (error) {
    console.error('服务器启动失败:', error);
    logger.error('服务器启动失败', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
};

startServer();

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号，准备关闭服务器');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('收到SIGINT信号，准备关闭服务器');
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
