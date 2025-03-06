// background.js
chrome.sidePanel
	.setPanelBehavior({ openPanelOnActionClick: true })
	.catch((error) => console.error(error));

// 可用的标签组颜色
const GROUP_COLORS = [
	'blue', 'red', 'yellow', 'green',
	'pink', 'purple', 'cyan', 'orange'
];

// 修改存储结构，以简化域名为键
let domainGroupMap = {
	// simplified: {
	//   id: groupId,
	//   color: color,
	//   domains: Set of full domains
	// }
};

// 存储已使用的颜色
let usedColors = new Set();

// 获取随机未使用颜色
function getRandomColor() {
	// 过滤出未使用的颜色
	const availableColors = GROUP_COLORS.filter(color => !usedColors.has(color));

	// 如果所有颜色都已使用，则重置
	if (availableColors.length === 0) {
		return GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)];
	}

	// 随机选择一个未使用的颜色
	const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
	usedColors.add(randomColor);
	return randomColor;
}

// 从URL中提取域名和简化域名
function extractDomain(url) {
	try {
		const urlObj = new URL(url);
		return {
			full: urlObj.hostname,
			simplified: simplifyDomain(urlObj.hostname)
		};
	} catch (e) {
		return null;
	}
}

// 简化域名，提取主要部分
function simplifyDomain(domain) {
	// 特殊情况处理
	if (domain.startsWith('www.')) {
		domain = domain.substring(4);
	}

	// 提取主域名
	const parts = domain.split('.');

	// 处理常见的二级域名
	if (parts.length >= 2) {
		// 处理特殊的二级域名，如 co.uk, com.cn 等
		const commonTLDs = ['co.uk', 'com.au', 'com.cn', 'co.jp', 'com.br'];
		const lastTwoParts = parts.slice(-2).join('.');

		if (commonTLDs.includes(lastTwoParts) && parts.length > 2) {
			// 对于 example.co.uk 返回 example
			return parts[parts.length - 3];
		} else {
			// 对于 example.com 返回 example
			return parts[parts.length - 2];
		}
	}

	// 如果无法简化则返回原域名
	return domain;
}

// 获取指定简化域名的所有标签
async function getTabsBySimplifiedDomain(simplifiedDomain) {
	return new Promise((resolve) => {
		chrome.tabs.query({}, (tabs) => {
			const matchingTabs = tabs.filter(tab => {
				try {
					const domain = extractDomain(tab.url);
					return domain && domain.simplified === simplifiedDomain;
				} catch (e) {
					return false;
				}
			});
			resolve(matchingTabs);
		});
	});
}

// 扫描并为所有符合条件的域名创建标签组
async function scanAndGroupTabs() {
	// 获取所有标签
	const tabs = await new Promise((resolve) => {
		chrome.tabs.query({}, (tabs) => resolve(tabs));
	});

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
				const groupId = await chrome.tabs.group({ tabIds });
				const color = getRandomColor();

				await chrome.tabGroups.update(groupId, {
					// 使用简化的域名作为标签组名称
					title: simplified,
					color: color
				});

				// 创建后自动折叠
				await autoCollapseGroup(groupId);

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

// 自动折叠新创建的标签组
chrome.tabGroups.onCreated.addListener((group) => {
	// 短暂延迟以确保组已完全创建
	setTimeout(() => {
		chrome.tabGroups.update(group.id, { collapsed: true })
			.catch(error => console.error('自动折叠标签组失败:', error));
	}, 300);
});

// 在创建标签组后自动将其折叠
async function autoCollapseGroup(groupId) {
	try {
		await chrome.tabGroups.update(groupId, { collapsed: true });
	} catch (error) {
		console.error('折叠标签组失败:', error);
	}
}

// 当标签被创建时，检查是否需要添加到已有的组
chrome.tabs.onCreated.addListener(async (tab) => {
	// 等待标签加载完成
	if (!tab.url || tab.url === 'chrome://newtab/') {
		// 对于新标签页，等待它导航到实际URL
		const listener = (tabId, changeInfo) => {
			if (tabId === tab.id && changeInfo.url) {
				processTab(tabId, changeInfo.url);
				chrome.tabs.onUpdated.removeListener(listener);
			}
		};
		chrome.tabs.onUpdated.addListener(listener);
	} else {
		// 标签已有URL时直接处理
		processTab(tab.id, tab.url);
	}
});

// 处理标签
async function processTab(tabId, url) {
	const domain = extractDomain(url);
	if (!domain || url.startsWith('chrome://')) return;

	const simplified = domain.simplified;

	// 检查该简化域名是否已存在标签组
	if (domainGroupMap[simplified]) {
		try {
			// 先检查组是否仍然存在
			const groupExists = await checkIfGroupExists(domainGroupMap[simplified].id);

			if (!groupExists) {
				// 如果组不存在，从映射中删除并重新扫描
				console.log(`标签组 ${domainGroupMap[simplified].id} 不存在，清理映射并重新扫描`);
				usedColors.delete(domainGroupMap[simplified].color);
				delete domainGroupMap[simplified];
				// 重新创建该域名的组
				return await scanAndCreateGroupForSimplifiedDomain(simplified);
			}

			// 将完整域名添加到集合中
			domainGroupMap[simplified].domains.add(domain.full);

			// 尝试将标签添加到组
			await chrome.tabs.group({
				tabIds: [tabId],
				groupId: domainGroupMap[simplified].id
			});
		} catch (e) {
			// 记录详细错误信息
			console.error(`将标签添加到组失败 (ID: ${tabId}, URL: ${url}, Group: ${domainGroupMap[simplified]?.id}):`, e);

			// 检查是否是组不存在了，重新扫描
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
				const groupId = await chrome.tabs.group({ tabIds });
				const color = getRandomColor();

				await chrome.tabGroups.update(groupId, {
					title: simplified,
					color: color
				});

				// 创建后自动折叠
				await autoCollapseGroup(groupId);

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

// 当标签被更新时，检查URL是否改变
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.url) {
		processTab(tabId, changeInfo.url);
	}
});

// 当标签被移除时，检查组是否为空
chrome.tabs.onRemoved.addListener(async () => {
	// 获取所有标签组
	const groups = await chrome.tabGroups.query({});

	// 获取所有标签
	const tabs = await chrome.tabs.query({});

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
						usedColors.delete(groupInfo.color);
					}
					break;
				}
			}
		}
	}
});

// 折叠所有标签组
async function collapseAllGroups() {
	try {
		const groups = await chrome.tabGroups.query({});
		for (const group of groups) {
			if (!group.collapsed) {
				await chrome.tabGroups.update(group.id, { collapsed: true });
			}
		}
	} catch (error) {
		console.error('折叠所有标签组失败:', error);
	}
}

// 在扩展启动或安装时折叠所有组
chrome.runtime.onStartup.addListener(collapseAllGroups);
chrome.runtime.onInstalled.addListener(collapseAllGroups);

// 初始扫描
chrome.runtime.onInstalled.addListener(() => {
	scanAndGroupTabs();
});

// 初始化时也扫描一次并折叠所有组
scanAndGroupTabs().then(() => collapseAllGroups());


