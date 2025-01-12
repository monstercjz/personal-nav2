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
        const response = await fetch(`${backendUrl}/data`);
        const data = await response.json();
        renderDashboard(data);
    } catch (error) {
        console.error('Failed to fetch data:', error);
        alert('Failed to load data. Please check the console for details.');
    }
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
            websiteItem.innerHTML = `
                ${website.iconPath ? `<img src="${backendUrl}${website.iconPath}" style="width: 16px; height: 16px; margin-right: 5px;">` : ''}
                <a href="${website.url}?websiteId=${website.id}" target="_blank">${website.name}</a>
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
        alert('Failed to save group order.');
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
        alert('Failed to load group data. Please check the console for details.');
    }
}

// 添加分组
async function addGroup() {
    const modal = document.getElementById('addGroupModal');
    const newGroupName = modal.querySelector('#newGroupName').value;
    if (!newGroupName) {
        alert('Please enter a group name.');
        return;
    }
    const response = await fetch(`${backendUrl}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName })
    });
    if (response.ok) {
        fetchDataAndRender();
        modal.querySelector('#newGroupName').value = '';
        fetchAndRenderGroupSelect();
        closeModal('addGroupModal');
    } else {
        alert('Failed to add group.');
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
        alert('Please enter website name, URL and description.');
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
                alert('Failed to create default group.');
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
    if (confirm('Are you sure you want to delete this group?')) {
        const response = await fetch(`${backendUrl}/groups/${groupId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            fetchDataAndRender();
        } else {
            alert('Failed to delete group.');
        }
    }
}

// 删除网站
async function deleteWebsite(groupId, websiteId) {
    if (confirm('Are you sure you want to delete this website?')) {
        const response = await fetch(`${backendUrl}/groups/${groupId}/websites/${websiteId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            fetchDataAndRender();
        } else {
            alert('Failed to delete website.');
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
    } else if (target.closest('.website-item a')) {
        e.preventDefault();
        const websiteItem = target.closest('.website-item');
        const groupId = websiteItem.closest('.group').querySelector('h2 input[id^="editGroupName-"]').getAttribute('id').match(/editGroupName-(\d+)/)[1];
        const websiteUrl = target.getAttribute('href');
        const websiteIdMatch = websiteUrl.match(/websiteId=(\d+)/);
        const websiteId = websiteIdMatch ? websiteIdMatch[1] : null;
        if (websiteId) {
            showWebsiteContextMenu(e, groupId, websiteId);
        }
    }
});

// 创建右键菜单
function createContextMenu(e, menuItems) {
    const menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    menu.innerHTML = menuItems.join('');
    document.body.appendChild(menu);
    document.addEventListener('click', hideContextMenu);
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
        alert('Please enter a valid URL.');
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
        alert('Please enter a new group name.');
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
        alert('Failed to update group name.');
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
            alert('Failed to move website.');
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
        alert('Failed to update website.');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
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