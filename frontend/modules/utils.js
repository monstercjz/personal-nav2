// utils.js - 工具函数模块

/**
 * @function validateAndCompleteUrl
 * @description URL 校验和补全函数，校验 URL 格式是否有效，并补全 URL 协议头
 * @param {string} url URL 字符串
 * @returns {string | null} 校验和补全后的 URL，如果 URL 无效则返回 null
 */
function validateAndCompleteUrl(url) {
    const urlRegex = /^[^\s/$.?#].[^\s]*$/i; // URL 正则表达式
    if (!urlRegex.test(url)) {
        showNotification('请输入有效的URL', 'error'); // 显示错误提示
        return null; // URL 无效，返回 null
    }
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
        // 如果 URL 没有协议头，则自动添加 https:// 协议头
        return 'https://' + url;
    }
    return url; // URL 校验通过，返回原始 URL 或补全协议头后的 URL
}

let currentTooltip = null; // 当前显示的 tooltip 元素

/**
 * @function showTooltip
 * @description 显示 tooltip
 * @param {Event} e 鼠标事件对象
 */
function showTooltip(e) {
    const target = e.target.closest('[data-tooltip]'); // 获取最近的 data-tooltip 元素
    if (target) {
        if (!currentTooltip) {
            // 如果 currentTooltip 不存在，则创建 tooltip 元素
            currentTooltip = document.createElement('div');
            currentTooltip.id = 'tooltip'; // 设置 tooltip ID
            document.body.appendChild(currentTooltip); // 将 tooltip 添加到 body 中
        }
        const tooltipText = target.getAttribute('data-tooltip'); // 获取 data-tooltip 属性值
        currentTooltip.textContent = tooltipText; // 设置 tooltip 文本内容
        currentTooltip.style.display = 'block'; // 显示 tooltip
        const rect = target.getBoundingClientRect(); // 获取目标元素 Rect
        currentTooltip.style.left = `${rect.left + window.scrollX-5}px`; // 设置 tooltip left 偏移量
        currentTooltip.style.top = `${rect.top + window.scrollY+5 }px`; // 设置 tooltip top 偏移量
    }
}

/**
 * @function hideTooltip
 * @description 隐藏 tooltip
 * @param {Event} e 鼠标事件对象
 */
function hideTooltip(e) {
    const target = e.target.closest('[data-tooltip]'); // 获取最近的 data-tooltip 元素
    if (target && currentTooltip) {
        currentTooltip.style.display = 'none'; // 隐藏 tooltip
        currentTooltip.remove(); // 从 DOM 中移除 tooltip
        currentTooltip = null; // 清空 currentTooltip 引用
    }
}

/**
 * @function escapeHtml
 * @description HTML 字符转义函数，防止 XSS 攻击 
 * @param {string} unsafe 包含 HTML 字符的字符串
 * @returns {string} 转义后的 HTML 字符串
 */
function escapeHtml(unsafe) {
    return unsafe ?
      unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
      : '';
  }
  
/**
 * @function generateTooltipContent
 * @description 生成 tooltip 内容 HTML 字符串
 * @param {Website} website 网站数据对象
 * @returns {string} tooltip 内容 HTML 字符串
 */
function generateTooltipContent(website) { 
    if (!website || !website.lastAccessTime) {
      return '<div class="tooltip-content error">数据无效</div>'; // 数据无效时显示错误提示
    }
    const lastAccessTime = new Date(website.lastAccessTime).toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai', // 设置时区为上海
      hour12: false // 24 小时制
    });

    let content = '<div class="tooltip-content">';
    content += '<div class="tooltip-row"><strong>网址:</strong> ' + escapeHtml(website.url) + '</div>';
    content += '<div class="tooltip-row"><strong>最后访问:</strong> ' + lastAccessTime + '</div>';
    if (website.description) {
      content += '<div class="tooltip-row"><strong>描述:</strong> ' + escapeHtml(website.description) + '</div>';
    }
    content += '</div>';
    return content;
  }

/**
 * @function setRandomGroupColors
 * @description 为每个分组标题设置随机颜色
 */
function setRandomGroupColors() {
  const colors = [
    '#2563eb', // blue
    '#7c3aed', // purple
    '#db2777', // pink
    '#059669', // emerald
    '#d97706', // amber
    '#dc2626', // red
    '#4f46e5', // indigo
    '#0891b2', // cyan
    '#ea580c', // orange
    '#7e22ce'  // violet
  ];
  
  const groupTitles = document.querySelectorAll('.group h2');
  groupTitles.forEach(title => {
    const color = colors[Math.floor(Math.random() * colors.length)];
    title.style.setProperty('--group-title-color', color);
  });
}

/**
 * @function resetGroupColors
 * @description 重置所有分组标题的颜色为默认值
 */
function resetGroupColors() {
  const groupTitles = document.querySelectorAll('.group h2');
  groupTitles.forEach(title => {
    title.style.removeProperty('--group-title-color');
  });
}

export { validateAndCompleteUrl, showTooltip, hideTooltip, escapeHtml, generateTooltipContent, setRandomGroupColors, resetGroupColors };
