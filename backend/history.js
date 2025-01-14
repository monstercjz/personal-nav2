const fs = require('fs');
const path = require('path');

const historyFilePath = 'history.json';

function readHistory() {
    try {
        const data = fs.readFileSync(historyFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function writeHistory(data) {
    fs.writeFileSync(historyFilePath, JSON.stringify(data, null, 2));
}

module.exports = { readHistory, writeHistory };