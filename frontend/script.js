'use strict';

import { showNotification, renderDashboardWithData } from './modules/dashboardDataService.js';
import { fetchAndRenderGroupSelect, renderGroupSelect } from './modules/groupSelectDataService.js';
import { applySavedTheme, toggleTheme } from './modules/themeService.js';
import { addGroup, deleteGroup, editGroup } from './modules/groupInteractionService.js';
import { addWebsite, deleteWebsite, saveModalWebsite, getWebsiteInfo, fetchIcon, openImportWebsitesModal, saveImportedWebsites } from './modules/websiteInteractionService.js';
import { hideContextMenu, createContextMenu, showGroupContextMenu, showWebsiteContextMenu } from './modules/contextMenu.js';
import { validateAndCompleteUrl, showTooltip, hideTooltip } from './modules/utils.js';
import modalInteractionService from './modules/modalInteractionService.js';
import './modules/groupOrderService.js';
import { importData, exportData } from './modules/historyDataService.js';

// 用于存储分组数据
let groupsData = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 获取主题切换按钮元素
    const toggleThemeButton = document.getElementById('toggleTheme');
    // 获取分组选择下拉框元素
    const groupSelect = document.getElementById('groupSelect');
    // 获取仪表盘元素
    const dashboard = document.getElementById('dashboard');
    // 获取数据导入按钮元素
    const importDataButton = document.getElementById('importData');
    // 获取数据导出按钮元素
    const exportDataButton = document.getElementById('exportData');
    // 获取导入网站按钮元素
    const importWebsitesButton = document.getElementById('importWebsites');
    // 获取切换添加按钮元素
    const toggleAddButtons = document.getElementById('toggleAddButtons');
    // 获取添加按钮容器元素
    const addButtons = document.querySelector('.add-buttons');

    // 应用保存的主题
    applySavedTheme();

    // 实例化 ModalInteractionService具有编辑页面保存取消关闭的监听
    //const modalInteractionService = new ModalInteractionService();

    // 渲染仪表盘数据
    renderDashboardWithData();

    // 添加主题切换按钮点击事件监听器
    toggleThemeButton.addEventListener('click', toggleTheme);

    /**
     * 监听分组选择下拉框点击事件，如果 groupsData 为空则获取并渲染分组下拉框
     */
/*     if (groupSelect) {
        groupSelect.addEventListener('click', () => {
            if (!groupsData) {
                fetchAndRenderGroupSelect();
            }
        });
    } */

    /**
     * 处理仪表盘点击事件，打开网站链接
     * 使用事件委托，监听仪表盘容器的点击事件
     * @param {Event} e - 点击事件对象
     */
    dashboard.addEventListener('click', (e) => {
        const target = e.target.closest('.website-item');
        if (target) {
            const link = target.querySelector('a');
            if (link) {
                window.open(link.href, '_blank');
            }
        }
    });

    // 添加数据导入按钮点击事件监听器
    importDataButton.addEventListener('click', importData);

    // 添加数据导出按钮点击事件监听器
    exportDataButton.addEventListener('click', exportData);

    // 添加导入网站按钮点击事件监听器
    importWebsitesButton.addEventListener('click', () => {
        const modalId = 'pasteWebsitesModal';
        const modalContent = `
            <div class="modal-content">
                <span class="close close-modal-button" aria-label="关闭粘贴导入网站模态框">&times;</span>
                <h2>粘贴导入网站</h2>
                <textarea placeholder="请粘贴网站列表，格式为 网站名+网站地址+描述，一行一个" style="width: 96%; height: 200px;"></textarea>
                <select id="pasteWebsitesGroupSelect" style="margin-top: 10px;">
                    <option value="">选择分组</option>
                </select>
                <div class="modal-buttons-container" style="margin-top: 10px;">
                    <button class="save-modal-button" id="savePasteWebsites">保存</button>
                    <button class="cancel-modal-button" id="cancelPasteWebsites" style="margin-left: 10px;">取消</button>
                </div>
            </div>
        `;
        modalInteractionService.createModal(modalId, modalContent);
        modalInteractionService.openModal(modalId);
    });

    // 添加鼠标悬停事件监听器，显示工具提示
    document.addEventListener('mouseover', showTooltip);

    // 添加鼠标移开事件监听器，隐藏工具提示
    document.addEventListener('mouseout', hideTooltip);

    // 添加切换添加按钮点击事件监听器
    toggleAddButtons.addEventListener('click', () => {
        addButtons.style.display = addButtons.style.display === 'none' ? 'flex' : 'none';
    });

    const showAddGroupButton = document.getElementById('showAddGroup');
    showAddGroupButton.addEventListener('click', () => {
        addGroup();
    });

    const showAddWebsiteButton = document.getElementById('showAddWebsite');
    showAddWebsiteButton.addEventListener('click', () => {
        addWebsite();
    });
});
