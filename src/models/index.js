'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// 初始化连接池监控
sequelize.addHook('afterConnect', (connection, config) => {
  console.log('数据库连接已建立:', {
    host: config.host,
    database: config.database,
    threadId: connection.threadId
  });
});

sequelize.addHook('beforeDisconnect', (connection) => {
  console.log('数据库连接即将断开:', {
    threadId: connection.threadId
  });
});

console.log('开始加载模型...');

// 明确指定要加载的模型文件，避免循环问题
const modelFiles = ['approidata.js'];

modelFiles.forEach(file => {
  try {
    console.log(`Loading model file: ${file}`);
    const modelModule = require(path.join(__dirname, file));
    if (typeof modelModule === 'function') {
      const model = modelModule(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
      console.log(`Successfully loaded model: ${model.name}`);
    } else {
      console.log(`Skipping ${file}: not a valid model function`);
    }
  } catch (error) {
    console.error(`Error loading model from ${file}:`, error.message);
  }
});

// 设置模型关联
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log('模型加载完成，可用模型:', Object.keys(db));

module.exports = db;