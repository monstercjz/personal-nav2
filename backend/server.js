const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { readData, writeData } = require('./data');

const app = express();
const port = 3000;

app.use(cors());
app.use('/api/icons', express.static(path.join(__dirname, 'icons')));
app.use(bodyParser.json({ limit: '20mb' }));

// 创建 icons 文件夹
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
}

// 获取 favicon 并保存
async function fetchAndSaveFavicon(url) {
    try {
        const faviconUrl = new URL('/favicon.ico', url).href;
        console.log('faviconUrl', faviconUrl);
        const response = await fetch(faviconUrl, { timeout: 5000 });
        if (response.ok && response.headers.get('content-type')?.includes('image')) {
            const buffer = await response.buffer();
            const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.ico`;
            const filePath = path.join(iconsDir, filename);
            fs.writeFileSync(filePath, buffer);
            return `/icons/${filename}`;
        }
        console.log(`Favicon not found for ${url}`);
        return null;
    } catch (error) {
        console.error('Error fetching favicon:', error);
        return null;
    }
}

// 获取 favicon
app.get('/api/favicon', async (req, res) => {
    const { url } = req.query;
    console.log('url1', url);
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    const iconPath = await fetchAndSaveFavicon(url);
    if (iconPath) {
        res.json({ iconPath });
    } else {
        res.status(404).json({ error: 'Favicon not found' });
    }
});

// 获取所有数据
app.get('/api/data', (req, res) => {
    try {
        const data = readData();
        res.json(data);
    } catch (error) {
        console.error('Error getting data:', error);
        res.status(500).json({ error: 'Failed to get data' });
    }
});

// 替换所有数据
app.put('/api/data', (req, res) => {
    try {
        const newData = req.body;
        writeData(newData);
        res.json(newData);
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ error: 'Failed to update data' });
    }
});

app.put('/api/groups/order', (req, res) => {
    const { groups } = req.body;
    if (!groups) {
        return res.status(400).json({ error: 'Groups are required' });
    }
    const data = readData();
    data.groups = groups;
    writeData(data);
    res.json(data);
});

// 添加分组
app.post('/api/groups', (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Group name is required' });
        }
        const data = readData();
        const newGroup = { id: Date.now(), name, websites: [] };
        data.groups.push(newGroup);
        writeData(data);
        res.status(201).json(newGroup);
    } catch (error) {
        console.error('Error adding group:', error);
        res.status(500).json({ error: 'Failed to add group' });
    }
});

// 添加网站到分组
app.post('/api/groups/:groupId/websites', async (req, res) => {
    console.log('标记添加网站到分组');
    try {
        const { groupId } = req.params;
        const { name, url, description } = req.body;
        if (!name || !url) {
            return res.status(400).json({ error: 'Website name and URL are required' });
        }
        const data = readData();
        const group = data.groups.find(g => g.id === parseInt(groupId));
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        const iconPath = await fetchAndSaveFavicon(url);
        const newWebsite = { id: Date.now(), name, url, description, iconPath };
        group.websites.push(newWebsite);
        writeData(data);
        res.status(201).json(newWebsite);
    } catch (error) {
        console.error('Error adding website:', error);
        res.status(500).json({ error: 'Failed to add website' });
    }
});

// 删除网页
app.delete('/api/groups/:groupId/websites/:websiteId', (req, res) => {
    console.log('标记删除网页');
    try {
        const { groupId, websiteId } = req.params;
        const data = readData();
        const group = data.groups.find(g => g.id === parseInt(groupId));
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        group.websites = group.websites.filter(w => w.id !== parseInt(websiteId));
        writeData(data);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting website:', error);
        res.status(500).json({ error: 'Failed to delete website' });
    }
});

// 删除分组
app.delete('/api/groups/:groupId', (req, res) => {
    console.log('标记删除分组');
    try {
        const { groupId } = req.params;
        const data = readData();
        data.groups = data.groups.filter(g => g.id !== parseInt(groupId));
        writeData(data);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ error: 'Failed to delete group' });
    }
});

// 修改网页
app.put('/api/groups/:groupId/websites/:websiteId', (req, res) => {
    console.log('标记修改网页');
    try {
        const { groupId, websiteId } = req.params;
        const { name, url, description, iconPath, groupId: newGroupId } = req.body;
        if (!name || !url) {
            return res.status(400).json({ error: 'Website name and URL are required' });
        }
        const data = readData();
        const group = data.groups.find(g => g.id === parseInt(groupId));
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        const website = group.websites.find(w => w.id === parseInt(websiteId));
        if (!website) {
            return res.status(404).json({ error: 'Website not found' });
        }
        website.name = name;
        website.url = url;
        website.description = description;
        if (iconPath) {
            website.iconPath = iconPath;
        }
        writeData(data);
        res.json(website);
    } catch (error) {
        console.error('Error updating website:', error);
        res.status(500).json({ error: 'Failed to update website' });
    }
});

// 修改分组
app.put('/api/groups/:groupId', (req, res) => {
    console.log('标记修改分组');
    try {
        const { groupId } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Group name is required' });
        }
        const data = readData();
        const group = data.groups.find(g => g.id === parseInt(groupId));
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        group.name = name;
        writeData(data);
        res.json(group);
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ error: 'Failed to update group' });
    }
});

app.use('/icons', express.static(path.join(__dirname, 'icons')));
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
}); 