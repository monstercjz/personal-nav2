import { addGroup,saveModalGroup } from './groupInteractionService.js';

class ModalInteractionService {
    constructor() {
        if (ModalInteractionService.instance) {
            return ModalInteractionService.instance;
        }
        ModalInteractionService.instance = this;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.body.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('close-modal-button')) {
                const modalId = target.closest('.modal').id;
                this.closeModal(modalId);
            } else if (target.classList.contains('save-modal-button')) {
                const modalId = target.closest('.modal').id;
                this.saveModal(modalId);
            } else if (target.classList.contains('cancel-modal-button')) {
                 const modalId = target.closest('.modal').id;
                this.closeModal(modalId);
            }
        });
    }

    /**
     * 打开模态框
     * @param {string} modalId - 要打开的模态框的 ID
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal with ID "${modalId}" not found.`);
            return;
        }
        modal.style.display = '';
        modal.classList.add('show-modal');
    }

    /**
     * 关闭模态框
     * @param {string} modalId - 要关闭的模态框的 ID
     */
    closeModal(modalId) {
        if (!modalId || typeof modalId !== 'string') {
            console.error('Invalid modalId:', modalId);
            return;
        }

        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error('Modal with ID', modalId, 'not found');
            return;
        }

        try {
            modal.classList.add('closing');

            // 获取 CSS 动画持续时间（假设单位为毫秒）
            const style = window.getComputedStyle(modal);
            const animationDuration = parseFloat(style.getPropertyValue('animation-duration')) * 1000;

            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('closing');
                modal.remove();
            }, animationDuration || 200); // 默认 200ms
        } catch (error) {
            console.error('Error closing modal:', error);
        }
    }

    /**
     * 设置模态框数据
     * @param {string} modalId - 要设置数据的模态框的 ID
     * @param {object} data - 要设置的数据
     */
    setModalData(modalId, data) {
        // 验证参数类型
        if (typeof modalId !== 'string' || !modalId.trim()) {
            console.error('Invalid modalId:', modalId);
            return;
        }

        if (!data || typeof data !== 'object') {
            console.error('Invalid data:', data);
            return;
        }

        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal with id "${modalId}" not found`);
            return;
        }

        // 缓存查询结果，减少DOM查询次数
        const inputs = {};
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const input = modal.querySelector(`#${key}`);
                if (input) {
                    inputs[key] = input;
                } else {
                    console.warn(`Input with id "${key}" not found in modal "${modalId}"`);
                }
            }
        }

        // 设置输入值
        for (const key in data) {
            if (data.hasOwnProperty(key) && inputs[key]) {
                inputs[key].value = data[key];
            }
        }
    }

    /**
     * 创建模态框
     * @param {string} modalId - 模态框的 ID
     * @param {string} content - 模态框的内容
     * @returns {string} - 模态框的 ID
     */
    createModal(modalId, content) {
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.classList.add('modal');
        modal.innerHTML = content;
        document.body.appendChild(modal);
        return modalId;
    }

    /**
     * 根据模态框的 ID 调用不同的保存函数
     * @param {string} modalId - 模态框的 ID
     */
    saveModal(modalId) {
        if (modalId.startsWith('groupModal')) {
            // 获取模态框元素
            const modal = document.getElementById(modalId);
            // 获取分组 ID
            const groupId = modal.getAttribute('data-group-id');
            // 如果存在分组 ID，则调用 saveModalGroup 函数，否则调用 addGroup 函数
            if (groupId) {
                saveModalGroup();
            } else {
                //saveModalGroup();
                 addGroup();
            }
        } else if (modalId.startsWith('deleteGroupModal')) {
            // do nothing, just close the modal
            this.closeModal(modalId);
        } else {
            console.warn(`Save action not implemented for modal: ${modalId}`);
        }
    }
}

export default new ModalInteractionService();