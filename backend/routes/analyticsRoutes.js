// backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

/**
 * @route GET /analytics
 * @description 获取分析数据
 */
router.get('/', analyticsController.getAnalytics);

/**
 * @route POST /analytics/click
 * @description 记录网站点击时间
 * @body {websiteId: string}
 */
router.post('/click', analyticsController.recordClick);

module.exports = router;
