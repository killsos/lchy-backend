'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 添加唯一性约束，防止相同的 (date, app_name, bid_type, country) 组合重复插入
    await queryInterface.addConstraint('AppRoiData', {
      fields: ['date', 'app_name', 'bid_type', 'country'],
      type: 'unique',
      name: 'unique_app_roi_record'
    });
  },

  async down(queryInterface, Sequelize) {
    // 移除唯一性约束
    await queryInterface.removeConstraint('AppRoiData', 'unique_app_roi_record');
  }
};