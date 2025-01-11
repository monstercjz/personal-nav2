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
    const response = await fetch(`${backendUrl}/data`);
    const data = await response.json();
    renderDashboard(data);
}

// 渲染仪表盘
function renderDashboard(data) {
    dashboard.innerHTML = '';
    data.groups.forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.classList.add('group');
        groupDiv.innerHTML = `
            <h2>
                ${group.name}
                <input type="text" id="editGroupName-${group.id}" style="display:none;" placeholder="New Group Name">
                <button onclick="saveGroup(${group.id})" style="display:none;">保存</button>
            </h2>
            <div class="website-list" id="website-list-${group.id}"></div>

            <div class="modal" id="editGroupModal-${group.id}" style="display:none;">
                <div class="modal-content">
                    <span class="close" onclick="closeModal('editGroupModal-${group.id}')">&times;</span>
                    <h2>Edit Group</h2>
                    <input type="text" id="modalEditGroupName-${group.id}" placeholder="New Group Name">
                    <button onclick="saveModalGroup(${group.id})">Save</button>
                    <button onclick="closeModal('editGroupModal-${group.id}')">Cancel</button>
                </div>
            </div>
        `;
        dashboard.appendChild(groupDiv);
        const websiteList = document.getElementById(`website-list-${group.id}`);
        group.websites.forEach(website => {
            const websiteItem = document.createElement('div');
            websiteItem.classList.add('website-item');
            websiteItem.innerHTML = `
                ${website.iconPath ? `<img src="${backendUrl}${website.iconPath}" style="width: 16px; height: 16px; margin-right: 5px;">` : ''}
                <a href="${website.url}" target="_blank">${website.name}</a>
                <span style="display:none;">${website.iconPath}</span>

                <div class="modal" id="editWebsiteModal-${group.id}-${website.id}" style="display:none;">
                    <div class="modal-content">
                        <span class="close" onclick="closeModal('editWebsiteModal-${group.id}-${website.id}')">&times;</span>
                        <h2>Edit Website</h2>
                        <input type="text" id="modalEditWebsiteName-${group.id}-${website.id}" placeholder="New Website Name" value="${website.name}">
                        <input type="text" id="modalEditWebsiteUrl-${group.id}-${website.id}" placeholder="New Website URL" value="${website.url}">
                        <input type="text" id="modalEditWebsiteDescription-${group.id}-${website.id}" placeholder="New Website Description" value="${website.description}" >
                        <button onclick="saveModalWebsite(${group.id}, ${website.id})">Save</button>
                        <button onclick="closeModal('editWebsiteModal-${group.id}-${website.id}')">Cancel</button>
                    </div>
                </div>
            `;
            websiteList.appendChild(websiteItem);
        });
    });
}

// 渲染分组下拉框
function renderGroupSelect(data) {
    groupSelect.innerHTML = '<option value="">Select Group</option>';
    data.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        groupSelect.appendChild(option);
    });
}

// 获取分组数据并渲染下拉框
async function fetchAndRenderGroupSelect() {
    const response = await fetch(`${backendUrl}/data`);
    groupsData = await response.json();
    renderGroupSelect(groupsData);
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

    // URL 校验和补全
    const urlRegex = /^[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(newWebsiteUrl)) {
        alert('Please enter a valid URL.');
        return;
    }
    if (!newWebsiteUrl.startsWith('https://') && !newWebsiteUrl.startsWith('http://')) {
        newWebsiteUrl = 'https://' + newWebsiteUrl;
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
            if (createGroupResponse.ok) {
                defaultGroup = await createGroupResponse.json();
                groupId = defaultGroup.id;
            } else {
                alert('Failed to create default group.');
                return;
            }
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
        // 清空下拉框
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
document.addEventListener('contextmenu', function (e) {
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
        const websiteId = websiteItem.querySelector('div[id^="editWebsiteModal-"]').getAttribute('id').match(/editWebsiteModal-(\d+)-(\d+)/)[2];
        showWebsiteContextMenu(e, groupId, websiteId);
    }
});

// 显示分组右键菜单
function showGroupContextMenu(e, groupId) {
    const menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    menu.innerHTML = `
        <div onclick="editGroup(${groupId})">编辑分组</div>
        <div onclick="deleteGroup(${groupId})" >删除分组</div>
    `;
    document.body.appendChild(menu);
    document.addEventListener('click', hideContextMenu);
}

// 显示网站右键菜单
function showWebsiteContextMenu(e, groupId, websiteId) {
    const menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    menu.innerHTML = `
        <div onclick="editWebsite(${groupId}, ${websiteId})">编辑网站</div>
        <div onclick="deleteWebsite(${groupId}, ${websiteId})" >删除网站</div>
    `;
    document.body.appendChild(menu);
    document.addEventListener('click', hideContextMenu);
}

// 编辑分组
async function editGroup(groupId) {
    hideContextMenu();
    const modal = document.getElementById(`editGroupModal-${groupId}`);
    modal.style.display = 'block';
    const modalEditGroupName = document.getElementById(`modalEditGroupName-${groupId}`);
    const groupDiv = document.querySelector(`.group:has(h2 input[id^="editGroupName-${groupId}"])`);
    const editInput = groupDiv.querySelector(`#editGroupName-${groupId}`);
    modalEditGroupName.value = editInput.value;
}

// 保存分组
async function saveGroup(groupId) {
    const groupDiv = document.querySelector(`.group:has(h2 input[id^="editGroupName-${groupId}"])`);
    const editInput = groupDiv.querySelector(`#editGroupName-${groupId}`);
    const modal = document.getElementById(`editGroupModal-${groupId}`);
    const modalEditGroupName = document.getElementById(`modalEditGroupName-${groupId}`);
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

async function saveModalGroup(groupId) {
    hideContextMenu();
    const groupDiv = document.querySelector(`.group:has(h2 input[id^="editGroupName-${groupId}"])`);
    const editInput = groupDiv.querySelector(`#editGroupName-${groupId}`);
    const modal = document.getElementById(`editGroupModal-${groupId}`);
    const modalEditGroupName = document.getElementById(`modalEditGroupName-${groupId}`);
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

// 编辑网站
async function editWebsite(groupId, websiteId) {
    hideContextMenu();
    const modal = document.getElementById(`editWebsiteModal-${groupId}-${websiteId}`);
    modal.style.display = 'block';
    const modalEditWebsiteName = document.getElementById(`modalEditWebsiteName-${groupId}-${websiteId}`);
    const modalEditWebsiteUrl = document.getElementById(`modalEditWebsiteUrl-${groupId}-${websiteId}`);
    const modalEditWebsiteDescription = document.getElementById(`modalEditWebsiteDescription-${groupId}-${websiteId}`);
    const websiteItem = document.querySelector(`.website-item:has(div[id^="editWebsiteModal-${groupId}-${websiteId}"])`);
    const website = websiteItem.querySelector('a');
    modalEditWebsiteName.value = website.textContent;
    modalEditWebsiteUrl.value = website.href;
    modalEditWebsiteDescription.value = websiteItem.querySelector('div[id^="editWebsiteModal-"] input[id^="modalEditWebsiteDescription-"]').value;
}

// 保存网站
async function saveWebsite(groupId, websiteId) {
    const modal = document.getElementById(`editWebsiteModal-${groupId}-${websiteId}`);
    const modalEditWebsiteName = document.getElementById(`modalEditWebsiteName-${groupId}-${websiteId}`).value;
    let modalEditWebsiteUrl = document.getElementById(`modalEditWebsiteUrl-${groupId}-${websiteId}`).value;
    const modalEditWebsiteDescription = document.getElementById(`modalEditWebsiteDescription-${groupId}-${websiteId}`).value;

    // URL 校验和补全
    const urlRegex = /^[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(modalEditWebsiteUrl)) {
        alert('Please enter a valid URL.');
        return;
    }
    if (!modalEditWebsiteUrl.startsWith('https://') && !modalEditWebsiteUrl.startsWith('http://')) {
        modalEditWebsiteUrl = 'https://' + modalEditWebsiteUrl;
    }

    const response = await fetch(`${backendUrl}/groups/${groupId}/websites/${websiteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modalEditWebsiteName, url: modalEditWebsiteUrl, description: modalEditWebsiteDescription })
    });
    if (response.ok) {
        // 重新获取图标
        const iconResponse = await fetch(`${backendUrl}/favicon?url=${modalEditWebsiteUrl}`);
        if (iconResponse.ok) {
            const iconData = await iconResponse.json();
            const updateResponse = await fetch(`${backendUrl}/groups/${groupId}/websites/${websiteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modalEditWebsiteName, url: modalEditWebsiteUrl, description: modalEditWebsiteDescription, iconPath: iconData.iconPath })
            });
        }
        fetchDataAndRender();
        modal.style.display = 'none';
    } else {
        alert('Failed to update website.');
    }
}

async function saveModalWebsite(groupId, websiteId) {
    hideContextMenu();
    const modal = document.getElementById(`editWebsiteModal-${groupId}-${websiteId}`);
    const modalEditWebsiteName = document.getElementById(`modalEditWebsiteName-${groupId}-${websiteId}`).value;
    let modalEditWebsiteUrl = document.getElementById(`modalEditWebsiteUrl-${groupId}-${websiteId}`).value;
    const modalEditWebsiteDescription = document.getElementById(`modalEditWebsiteDescription-${groupId}-${websiteId}`).value;

    // URL 校验和补全
    const urlRegex = /^[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(modalEditWebsiteUrl)) {
        alert('Please enter a valid URL.');
        return;
    }
    if (!modalEditWebsiteUrl.startsWith('https://') && !modalEditWebsiteUrl.startsWith('http://')) {
        modalEditWebsiteUrl = 'https://' + modalEditWebsiteUrl;
    }

    const response = await fetch(`${backendUrl}/groups/${groupId}/websites/${websiteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modalEditWebsiteName, url: modalEditWebsiteUrl, description: modalEditWebsiteDescription })
    });
    if (response.ok) {
        // 重新获取图标
        const iconResponse = await fetch(`${backendUrl}/favicon?url=${modalEditWebsiteUrl}`);
        if (iconResponse.ok) {
            const iconData = await iconResponse.json();
            const updateResponse = await fetch(`${backendUrl}/groups/${groupId}/websites/${websiteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modalEditWebsiteName, url: modalEditWebsiteUrl, description: modalEditWebsiteDescription, iconPath: iconData.iconPath })
            });
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