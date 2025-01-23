/**
 * 网站搜索服务模块
 * 提供简单的客户端搜索功能
 * 根据网站名称或URL进行实时过滤
 */
export class SearchService {
  constructor() {
    this.searchContainer = document.querySelector('.search-container');
    this.searchIcon = document.querySelector('.search-icon');
    this.searchInput = document.querySelector('.search-input');
    this.hideTimeout = null;
    this.init();
  }

  /**
   * 初始化搜索功能
   * 添加事件监听器
   */
  init() {
    // 点击图标展开/隐藏搜索框
    this.searchIcon.addEventListener('click', () => {
      if (this.searchContainer.classList.contains('expanded')) {
        this.toggleSearch(false);
      } else {
        this.toggleSearch(true);
      }
    });

    // 输入时过滤网站
    this.searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim().toLowerCase();
      this.filterSites(searchTerm);
    });

    // 失去焦点时延迟隐藏
    this.searchInput.addEventListener('blur', () => {
      this.hideTimeout = setTimeout(() => {
        this.toggleSearch(false);
      }, 5000); // 3秒后隐藏
    });

    // 鼠标进入时取消隐藏
    this.searchContainer.addEventListener('mouseenter', () => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
    });
  }

  /**
   * 切换搜索框状态
   * @param {boolean} show - 是否显示搜索框
   */
  toggleSearch(show) {
    this.searchContainer.classList.toggle('expanded', show);
    if (show) {
      this.searchInput.focus();
    }
  }

  /**
   * 根据搜索词过滤网站
   * @param {string} searchTerm - 搜索关键词
   */
  filterSites(searchTerm) {
    const siteElements = document.querySelectorAll('.website-item');
    siteElements.forEach(element => {
      const siteLink = element.querySelector('a');
      const siteName = siteLink.textContent.toLowerCase();
      const siteUrl = siteLink.href.toLowerCase();
      
      // 根据名称或URL匹配
      if (siteName.includes(searchTerm) || siteUrl.includes(searchTerm)) {
        element.style.display = '';
      } else {
        element.style.display = 'none';
      }
    });
  }
}
