// backend/services/websiteService.js
const Website = require('../models/Website');
const fileHandler = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

const dataFilePath = 'backend/data/sites-data.json';

/**
 * @description 获取某个分组下的所有网站记录
 */
const getWebsitesByGroupId = async (groupId) => {
  const data = await fileHandler.readData(dataFilePath);
  return (data.websites || []).filter(website => website.groupId === groupId);
};

/**
 * @description 在某个分组下创建新的网站记录
 */
const createWebsite = async (groupId, websiteData) => {
  const data = await fileHandler.readData(dataFilePath);
  const newWebsite = { id: uuidv4(), groupId, order: data.nextWebsiteId, ...websiteData };
  data.websites = [...(data.websites || []), newWebsite];
  data.nextWebsiteId = data.nextWebsiteId + 1;
  await fileHandler.writeData(dataFilePath, data);
  return newWebsite;
};

/**
 * @description 获取单个网站记录详情
 */
const getWebsiteById = async (websiteId) => {
  const data = await fileHandler.readData(dataFilePath);
  return (data.websites || []).find((website) => website.id === websiteId);
};

/**
 * @description 更新网站记录信息
 */
const updateWebsite = async (websiteId, websiteData) => {
  const data = await fileHandler.readData(dataFilePath);
  const websites = (data.websites || []).map((website) =>
    website.id === websiteId ? { ...website, ...websiteData } : website
  );
  data.websites = websites;
  await fileHandler.writeData(dataFilePath, data);
  return websites.find(website => website.id === websiteId);
};

/**
 * @description 删除网站记录
 */
const deleteWebsite = async (websiteId) => {
  const data = await fileHandler.readData(dataFilePath);
  let websites = (data.websites || []).filter((website) => website.id !== websiteId);
  websites = websites.map((website, index) => ({ ...website, order: index + 1 }));
  data.websites = websites;
  data.nextWebsiteId = websites.length + 1;
  await fileHandler.writeData(dataFilePath, data);
  return { message: 'Website deleted successfully' };
};

/**
 * @description 网站记录排序
 */
const reorderWebsites = async (reorderData) => {
    const data = await fileHandler.readData(dataFilePath);
    const websites = data.websites || [];
    const orderedWebsites = reorderData.map(item => websites.find(website => website.id === item.id));
    data.websites = orderedWebsites;
    await fileHandler.writeData(dataFilePath, data);
    return orderedWebsites;
};

/**
 * @description 批量删除网站记录
 */
const batchDeleteWebsites = async (websiteIds) => {
    const data = await fileHandler.readData(dataFilePath);
    let websites = data.websites || [];
    let deletedCount = 0;
    websiteIds.forEach(websiteId => {
        const index = websites.findIndex(website => website.id === websiteId);
        if (index > -1) {
            websites.splice(index, 1);
            deletedCount++;
        }
    });
    data.websites = websites;
    await fileHandler.writeData(dataFilePath, data);
    return deletedCount;
};

/**
 * @description 批量移动网站记录到其他分组
 */
const batchMoveWebsites = async (websiteIds, targetGroupId) => {
    const data = await fileHandler.readData(dataFilePath);
    let websites = data.websites || [];
    let movedCount = 0;
    websites.forEach(website => {
        if (websiteIds.includes(website.id)) {
            website.groupId = targetGroupId;
            movedCount++;
        }
    });
    data.websites = websites;
    await fileHandler.writeData(dataFilePath, data);
    return movedCount;
};

module.exports = {
  getWebsitesByGroupId,
  createWebsite,
  getWebsiteById,
  updateWebsite,
  deleteWebsite,
  reorderWebsites,
  batchDeleteWebsites,
  batchMoveWebsites
};