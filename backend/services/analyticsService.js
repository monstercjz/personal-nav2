// backend/services/analyticsService.js
const fileHandler = require('../utils/fileHandler');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data/analytics.json');

/**
 * @description 获取网站记录的访问统计信息
 */
const getAnalytics = async () => {
  try {
    const data = await fileHandler.readData(dataFilePath);
    return data || { websiteClicks: {} };
  } catch (error) {
    return { websiteClicks: {} };
  }
};

/**
 * @description 更新网站的最后点击时间
 * @param {string} websiteId - 网站ID
 */
const updateLastClickTime = async (websiteId) => {
  try {
    const data = await getAnalytics();
    
    // 初始化网站点击数据
    if (!data.websiteClicks) {
      data.websiteClicks = {};
    }
    
    // 更新最后点击时间
    data.websiteClicks[websiteId] = {
      lastClick: new Date().toISOString()
    };

    // 保存更新后的数据
    await fileHandler.writeData(dataFilePath, data);
    
    return true;
  } catch (error) {
    console.error('Error updating website click time:', error);
    throw error;
  }
};

module.exports = {
  getAnalytics,
  updateLastClickTime
};
