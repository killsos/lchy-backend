import fs from 'fs';
import { parse } from 'csv-parse';
import logger from '../utils/logger';
import { CsvParseResult, CsvRowData } from '../types/appRoi.types';

export class CsvService {
    /**
     * 验证文件是否为CSV格式
     * @param fileName 文件名
     * @returns boolean
     */
    static isValidCsvFile(fileName: string): boolean {
        const csvExtensions = ['.csv'];
        const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        return csvExtensions.includes(fileExtension);
    }

    /**
     * 清理数据中的日期格式
     * @param data 原始数据对象
     * @returns 清理后的数据对象
     */
    private static cleanDateFields(data: string[]): string[] {
        // 删除日期中的中文后缀
        if (data[0] && data[0].includes('(')) {
            data[0] = data[0].replace(/\([^)]*\)/g, '').trim();
        }
        
        // 删除所有字段中的%符号
        return data.map(item => 
            typeof item === 'string' ? item.replace(/%/g, '').trim() : item
        );
    }

    /**
     * 解析CSV文件为JSON数组
     * @param filePath 文件路径
     * @returns Promise<CsvParseResult>
     */
    static async parseCsvToJson(filePath: string): Promise<CsvParseResult> {
        return new Promise((resolve) => {
            const results: CsvRowData[] = [];
            fs.createReadStream(filePath)
                .pipe(parse({ columns: false, skip_empty_lines: true }))
                .on('data', (data: string[]) => {
                    // 清理数据中的日期格式和百分比符号
                    const cleanedData = this.cleanDateFields(data);
                    results.push(cleanedData as unknown as CsvRowData);
                })
                .on('end', () => {
                    logger.info('CSV解析完成', { 
                        totalRows: results.length,
                        filePath: filePath.split('/').pop() 
                    });
                    // 删除临时文件
                    this.deleteTempFile(filePath);
                    resolve({
                        success: true,
                        data: results.splice(1)
                    });
                })
                .on('error', (err) => {
                    logger.error('CSV解析失败', { error: err.message, filePath });
                    // 删除临时文件
                    this.deleteTempFile(filePath);
                    resolve({
                        success: false,
                        error: err.message
                    });
                });
        });
    }

    /**
     * 删除临时文件
     * @param filePath 文件路径
     */
    private static deleteTempFile(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            logger.error('删除临时文件失败', { error: error instanceof Error ? error.message : error, filePath });
        }
    }
} 