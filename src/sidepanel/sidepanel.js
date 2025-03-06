import ChromeAPI from './services/ChromeAPI.js';
import DataManager from './services/DataManager.js';
import TabGroup from './components/TabGroup.js';
import EventBus from './components/EventBus.js';

document.addEventListener('DOMContentLoaded', function () {
  const tabGroupsContainer = document.getElementById('tab-groups-container');

  // 更新界面
  async function updateTabGroups() {
    // 清空容器
    tabGroupsContainer.innerHTML = '';

    try {
      // 获取数据
      const groups = await ChromeAPI.getTabGroups();
      const tabs = await ChromeAPI.getAllTabs();

      // 处理数据
      const organizedGroups = DataManager.organizeTabsIntoGroups(groups, tabs);

      // 渲染UI
      organizedGroups.forEach(group => {
        const tabGroup = new TabGroup(group);
        tabGroupsContainer.appendChild(tabGroup.getElement());
      });

    } catch (error) {
      console.error('Error updating tab groups:', error);
    }
  }

  // 使用防抖函数减少频繁更新
  function debounce(func, wait) {
    let timeout;
    return function () {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(), wait);
    };
  }

  // 防抖处理的更新函数
  const debouncedUpdate = debounce(updateTabGroups, 300);

  // 初始加载
  updateTabGroups();

  // 监听标签变化和组变化
  chrome.tabs.onCreated.addListener(debouncedUpdate);
  chrome.tabs.onRemoved.addListener(debouncedUpdate);
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.title || changeInfo.url) debouncedUpdate();
  });
  chrome.tabs.onMoved.addListener(debouncedUpdate);
  chrome.tabGroups.onCreated.addListener(debouncedUpdate);
  chrome.tabGroups.onRemoved.addListener(debouncedUpdate);
  chrome.tabGroups.onUpdated.addListener(debouncedUpdate);
  chrome.tabGroups.onMoved.addListener(debouncedUpdate);

  // 监听标签组状态变化
  chrome.tabGroups.onUpdated.addListener((group) => {
    // 如果是折叠状态变化
    if (group.collapsed !== undefined) {
      // 通过事件总线通知对应的组件
      EventBus.publish(`tabGroup:${group.id}:stateChanged`, {
        isExpanded: !group.collapsed
      });
    } else {
      // 其他变化仍然触发界面更新
      debouncedUpdate();
    }
  });
});