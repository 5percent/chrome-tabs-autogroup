// Chrome API封装，提供统一的接口
export default class ChromeAPI {
  static async getTabGroups() {
    return new Promise((resolve) => {
      chrome.tabGroups.query({}, (groups) => resolve(groups));
    });
  }

  static async getAllTabs() {
    return new Promise((resolve) => {
      chrome.tabs.query({}, (tabs) => resolve(tabs));
    });
  }

  static async groupTabs(tabIds, groupId) {
    let params = { tabIds };
    if (groupId) {
      params = { ...params, groupId };
    }

    return new Promise((resolve) => {
      chrome.tabs.group(params, (groupId) => resolve(groupId));
    });
  }

  static async updateGroup(groupId, properties) {
    return new Promise((resolve) => {
      chrome.tabGroups.update(groupId, properties, (group) => resolve(group));
    });
  }

  static activateTab(tabId, windowId) {
    chrome.tabs.update(tabId, { active: true });
    chrome.windows.update(windowId, { focused: true });
  }

  static closeTab(tabId) {
    chrome.tabs.remove(tabId);
  }

  static closeGroup(groupId) {
    chrome.tabs.query({ groupId }, (tabs) => {
      const tabIds = tabs.map(tab => tab.id);
      chrome.tabs.remove(tabIds);
    });
  }

  static async expandGroup(groupId) {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabGroups.update(groupId, { collapsed: false }, (group) => {
          if (chrome.runtime.lastError) {
            console.error('展开标签组失败:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            resolve(group);
          }
        });
      } catch (error) {
        console.error('展开标签组异常:', error);
        reject(error);
      }
    });
  }

  static async collapseGroup(groupId) {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabGroups.update(groupId, { collapsed: true }, (group) => {
          if (chrome.runtime.lastError) {
            console.error('折叠标签组失败:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            resolve(group);
          }
        });
      } catch (error) {
        console.error('折叠标签组异常:', error);
        reject(error);
      }
    });
  }

  static getGroupState(groupId) {
    return new Promise((resolve) => {
      chrome.tabGroups.get(groupId, (group) => {
        resolve({
          id: group.id,
          isExpanded: !group.collapsed
        });
      });
    });
  }
}