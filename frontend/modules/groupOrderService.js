import { renderDashboardWithData } from './dashboardDataService.js';
import { reorderGroups } from './api.js';

const dashboard = document.getElementById('dashboard');

dashboard.addEventListener('dragstart', (e) => {
    if (!e.target.closest('.group')) {
        e.preventDefault();
        return;
    }
    e.stopPropagation(); // 阻止事件冒泡
    e.dataTransfer.setData('text/plain', e.target.closest('.group').id);
});

dashboard.addEventListener('dragover', (e) => {
    e.preventDefault();
});

dashboard.addEventListener('drop', (e) => {
    e.preventDefault();
    const draggedGroupId = e.dataTransfer.getData('text/plain');
    const targetGroup = e.target.closest('.group');
    if (!targetGroup) return; // 避免在非 .group 元素上触发拖拽
    if (targetGroup && targetGroup.id !== draggedGroupId) {
        const draggedGroup = document.getElementById(draggedGroupId);
        const dashboard = document.getElementById('dashboard');
        const draggedIndex = Array.from(dashboard.children).indexOf(draggedGroup);
        const targetIndex = Array.from(dashboard.children).indexOf(targetGroup);
        if (draggedIndex < targetIndex) {
            dashboard.insertBefore(draggedGroup, targetGroup.nextSibling);
        } else {
            dashboard.insertBefore(draggedGroup, targetGroup);
        }
        saveGroupOrder();
    }
});

// 保存分组顺序
async function saveGroupOrder() {
    // 获取页面上的 'dashboard' 元素
    const dashboard = document.getElementById('dashboard');
    
    // 提取所有分组元素的 ID，并将其转换为整数
    const groupIds = Array.from(document.querySelectorAll('.group'))
        .map(group => parseInt(group.id.split('-')[1]));
    
    // 向后端请求数据，以获取最新的信息
    
    // 构建分组顺序对象数组，每个对象包含分组 ID 和其顺序
    const orderedGroups = groupIds.map(id => ({ id: id, order: groupIds.indexOf(id) + 1 }));
    
    // 向后端发送 PUT 请求，更新分组的顺序
    try {
        const updateResponse = await reorderGroups(orderedGroups);
        if (!updateResponse) {
            showNotification('保存分组顺序失败', 'error');
        }
    } catch (error) {
        console.error('Failed to save group order:', error);
        showNotification('保存分组顺序失败', 'error');
    }
}