import { renderDashboardWithData, showNotification } from './dashboardDataService.js';
import { validateAndCompleteUrl } from './utils.js';
import { fetchAndRenderGroupSelect } from './groupSelectDataService.js';
import { hideContextMenu } from './contextMenu.js';
import { backendUrl } from '../config.js';
import modalInteractionService from './modalInteractionService.js';

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

// 添加网站
export async function addWebsite() {
    const modalId = 'addWebsiteModal';
    const newWebsiteName = document.getElementById('newWebsiteName').value;
    let newWebsiteUrl = document.getElementById('newWebsiteUrl').value;
    const newWebsiteDescription = document.getElementById('newWebsiteDescription').value;
    const selectedGroupId = document.getElementById('groupSelect').value;

    newWebsiteUrl = validateAndCompleteUrl(newWebsiteUrl);
    if (!newWebsiteUrl) {
        return;
    }

    if (!newWebsiteName || !newWebsiteUrl || !newWebsiteDescription) {
        showNotification('请输入网站名称、URL和描述', 'error');
        return;
    }

    let groupId = selectedGroupId;

    if (!groupId) {
        // 检查是否存在默认分组
        try {
            const response = await fetch(`${backendUrl}/data`);
            const { groups } = await response.json();
            let defaultGroup = groups.find(group => group.name === 'Default');

            if (!defaultGroup) {
                // 创建默认分组
                const createGroupResponse = await fetch(`${backendUrl}/groups`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'Default' })
                });
                if (!createGroupResponse.ok) {
                    showNotification('创建默认分组失败', 'error');
                    return;
                }
                defaultGroup = await createGroupResponse.json();
                groupId = defaultGroup.id;
            } else {
                groupId = defaultGroup.id;
            }
        } catch (error) {
            console.error('Failed to fetch or create default group:', error);
            showNotification('创建默认分组失败', 'error');
            return;
        }
    }

    try {
        const addWebsiteResponse = await fetch(`${backendUrl}/websites/groups/${groupId}/websites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newWebsiteName, url: newWebsiteUrl, description: newWebsiteDescription })
        });
        if (addWebsiteResponse.ok) {
            renderDashboardWithData();
            modalInteractionService.setModalData(modalId, {
                newWebsiteName: '',
                newWebsiteUrl: '',
                newWebsiteDescription: '',
                groupSelect: ''
            });
            modalInteractionService.closeModal(modalId);
        } else {
            showNotification('Failed to add website.', 'error');
        }
    } catch (error) {
        console.error('Failed to add website:', error);
        showNotification('Failed to add website.', 'error');
    }
}

// 删除网站
export async function deleteWebsite(groupId, websiteId) {
    const deleteOption = await new Promise((resolve) => {
        const modalId = 'deleteWebsiteModal';
        const modalContent = `
            <div class="modal-content">
                <span class="close close-modal-button">&times;</span>
                <h2>删除网站</h2>
                <p>请选择删除选项:</p>
                <div class="modal-buttons-container">
                    <button class="save-modal-button" id="permanentDelete">永久删除</button>
                    <button class="save-modal-button" id="moveToTrash">移动到回收站</button>
                    <button class="cancel-modal-button">取消</button>
                </div>
            </div>
        `;
        modalInteractionService.createModal(modalId, modalContent);
        modalInteractionService.openModal(modalId);

        document.getElementById('permanentDelete').addEventListener('click', () => {
            resolve('permanent');
            modalInteractionService.closeModal(modalId);
        });

        document.getElementById('moveToTrash').addEventListener('click', () => {
            resolve('moveToTrash');
            modalInteractionService.closeModal(modalId);
        });
    });

    if (deleteOption) {
        try {
            const response = await fetch(`${backendUrl}/websites/${websiteId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deleteOption })
            });
            if (response.ok) {
                renderDashboardWithData();
            } else {
                showNotification('删除网站失败', 'error');
            }
        } catch (error) {
            console.error('Failed to delete website:', error);
            showNotification('删除网站失败', 'error');
        }
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

    let updateGroupId = groupId;
    if (modalEditWebsiteGroup && parseInt(modalEditWebsiteGroup) !== parseInt(groupId)) {
        updateGroupId = modalEditWebsiteGroup;
    }
    let response;
     try {
        if (parseInt(updateGroupId) !== parseInt(groupId)) {
            // 先删除旧分组的网站
            response = await fetch(`${backendUrl}/websites/groups/${groupId}/websites/${websiteId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                showNotification('移动网站失败', 'error');
                return;
            }
            // 再添加新分组的网站
            response = await fetch(`${backendUrl}/websites/groups/${updateGroupId}/websites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modalEditWebsiteName, url: modalEditWebsiteUrl, description: modalEditWebsiteDescription })
            });
        } else {
             response = await fetch(`${backendUrl}/websites/${websiteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modalEditWebsiteName, url: modalEditWebsiteUrl, description: modalEditWebsiteDescription })
            });
        }


        if (response.ok) {
            const iconData = await fetchIcon(modalEditWebsiteUrl);
            if (iconData) {
                let updateResponse;
                 if (parseInt(updateGroupId) !== parseInt(groupId)) {
                    const data = await response.json();
                    updateResponse = await fetch(`${backendUrl}/websites/groups/${updateGroupId}/websites/${data.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: modalEditWebsiteName, url: modalEditWebsiteUrl, description: modalEditWebsiteDescription, iconPath: iconData.iconPath })
                    });
                } else {
                     updateResponse = await fetch(`${backendUrl}/websites/groups/${updateGroupId}/websites/${websiteId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: modalEditWebsiteName, url: modalEditWebsiteUrl, description: modalEditWebsiteDescription, iconPath: iconData.iconPath })
                    });
                }
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
        for (const line of websites) {
            const parts = line.split('+').map(item => item.trim());
            if (parts.length >= 2) {
                const name = parts[0];
                const url = parts[1];
                const description = parts[2] || '';
                const validatedUrl = validateAndCompleteUrl(url);
                if (validatedUrl) {
                    await fetch(`${backendUrl}/websites/groups/${groupId}/websites`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: name, url: validatedUrl, description: description, groupId: parseInt(groupId) })
                    });
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

// 编辑网站
export async function editWebsite(groupId, websiteId) {
    hideContextMenu();
    currentEditWebsiteGroupId = groupId;
    currentEditWebsiteId = websiteId;
    const modalId = 'addWebsiteModal';
    const { websiteName, websiteUrl, websiteDescription, websiteGroupId } = getWebsiteInfo(websiteId);
    modalInteractionService.openModal(modalId);
    modalInteractionService.setModalData(modalId, {
        newWebsiteName: websiteName,
        newWebsiteUrl: websiteUrl,
        newWebsiteDescription: websiteDescription,
        groupSelect: websiteGroupId
    });
}