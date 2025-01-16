// backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

/**
 * @route GET /analytics
 * @description 获取网站记录的访问统计信息
 */
router.get('/', analyticsController.getAnalytics);

module.exports = router;