const fs = require('fs');
const path = require('path');

const dataFilePath = 'data.json';

function readData() {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { websites: [], groups: [], order: [] };
    }
}

function writeData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

module.exports = { readData, writeData }; 