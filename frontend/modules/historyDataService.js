import { showNotification, renderDashboardWithData } from './dashboardDataService.js';
import { backendUrl } from '../config.js';

/**
 * 导入数据
 */
export async function importData() {
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
                    renderDashboardWithData();
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
}

/**
 * 导出数据
 */
export async function exportData() {
    try {
        const response = await fetch(`${backendUrl}/data`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const { websites, groups, order } = await response.json();
         const jsonString = JSON.stringify({ websites, groups, order }, null, 2);
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
}