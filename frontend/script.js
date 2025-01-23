'use strict';

import { showNotification, renderDashboardWithData } from './modules/dashboardDataService.js';
//import { WebsiteDataService } from './modules/websiteDataService.js';
import { SearchService } from './modules/searchService.js';
import { fetchAndRenderGroupSelect, renderGroupSelect } from './modules/groupSelectDataService.js';
import { applySavedTheme, toggleTheme } from './modules/themeService.js';
import { addGroup, deleteGroup, editGroup } from './modules/groupInteractionService.js';
import { addWebsite, deleteWebsite, getWebsiteInfo, fetchIcon, openImportWebsitesModal } from './modules/websiteInteractionService.js';
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

    // 渲染仪表盘数据
    renderDashboardWithData();

    // 初始化搜索功能
    const searchService = new SearchService();

    // 添加主题切换按钮点击事件监听器
    toggleThemeButton.addEventListener('click', toggleTheme);

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
        openImportWebsitesModal();
    });

    // 添加鼠标悬停事件监听器，显示工具提示
    document.addEventListener('mouseover', showTooltip);

    // 添加鼠标移开事件监听器，隐藏工具提示
    document.addEventListener('mouseout', hideTooltip);

    // 添加切换添加按钮点击事件监听器
    toggleAddButtons.addEventListener('click', () => {
        addButtons.style.display = addButtons.style.display === 'none' ? 'flex' : 'none';
    });
    // 添加添加分组按钮点击事件监听器
    const showAddGroupButton = document.getElementById('showAddGroup');
    showAddGroupButton.addEventListener('click', () => {
        addGroup();
    });
    // 添加添加网站按钮点击事件监听器
    const showAddWebsiteButton = document.getElementById('showAddWebsite');
    showAddWebsiteButton.addEventListener('click', () => {
        addWebsite();
    });
});
