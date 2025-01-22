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

const path = require('path');
const fs = require('fs').promises;

const BACKUP_DIR = path.join(__dirname, '../data/backups'); // 备份文件存放目录
const MAX_BACKUP_VERSIONS = 5; // 最大备份版本数

/**
 * @description 备份 sites-data.json 文件
 */
const backupData = async () => {
  try {
    const data = await fileHandler.readData(WEBSITE_DATA_FILE_PATH);
    const timestamp = new Date().toISOString().replace(/:/g, '-'); // 使用 ISO 时间戳，替换冒号
    const backupFilename = path.join(BACKUP_DIR, `sites-data-backup-${timestamp}.json`);

    // 确保备份目录存在
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    await fileHandler.writeData(backupFilename, data);

    // 清理旧备份文件，只保留最新 MAX_BACKUP_VERSIONS 个
    await cleanupOldBackups();

    console.log('sites-data.json backed up successfully');
  } catch (error) {
    console.error('Error backing up sites-data.json:', error);
    throw error;
  }
};

/**
 * @description 清理旧备份文件，只保留最新的 MAX_BACKUP_VERSIONS 个
 */
const cleanupOldBackups = async () => {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files.filter(file => file.startsWith('sites-data-backup-') && file.endsWith('.json'));

    if (backupFiles.length > MAX_BACKUP_VERSIONS) {
      backupFiles.sort(); // 默认升序，时间戳越早的文件排在前面
      const filesToDelete = backupFiles.slice(0, backupFiles.length - MAX_BACKUP_VERSIONS); // 删除较旧的文件

      for (const file of filesToDelete) {
        const filePath = path.join(BACKUP_DIR, file);
        await fs.unlink(filePath);
        console.log(`Deleted old backup file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
};


module.exports = {
  exportData,
  importData,
  restoreData,
  moveToTrash,
  backupData // 导出备份函数
};