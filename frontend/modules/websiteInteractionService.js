import { renderDashboardWithData, showNotification } from './dashboardDataService.js';
import { validateAndCompleteUrl } from './utils.js';
import { fetchAndRenderGroupSelect } from './groupSelectDataService.js';
import { hideContextMenu } from './contextMenu.js';
import { backendUrl } from '../config.js';
import modalInteractionService from './modalInteractionService.js';
import { WebsiteOperationService } from './websiteOperationService.js';
import { WebsiteSaveService } from './websiteDataService.js';
import { confirmWebsiteDelete } from './websiteDeleteService.js';
import { getGroups, createGroup } from './api.js';

let currentEditWebsiteGroupId = null;
let currentEditWebsiteId = null;

// 获取图标函数
export async function fetchIcon(url) {
    try {
        console.log('url2', url);
        const iconResponse = await fetch(`${backendUrl}/favicon?url=${url}`);
        if (iconResponse.ok) {
            console.log('iconResponse', iconResponse);
            return await iconResponse.json();
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch icon:', error);
        return null;
    }
}

const websiteOperationService = new WebsiteOperationService();
// 添加网站
export async function addWebsite() {
    try {
        await websiteOperationService.openWebsiteModal({
            mode: 'add',
            callback: async ({ newWebsiteName, newWebsiteUrl, newWebsiteDescription, newWebsiteGroup }) => {
                const websiteSaveService = new WebsiteSaveService();
                const result = await websiteSaveService.saveWebsite(null, {
                    name: newWebsiteName,
                    url: newWebsiteUrl,
                    description: newWebsiteDescription
                }, newWebsiteGroup);
                if (result) {
                    renderDashboardWithData();
                }
            }
        });
    } catch (error) {
        console.error('Failed to add website:', error);
        showNotification('添加网站失败', 'error');
    }
}
// 编辑网站
export async function editWebsite(groupId, websiteId) {
    console.log('编辑网站', groupId, websiteId);
    hideContextMenu();
    currentEditWebsiteGroupId = groupId;
    currentEditWebsiteId = websiteId;
    websiteOperationService.openWebsiteModal({
        mode: 'edit',
        websiteId: websiteId,
        groupId: groupId,
        callback: async ({ newWebsiteName, newWebsiteUrl, newWebsiteDescription, newWebsiteGroup }) => {
            const websiteSaveService = new WebsiteSaveService();
            const result = await websiteSaveService.saveWebsite(websiteId, {
                name: newWebsiteName,
                url: newWebsiteUrl,
                description: newWebsiteDescription
            }, newWebsiteGroup);
            if (result) {
                renderDashboardWithData();
            }
        }
    });
}

// 删除网站
export async function deleteWebsite(groupId, websiteId) {
    try {
        // 获取删除选项
        const deleteOption = await confirmWebsiteDelete({
            title: '删除网站',
            message: '请选择删除选项:',
            options: [
                { id: 'permanentDelete', label: '永久删除网站' },
                { id: 'moveToTrash', label: '将网站移动到回收站' }
            ]
        });
        console.log('deleteOption:', deleteOption);
        if (!deleteOption) return;

        // 执行删除操作
        const websiteSaveService = new WebsiteSaveService();
        await websiteSaveService.deleteWebsite(websiteId, deleteOption);

        // 更新UI
        renderDashboardWithData();
    } catch (error) {
        console.error('Failed to delete website:', error);
        showNotification('删除网站失败', 'error');
    }
}

// 获取网站信息
export function getWebsiteInfo(websiteId) {
    const websiteItem = document.querySelector(`.website-item[data-website-id="${websiteId}"]`);
    const websiteUrl = websiteItem.querySelector('a').getAttribute('href');
    const websiteName = websiteItem.querySelector('a').textContent;
    const websiteDescription = websiteItem.getAttribute('data-description');
    const websiteGroupId = websiteItem.getAttribute('data-group-id');
    return { websiteName, websiteUrl, websiteDescription, websiteGroupId };
}

// 保存网站
export async function saveModalWebsite() {
    hideContextMenu();
    const groupId = currentEditWebsiteGroupId;
    const websiteId = currentEditWebsiteId;
    const modalId = 'editWebsiteModal';
    openModal(modalId);
    const modalEditWebsiteName = document.getElementById('modalEditWebsiteName').value;
    let modalEditWebsiteUrl = document.getElementById('modalEditWebsiteUrl').value;
    const modalEditWebsiteDescription = document.getElementById('modalEditWebsiteDescription').value;
    const modalEditWebsiteGroup = document.getElementById('modalEditWebsiteGroup').value;

    modalEditWebsiteUrl = validateAndCompleteUrl(modalEditWebsiteUrl);
    if (!modalEditWebsiteUrl) {
        return;
    }

    let updateGroupId = modalEditWebsiteGroup;
    if (modalEditWebsiteGroup && parseInt(modalEditWebsiteGroup) !== parseInt(groupId)) {
        updateGroupId = modalEditWebsiteGroup;
    }
    try {
        const websiteSaveService = new WebsiteSaveService();
        const result = await websiteSaveService.saveWebsite(websiteId, {
            name: modalEditWebsiteName,
            url: modalEditWebsiteUrl,
            description: modalEditWebsiteDescription
        });
        if (result) {
            const iconData = await fetchIcon(modalEditWebsiteUrl);
            if (iconData) {
                await websiteSaveService.saveWebsite(websiteId, {
                    name: modalEditWebsiteName,
                    url: modalEditWebsiteUrl,
                    description: modalEditWebsiteDescription,
                    iconPath: iconData.iconPath
                });
            }
            renderDashboardWithData();
            closeModal(modalId);
        } else {
            showNotification('更新网站失败', 'error');
        }
    } catch (error) {
        console.error('Failed to save website:', error);
        showNotification('更新网站失败', 'error');
    }
}

/**
 * 打开导入网站模态框
 */
export async function openImportWebsitesModal() {
    const modalId = 'pasteWebsitesModal';
    modalInteractionService.openModal(modalId);
    document.querySelector('#pasteWebsitesModal textarea').focus();
    const groupSelect = document.getElementById('pasteWebsitesGroupSelect');
    if (!groupsData) {
        await fetchAndRenderGroupSelect();
    }
    groupSelect.innerHTML = '<option value="">选择分组</option>';
    const fragment = document.createDocumentFragment();
    groupsData.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        fragment.appendChild(option);
    });
    groupSelect.appendChild(fragment);
}

/**
 * 保存导入的网站
 */
export async function saveImportedWebsites() {
    const modalId = 'pasteWebsitesModal';
    const websites = document.querySelector('#pasteWebsitesModal textarea').value.trim().split('\n').filter(line => line.trim() !== '');
    if (websites.length === 0) {
        showNotification('没有检测到网站', 'error');
        closeModal(modalId);
        return;
    }
    const selectedGroupId = document.getElementById('pasteWebsitesGroupSelect').value;
    let groupId = selectedGroupId;
    let newGroup;
    if (!groupId) {
        const now = new Date();
        const groupName = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        try {
            const createGroupResponse = await fetch(`${backendUrl}/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: groupName })
            });
            if (!createGroupResponse.ok) {
                showNotification('创建分组失败', 'error');
                closeModal(modalId);
                return;
            }
            newGroup = await createGroupResponse.json();
            groupId = newGroup.id;
        } catch (error) {
            console.error('Failed to create group:', error);
            showNotification('创建分组失败', 'error');
            closeModal(modalId);
            return;
        }
    }
    try {
        const websiteSaveService = new WebsiteSaveService();
        for (const line of websites) {
            const parts = line.split('+').map(item => item.trim());
            if (parts.length >= 2) {
                const name = parts[0];
                const url = parts[1];
                const description = parts[2] || '';
                const validatedUrl = validateAndCompleteUrl(url);
                 if (validatedUrl) {
                    await websiteSaveService.saveWebsite(null, {
                        name: name,
                        url: validatedUrl,
                        description: description
                    }, groupId);
                }
            }
        }
        showNotification('网站导入成功', 'success');
        renderDashboardWithData();
        closeModal(modalId);
    } catch (error) {
        console.error('Failed to import websites:', error);
        showNotification('网站导入失败', 'error');
        closeModal(modalId);
    }
}

