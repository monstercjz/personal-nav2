// backend/services/syncService.js
const fileHandler = require('../utils/fileHandler');

const dataFilePath = 'backend/data/sites-data.json';
const historyFilePath = 'backend/data/sites-history.json';

/**
 * @description 导出数据
 */
const exportData = async () => {
  const data = await fileHandler.readData(dataFilePath);
  return data;
};

/**
 *  @description 导入数据
 */
const importData = async (importData) => {
    const data = await fileHandler.readData(dataFilePath);
    const historyData = await fileHandler.readData(historyFilePath);
    const versionId = new Date().toISOString();
    historyData.versions = [...(historyData.versions || []), { versionId, data }];
    await fileHandler.writeData(historyFilePath, historyData);
    await fileHandler.writeData(dataFilePath, importData);
};

/**
 * @description 恢复到指定版本
 */
const restoreData = async (versionId) => {
    const historyData = await fileHandler.readData(historyFilePath);
    const version = (historyData.versions || []).find(version => version.versionId === versionId);
    if (!version) {
        throw new Error('Version not found');
    }
    await fileHandler.writeData(dataFilePath, version.data);
};

module.exports = {
  exportData,
  importData,
  restoreData
};