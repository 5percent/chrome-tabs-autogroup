import ChromeAPI from '../services/ChromeAPI.js';
import { extractDomain } from './domain.js';
import { getRandomColor } from './color.js';

export async function scanAndGroupTabs(domainGroupMap) {
  const tabs = await ChromeAPI.getAllTabs();

  // 对所有标签按简化域名分组
  const simplifiedDomainTabsMap = {};

  tabs.forEach(tab => {
    if (!tab.url || tab.url.startsWith('chrome://')) return;

    const domain = extractDomain(tab.url);
    if (!domain) return;

    if (!simplifiedDomainTabsMap[domain.simplified]) {
      simplifiedDomainTabsMap[domain.simplified] = {
        tabs: [],
        fullDomains: new Set()
      };
    }
    simplifiedDomainTabsMap[domain.simplified].tabs.push(tab);
    simplifiedDomainTabsMap[domain.simplified].fullDomains.add(domain.full);
  });

  // 处理每个简化域名
  for (const [simplified, data] of Object.entries(simplifiedDomainTabsMap)) {
    // 如果该简化域名有2个以上的标签，并且还没有对应的标签组
    if (data.tabs.length >= 2 && !domainGroupMap[simplified]) {
      const tabIds = data.tabs.map(tab => tab.id);

      // 创建新的标签组
      try {
        const groupId = await ChromeAPI.groupTabs(tabIds);
        const color = getRandomColor();

        await chrome.tabGroups.update(groupId, {
          // 使用简化的域名作为标签组名称
          title: simplified,
          color: color
        });

        // 记录简化域名和标签组的映射关系
        domainGroupMap[simplified] = {
          id: groupId,
          color: color,
          domains: data.fullDomains
        };
      } catch (e) {
        console.error('创建标签组失败:', e);
      }
    }
  }
}

// 折叠所有标签组
export async function collapseAllGroups() {
  try {
    const groups = await ChromeAPI.getTabGroups();
    for (const group of groups) {
      if (!group.collapsed) {
        await ChromeAPI.collapseGroup(group.id);
      }
    }
  } catch (error) {
    console.error('折叠所有标签组失败:', error);
  }
}