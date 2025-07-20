import { DataTypes, Model, Optional } from 'sequelize';
import { AppRoiData as AppRoiDataAttributes } from '../types/appRoi.types';

interface AppRoiDataCreationAttributes extends Optional<AppRoiDataAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class AppRoiDataModel extends Model<AppRoiDataAttributes, AppRoiDataCreationAttributes> 
  implements AppRoiDataAttributes {
  public id!: number;
  public date!: string;
  public app_name!: string;
  public bid_type!: string;
  public country!: string;
  public install_count!: number;
  public roi_1d?: number;
  public roi_3d?: number;
  public roi_7d?: number;
  public roi_14d?: number;
  public roi_30d?: number;
  public roi_60d?: number;
  public roi_90d?: number;
  public roi_current?: number;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: any) {
    AppRoiDataModel.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
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

    return AppRoiDataModel;
  }
}