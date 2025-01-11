const dashboard = document.getElementById('dashboard');
const backendUrl = 'http://localhost:3000/api';
const groupSelect = document.getElementById('groupSelect');
let groupsData = null;

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
                <button onclick="deleteGroup(${group.id})">删除</button>
                <button onclick="editGroup(${group.id})">编辑</button>
                <input type="text" id="editGroupName-${group.id}" style="display:none;" placeholder="New Group Name">
                <button onclick="saveGroup(${group.id})" style="display:none;">保存</button>
            </h2>
            <ul class="website-list" id="website-list-${group.id}"></ul>
        `;
        dashboard.appendChild(groupDiv);
        const websiteList = document.getElementById(`website-list-${group.id}`);
        group.websites.forEach(website => {
            const websiteItem = document.createElement('li');
            websiteItem.classList.add('website-item');
            websiteItem.innerHTML = `
                ${website.iconPath ? `<img src="${backendUrl}${website.iconPath}" style="width: 16px; height: 16px; margin-right: 5px;">` : ''}
                <a href="${website.url}" target="_blank">${website.name}</a>
                <button onclick="editWebsite(${group.id}, ${website.id})">编辑</button>
                <div id="editWebsiteForm-${group.id}-${website.id}" style="display:none;">
                    <input type="text" id="editWebsiteName-${group.id}-${website.id}" placeholder="New Website Name" value="${website.name}">
                    <input type="text" id="editWebsiteUrl-${group.id}-${website.id}" placeholder="New Website URL" value="${website.url}">
                    <input type="text" id="editWebsiteDescription-${group.id}-${website.id}" placeholder="New Website Description" value="${website.description}">
                    <button onclick="saveWebsite(${group.id}, ${website.id})">保存</button>
                </div>
                <button onclick="deleteWebsite(${group.id}, ${website.id})">Delete</button>
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
    const newGroupName = document.getElementById('newGroupName').value;
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
        document.getElementById('newGroupName').value = '';
        fetchAndRenderGroupSelect();
    } else {
        alert('Failed to add group.');
    }
}

// 添加网站
async function addWebsite() {
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

// 监听下拉框点击事件
groupSelect.addEventListener('click', () => {
    if (!groupsData) {
        fetchAndRenderGroupSelect();
    }
});

fetchDataAndRender();

// 编辑分组
function editGroup(groupId) {
    const groupDiv = document.querySelector(`.group:has(h2 button[onclick="deleteGroup(${groupId})"])`);
    const editInput = groupDiv.querySelector(`#editGroupName-${groupId}`);
    const saveButton = groupDiv.querySelector(`button[onclick="saveGroup(${groupId})"]`);
    editInput.style.display = 'inline-block';
    saveButton.style.display = 'inline-block';
}

// 保存分组
async function saveGroup(groupId) {
    const groupDiv = document.querySelector(`.group:has(h2 button[onclick="deleteGroup(${groupId})"])`);
    const editInput = groupDiv.querySelector(`#editGroupName-${groupId}`);
    const saveButton = groupDiv.querySelector(`button[onclick="saveGroup(${groupId})"]`);
    const newGroupName = editInput.value;
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
        editInput.style.display = 'none';
        saveButton.style.display = 'none';
    } else {
        alert('Failed to update group name.');
    }
}

// 编辑网站
function editWebsite(groupId, websiteId) {
    const editForm = document.getElementById(`editWebsiteForm-${groupId}-${websiteId}`);
    editForm.style.display = 'block';
}

// 保存网站
async function saveWebsite(groupId, websiteId) {
    const editForm = document.getElementById(`editWebsiteForm-${groupId}-${websiteId}`);
    const newWebsiteName = document.getElementById(`editWebsiteName-${groupId}-${websiteId}`).value;
    let newWebsiteUrl = document.getElementById(`editWebsiteUrl-${groupId}-${websiteId}`).value;
    const newWebsiteDescription = document.getElementById(`editWebsiteDescription-${groupId}-${websiteId}`).value;

    // URL 校验和补全
    const urlRegex = /^[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(newWebsiteUrl)) {
        alert('Please enter a valid URL.');
        return;
    }
    if (!newWebsiteUrl.startsWith('https://') && !newWebsiteUrl.startsWith('http://')) {
        newWebsiteUrl = 'https://' + newWebsiteUrl;
    }

    const response = await fetch(`${backendUrl}/groups/${groupId}/websites/${websiteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWebsiteName, url: newWebsiteUrl, description: newWebsiteDescription })
    });
    if (response.ok) {
        fetchDataAndRender();
        editForm.style.display = 'none';
    } else {
        alert('Failed to update website.');
    }
} 