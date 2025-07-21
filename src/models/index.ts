import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';

const env = process.env.NODE_ENV || 'development';
import configObj from '../config/config';
const config = configObj[env as keyof typeof configObj];

interface DB {
  [key: string]: any;
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
}

const db: DB = {} as DB;

let sequelize: Sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable] as string, config);
} else {
  sequelize = new Sequelize(config.database as string, config.username as string, config.password as string, config);
}

// 初始化连接池监控
sequelize.addHook('afterConnect', (connection: any, config: any) => {
  console.log('数据库连接已建立:', {
    host: config.host,
    database: config.database,
    threadId: connection.threadId
  });
});

sequelize.addHook('beforeDisconnect', (connection: any) => {
  console.log('数据库连接即将断开:', {
    threadId: connection.threadId
  });
});

console.log('开始加载模型...');

// 导入 TypeScript 模型
import { AppRoiDataModel } from './appRoiData.model';

try {
  console.log('Loading TypeScript model: AppRoiData');
  const model = AppRoiDataModel.initModel(sequelize);
  db[model.name] = model;
  console.log(`Successfully loaded model: ${model.name}`);
} catch (error) {
  console.error('Error loading AppRoiData model:', (error as Error).message);
}

// 设置模型关联
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log('模型加载完成，可用模型:', Object.keys(db));

export default db;