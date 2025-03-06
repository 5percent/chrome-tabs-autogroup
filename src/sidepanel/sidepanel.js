import ChromeAPI from '../services/ChromeAPI.js';
import GroupModel from '../services/GroupModel.js';
import TabGroup from './components/TabGroup.js';
import EventBus from './components/EventBus.js';
import { debounce } from '../utils/debounce.js';

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
      const organizedGroups = GroupModel.organizeTabsIntoGroups(groups, tabs);

      // 渲染UI
      organizedGroups.forEach(group => {
        const tabGroup = new TabGroup(group);
        tabGroupsContainer.appendChild(tabGroup.getElement());
      });

    } catch (error) {
      console.error('Error updating tab groups:', error);
    }
  }

  // 防抖处理的更新函数
  const debouncedUpdate = debounce(updateTabGroups, 300);

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateTabGroups') {
      debouncedUpdate();
    }
  });

  // 监听标签组状态变化
  chrome.tabGroups.onUpdated.addListener(
    debounce((group) => {
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
    }, 300)
  );
});