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
}