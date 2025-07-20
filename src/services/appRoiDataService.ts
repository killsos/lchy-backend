import logger from '../utils/logger';
import { DataInsertResult, CsvRowData, ProcessedRowData, AppRoiData as AppRoiDataType } from '../types/appRoi.types';
import { Sequelize, where} from 'sequelize';

// 使用 require 导入数据库模型
const db = require('../models/index.js');
const AppRoiData = db.AppRoiData;

export class AppRoiDataService {
    /**
     * 测试数据库连接
     * @returns Promise<boolean>
     */
    static async testConnection(): Promise<boolean> {
        try {
            await db.sequelize.authenticate();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 将CSV解析的数据批量插入到AppRoiData表
     * @param csvData CSV解析后的数据数组
     * @returns Promise<DataInsertResult>
     */
    static async insertCsvData(csvData: CsvRowData[]): Promise<DataInsertResult> {
        try {
            // 首先测试数据库连接
            const isConnected = await this.testConnection();
            if (!isConnected) {
                return {
                    success: false,
                    error: '数据库连接失败'
                };
            }

            if (!csvData || csvData.length === 0) {
                return {
                    success: false,
                    error: '没有数据需要插入'
                };
            }
            // 'csvData', csvData)

            // 数据预处理和验证
            const processedData: ProcessedRowData[] = csvData.map((row) => {
                // 处理数值字段，如果为空则设为0
                const processNumericValue = (value: string | undefined): number => {
                    if (!value || value.trim() === '') {
                        return 0;
                    }
                    const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
                    return isNaN(numValue) ? 0 : numValue;
                };

                return {
                    date: row[0] || '',
                    app_name: row[1] || '',
                    bid_type: row[2] || '',
                    country: row[3] || '',
                    install_count: row[4] || '0',
                    roi_1d: processNumericValue(row[5]),
                    roi_3d: processNumericValue(row[6]),
                    roi_7d: processNumericValue(row[7]),
                    roi_14d: processNumericValue(row[8]),
                    roi_30d: processNumericValue(row[9]),
                    roi_60d: processNumericValue(row[10]),
                    roi_90d: processNumericValue(row[11]),
                    roi_current: processNumericValue(row[12]),
                };
            });

            logger.info('处理后的数据示例', { sampleData: processedData[0] });
            // 过滤有效数据
            const validData = processedData.filter(data => this.validateRowData(data));
            
            if (validData.length === 0) {
                return {
                    success: false,
                    error: '没有有效的数据可以插入'
                };
            }

            // 使用事务批量插入数据
            const transaction = await db.sequelize.transaction();
            
            try {
                const result = await AppRoiData.bulkCreate(validData, {
                    transaction,
                    ignoreDuplicates: true, // 忽略重复数据
                    validate: true // 验证数据
                });
                
                await transaction.commit();
                
                logger.info('数据批量插入成功', {
                    totalRows: csvData.length,
                    validRows: validData.length,
                    insertedRows: result.length
                });

                return {
                    success: true,
                    insertedCount: result.length,
                    details: {
                        totalRecords: csvData.length,
                        validRecords: validData.length,
                        insertedRecords: result.length
                    }
                };
                
            } catch (insertError) {
                await transaction.rollback();
                logger.error('数据库插入失败，事务已回滚', { 
                    error: insertError instanceof Error ? insertError.message : insertError 
                });
                throw insertError;
            }

        } catch (error) {
            logger.error('数据库操作失败', { error: error instanceof Error ? error.message : error });
            return {
                success: false,
                error: '数据库操作失败',
                details: error instanceof Error ? error.message : '未知错误'
            };
        }
    }

    /**
     * 处理单行数据，确保字段类型正确
     * @param row 原始行数据
     * @returns 处理后的数据对象
     */
    /**
     * 数据验证
     * @param data 待验证的数据
     * @returns boolean
     */
    private static validateRowData(data: ProcessedRowData): boolean {
        return !!(data.date && data.app_name && data.bid_type && data.country);
    }

    /**
     * 获取所有AppRoiData记录
     * @returns Promise<any[]>
     */
    static async getAllData(): Promise<AppRoiDataType[]> {
        try {
            return await AppRoiData.findAll({
                order: [['date', 'DESC']]
            });
        } catch (error) {
            logger.error('获取数据失败', { error: error instanceof Error ? error.message : error });
            throw error;
        }
    }

    /**
     * 获取所有唯一的app_name值 - 使用Sequelize.fn
     * @returns Promise<string[]>
     */
    static async getUniqueAppNames(): Promise<string[]> {
        try {
            const result = await db.sequelize.query(
                'SELECT DISTINCT app_name FROM AppRoiData ORDER BY app_name ASC',
                { 
                    type: db.sequelize.QueryTypes.SELECT,
                    raw: true 
                }
            );
            
            return result.map((item: any) => item.app_name).filter(Boolean);
        } catch (error) {
            logger.error('获取app_name列表失败', { error: error instanceof Error ? error.message : error });
            throw error;
        }
    }

    /**
     * 获取所有唯一的country值 - 使用Sequelize.fn
     * @returns Promise<string[]>
     */
    static async getUniqueCountries(): Promise<string[]> {
        try {
            const result = await db.sequelize.query(
                'SELECT DISTINCT country FROM AppRoiData ORDER BY country ASC',
                { 
                    type: db.sequelize.QueryTypes.SELECT,
                    raw: true 
                }
            );
            
            return result.map((item: any) => item.country).filter(Boolean);
        } catch (error) {
            logger.error('获取country列表失败', { error: error instanceof Error ? error.message : error });
            throw error;
        }
    }

    /**
     * 获取所有唯一的bid_type值 - 使用Sequelize.fn
     * @returns Promise<string[]>
     */
    static async getUniqueBidTypes(): Promise<string[]> {
        try {
            const result = await db.sequelize.query(
                'SELECT DISTINCT bid_type FROM AppRoiData ORDER BY bid_type ASC',
                { 
                    type: db.sequelize.QueryTypes.SELECT,
                    raw: true 
                }
            );
            
            return result.map((item: any) => item.bid_type).filter(Boolean);
        } catch (error) {
            logger.error('获取bid_type列表失败', { error: error instanceof Error ? error.message : error });
            throw error;
        }
    }

    /**
     * 使用Sequelize aggregate方法获取所有筛选器数据
     * @returns Promise<FilterOptions>
     */
    static async getAllFilters(): Promise<{
        app_names: string[];
        countries?: string[];
        bid_types?: string[];
    }> {
        try {
            // 使用Sequelize的聚合查询获取所有唯一的app_name值
            const [appNamesResult] = await Promise.all([
                db.sequelize.query(
                    'SELECT DISTINCT app_name FROM AppRoiData WHERE app_name IS NOT NULL ORDER BY app_name ASC',
                    { type: db.sequelize.QueryTypes.SELECT }
                ),
            ]);

            const appNames = appNamesResult.map((item: any) => item.app_name).filter(Boolean);

            // appNamesResult 长度大于0 选择appNamesResult[0]作为条件值
            // 查询对应 国家地区字段值 无重复 出价类型字段值 无重复
            let countries: string[] = [];
            let bidTypes: string[] = [];

            if (appNames.length > 0) {
                const selectedAppName = appNames[0];

                const [countriesResult, bidTypesResult] = await Promise.all([
                    db.sequelize.query(
                        'SELECT DISTINCT country FROM AppRoiData WHERE app_name = ? AND country IS NOT NULL ORDER BY country ASC',
                        { 
                            type: db.sequelize.QueryTypes.SELECT,
                            replacements: [selectedAppName]
                        }
                    ),
                    db.sequelize.query(
                        'SELECT DISTINCT bid_type FROM AppRoiData WHERE app_name = ? AND bid_type IS NOT NULL ORDER BY bid_type ASC',
                        { 
                            type: db.sequelize.QueryTypes.SELECT,
                            replacements: [selectedAppName]
                        }
                    )
                ]);

                countries = countriesResult.map((item: any) => item.country).filter(Boolean);
                bidTypes = bidTypesResult.map((item: any) => item.bid_type).filter(Boolean);

                logger.info('获取所有筛选器数据成功', {
                    selectedAppName,
                    appNamesCount: appNames.length,
                    countriesCount: countries.length,
                    bidTypesCount: bidTypes.length
                });
            } else {
                logger.info('获取所有筛选器数据成功', {
                    appNamesCount: appNames.length,
                    message: '没有app_name数据'
                });
            }

            const result = {
                app_names: appNames,
                ...(countries.length > 0 && { countries }),
                ...(bidTypes.length > 0 && { bid_types: bidTypes })
            };

            return result;
        } catch (error) {
            logger.error('获取筛选器数据失败', { error: error instanceof Error ? error.message : error });
            throw error;
        }
    }

    /**
     * 根据app_name获取对应的country和bid_type无重复值
     * @param appName 应用名称
     * @returns Promise<{ countries: string[], bid_types: string[] }>
     */
    static async getFiltersByAppName(appName: string): Promise<{
        countries: string[];
        bid_types: string[];
    }> {
        try {
            const [countriesResult, bidTypesResult] = await Promise.all([
                db.sequelize.query(
                    'SELECT DISTINCT country FROM AppRoiData WHERE app_name = ? AND country IS NOT NULL ORDER BY country ASC',
                    { 
                        type: db.sequelize.QueryTypes.SELECT,
                        replacements: [appName]
                    }
                ),
                db.sequelize.query(
                    'SELECT DISTINCT bid_type FROM AppRoiData WHERE app_name = ? AND bid_type IS NOT NULL ORDER BY bid_type ASC',
                    { 
                        type: db.sequelize.QueryTypes.SELECT,
                        replacements: [appName]
                    }
                )
            ]);

            const countries = countriesResult.map((item: any) => item.country).filter(Boolean);
            const bidTypes = bidTypesResult.map((item: any) => item.bid_type).filter(Boolean);

            logger.info('根据app_name获取筛选器数据成功', {
                appName,
                countriesCount: countries.length,
                bidTypesCount: bidTypes.length
            });

            return {
                countries,
                bid_types: bidTypes
            };
        } catch (error) {
            logger.error('根据app_name获取筛选器数据失败', { 
                appName,
                error: error instanceof Error ? error.message : error 
            });
            throw error;
        }
    }

    static async getAllDates(appName: string, country: string): Promise<{
        dates: string[]
    }> {
        try {
            const dates = await AppRoiData.findAll({
                attributes: [
                  [Sequelize.fn('DISTINCT', Sequelize.col('date')), 'date']
                ],
                where: {
                    app_name: appName,
                    country: country
                },
                raw: true
              });

              const allDates = dates.map((item: any) => item.date)
              
              return allDates;
        } catch (error) {
            logger.error('getAllDates获取筛选器数据失败', { 
                error: error instanceof Error ? error.message : error 
            });
            throw error;
        }
    }

    static async getAllChartData(appName: string, country: string) {
        try {
            // 使用 GROUP BY 防止重复数据，取平均值作为聚合结果
            const datas = await AppRoiData.findAll({
                attributes: [
                    'roi_current',
                    'roi_1d',
                    'roi_3d',
                    'roi_7d',
                    'roi_14d',
                    'roi_30d',
                    'roi_60d',
                    'roi_90d'
                ],
                where: {
                    app_name: appName,
                    country: country
                },
                order: [['date', 'ASC']],
                raw: true
              });
            return datas;

        } catch (error) {
            logger.error('getAllChartData获取筛选器数据失败', { 
                error: error instanceof Error ? error.message : error 
            });
            throw error;
        }
    }

} 