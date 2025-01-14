const toggleThemeButton = document.getElementById('toggleTheme');
const body = document.body;

// 从 localStorage 获取主题
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.setAttribute('data-theme', savedTheme);
}

// 切换主题
toggleThemeButton.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

const dashboard = document.getElementById('dashboard');
const backendUrl = 'http://localhost:3000/api';
const groupSelect = document.getElementById('groupSelect');
let groupsData = null;

const toggleAddButtons = document.getElementById('toggleAddButtons');
const addButtons = document.querySelector('.add-buttons');
const showAddGroup = document.getElementById('showAddGroup');
const showAddWebsite = document.getElementById('showAddWebsite');

// 获取数据并渲染
async function fetchDataAndRender() {
    try {
        dashboard.classList.add('loading');
        const response = await fetch(`${backendUrl}/data`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        renderDashboard(data);
        showNotification('数据加载成功', 'success');
    } catch (error) {
        console.error('Failed to fetch data:', error);
        showNotification('数据加载失败，请重试', 'error');
    } finally {
        dashboard.classList.remove('loading');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    notification.style.transform = 'translateY(-20px)';
    notification.style.opacity = '0';
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 渲染仪表盘
function renderDashboard(data) {
    dashboard.innerHTML = '';
    const fragment = document.createDocumentFragment(); // 创建一个文档片段
    data.groups.forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.classList.add('group');
        groupDiv.setAttribute('draggable', true);
        groupDiv.id = `group-${group.id}`;
        groupDiv.innerHTML = `
            <h2>
                ${group.name}
                <input type="text" id="editGroupName-${group.id}" style="display:none;" placeholder="New Group Name">
                <button onclick="saveGroup(${group.id})" style="display:none;">保存</button>
            </h2>
            <div class="website-list" id="website-list-${group.id}"></div>
        `;
        const websiteList = document.createElement('div');
        websiteList.classList.add('website-list');
        websiteList.id = `website-list-${group.id}`;
        group.websites.forEach(website => {
            const websiteItem = document.createElement('div');
            websiteItem.classList.add('website-item');
            websiteItem.setAttribute('data-description', website.description);
            websiteItem.setAttribute('data-website-id', website.id);
            websiteItem.innerHTML = `
                ${website.iconPath ? `<img src="${backendUrl}${website.iconPath}" style="width: 16px; height: 16px; margin-right: 5px;">` : ''}
                <a href="${website.url}" target="_blank">${website.name}</a>
                <span style="display:none;">${website.iconPath}</span>
            `;
            websiteList.appendChild(websiteItem);
        });
        groupDiv.appendChild(websiteList);
        fragment.appendChild(groupDiv); // 将 groupDiv 添加到文档片段
    });
    dashboard.appendChild(fragment); // 将文档片段添加到 dashboard
}

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

async function saveGroupOrder() {
    const groupIds = Array.from(document.querySelectorAll('.group'))
        .map(group => parseInt(group.id.split('-')[1]));
    const response = await fetch(`${backendUrl}/data`);
    const data = await response.json();
    const orderedGroups = groupIds.map(id => data.groups.find(group => group.id === id));
    const updateResponse = await fetch(`${backendUrl}/groups/order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: orderedGroups })
    });
    if (!updateResponse.ok) {
        alert('保存分组顺序失败');
    }
}

// 渲染分组下拉框
function renderGroupSelect(data) {
    groupSelect.innerHTML = '<option value="">Select Group</option>';
    const fragment = document.createDocumentFragment();
    data.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        fragment.appendChild(option);
    });
    groupSelect.appendChild(fragment);
}

// 获取分组数据并渲染下拉框
async function fetchAndRenderGroupSelect() {
    try {
        const response = await fetch(`${backendUrl}/data`);
        groupsData = await response.json();
        renderGroupSelect(groupsData);
    } catch (error) {
        console.error('Failed to fetch group data:', error);
        alert('加载分组数据失败，请检查控制台获取详细信息');
    }
}

// 添加分组
async function addGroup() {
    const modal = document.getElementById('addGroupModal');
    const newGroupName = modal.querySelector('#newGroupName').value;
    if (!newGroupName) {
            showNotification('请输入分组名称', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${backendUrl}/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newGroupName })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        showNotification('分组添加成功', 'success');
        fetchDataAndRender();
        modal.querySelector('#newGroupName').value = '';
        fetchAndRenderGroupSelect();
        closeModal('addGroupModal');
    } catch (error) {
        console.error('Failed to add group:', error);
        showNotification('分组添加失败，请重试', 'error');
    }
}

// 添加网站
async function addWebsite() {
    const modal = document.getElementById('addWebsiteModal');
    const newWebsiteName = document.getElementById('newWebsiteName').value;
    let newWebsiteUrl = document.getElementById('newWebsiteUrl').value;
    const newWebsiteDescription = document.getElementById('newWebsiteDescription').value;
    const selectedGroupId = groupSelect.value;

    newWebsiteUrl = validateAndCompleteUrl(newWebsiteUrl);
    if (!newWebsiteUrl) {
        return;
    }

    if (!newWebsiteName || !newWebsiteUrl || !newWebsiteDescription) {
        alert('请输入网站名称、URL和描述');
        return;
    }

    let groupId = selectedGroupId;

    if (!groupId) {
        // 检查是否存在默认分组
        const response = await fetch(`${backendUrl}/data`);
        const data = await response.json();
        let defaultGroup = data.groups.find(group => group.name === 'Default');

        if (!defaultGroup) {
            // 创建默认分组
            const createGroupResponse = await fetch(`${backendUrl}/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Default' })
            });
            if (!createGroupResponse.ok) {
        alert('创建默认分组失败');
                return;
            }
            defaultGroup = await createGroupResponse.json();
            groupId = defaultGroup.id;
        } else {
            groupId = defaultGroup.id;
        }
    }

    const addWebsiteResponse = await fetch(`${backendUrl}/groups/${groupId}/websites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWebsiteName, url: newWebsiteUrl, description: newWebsiteDescription })
    });
    if (addWebsiteResponse.ok) {
        fetchDataAndRender();
        document.getElementById('newWebsiteName').value = '';
        document.getElementById('newWebsiteUrl').value = '';
        document.getElementById('newWebsiteDescription').value = '';
        groupSelect.value = '';
        closeModal('addWebsiteModal');
    } else {
        alert('Failed to add website.');
    }
}

// 删除分组
async function deleteGroup(groupId) {
    if (confirm('确定要删除这个分组吗？')) {
        const response = await fetch(`${backendUrl}/groups/${groupId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            fetchDataAndRender();
        } else {
        alert('删除分组失败');
        }
    }
}

// 删除网站
async function deleteWebsite(groupId, websiteId) {
    if (confirm('确定要删除这个网站吗？')) {
        const response = await fetch(`${backendUrl}/groups/${groupId}/websites/${websiteId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            fetchDataAndRender();
        } else {
        alert('删除网站失败');
        }
    }
}

// 隐藏右键菜单
function hideContextMenu() {
    document.getElementById('contextMenu')?.remove();
}

// 监听下拉框点击事件
groupSelect.addEventListener('click', () => {
    if (!groupsData) {
        fetchAndRenderGroupSelect();
    }
});

fetchDataAndRender();

// 右键菜单事件监听器
dashboard.addEventListener('contextmenu', function (e) {
    const target = e.target;
    hideContextMenu();
    if (target.closest('.group h2')) {
        e.preventDefault();
        const groupDiv = target.closest('.group');
        const groupId = groupDiv.querySelector('h2 input[id^="editGroupName-"]').getAttribute('id').match(/editGroupName-(\d+)/)[1];
        showGroupContextMenu(e, groupId);
    } else if (target.closest('.website-item')) {
        e.preventDefault();
        const websiteItem = target.closest('.website-item');
        const groupId = websiteItem.closest('.group').querySelector('h2 input[id^="editGroupName-"]').getAttribute('id').match(/editGroupName-(\d+)/)[1];
        const websiteId = websiteItem.getAttribute('data-website-id');
        if (websiteId) {
            showWebsiteContextMenu(e, groupId, websiteId);
        }
    }
});

dashboard.addEventListener('click', (e) => {
    const target = e.target.closest('.website-item');
    if (target) {
        const link = target.querySelector('a');
        if (link) {
            window.open(link.href, '_blank');
        }
    }
});

// 创建右键菜单
function createContextMenu(e, menuItems) {
    const menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.style.position = 'fixed';
    
    // 获取视口尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 直接使用鼠标位置
    let left = e.clientX;
    let top = e.clientY;
    
    // 确保菜单不会超出屏幕边界
    if (left + 200 > viewportWidth) {
        left = viewportWidth - 200;
    }
    if (top + 100 > viewportHeight) {
        top = viewportHeight - 100;
    }
    
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.zIndex = '1000';
    menu.innerHTML = menuItems.join('');
    document.body.appendChild(menu);
    document.addEventListener('click', hideContextMenu);
    return menu;
}

// 显示分组右键菜单
function showGroupContextMenu(e, groupId) {
    const menuItems = [
        `<div onclick="editGroup(${groupId})">编辑分组</div>`,
        `<div onclick="deleteGroup(${groupId})" >删除分组</div>`
    ];
    createContextMenu(e, menuItems);
}

// 显示网站右键菜单
function showWebsiteContextMenu(e, groupId, websiteId) {
    const menuItems = [
        `<div onclick="editWebsite(${groupId}, ${websiteId})">编辑网站</div>`,
        `<div onclick="deleteWebsite(${groupId}, ${websiteId})" >删除网站</div>`
    ];
    createContextMenu(e, menuItems);
}

// 编辑分组
let currentEditGroupId = null;
async function editGroup(groupId) {
    hideContextMenu();
    currentEditGroupId = groupId;
    const modal = document.getElementById('editGroupModal');
    modal.style.display = 'block';
    const modalEditGroupName = document.getElementById('modalEditGroupName');
    const groupDiv = document.querySelector(`.group:has(h2 input[id^="editGroupName-${groupId}"])`);
    const editInput = groupDiv.querySelector(`#editGroupName-${groupId}`);
    modalEditGroupName.value = editInput.value;
}

// URL 校验和补全函数
function validateAndCompleteUrl(url) {
    const urlRegex = /^[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(url)) {
        alert('请输入有效的URL');
        return null;
    }
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
        return 'https://' + url;
    }
    return url;
}

// 获取图标函数
async function fetchIcon(url) {
    console.log('url2', url);
    const iconResponse = await fetch(`${backendUrl}/favicon?url=${url}`);
    if (iconResponse.ok) {
        console.log('iconResponse', iconResponse);
        return await iconResponse.json();
    }
    return null;
}

// 保存分组
async function saveModalGroup() {
    hideContextMenu();
    const groupId = currentEditGroupId;
    const groupDiv = document.querySelector(`.group:has(h2 input[id^="editGroupName-${groupId}"])`);
    const editInput = groupDiv.querySelector(`#editGroupName-${groupId}`);
    const modal = document.getElementById('editGroupModal');
    const modalEditGroupName = document.getElementById('modalEditGroupName');
    const newGroupName = modalEditGroupName.value;
    if (!newGroupName) {
        alert('请输入新的分组名称');
        return;
    }
    const response = await fetch(`${backendUrl}/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName })
    });
    if (response.ok) {
        fetchDataAndRender();
        modal.style.display = 'none';
    } else {
        alert('更新分组名称失败');
    }
}

// 获取网站信息
function getWebsiteInfo(websiteId) {
    const websiteItem = document.querySelector(`.website-item a[href*="websiteId=${websiteId}"]`).closest('.website-item');
    const websiteUrl = websiteItem.querySelector('a').getAttribute('href').split('?')[0];
    const websiteName = websiteItem.querySelector('a').textContent;
    const websiteDescription = websiteItem.getAttribute('data-description');
    return { websiteName, websiteUrl, websiteDescription };
}

// 编辑网站
let currentEditWebsiteGroupId = null;
let currentEditWebsiteId = null;
async function editWebsite(groupId, websiteId) {
    hideContextMenu();
    currentEditWebsiteGroupId = groupId;
    currentEditWebsiteId = websiteId;
    const modal = document.getElementById('editWebsiteModal');
    modal.style.display = 'block';
    const modalEditWebsiteName = document.getElementById('modalEditWebsiteName');
    const modalEditWebsiteUrl = document.getElementById('modalEditWebsiteUrl');
    const modalEditWebsiteDescription = document.getElementById('modalEditWebsiteDescription');
    const modalEditWebsiteGroup = document.getElementById('modalEditWebsiteGroup');
    const { websiteName, websiteUrl, websiteDescription } = getWebsiteInfo(websiteId);
    modalEditWebsiteName.value = websiteName;
    modalEditWebsiteUrl.value = websiteUrl;
    modalEditWebsiteDescription.value = websiteDescription;
    // 填充分组下拉框
    if (!groupsData) {
        await fetchAndRenderGroupSelect();
    }
    modalEditWebsiteGroup.innerHTML = '<option value="">Select Group</option>';
    groupsData.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        if (group.id == groupId) {
            option.selected = true;
        }
        modalEditWebsiteGroup.appendChild(option);
    });
}

// 保存网站
async function saveModalWebsite() {
    hideContextMenu();
    const groupId = currentEditWebsiteGroupId;
    const websiteId = currentEditWebsiteId;
    const modal = document.getElementById('editWebsiteModal');
    const modalEditWebsiteName = document.getElementById('modalEditWebsiteName').value;
    let modalEditWebsiteUrl = document.getElementById('modalEditWebsiteUrl').value;
    const modalEditWebsiteDescription = document.getElementById('modalEditWebsiteDescription').value;
    const modalEditWebsiteGroup = document.getElementById('modalEditWebsiteGroup').value;

    modalEditWebsiteUrl = validateAndCompleteUrl(modalEditWebsiteUrl);
    if (!modalEditWebsiteUrl) {
        return;
    }

    let updateGroupId = groupId;
    if (modalEditWebsiteGroup && modalEditWebsiteGroup !== groupId) {
        updateGroupId = modalEditWebsiteGroup;
    }
    console.log('updateGroupId', updateGroupId);
    console.log('groupId', groupId);
    let response;
    if (parseInt(updateGroupId) !== groupId) {
        console.log('标记删除旧分组');
        // 先删除旧分组的网站
        response = await fetch(`${backendUrl}/groups/${groupId}/websites/${websiteId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
        alert('移动网站失败');
            return;
        }
        // 再添加新分组的网站
        console.log('标记添加新分组');
        response = await fetch(`${backendUrl}/groups/${updateGroupId}/websites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: modalEditWebsiteName, url: modalEditWebsiteUrl, description: modalEditWebsiteDescription, iconPath: null })
        });
    } else {
        console.log('标记修改网页');
        response = await fetch(`${backendUrl}/groups/${updateGroupId}/websites/${websiteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: modalEditWebsiteName, url: modalEditWebsiteUrl, description: modalEditWebsiteDescription, groupId: updateGroupId })
        });
    }

    if (response.ok) {
        const iconData = await fetchIcon(modalEditWebsiteUrl);
        console.log('iconData', iconData);
        if (iconData) {
            let updateResponse;
            if (parseInt(updateGroupId) !== groupId) {
                const data = await response.json();
                updateResponse = await fetch(`${backendUrl}/groups/${updateGroupId}/websites/${data.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: modalEditWebsiteName, url: modalEditWebsiteUrl, description: modalEditWebsiteDescription, iconPath: iconData.iconPath, groupId: updateGroupId })
                });
            } else {
                updateResponse = await fetch(`${backendUrl}/groups/${updateGroupId}/websites/${websiteId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: modalEditWebsiteName, url: modalEditWebsiteUrl, description: modalEditWebsiteDescription, iconPath: iconData.iconPath, groupId: updateGroupId })
                });
            }
        }
        fetchDataAndRender();
        modal.style.display = 'none';
    } else {
        alert('更新网站失败');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('closing');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
    }, 200); // Match the animation duration
}

toggleAddButtons.addEventListener('click', () => {
    addButtons.style.display = addButtons.style.display === 'none' ? 'flex' : 'none';
});

showAddGroup.addEventListener('click', () => {
    addButtons.style.display = 'none';
    const modal = document.getElementById('addGroupModal');
    modal.style.display = 'block';
});

showAddWebsite.addEventListener('click', () => {
    addButtons.style.display = 'none';
    const modal = document.getElementById('addWebsiteModal');
    modal.style.display = 'block';
});

const importDataButton = document.getElementById('importData');
const exportDataButton = document.getElementById('exportData');

importDataButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);
                const response = await fetch(`${backendUrl}/data`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jsonData),
                });
                if (response.ok) {
                    showNotification('数据导入成功', 'success');
                    fetchDataAndRender();
                } else {
                    showNotification('数据导入失败', 'error');
                }
            } catch (error) {
                console.error('Failed to import data:', error);
                showNotification('数据导入失败，请检查文件格式', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

exportDataButton.addEventListener('click', async () => {
    try {
        const response = await fetch(`${backendUrl}/data`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('数据导出成功', 'success');
    } catch (error) {
        console.error('Failed to export data:', error);
        showNotification('数据导出失败', 'error');
    }
});

const importWebsitesButton = document.getElementById('importWebsites');

importWebsitesButton.addEventListener('click', async () => {
    const modal = document.getElementById('pasteWebsitesModal');
    modal.style.display = 'block';
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
});

document.querySelector('#pasteWebsitesModal #cancelPasteWebsites').addEventListener('click', () => {
    closeModal('pasteWebsitesModal');
});

document.querySelector('#pasteWebsitesModal #savePasteWebsites').addEventListener('click', async () => {
        const websites = document.querySelector('#pasteWebsitesModal textarea').value.trim().split('\n').filter(line => line.trim() !== '');
        if (websites.length === 0) {
            showNotification('没有检测到网站', 'error');
            closeModal('pasteWebsitesModal');
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
                    closeModal('pasteWebsitesModal');
                    return;
                }
                newGroup = await createGroupResponse.json();
                groupId = newGroup.id;
            } catch (error) {
                console.error('Failed to create group:', error);
                showNotification('创建分组失败', 'error');
                closeModal('pasteWebsitesModal');
                return;
            }
        }
        try {
            for (const line of websites) {
                const [name, url] = line.split(':').map(item => item.trim());
                if (name && url) {
                    const validatedUrl = validateAndCompleteUrl(url);
                    if (validatedUrl) {
                        await fetch(`${backendUrl}/groups/${groupId}/websites`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: name, url: validatedUrl, description: '' })
                        });
                    }
                }
            }
            showNotification('网站导入成功', 'success');
            fetchDataAndRender();
            closeModal('pasteWebsitesModal');
        } catch (error) {
            console.error('Failed to import websites:', error);
            showNotification('网站导入失败', 'error');
            closeModal('pasteWebsitesModal');
        }
    });

    let currentTooltip = null;
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.remove();
    }
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            if (!currentTooltip) {
                currentTooltip = document.createElement('div');
                currentTooltip.id = 'tooltip';
                document.body.appendChild(currentTooltip);
            }
            const tooltipText = target.getAttribute('data-tooltip');
            currentTooltip.textContent = tooltipText;
            currentTooltip.style.display = 'block';
            const rect = target.getBoundingClientRect();
            currentTooltip.style.left = `${rect.left + window.scrollX-5}px`;
            currentTooltip.style.top = `${rect.top + window.scrollY+5 }px`;
        }
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target && currentTooltip) {
            currentTooltip.style.display = 'none';
            currentTooltip.remove();
            currentTooltip = null;
        }
    });
