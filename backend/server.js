const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const dataFilePath = 'data.json';

// 读取数据
function readData() {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { groups: [] };
    }
}

// 写入数据
function writeData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// 获取所有数据
app.get('/api/data', (req, res) => {
    const data = readData();
    res.json(data);
});

// 添加分组
app.post('/api/groups', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Group name is required' });
    }
    const data = readData();
    const newGroup = { id: Date.now(), name, websites: [] };
    data.groups.push(newGroup);
    writeData(data);
    res.status(201).json(newGroup);
});

// 添加网站到分组
app.post('/api/groups/:groupId/websites', (req, res) => {
    const { groupId } = req.params;
    const { name, url } = req.body;
    if (!name || !url) {
        return res.status(400).json({ error: 'Website name and URL are required' });
    }
    const data = readData();
    const group = data.groups.find(g => g.id === parseInt(groupId));
    if (!group) {
        return res.status(404).json({ error: 'Group not found' });
    }
    const newWebsite = { id: Date.now(), name, url };
    group.websites.push(newWebsite);
    writeData(data);
    res.status(201).json(newWebsite);
});

// 删除分组
app.delete('/api/groups/:groupId', (req, res) => {
    const { groupId } = req.params;
    const data = readData();
    data.groups = data.groups.filter(g => g.id !== parseInt(groupId));
    writeData(data);
    res.status(204).send();
});

// 删除网站
app.delete('/api/groups/:groupId/websites/:websiteId', (req, res) => {
    const { groupId, websiteId } = req.params;
    const data = readData();
    const group = data.groups.find(g => g.id === parseInt(groupId));
    if (!group) {
        return res.status(404).json({ error: 'Group not found' });
    }
    group.websites = group.websites.filter(w => w.id !== parseInt(websiteId));
    writeData(data);
    res.status(204).send();
});

// 修改分组
app.put('/api/groups/:groupId', (req, res) => {
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
});

// 修改网站
app.put('/api/groups/:groupId/websites/:websiteId', (req, res) => {
    const { groupId, websiteId } = req.params;
    const { name, url } = req.body;
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
    writeData(data);
    res.json(website);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
}); 