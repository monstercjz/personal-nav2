import { createWebsite, updateWebsite, deleteWebsite, batchMoveWebsites, moveToTrash } from './api.js';
import { showNotification } from './dashboardDataService.js';

export class WebsiteSaveService {
  async saveWebsite(websiteId, websiteData, groupId) {
    try {
        console.log('groupId:', groupId);
        console.log('websiteData:', websiteData);
        console.log('websiteId:', websiteId);
        let actualGroupId = groupId;
        if (!actualGroupId) {
            const { getGroups, createGroup } = await import('./api.js');
            try {
                const  groups  = await getGroups();
                console.log('groups:', groups);
                let defaultGroup;
                if (groups) {
                    
                    defaultGroup = groups.find(group => group.name === 'Default');
                    console.log('defaultGroup:', defaultGroup);
                }
                if (!defaultGroup) {
                    const newGroup = await createGroup({ name: 'Default',isCollapsible: false });
                    actualGroupId = newGroup.id;
                } else {
                    actualGroupId = defaultGroup.id;
                }
            } catch (error) {
                console.error('Failed to fetch or create default group:', error);
                showNotification('创建默认分组失败', 'error');
                throw error;
            }
        }
      if (websiteId) {
        // 更新网站
        const updatedWebsite = await updateWebsite(websiteId, websiteData);
        showNotification('网站更新成功', 'success');
        return updatedWebsite;
      } else {
        // 创建网站
        const newWebsite = await createWebsite(actualGroupId, websiteData);
        showNotification('网站创建成功', 'success');
        return newWebsite;
      }
    } catch (error) {
      console.error('Failed to save website:', error);
      showNotification('保存网站失败，请重试', 'error');
      throw error;
    }
  }

  async deleteWebsite(websiteId, deleteOption) {
    try {
      if (deleteOption === 'permanentDelete') {
        const response = await deleteWebsite(websiteId);
        showNotification('网站删除成功', 'success');
        return response;
      } else if (deleteOption === 'moveToTrash') {
        const response = await moveToTrash(websiteId);
        showNotification('网站已移动到回收站', 'success');
        return response;
      }
    } catch (error) {
      console.error('Failed to delete website:', error);
      showNotification('删除网站失败，请重试', 'error');
      throw error;
    }
  }

    async moveWebsites(websiteIds, groupId) {
        try {
            const response = await batchMoveWebsites(websiteIds, groupId);
            showNotification('网站移动成功', 'success');
            return response;
        } catch (error) {
            console.error('Failed to move websites:', error);
            showNotification('移动网站失败，请重试', 'error');
            throw error;
        }
    }
}