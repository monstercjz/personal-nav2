const body = document.body;

// 获取当前主题，默认为 'light'
function getCurrentTheme() {
    return body.getAttribute('data-theme') || 'light';
}

// 设置新主题
function setTheme(theme) {
    body.setAttribute('data-theme', theme);
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('theme', theme);
        }
    } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
    }
}

/**
 * 从 localStorage 获取主题并应用
 */
export function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    }
}

/**
 * 切换主题
 */
export function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}