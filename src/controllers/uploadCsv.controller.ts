import { Request, Response } from 'express';
import path from 'path';
import { CsvService } from '../services/csvService';
import { AppRoiDataService } from '../services/appRoiDataService';
import logger from '../utils/logger';

export const addCsv = async (_req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, '../views/upload.html'));
};

export const upload = async (req: Request, res: Response) => {
    try {
        // 1. 验证文件是否存在
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: '未上传文件' 
            });
        }

        // 2. 验证文件格式
        if (!CsvService.isValidCsvFile(req.file.originalname)) {
            return res.status(400).json({ 
                success: false,
                error: '请上传CSV格式的文件' 
            });
        }

        // 3. 测试数据库连接
        const isConnected = await AppRoiDataService.testConnection();
        if (!isConnected) {
            return res.status(500).json({
                success: false,
                error: '数据库连接失败，请检查数据库配置'
            });
        }

        // 4. 调用Service层解析CSV
        const result = await CsvService.parseCsvToJson(req.file.path);
        if (result.data && result.data.length > 0) {
            logger.info('CSV解析结果', { 
                fileName: req.file.originalname,
                recordCount: result.data.length,
                sampleData: result.data[0] 
            });
        } else {
            logger.warn('CSV解析结果为空', { fileName: req.file.originalname });
        }

        // 5. 返回结果
        if (result.success && result.data) {
            // 调用AppRoiData模型将解析数据插入表中字段按照顺序一一对应插入
            const insertResult = await AppRoiDataService.insertCsvData(result.data);
            
            if (insertResult.success) {
                res.json({
                    success: true,
                    message: 'CSV文件解析并插入数据库成功',
                    details: {
                        csvRecords: result.data.length,
                        insertedRecords: insertResult.insertedCount,
                        totalRecords: typeof insertResult.details === 'object' ? insertResult.details?.totalRecords : undefined
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: '数据库插入失败',
                    details: insertResult.error
                });
            }
        } else {
            res.status(500).json({
                success: false,
                error: '解析CSV失败',
                details: result.error
            });
        }

    } catch (error) {
        logger.error('上传处理错误', { 
            error: error instanceof Error ? error.message : error,
            fileName: req.file?.originalname 
        });
        res.status(500).json({
            success: false,
            error: '服务器内部错误',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
};