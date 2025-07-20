'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AppRoiData extends Model {
    static associate(models) {
      // 定义关联关系（如果需要）
    }
  }

  AppRoiData.init({
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '日期'
    },
    app_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'app名称'
    },
    bid_type: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: '出价类型'
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '国家地区'
    },
    install_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '应用安装次数'
    },
    roi_1d: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '1日ROI'
    },
    roi_3d: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '3日ROI'
    },
    roi_7d: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '7日ROI'
    },
    roi_14d: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '14日ROI'
    },
    roi_30d: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '30日ROI'
    },
    roi_60d: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '60日ROI'
    },
    roi_90d: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '90日ROI'
    },
    roi_current: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '当日ROI'
    }
  }, {
    sequelize,
    modelName: 'AppRoiData',
    tableName: 'AppRoiData',
    underscored: false,
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  return AppRoiData;
};