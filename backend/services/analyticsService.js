// backend/services/analyticsService.js
const fileHandler = require('../utils/fileHandler');

const dataFilePath = 'backend/data/analytics.json';

/**
 * @description 获取网站记录的访问统计信息
 */
const getAnalytics = async () => {
  try {
    const data = await fileHandler.readData(dataFilePath);
    return data || {};
  } catch (error) {
    return {};
  }
};

module.exports = {
  getAnalytics,
};