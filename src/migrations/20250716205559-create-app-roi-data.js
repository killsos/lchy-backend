'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AppRoiData', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATEONLY
      },
      app_name: {
        type: Sequelize.STRING
      },
      bid_type: {
        type: Sequelize.STRING
      },
      country: {
        type: Sequelize.STRING
      },
      install_count: {
        type: Sequelize.INTEGER
      },
      roi_current: {
        type: Sequelize.DECIMAL(10, 2)
      },
      roi_1d: {
        type: Sequelize.DECIMAL(10, 2)
      },
      roi_3d: {
        type: Sequelize.DECIMAL(10, 2)
      },
      roi_7d: {
        type: Sequelize.DECIMAL(10, 2)
      },
      roi_14d: {
        type: Sequelize.DECIMAL(10, 2)
      },
      roi_30d: {
        type: Sequelize.DECIMAL(10, 2)
      },
      roi_60d: {
        type: Sequelize.DECIMAL(10, 2)
      },
      roi_90d: {
        type: Sequelize.DECIMAL(10, 2)
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AppRoiData');
  }
};