import TabItem from './TabItem.js';
import ChromeAPI from '../services/ChromeAPI.js';
import EventBus from './EventBus.js';

export default class TabGroup {
  constructor(group) {
    this.group = group;
    this.isExpanded = true;
    this.element = this.render();
    this.bindEvents();
  }

  render() {
    const groupElement = document.createElement('div');
    groupElement.className = 'tab-group';

    // 创建标题元素
    const titleElement = this.renderTitle();
    groupElement.appendChild(titleElement);

    // 创建标签列表容器
    const tabsContainer = this.renderTabsContainer();
    groupElement.appendChild(tabsContainer);

    return groupElement;
  }

  renderTitle() {
    const titleElement = document.createElement('div');
    titleElement.className = 'group-title';

    // 调整颜色以匹配 Chrome 的原生标签组颜色
    const colorMap = {
      'grey': '#676767',
      'blue': '#1A73E8',
      'red': '#D93025',
      'yellow': '#F9AB00',
      'green': '#188038',
      'pink': '#D85ABC',
      'purple': '#A142F4',
      'cyan': '#009D7E',
      'orange': '#FA903E'
    };

    // 为标签组应用正确的颜色
    const originalColor = this.group.id === 'ungrouped' ? 'grey' : this.group.color;
    const adjustedColor = colorMap[originalColor] || originalColor;

    // 设置背景色
    titleElement.style.backgroundColor = adjustedColor;

    // 添加一个半透明叠加层，降低饱和度
    titleElement.style.position = 'relative';
    titleElement.style.overflow = 'hidden';

    // 添加伪元素以获取正确的颜色效果
    titleElement.classList.add('chrome-color');

    titleElement.dataset.groupId = this.group.id;
    titleElement.dataset.originalColor = originalColor;

    // 添加标题文本
    const titleSpan = document.createElement('span');
    titleSpan.className = 'group-title-text';
    titleSpan.textContent = this.group.title || '未命名组';
    titleElement.appendChild(titleSpan);

    // 添加操作区域
    const actionsElement = document.createElement('div');
    actionsElement.className = 'group-actions';

    // 添加标签数量
    const countSpan = document.createElement('span');
    countSpan.className = 'tab-count';
    countSpan.textContent = this.group.tabs.length;
    actionsElement.appendChild(countSpan);

    // 如果不是未分组标签，添加额外控件
    if (this.group.id !== 'ungrouped') {
      // 添加展开/折叠按钮
      const expandIcon = document.createElement('span');
      expandIcon.className = 'expand-icon material-icons';
      expandIcon.textContent = 'expand_more'; // Material Icons 的向下箭头
      expandIcon.setAttribute('title', '折叠');
      actionsElement.appendChild(expandIcon);

      // 添加关闭组按钮
      const closeButton = document.createElement('span');
      closeButton.className = 'close-group material-icons small-icon'; // 添加 small-icon 类
      closeButton.dataset.groupId = this.group.id;
      closeButton.textContent = 'close'; // 使用 Material Icons 的关闭图标
      closeButton.setAttribute('title', '关闭所有标签');
      actionsElement.appendChild(closeButton);
    }

    titleElement.appendChild(actionsElement);
    return titleElement;
  }

  renderTabsContainer() {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs-container';
    tabsContainer.dataset.groupId = this.group.id;

    // 创建并添加所有标签项
    this.group.tabs.forEach(tab => {
      const tabItem = new TabItem(tab);
      tabsContainer.appendChild(tabItem.getElement());
    });

    return tabsContainer;
  }

  bindEvents() {
    const titleElement = this.element.querySelector('.group-title');
    const tabsContainer = this.element.querySelector('.tabs-container');
    const expandIcon = titleElement.querySelector('.expand-icon');
    const closeButton = titleElement.querySelector('.close-group');

    // 展开/折叠逻辑
    titleElement.addEventListener('click', (e) => {
      if (e.target.classList.contains('close-group')) return;

      this.isExpanded = !this.isExpanded;

      if (this.isExpanded) {
        tabsContainer.style.display = 'block';
        if (expandIcon) {
          expandIcon.textContent = 'expand_more'; // 向下箭头
          expandIcon.setAttribute('title', '折叠');
        }
      } else {
        tabsContainer.style.display = 'none';
        if (expandIcon) {
          expandIcon.textContent = 'expand_less'; // 向上箭头
          expandIcon.setAttribute('title', '展开');
        }
      }
    });

    // 关闭组按钮
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        ChromeAPI.closeGroup(parseInt(this.group.id));
      });
    }
  }

  getElement() {
    return this.element;
  }
}