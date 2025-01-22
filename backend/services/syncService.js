// backend/services/syncService.js
const fileHandler = require('../utils/fileHandler');

const { WEBSITE_DATA_FILE_PATH } = require('../config/constants');
const { HISTORY_DATA_FILE_PATH } = require('../config/constants');
const ARCHIVE_SUCCESS_MESSAGE = 'Websites info archived successfully';

/**
 * @description 导出数据
 */
const exportData = async () => {
  const data = await fileHandler.readData(WEBSITE_DATA_FILE_PATH);
  return data;
};

/**
 *  @description 导入数据
 */
const importData = async (importData) => {
    const data = await fileHandler.readData(WEBSITE_DATA_FILE_PATH);
    const historyData = await fileHandler.readData(historyFilePath);
    const versionId = new Date().toISOString();
    historyData.versions = [...(historyData.versions || []), { versionId, data }];
    await fileHandler.writeData(historyFilePath, historyData);
    await fileHandler.writeData(WEBSITE_DATA_FILE_PATH, importData);
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
    await fileHandler.writeData(WEBSITE_DATA_FILE_PATH, version.data);
};

/**
 * @description 记录网站信息
 * @description 记录网站信息
 */
const moveToTrash = async (websiteIds) => {
    try {
        // 读取网站数据
        const data = await fileHandler.readData(WEBSITE_DATA_FILE_PATH);
        if (!data || !data.websites) {
            throw new Error('Invalid website data');
        }
        
        // 读取历史数据
        const historyData = await fileHandler.readData(HISTORY_DATA_FILE_PATH);
        const existingWebsiteInfos = historyData?.websiteInfos || [];

        // 如果 websiteIds 不是数组，则转换为数组
        const idsArray = Array.isArray(websiteIds) ? websiteIds : [websiteIds];
        const websitesToDelete = new Set(idsArray);
        const websiteInfos = [];

        // 获取所有网站
        const websites = data.websites;

        // 循环处理每个网站 ID
        for (const websiteId of idsArray) {
            const website = websites.find(item => item.id === websiteId);
            // 如果网站不存在，则输出错误信息并跳过
            if (!website) {
                console.error(`Website with id ${websiteId} not found`);
                continue;
            }
            // 提取网站信息
            const websiteInfo = `${website.name}+${website.url}+${website.description}`;
            websiteInfos.push(websiteInfo);
        }

        // 将网站信息添加到历史数据
        historyData.websiteInfos = [...existingWebsiteInfos, ...websiteInfos];

        // 从网站数据中删除已归档的网站
        data.websites = websites.filter(website => !websitesToDelete.has(website.id));

        // 写入历史数据
        await fileHandler.writeData(HISTORY_DATA_FILE_PATH, historyData);

        // 写入网站数据
        await fileHandler.writeData(WEBSITE_DATA_FILE_PATH, data);

        return { message: ARCHIVE_SUCCESS_MESSAGE };
    } catch (error) {
        console.error('Error archiving websites:', error);
        throw error; // 重新抛出异常以便调用者处理
    }
};

module.exports = {
  exportData,
  importData,
  restoreData,
  moveToTrash
};