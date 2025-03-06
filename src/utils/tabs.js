import ChromeAPI from '../services/ChromeAPI.js';
import { extractDomain } from './domain.js';
import { getRandomColor, removeColor } from './color.js';

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

        await ChromeAPI.updateGroup(groupId, {
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

export async function getTabsBySimplifiedDomain(simplifiedDomain) {
  const tabs = await ChromeAPI.getAllTabs();
  const matchingTabs = tabs.filter(tab => {
    try {
      const domain = extractDomain(tab.url);
      return domain && domain.simplified === simplifiedDomain;
    } catch (e) {
      return false;
    }
  });

  return matchingTabs;
}

export async function processTab(tabId, url, domainGroupMap) {
  const domain = extractDomain(url);
  if (!domain || url.startsWith('chrome://')) return;

  const simplified = domain.simplified;

  // 检查该简化域名是否已存在标签组
  if (domainGroupMap[simplified]) {
    try {
      // 将完整域名添加到集合中
      domainGroupMap[simplified].domains.add(domain.full);

      const tabIds = [tabId];
      await ChromeAPI.groupTabs(tabIds, domainGroupMap[simplified].id);
    } catch (e) {
      // 如果标签组不存在了，重新扫描
      if (e.message && e.message.includes("group does not exist")) {
        delete domainGroupMap[simplified];
        scanAndGroupTabs();
      } else {
        console.error('将标签添加到组失败:', e);
      }
    }
  } else {
    // 检查同一简化域名的标签是否达到阈值
    const simplifiedDomainTabs = await getTabsBySimplifiedDomain(simplified);
    if (simplifiedDomainTabs.length >= 2) {
      const tabIds = simplifiedDomainTabs.map(tab => tab.id);

      try {
        const groupId = await ChromeAPI.groupTabs(tabIds);
        const color = getRandomColor();

        await ChromeAPI.updateGroup(groupId, {
          title: simplified,
          color: color
        });

        // 记录所有相关的完整域名
        const fullDomains = new Set();
        simplifiedDomainTabs.forEach(tab => {
          const dom = extractDomain(tab.url);
          if (dom) fullDomains.add(dom.full);
        });

        domainGroupMap[simplified] = {
          id: groupId,
          color: color,
          domains: fullDomains
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

export async function checkAndRemoveGroup(domainGroupMap) {
  const groups = await ChromeAPI.getTabGroups();
  const tabs = await ChromeAPI.getAllTabs();

  // 检查每个标签组是否有标签
  for (const group of groups) {
    const groupTabs = tabs.filter(tab => tab.groupId === group.id);

    if (groupTabs.length === 0) {
      // 标签组为空，删除标签组
      for (const [simplified, groupInfo] of Object.entries(domainGroupMap)) {
        if (groupInfo.id === group.id) {
          delete domainGroupMap[simplified];
          // 如果有颜色记录，从已使用颜色集合中移除
          if (groupInfo.color) {
            removeColor(groupInfo.color);
          }
          break;
        }
      }
    }
  }
}