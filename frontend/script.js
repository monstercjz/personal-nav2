const dashboard = document.getElementById('dashboard');
const backendUrl = 'http://localhost:3000/api';

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
                <button onclick="deleteGroup(${group.id})">Delete</button>
            </h2>
            <ul class="website-list" id="website-list-${group.id}"></ul>
            <div class="add-website">
                <input type="text" id="newWebsiteName-${group.id}" placeholder="Website Name">
                <input type="text" id="newWebsiteUrl-${group.id}" placeholder="Website URL">
                <button onclick="addWebsite(${group.id})">Add Website</button>
            </div>
        `;
        dashboard.appendChild(groupDiv);
        const websiteList = document.getElementById(`website-list-${group.id}`);
        group.websites.forEach(website => {
            const websiteItem = document.createElement('li');
            websiteItem.classList.add('website-item');
            websiteItem.innerHTML = `
                <a href="${website.url}" target="_blank">${website.name}</a>
                <button onclick="deleteWebsite(${group.id}, ${website.id})">Delete</button>
            `;
            websiteList.appendChild(websiteItem);
        });
    });
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
    } else {
        alert('Failed to add group.');
    }
}

// 添加网站
async function addWebsite(groupId) {
    const newWebsiteName = document.getElementById(`newWebsiteName-${groupId}`).value;
    const newWebsiteUrl = document.getElementById(`newWebsiteUrl-${groupId}`).value;
    if (!newWebsiteName || !newWebsiteUrl) {
        alert('Please enter website name and URL.');
        return;
    }
    const response = await fetch(`${backendUrl}/groups/${groupId}/websites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWebsiteName, url: newWebsiteUrl })
    });
    if (response.ok) {
        fetchDataAndRender();
        document.getElementById(`newWebsiteName-${groupId}`).value = '';
        document.getElementById(`newWebsiteUrl-${groupId}`).value = '';
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

fetchDataAndRender(); 