// backend/controllers/analyticsController.js
const analyticsService = require('../services/analyticsService');
const apiResponse = require('../utils/apiResponse');

/**
 * @description 获取网站记录的访问统计信息
 */
const getAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getAnalytics();
    apiResponse.success(res, analytics);
  } catch (error) {
    apiResponse.error(res, error.message);
  }
};

module.exports = {
  getAnalytics,
};