'use strict';

// backend/services/websiteService.js
const Website = require('../models/Website');
const fileHandler = require('../utils/fileHandler');
const { isValidUrl } = require('../utils/validation');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { getGroupById } = require('./groupService');

const dataFilePath = `${__dirname}/../data/sites-data.json`;

const handleServiceError = (error, message) => {
  console.error(`${message}:`, error);
  throw new Error(message);
};

/**
 * @description 获取指定分组下的所有网站记录
 * @param {string} groupId - 分组 ID
 * @returns {Promise<Array<Website>>} - 网站记录列表
 */
const getWebsitesByGroupId = async (groupId) => {
  const schema = Joi.string().uuid().required();
  try {
    await schema.validateAsync(groupId);
  } catch (error) {
    handleServiceError(error, '无效的 groupId');
  }

  const group = await getGroupById(groupId);
  if (!group) {
    handleServiceError(new Error('指定的分组不存在'), '获取网站记录失败');
  }

  try {
    const data = await fileHandler.readData(dataFilePath);
    return _getWebsitesByGroupId(groupId, data.websites || []);
  } catch (error) {
    handleServiceError(error, '获取网站记录失败');
  }
};

/**
 * @description 获取单个网站记录详情
 * @param {string} websiteId - 网站 ID
 * @returns {Promise<Website|undefined>} - 网站记录详情
 */
const getWebsiteById = async (websiteId) => {
  const schema = Joi.string().uuid().required();
  try {
    await schema.validateAsync(websiteId);
  } catch (error) {
    handleServiceError(error, '无效的 websiteId');
  }
  const data = await fileHandler.readData(dataFilePath);
  console.log('getWebsiteById called');
  const websiteData = (data.websites || []).find((website) => website.id === websiteId);
  return websiteData ? new Website(websiteData.id, websiteData.groupId, websiteData.name, websiteData.url, websiteData.description, websiteData.faviconUrl, websiteData.lastAccessTime, websiteData.order, websiteData.isAccessible) : undefined;
};

/**
 * @description 创建新的网站记录
 * @param {string} groupId - 分组 ID
 * @param {object} websiteData - 网站数据
 * @returns {Promise<Website>} - 新的网站对象
 */
const createWebsite = async (groupId, websiteData) => {
  await validateWebsiteData(groupId, websiteData);

  const group = await getGroupById(groupId);
  if (!group) {
    handleServiceError(new Error('指定的分组不存在'), '创建网站记录失败');
  }

  try {
    const data = await fileHandler.readData(dataFilePath);
    await _checkIfWebsiteUrlExists(data.websites || [], websiteData.url);
    const websitesInGroup = (data.websites || []).filter(website => website.groupId === groupId);
    const newWebsite = createNewWebsiteObject(groupId, websiteData, websitesInGroup);
    data.websites = [...(data.websites || []), newWebsite];
    await fileHandler.writeData(dataFilePath, data);
    return newWebsite;
  } catch (error) {
    handleServiceError(error, '创建网站记录失败');
  }
};

/**
 * @description 更新网站记录信息
 * @param {string} websiteId - 网站 ID
 * @param {object} websiteData - 网站数据
 * @returns {Promise<Website>} - 更新后的网站对象
 */
const updateWebsite = async (websiteId, websiteData) => {
  const schema = Joi.object({
    websiteId: Joi.string().uuid().required(),
    websiteData: Joi.object({
      groupId: Joi.string().uuid(),
      name: Joi.string().required(),
      url: Joi.string().uri().required(),
      description: Joi.string().allow(''),
      faviconUrl: Joi.string().uri(),
      order: Joi.number().integer(),
      isAccessible: Joi.boolean(),
    }).required()
  });

  try {
    await schema.validateAsync({ websiteId, websiteData });
  } catch (error) {
    handleServiceError(error, '无效的网站数据');
  }

  try {
    const data = await fileHandler.readData(dataFilePath);
    const updatedWebsites = _updateWebsiteData(websiteId, websiteData, data.websites || []);
    data.websites = updatedWebsites;
    await fileHandler.writeData(dataFilePath, data);
    return updatedWebsites.find(website => website.id === websiteId);
  } catch (error) {
    handleServiceError(error, '更新网站记录失败');
  }
};

/**
 * @description 删除网站记录
 * @param {string} websiteId - 网站 ID
 * @returns {Promise<{message: string}>} - 删除结果
 */
const deleteWebsite = async (websiteId) => {
  console.log('deleteWebsite called');
  console.log('deleteWebsite called');
  const schema = Joi.string().uuid().required();
  try {
    await schema.validateAsync(websiteId);
  } catch (error) {
    handleServiceError(error, '无效的 websiteId');
  }
  const data = await fileHandler.readData(dataFilePath);
  data.websites = (data.websites || []).filter(website => website.id !== websiteId);
  await fileHandler.writeData(dataFilePath, data);
  return { message: 'Website deleted successfully' };
};

/**
 * @description 网站记录排序
 * @param {Array<{id: string}>} reorderData - 排序数据
 * @returns {Promise<Array<Website>>} - 排序后的网站列表
 */
const reorderWebsites = async (reorderData) => {
  const schema = Joi.array().items(Joi.object({
    id: Joi.string().uuid().required()
  })).required();

  try {
    await schema.validateAsync(reorderData);
  } catch (error) {
    handleServiceError(error, '无效的排序数据');
  }

  const data = await fileHandler.readData(dataFilePath);
  const rawWebsites = data.websites || [];
  const websiteMap = rawWebsites.reduce((map, website) => {
    map[website.id] = website;
    return map;
  }, {});

  const orderMap = reorderData.reduce((map, item, index) => {
    map[item.id] = index;
    return map;
  }, {});

  const orderedWebsites = [...rawWebsites].sort((a, b) => orderMap[a.id] - orderMap[b.id]).map(website => new Website(website.id, website.groupId, website.name, website.url, website.description, website.faviconUrl, website.lastAccessTime, website.order, website.isAccessible));
  data.websites = orderedWebsites;
  await fileHandler.writeData(dataFilePath, data);
  return orderedWebsites;
};

/**
 * @description 批量删除网站记录
 * @param {Array<string>} websiteIds - 网站 ID 列表
 * @returns {Promise<number>} - 删除的网站数量
 */
const batchDeleteWebsites = async (websiteIds) => {
  console.log('batchDeleteWebsites called');
  console.log('batchDeleteWebsites called');
  const schema = Joi.array().items(Joi.string().uuid().required()).required();
  console.log(schema);
  if (!websiteIds || websiteIds.length === 0) {
    return 0;
  }

  try {
    await schema.validateAsync(websiteIds);
  } catch (error) {
    handleServiceError(error, '无效的网站 ID 列表');
  }

  const data = await fileHandler.readData(dataFilePath);
  let websites = (data.websites || []).map(website => new Website(website.id, website.groupId, website.name, website.url, website.description, website.faviconUrl, website.lastAccessTime, website.order, website.isAccessible));
  let deletedCount = 0;
  const filteredWebsites = websites.filter(website => !websiteIds.includes(website.id));
  deletedCount = websites.length - filteredWebsites.length;
  data.websites = filteredWebsites;
  await fileHandler.writeData(dataFilePath, data);
  return deletedCount;
};

/**
 * @description 批量移动网站记录到其他分组
 * @param {Array<string>} websiteIds - 网站 ID 列表
 * @param {string} targetGroupId - 目标分组 ID
 * @returns {Promise<number>} - 移动的网站数量
 */
const batchMoveWebsites = async (websiteIds, targetGroupId) => {
  const schema = Joi.object({
    websiteIds: Joi.array().items(Joi.string().uuid().required()).required(),
    targetGroupId: Joi.string().uuid().required()
  });

  try {
    await schema.validateAsync({ websiteIds, targetGroupId });
  } catch (error) {
    handleServiceError(error, '无效的网站 ID 列表或目标分组 ID');
  }

  const group = await getGroupById(targetGroupId);
  if (!group) {
    handleServiceError(new Error('指定的目标分组不存在'), '批量移动网站记录失败');
  }

  try {
    const data = await fileHandler.readData(dataFilePath);
    const updatedWebsites = _moveWebsitesToGroup(websiteIds, targetGroupId, data.websites || []);
    data.websites = updatedWebsites;
    await fileHandler.writeData(dataFilePath, data);
    return updatedWebsites.filter(website => websiteIds.includes(website.id)).length;
  } catch (error) {
    handleServiceError(error, '批量移动网站记录失败');
  }
};

/**
 * @description 根据分组 ID 过滤网站列表
 * @param {string} groupId - 分组 ID
 * @param {Array<object>} websites - 网站列表
 * @returns {Array<Website>} - 过滤后的网站列表
 */
const _getWebsitesByGroupId = (groupId, websites) => {
  return websites.filter(item => item.groupId === groupId)
    .map(item => new Website(item.id, item.groupId, item.name, item.url, item.description, item.faviconUrl, item.lastAccessTime, item.order, item.isAccessible));
};

/**
 * @description 验证网站数据
 * @param {string} groupId - 分组 ID
 * @param {object} websiteData - 网站数据
 * @returns {Promise<void>}
 */
const validateWebsiteData = async (groupId, websiteData) => {
  const schema = Joi.object({
    groupId: Joi.string().uuid().required(),
    websiteData: Joi.object({
      name: Joi.string().required(),
      url: Joi.string().uri().required(),
      description: Joi.string().allow(''),
      faviconUrl: Joi.string().uri(),
    }).required()
  });

  try {
    await schema.validateAsync({ groupId, websiteData });
  } catch (error) {
    handleServiceError(error, '无效的网站数据');
  }
};

/**
 * @description 检查网站 URL 是否已存在
 * @param {Array<Website>} websites - 网站列表
 * @param {string} url - 要检查的 URL
 * @param {string} [excludeId] - 要排除的网站 ID
 * @returns {Website|undefined} - 如果存在则返回网站对象，否则返回 undefined
 */
const checkIfWebsiteUrlExists = (websites, url, excludeId = null) => {
  return websites.find(website => website.url === url && website.id !== excludeId);
};

/**
 * @description 检查网站 URL 是否已存在，如果存在则抛出错误
 * @param {Array<Website>} websites - 网站列表
 * @param {string} url - 要检查的 URL
 * @returns {Promise<void>}
 */
const _checkIfWebsiteUrlExists = async (websites, url) => {
  if (checkIfWebsiteUrlExists(websites, url)) {
    handleServiceError(new Error('该网站 URL 已存在'), '创建网站记录失败');
  }
};

/**
 * @description 生成网站的 favicon URL
 * @param {string} websiteUrl - 网站 URL
 * @param {string} [customFaviconUrl] - 自定义的 favicon URL
 * @returns {string} - favicon URL
 */
const generateFaviconUrl = (websiteUrl, customFaviconUrl) => {
  if (customFaviconUrl) {
    return customFaviconUrl;
  }
  const url = new URL('https://www.google.com/s2/favicons');
  url.searchParams.set('sz', '64');
  url.searchParams.set('domain_url', websiteUrl);
  return url.toString();
};

/**
 * @description 创建新的网站对象
 * @param {string} groupId - 分组 ID
 * @param {object} websiteData - 网站数据
 * @param {Array<Website>} websitesInGroup - 分组内的网站列表
 * @returns {Website} - 新的网站对象
 */
const createNewWebsiteObject = (groupId, websiteData, websitesInGroup) => {
  const faviconUrl = generateFaviconUrl(websiteData.url, websiteData.faviconUrl);
  return new Website(uuidv4(), groupId, websiteData.name, websiteData.url, websiteData.description, faviconUrl, new Date(), websitesInGroup.length + 1, true);
};

/**
 * @description 根据网站 ID 查找网站数据，如果找不到则抛出错误
 * @param {string} websiteId - 网站 ID
 * @returns {Promise<Website>} - 找到的网站数据
 */
const _findWebsiteById = async (websiteId) => {
  const data = await fileHandler.readData(dataFilePath);
  const websiteData = (data.websites || []).find((website) => website.id === websiteId);
  if (!websiteData) {
    handleServiceError(new Error('找不到指定的网站'), '更新网站记录失败');
  }
  return new Website(websiteData.id, websiteData.groupId, websiteData.name, websiteData.url, websiteData.description, websiteData.faviconUrl, websiteData.lastAccessTime, websiteData.order, websiteData.isAccessible);
};

/**
 * @description 更新网站数据
 * @param {string} websiteId - 要更新的网站 ID
 * @param {object} websiteData - 包含更新数据的网站对象
 * @param {Array<Website>} websites - 网站列表
 * @returns {Array<Website>} - 更新后的网站列表
 */
const _updateWebsiteData = (websiteId, websiteData, websites) => {
  const existingWebsiteWithUrl = websites.find(website => website.url === websiteData.url && website.id !== websiteId);
  if (existingWebsiteWithUrl) {
    handleServiceError(new Error('该网站 URL 已存在'), '更新网站记录失败');
  }

  return websites.map(website => {
    if (website.id === websiteId) {
      const groupId = websiteData.groupId || website.groupId;
      const order = websiteData.order || website.order;
      const isAccessible = websiteData.isAccessible || website.isAccessible;
      return new Website(website.id, groupId, websiteData.name, websiteData.url, websiteData.description, websiteData.faviconUrl, website.lastAccessTime, order, isAccessible);
    }
    return website;
  });
};

/**
 * @description 移动网站记录到其他分组
 * @param {Array<string>} websiteIds - 网站 ID 列表
 * @param {string} targetGroupId - 目标分组 ID
 * @param {Array<Website>} websites - 网站列表
 * @returns {Array<Website>} - 更新后的网站列表
 */
const _moveWebsitesToGroup = (websiteIds, targetGroupId, websites) => {
  return websites.map(website => {
    if (websiteIds.includes(website.id)) {
      return new Website(website.id, targetGroupId, website.name, website.url, website.description, website.faviconUrl, website.lastAccessTime, website.order, website.isAccessible);
    }
    return website;
  });
};

module.exports = {
  getWebsitesByGroupId,
  getWebsiteById,
  createWebsite,
  updateWebsite,
  deleteWebsite,
  reorderWebsites,
  batchDeleteWebsites,
  batchMoveWebsites
};

