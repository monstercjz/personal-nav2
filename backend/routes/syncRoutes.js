// backend/routes/syncRoutes.js
const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

/**
 * @route GET /export
 * @description 导出数据
 */
router.get('/export', syncController.exportData);
/**
 * @route POST /import
 * @description 导入数据
 */
router.post('/import', syncController.importData);
/**
 * @route POST /history/restore
 * @description 恢复到指定版本
 */
router.post('/history/restore', syncController.restoreData);

module.exports = router;