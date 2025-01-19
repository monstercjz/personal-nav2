// URL 校验和补全函数
function validateAndCompleteUrl(url) {
    const urlRegex = /^[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(url)) {
        showNotification('请输入有效的URL', 'error');
        return null;
    }
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
        return 'https://' + url;
    }
    return url;
}

let currentTooltip = null;

function showTooltip(e) {
    const target = e.target.closest('[data-tooltip]');
    if (target) {
        if (!currentTooltip) {
            currentTooltip = document.createElement('div');
            currentTooltip.id = 'tooltip';
            document.body.appendChild(currentTooltip);
        }
        const tooltipText = target.getAttribute('data-tooltip');
        currentTooltip.textContent = tooltipText;
        currentTooltip.style.display = 'block';
        const rect = target.getBoundingClientRect();
        currentTooltip.style.left = `${rect.left + window.scrollX-5}px`;
        currentTooltip.style.top = `${rect.top + window.scrollY+5 }px`;
    }
}

function hideTooltip(e) {
    const target = e.target.closest('[data-tooltip]');
    if (target && currentTooltip) {
        currentTooltip.style.display = 'none';
        currentTooltip.remove();
        currentTooltip = null;
    }
}

export { validateAndCompleteUrl, showTooltip, hideTooltip };