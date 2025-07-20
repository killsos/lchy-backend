import { Sequelize } from 'sequelize';
import logger from '../utils/logger';

export class ConnectionPoolService {
    private sequelize: Sequelize;
    private poolMonitorInterval?: NodeJS.Timeout;

    constructor(sequelize: Sequelize) {
        this.sequelize = sequelize;
    }

    /**
     * 初始化连接池监控
     */
    public initializePoolMonitoring(): void {
        // 监听连接池事件
        this.setupPoolEventListeners();
        
        // 启动定期监控
        this.startPoolMonitoring();
        
        logger.info('数据库连接池监控已启动');
    }

    /**
     * 设置连接池事件监听器
     */
    private setupPoolEventListeners(): void {
        try {
            const connectionManager = this.sequelize.connectionManager as any;
            const pool = connectionManager.pool;
            
            if (pool && typeof pool.on === 'function') {
                // 监听连接创建事件
                pool.on('createRequest', () => {
                    logger.debug('连接池: 请求创建新连接');
                });

                // 监听连接创建成功事件
                pool.on('createSuccess', () => {
                    logger.debug('连接池: 成功创建新连接');
                });

                // 监听连接创建失败事件
                pool.on('createFail', (err: Error) => {
                    logger.error('连接池: 创建连接失败', { error: err.message });
                });

                // 监听连接销毁事件
                pool.on('destroyRequest', () => {
                    logger.debug('连接池: 请求销毁连接');
                });

                // 监听连接销毁成功事件
                pool.on('destroySuccess', () => {
                    logger.debug('连接池: 成功销毁连接');
                });

                // 监听连接销毁失败事件
                pool.on('destroyFail', (err: Error) => {
                    logger.error('连接池: 销毁连接失败', { error: err.message });
                });
            } else {
                logger.info('连接池事件监听器不可用，跳过事件监听设置');
            }
        } catch (error) {
            logger.warn('设置连接池事件监听器失败', {
                error: error instanceof Error ? error.message : error
            });
        }
    }

    /**
     * 启动连接池定期监控
     */
    private startPoolMonitoring(): void {
        // 每30秒检查一次连接池状态
        this.poolMonitorInterval = setInterval(() => {
            this.logPoolStats();
        }, 30000);
    }

    /**
     * 获取连接池统计信息
     */
    public getPoolStats(): {
        size: number;
        available: number;
        using: number;
        waiting: number;
        max: number;
        min: number;
    } {
        try {
            const connectionManager = this.sequelize.connectionManager as any;
            const pool = connectionManager.pool;
            
            if (!pool) {
                // 如果没有连接池，返回配置信息
                const config = this.sequelize.config as any;
                return {
                    size: 0,
                    available: 0,
                    using: 0,
                    waiting: 0,
                    max: config?.pool?.max || 10,
                    min: config?.pool?.min || 0
                };
            }

            return {
                size: pool.size || 0,
                available: pool.available || 0,
                using: pool.using || 0,
                waiting: pool.waiting || 0,
                max: pool.max || 10,
                min: pool.min || 0
            };
        } catch (error) {
            logger.warn('获取连接池统计信息失败', {
                error: error instanceof Error ? error.message : error
            });
            return {
                size: 0,
                available: 0,
                using: 0,
                waiting: 0,
                max: 0,
                min: 0
            };
        }
    }

    /**
     * 记录连接池统计信息
     */
    private logPoolStats(): void {
        const stats = this.getPoolStats();
        
        logger.info('连接池状态', {
            总连接数: stats.size,
            可用连接: stats.available,
            使用中连接: stats.using,
            等待连接: stats.waiting,
            最大连接数: stats.max,
            最小连接数: stats.min,
            连接池利用率: `${((stats.using / stats.max) * 100).toFixed(2)}%`
        });

        // 检查连接池健康状态
        this.checkPoolHealth(stats);
    }

    /**
     * 检查连接池健康状态
     */
    private checkPoolHealth(stats: ReturnType<typeof this.getPoolStats>): void {
        // 检查连接池是否接近满载
        if (stats.using / stats.max > 0.8) {
            logger.warn('连接池使用率过高', {
                使用率: `${((stats.using / stats.max) * 100).toFixed(2)}%`,
                建议: '考虑增加最大连接数或优化查询性能'
            });
        }

        // 检查是否有等待连接的请求
        if (stats.waiting > 0) {
            logger.warn('连接池有等待请求', {
                等待数量: stats.waiting,
                建议: '检查数据库性能或增加连接池大小'
            });
        }

        // 检查连接数是否异常低
        if (stats.size < stats.min) {
            logger.warn('连接池连接数低于最小值', {
                当前连接数: stats.size,
                最小连接数: stats.min
            });
        }
    }

    /**
     * 测试数据库连接
     */
    public async testConnection(): Promise<boolean> {
        try {
            await this.sequelize.authenticate();
            logger.info('数据库连接测试成功');
            return true;
        } catch (error) {
            logger.error('数据库连接测试失败', {
                error: error instanceof Error ? error.message : error
            });
            return false;
        }
    }

    /**
     * 优雅关闭连接池
     */
    public async gracefulShutdown(): Promise<void> {
        try {
            // 停止监控
            if (this.poolMonitorInterval) {
                clearInterval(this.poolMonitorInterval);
                this.poolMonitorInterval = undefined;
            }

            // 关闭所有连接
            await this.sequelize.close();
            logger.info('数据库连接池已优雅关闭');
        } catch (error) {
            logger.error('关闭连接池时发生错误', {
                error: error instanceof Error ? error.message : error
            });
        }
    }

    /**
     * 强制释放空闲连接
     */
    public async releaseIdleConnections(): Promise<void> {
        try {
            const connectionManager = this.sequelize.connectionManager as any;
            const pool = connectionManager.pool;
            
            if (pool && typeof pool.clear === 'function') {
                await pool.clear();
                logger.info('已释放所有空闲连接');
            } else {
                logger.info('连接池不支持手动清理操作');
            }
        } catch (error) {
            logger.error('释放空闲连接时发生错误', {
                error: error instanceof Error ? error.message : error
            });
        }
    }

    /**
     * 获取连接池健康检查信息
     */
    public async getHealthCheck(): Promise<{
        status: 'healthy' | 'warning' | 'error';
        stats: {
            size: number;
            available: number;
            using: number;
            waiting: number;
            max: number;
            min: number;
        };
        connectionTest: boolean;
        timestamp: Date;
    }> {
        const stats = this.getPoolStats();
        const connectionTest = await this.testConnection();
        
        let status: 'healthy' | 'warning' | 'error' = 'healthy';
        
        if (!connectionTest) {
            status = 'error';
        } else if (stats.using / stats.max > 0.8 || stats.waiting > 0) {
            status = 'warning';
        }

        return {
            status,
            stats,
            connectionTest,
            timestamp: new Date()
        };
    }

    /**
     * 停止连接池监控
     */
    public stopPoolMonitoring(): void {
        if (this.poolMonitorInterval) {
            clearInterval(this.poolMonitorInterval);
            this.poolMonitorInterval = undefined;
            logger.info('连接池监控已停止');
        }
    }
}

// 导出单例实例
let poolServiceInstance: ConnectionPoolService | null = null;

export const getConnectionPoolService = (sequelize: Sequelize): ConnectionPoolService => {
    if (!poolServiceInstance) {
        poolServiceInstance = new ConnectionPoolService(sequelize);
    }
    return poolServiceInstance;
};

export default ConnectionPoolService;