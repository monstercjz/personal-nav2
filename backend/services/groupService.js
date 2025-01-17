// backend/services/groupService.js
const Group = require('../models/Group');
const fileHandler = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

const dataFilePath = `${__dirname}/../data/sites-data.json`;

/**
 * @description 获取所有分组
 */
const getAllGroups = async () => {
  const data = await fileHandler.readData(dataFilePath);
  return (data.groups || []).map(group => new Group(group.id, group.name, group.order));
};

/**
 * @description 创建新的分组
 */
const createGroup = async (groupData) => {
  const data = await fileHandler.readData(dataFilePath);
  const newGroup = new Group(uuidv4(), groupData.name, data.nextGroupId);
  data.groups = [...(data.groups || []), newGroup]
  data.nextGroupId = data.nextGroupId + 1;
  await fileHandler.writeData(dataFilePath, data);
  return newGroup;
};

/**
 * @description 获取单个分组详情
 */
const getGroupById = async (groupId) => {
  const data = await fileHandler.readData(dataFilePath);
  const groupData = (data.groups || []).find((group) => group.id === groupId);
  return groupData ? new Group(groupData.id, groupData.name, groupData.order) : undefined;
};

/**
 * @description 更新分组信息
 */
const updateGroup = async (groupId, groupData) => {
  const data = await fileHandler.readData(dataFilePath);
  const updatedGroups = (data.groups || []).map(group => {
    if (group.id === groupId) {
      const updatedGroup = new Group(group.id, groupData.name, group.order);
      return updatedGroup;
    }
    return new Group(group.id, group.name, group.order);
  });
  data.groups = updatedGroups;
  await fileHandler.writeData(dataFilePath, data);
  return updatedGroups.find(group => group.id === groupId);
};

/**
 * @description 删除分组
 */
const deleteGroup = async (groupId) => {
  const data = await fileHandler.readData(dataFilePath);
  let groups = (data.groups || []).filter((group) => group.id !== groupId);
  groups = groups.map((group, index) => new Group(group.id, group.name, index + 1));
  data.groups = groups;
  data.nextGroupId = groups.length + 1;
  await fileHandler.writeData(dataFilePath, data);
  return { message: 'Group deleted successfully' };
};

/**
 * @description 分组排序
 */
const reorderGroups = async (reorderData) => {
    const data = await fileHandler.readData(dataFilePath);
    const groups = data.groups || [];
    const orderedGroups = reorderData.map(item => {
      const groupData = groups.find(group => group.id === item.id);
      return groupData ? new Group(groupData.id, groupData.name, item.order) : undefined;
    });
    data.groups = orderedGroups;
    await fileHandler.writeData(dataFilePath, data);
    return orderedGroups;
};

module.exports = {
  getAllGroups,
  createGroup,
  getGroupById,
  updateGroup,
  deleteGroup,
  reorderGroups
};