import { getWebsiteById } from './api.js';

export class WebsiteTooltipService {
  // 时间常量
  static HOVER_DELAY = 1000; // 悬停延迟时间
  static AUTO_CLOSE_DELAY = 5000; // 自动关闭时间
  static DEBOUNCE_DELAY = 500; // 防抖时间
  static FADE_OUT_DURATION = 150; // 淡出动画时间

  constructor() {
    this.currentTooltip = null;
    this.currentWebsiteId = null; // 当前显示的tooltip对应的网站ID
    this.cache = new Map(); // 缓存网站数据
    this.debounceTimeout = null;
    this.hoverTimeout = null; // 悬停计时器
    this.autoCloseTimeout = null; // 自动关闭计时器
  }

  // 处理网站悬停事件
  async handleWebsiteHover(target) {
    if (!target) return;

    const websiteId = target.dataset.websiteId;
    if (!websiteId) return;

    // 使用debounce防止频繁触发
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(async () => {
      // 设置1秒延迟后再请求数据
      this.hoverTimeout = setTimeout(async () => {
        try {
          // 检查缓存中是否已有数据
          if (this.cache.has(websiteId)) {
            const cachedWebsite = this.cache.get(websiteId);
            this._showTooltip(target, cachedWebsite);
            return;
          }

          // 获取新数据并缓存
          const website = await getWebsiteById(websiteId);
          this.cache.set(websiteId, website);
          this._showTooltip(target, website);
        } catch (error) {
          console.error('Failed to get website details:', error);
        }
      }, WebsiteTooltipService.HOVER_DELAY);

      // 在1秒计时期间如果鼠标移出，清除计时器
      const handleEarlyMouseOut = (e) => {
        if (!target.contains(e.relatedTarget)) {
          clearTimeout(this.hoverTimeout);
          this.hoverTimeout = null;
          document.removeEventListener('mouseout', handleEarlyMouseOut);
        }
      };
      document.addEventListener('mouseout', handleEarlyMouseOut);
    }, WebsiteTooltipService.DEBOUNCE_DELAY);
  }

  // 内部方法：显示tooltip
  _showTooltip(target, website) {
    const websiteId = target.dataset.websiteId;
    
    // 如果已经在显示同一个网站的tooltip，则直接返回
    if (this.currentWebsiteId === websiteId) {
      return;
    }

    // 清除之前的tooltip
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
      this.currentWebsiteId = null;
    }

    // 创建并显示tooltip
    this._createTooltip(target, website, websiteId);
  }

  // 创建tooltip的内部方法
  _createTooltip(target, website, websiteId) {
    console.log('55', website);
    // 移除现有的tooltip，添加淡出效果
    if (this.currentTooltip) {
      this.currentTooltip.classList.add('fade-out');
      setTimeout(() => {
        this.currentTooltip.remove();
        this.currentTooltip = null;
        this.currentWebsiteId = null;
      }, WebsiteTooltipService.FADE_OUT_DURATION);
    }
    console.log('6', website);
    // 创建tooltip元素，添加淡入效果
    const tooltip = document.createElement('div');
    tooltip.className = 'website-tooltip fade-in';
    console.log('7', website);
    // 格式化最后访问时间
    const lastAccessTime = new Date(website.lastAccessTime).toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false
    });

    // 设置tooltip内容
    tooltip.innerHTML = `
      <div class="tooltip-content">
        <div class="tooltip-row"><strong>网址:</strong> ${website.url}</div>
        <div class="tooltip-row"><strong>最后访问:</strong> ${lastAccessTime}</div>
        ${website.description ? `<div class="tooltip-row"><strong>描述:</strong> ${website.description}</div>` : ''}
      </div>
    `;

    // 定位tooltip
    const rect = target.getBoundingClientRect();
    tooltip.style.position = 'absolute';
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;

    // 添加到body
    document.body.appendChild(tooltip);
    this.currentTooltip = tooltip;
    this.currentWebsiteId = websiteId;

    // 设置5秒后自动关闭
    this.autoCloseTimeout = setTimeout(() => {
      tooltip.remove();
      this.currentTooltip = null;
      this.currentWebsiteId = null;
      document.removeEventListener('mouseout', handleMouseOut);
    }, WebsiteTooltipService.AUTO_CLOSE_DELAY);

    // 在service内部处理鼠标移出事件，保持tooltip相关逻辑的封装性
    // 这样可以在不修改外部代码的情况下调整tooltip行为
    const handleMouseOut = (e) => {
      if (!tooltip.contains(e.relatedTarget) && !target.contains(e.relatedTarget)) {
        // 清除所有计时器
        if (this.hoverTimeout) {
          clearTimeout(this.hoverTimeout);
          this.hoverTimeout = null;
        }
        if (this.autoCloseTimeout) {
          clearTimeout(this.autoCloseTimeout);
          this.autoCloseTimeout = null;
        }
        
        tooltip.remove();
        this.currentTooltip = null;
        this.currentWebsiteId = null;
        document.removeEventListener('mouseout', handleMouseOut);
      }
    };

    document.addEventListener('mouseout', handleMouseOut);
  }
}
