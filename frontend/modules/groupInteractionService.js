import { renderDashboardWithData, showNotification } from './dashboardDataService.js';
import { fetchAndRenderGroupSelect } from './groupSelectDataService.js';
import { hideContextMenu } from './contextMenu.js';
import { backendUrl } from '../config.js';
import { getGroupById, updateGroup,createGroup } from './api.js';
import modalInteractionService from './modalInteractionService.js';

let currentEditGroupId = null;

// 添加分组
export async function addGroup() {
    console.log('addGroup');
    const modalId = 'groupModal';
    const newGroupName = document.getElementById('newGroupName').value;
    if (!newGroupName) {
        showNotification('请输入分组名称', 'error');
        return;
    }
    
    try {
        const addGroup = await createGroup({ name: newGroupName, isCollapsible: false });
        
        if (!addGroup) throw new Error(`HTTP error! status: ${addGroup.status}`);
        
        showNotification('分组添加成功', 'success');
        renderDashboardWithData();
        modalInteractionService.setModalData(modalId, { newGroupName: '' });//清空输入框的值
        modalInteractionService.closeModal(modalId);
    } catch (error) {
        console.error('Failed to add group:', error);
        showNotification('分组添加失败，请重试', 'error');
    }
}

// 删除分组
export async function deleteGroup(groupId) {
    const modalId = 'deleteGroupModal';
    const deleteOption = await new Promise((resolve) => {
        const modalContent = `
            <div class="modal-content">
                <span class="close close-modal-button" id="closeDeleteGroupModal">&times;</span>
                <h2>删除分组</h2>
                <p>请选择删除选项:</p>
                <div class="modal-buttons-container">
                    <button class="save-modal-button" id="permanentDelete">永久删除分组和网站</button>
                    <button class="save-modal-button" id="moveToTrash">将网站移动到回收站</button>
                    <button class="cancel-modal-button" id="cancelDeleteGroupModal">取消</button>
                </div>
            </div>
        `;
        modalInteractionService.createModal(modalId, modalContent);
        modalInteractionService.openModal(modalId);

        document.getElementById('permanentDelete').addEventListener('click', () => {
            resolve('permanentDelete');
            modalInteractionService.closeModal(modalId);
        });

        document.getElementById('moveToTrash').addEventListener('click', () => {
            resolve('moveToTrash');
            modalInteractionService.closeModal(modalId);
        });
    });

    if (deleteOption) {
        try {
            const response = await fetch(`${backendUrl}/groups/${groupId}?deleteOption=${deleteOption}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                renderDashboardWithData();
            } else {
                showNotification('删除分组失败', 'error');
            }
        } catch (error) {
            console.error('Failed to delete group:', error);
            showNotification('删除分组失败', 'error');
        }
    }
}

// 保存分组
/* export async function saveModalGroup() {
    hideContextMenu();
    const groupId = currentEditGroupId;
    const modalId = 'addGroupModal';
    const modalEditGroupName = document.getElementById('newGroupName');
    const newGroupName = modalEditGroupName.value;
    if (!newGroupName) {
        showNotification('请输入新的分组名称', 'error');
        return;
    }
    try {
        // 调用 apiService 更新分组数据
        const response = await updateGroup(groupId, { name: newGroupName, isCollapsible: false });
        if (response) {
            //多一次渲染 dashboardWithData，需要网络请求
            renderDashboardWithData();
            closeModal(modalId);
        } else {
            showNotification('更新分组名称失败', 'error');
        }
    } catch (error) {
        console.error('Failed to save group:', error);
        showNotification('更新分组名称失败', 'error');
    }
} */
// 保存分组
/* 更新 saveModalGroup 函数：

使用 updateGroup 函数来更新分组数据。
传递 groupId 和包含新分组名称和 isCollapsible 状态的对象作为参数。
如果更新成功，直接更新 DOM 中的 h2 元素的文本内容为新的分组名称。
关闭模态框并显示成功通知。
避免重新调用 renderDashboardWithData：

通过直接更新 DOM，避免了重新获取和渲染整个仪表盘数据，从而提高了性能和用户体验。 */
export async function saveModalGroup() {
    console.log('saveModalGroup');
    hideContextMenu();
    const groupId = currentEditGroupId;
    const modalId = 'groupModal';
    const modalEditGroupName = document.getElementById('newGroupName');
    const newGroupName = modalEditGroupName.value;
    if (!newGroupName) {
        showNotification('请输入新的分组名称', 'error');
        return;
    }
    try {
        const updatedGroup = await updateGroup(groupId, { name: newGroupName, isCollapsible: false });
        if (updatedGroup) {
            // 直接更新 DOM
            const groupDiv = document.querySelector(`#group-${groupId}`);
            if (groupDiv) {
                groupDiv.querySelector('h2').textContent = newGroupName;
                groupDiv.setAttribute('data-group-id', updatedGroup.id);
                groupDiv.id = `group-${updatedGroup.id}`;
            }
            //const modalInteractionService = new ModalInteractionService();
            //modalInteractionService.setModalData(modalId, { newGroupName: '' });
            modalInteractionService.closeModal(modalId);
            showNotification('分组名称更新成功', 'success');
        } else {
            showNotification('更新分组名称失败', 'error');
        }
    } catch (error) {
        console.error('Failed to save group:', error);
        showNotification('更新分组名称失败', 'error');
    }
}

// 打开编辑分组模态框
/**
 * 打开编辑分组模态框
 * @param {string} groupId - 分组 ID，如果为 null 则表示添加分组
 */
export async function openEditGroupModal(groupId = null) {
    hideContextMenu();
    currentEditGroupId = groupId;
    const modalId = 'groupModal';
    //const modalInteractionService = new ModalInteractionService();
    // 根据 groupId 是否存在来设置模态框标题和按钮文本
    let modalContent = `
        <div class="modal-content">
            <span class="close close-modal-button" aria-label="${groupId ? '关闭编辑分组模态框' : '关闭添加分组模态框'}">&times;</span>
            <h2>${groupId ? '编辑分组' : '添加分组'}</h2>
            <input type="text" id="newGroupName" placeholder="新分组名称">
            <div class="modal-buttons-container">
                <button class="save-modal-button" aria-label="${groupId ? '保存分组' : '添加新分组'}">保存</button>
                <button class="cancel-modal-button" aria-label="取消创建分组">取消</button>
            </div>
        </div>
    `;
    //每次都重新创建模态框
    const modalIdCreated = modalInteractionService.createModal(modalId, modalContent);
    // 如果是编辑分组，则获取分组信息并设置模态框数据
    if (groupId) {
        const modal = document.getElementById(modalIdCreated);
        modal.setAttribute('data-group-id', groupId);
        const groupDiv = document.querySelector(`.group:has(h2 input[id^="editGroupName-${groupId}"])`);
        setTimeout(() => {
            const editInput = groupDiv?.querySelector(`#editGroupName-${groupId}`);
            modalInteractionService.openModal(modalId);
            modalInteractionService.setModalData(modalId, { newGroupName: editInput?.value || '' });
        }, 0);
    } else {
        // 如果是添加分组，则直接打开模态框
        modalInteractionService.openModal(modalId);
    }
}