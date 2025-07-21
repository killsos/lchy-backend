import { Request, Response } from 'express';
import { getConnectionPoolService } from '../services/connectionPoolService';
import logger from '../utils/logger';

// 导入数据库实例
import db from '../models/index';
const poolService = getConnectionPoolService(db.sequelize);

/**
 * 基本健康检查
 */
export const healthCheck = async (_req: Request, res: Response) => {
  try {
    const healthData = await poolService.getHealthCheck();
    
    const responseCode = healthData.status === 'error' ? 503 : 200;
    
    res.status(responseCode).json({
      success: healthData.status !== 'error',
      status: healthData.status,
      timestamp: healthData.timestamp,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: healthData.connectionTest,
        pool: healthData.stats
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      }
    });
    
  } catch (error) {
    logger.error('健康检查失败', {
      error: error instanceof Error ? error.message : error
    });
    
    res.status(503).json({
      success: false,
      status: 'error',
      timestamp: new Date(),
      error: '健康检查失败'
    });
  }
};

/**
 * 连接池详细状态检查
 */
export const connectionPoolStatus = async (_req: Request, res: Response) => {
  try {
    const poolStats = poolService.getPoolStats();
    const connectionTest = await poolService.testConnection();
    
    // 计算连接池利用率
    const utilizationRate = poolStats.max > 0 ? (poolStats.using / poolStats.max) * 100 : 0;
    
    // 确定状态
    let status = 'healthy';
    let recommendations: string[] = [];
    
    if (!connectionTest) {
      status = 'error';
      recommendations.push('数据库连接失败，请检查数据库服务');
    } else if (utilizationRate > 80) {
      status = 'warning';
      recommendations.push('连接池使用率过高，考虑增加最大连接数');
    }
    
    if (poolStats.waiting > 0) {
      status = status === 'error' ? 'error' : 'warning';
      recommendations.push('有连接请求在等待，检查查询性能或增加连接池大小');
    }
    
    if (poolStats.size < poolStats.min) {
      status = status === 'error' ? 'error' : 'warning';
      recommendations.push('当前连接数低于最小值，检查连接池配置');
    }
    
    res.status(status === 'error' ? 503 : 200).json({
      success: status !== 'error',
      status,
      timestamp: new Date(),
      connectionPool: {
        stats: poolStats,
        utilizationRate: `${utilizationRate.toFixed(2)}%`,
        connected: connectionTest,
        configuration: {
          max: poolStats.max,
          min: poolStats.min,
          acquire: process.env.DB_POOL_ACQUIRE || '30000',
          idle: process.env.DB_POOL_IDLE || '10000'
        }
      },
      recommendations: recommendations.length > 0 ? recommendations : ['连接池状态正常']
    });
    
  } catch (error) {
    logger.error('连接池状态检查失败', {
      error: error instanceof Error ? error.message : error
    });
    
    res.status(503).json({
      success: false,
      status: 'error',
      timestamp: new Date(),
      error: '连接池状态检查失败'
    });
  }
};

/**
 * 强制释放空闲连接
 */
export const releaseIdleConnections = async (_req: Request, res: Response) => {
  try {
    await poolService.releaseIdleConnections();
    const newStats = poolService.getPoolStats();
    
    res.status(200).json({
      success: true,
      message: '空闲连接已释放',
      timestamp: new Date(),
      poolStats: newStats
    });
    
  } catch (error) {
    logger.error('释放空闲连接失败', {
      error: error instanceof Error ? error.message : error
    });
    
    res.status(500).json({
      success: false,
      error: '释放空闲连接失败',
      timestamp: new Date()
    });
  }
};