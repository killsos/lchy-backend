import { Request, Response } from 'express';
import { AppRoiDataService } from '../services/appRoiDataService';
import logger from '../utils/logger';

export const filters = async (_req: Request, res: Response) => {
  try {
    // 使用Sequelize并行查询获取所有筛选器数据
    const filterData = await AppRoiDataService.getAllFilters();

    res.status(200).json({
      code: 200,
      message: '获取筛选器数据成功',
      data: filterData
    });

  } catch (error) {
    logger.error('获取筛选器数据失败', {
      error: error instanceof Error ? error.message : error
    });

    res.status(500).json({
      code: 500,
      message: '获取筛选器数据失败',
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
};

export const filtersByAppName = async (req: Request, res: Response) => {
  try {
    const { appname } = req.query;
    
    if (!appname || typeof appname !== 'string') {
      return res.status(400).json({
        code: 400,
        message: 'appname参数是必需的',
        data: null
      });
    }

    const filterData = await AppRoiDataService.getFiltersByAppName(appname);

    res.status(200).json({
      code: 200,
      message: '获取筛选器数据成功',
      data: filterData
    });

  } catch (error) {
    logger.error('根据appname获取筛选器数据失败', {
      error: error instanceof Error ? error.message : error
    });

    res.status(500).json({
      code: 500,
      message: '获取筛选器数据失败',
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
};

export const getAllDate = async(req: Request, res: Response) => {
  const { appname, country} = req.query;

  if (!appname || typeof appname !== 'string') {
    return res.status(400).json({
      code: 400,
      message: 'appname参数是必需的',
      data: null
    });
  }

  if (!country || typeof country !== 'string') {
    return res.status(400).json({
      code: 400,
      message: 'country参数是必需的',
      data: null
    });
  }

  try {
    const allDates = await AppRoiDataService.getAllDates(
      appname, country
    );
    res.status(200).json({
      code: 200,
      message: '获取所有日期筛选器数据成功',
      data: allDates
    });
  } catch (error) {
    logger.error('获取所有日期筛选器数据失败', {
      error: error instanceof Error ? error.message : error
    });

    res.status(500).json({
      code: 500,
      message: '获取所有日期筛选器数据失败',
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}

export const getAllData = async(req: Request, res: Response) => {
  const { appname, country} = req.query;

  if (!appname || typeof appname !== 'string') {
    return res.status(400).json({
      code: 400,
      message: 'appname参数是必需的',
      data: null
    });
  }

  if (!country || typeof country !== 'string') {
    return res.status(400).json({
      code: 400,
      message: 'country参数是必需的',
      data: null
    });
  }

  try {
    const allData = await AppRoiDataService.getAllChartData(
      appname, country
    );
    res.status(200).json({
      code: 200,
      message: '获取所有图表数据成功',
      data: allData
    });
  } catch (error) {
    logger.error('获取所有图表数据失败', {
      error: error instanceof Error ? error.message : error
    });

    res.status(500).json({
      code: 500,
      message: '获取所有图表数据失败',
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}