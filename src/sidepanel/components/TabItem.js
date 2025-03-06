import ChromeAPI from '../../services/ChromeAPI.js';

export default class TabItem {
  constructor(tab) {
    this.tab = tab;
    this.element = this.render();
    this.bindEvents();
  }

  render() {
    const tabElement = document.createElement('div');
    tabElement.className = 'tab-item';
    tabElement.dataset.tabId = this.tab.id;

    // 标签图标（如果有）
    const favicon = this.tab.favIconUrl
      ? `<img src="${this.tab.favIconUrl}" class="tab-favicon">`
      : '<div class="tab-favicon-placeholder"></div>';

    // 在 render 方法里保持 HTML 结构不变，但添加一个更小的类名
    tabElement.innerHTML = `
      ${favicon}
      <span class="tab-title">${this.tab.title}</span>
      <button class="close-tab material-icons small-icon" data-tab-id="${this.tab.id}" title="关闭标签页">close</button>
    `;

    return tabElement;
  }

  bindEvents() {
    this.element.addEventListener('click', (e) => {
      if (!e.target.classList.contains('close-tab')) {
        ChromeAPI.activateTab(this.tab.id, this.tab.windowId);
      }
    });

    const closeBtn = this.element.querySelector('.close-tab');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      ChromeAPI.closeTab(parseInt(e.target.dataset.tabId));
    });
  }

  getElement() {
    return this.element;
  }
}