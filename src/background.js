// background.js
import { scanAndGroupTabs, collapseAllGroups, processTab, checkAndRemoveGroup } from './utils/tabs.js';
import { debounce } from './utils/debounce.js';

let domainGroupMap = {};

function sendMsg() {
	chrome.runtime.sendMessage({ action: 'updateTabGroups' }, () => {
		if (chrome.runtime.lastError) {
			console.warn("sendMsg warning:", chrome.runtime.lastError.message);
		}
	});
}

// 注册 sidePanel
chrome.sidePanel
	.setPanelBehavior({ openPanelOnActionClick: true })
	.catch((error) => console.error(error));

// 初始化时扫描所有标签并分组
chrome.runtime.onInstalled.addListener(async () => {
	await scanAndGroupTabs(domainGroupMap);
	await collapseAllGroups();
	sendMsg();
});

// 当标签被创建时，检查是否需要添加到已有的组
chrome.tabs.onCreated.addListener(async (tab) => {
	// 新标签页可能从空白开始，我们不急于立即处理
	if (!tab.url || tab.url === 'chrome://newtab/' || tab.url === 'about:blank') {
		console.log(`新标签创建: ${tab.id}，等待加载完成...`);
		// 不立即移除监听器，而是等待标签完成加载并到达最终URL
		const listener = async (tabId, changeInfo, updatedTab) => {
			// 只处理相关的标签且有URL变化
			if (tabId !== tab.id) return;

			// 仅当URL变化且不是chrome内部页面时处理
			if (changeInfo.url && !changeInfo.url.startsWith('chrome://') && !changeInfo.url.startsWith('about:blank')) {
				console.log(`标签 ${tabId} URL变化为: ${changeInfo.url}`);

				// 等待一小段时间确保标签状态稳定
				setTimeout(async () => {
					try {
						// 获取最新的标签信息
						const currentTab = await chrome.tabs.get(tabId);
						await processTab(tabId, currentTab.url, domainGroupMap);
						sendMsg();

						// 只有在标签达到完全加载状态时才移除监听器
						if (currentTab.status === 'complete') {
							console.log(`标签 ${tabId} 已完成加载，移除监听器`);
							chrome.tabs.onUpdated.removeListener(listener);
						}
					} catch (error) {
						console.error(`处理标签 ${tabId} 失败:`, error);
						// 出错时也移除监听器以避免泄漏
						chrome.tabs.onUpdated.removeListener(listener);
					}
				}, 500); // 短暂延迟确保标签状态稳定
			}

			// 标签完成加载但没有URL变化时，检查是否需要分组
			else if (changeInfo.status === 'complete' && updatedTab.url &&
				!updatedTab.url.startsWith('chrome://') &&
				!updatedTab.url.startsWith('about:blank')) {
				console.log(`标签 ${tabId} 完成加载: ${updatedTab.url}`);
				await processTab(tabId, updatedTab.url, domainGroupMap);
				sendMsg();
				chrome.tabs.onUpdated.removeListener(listener);
			}
		};

		chrome.tabs.onUpdated.addListener(listener);
	} else {
		// 标签创建时已有有效URL
		console.log(`新标签已有URL: ${tab.id} - ${tab.url}`);
		if (!tab.url.startsWith('chrome://')) {
			await processTab(tab.id, tab.url, domainGroupMap);
			sendMsg();
		}
	}
});

// 修改现有的URL变更监听器，避免与上面的逻辑冲突
chrome.tabs.onUpdated.addListener(debounce(async (tabId, changeInfo, tab) => {
	// 只处理明确的URL变化，且不是新建标签页的情况
	if (changeInfo.url &&
		!changeInfo.url.startsWith('chrome://') &&
		!changeInfo.url.startsWith('about:blank') &&
		tab && tab.status === 'complete') { // 确保标签已完成加载

		console.log(`现有标签 ${tabId} URL变化: ${changeInfo.url}`);

		// 检查是否已在某个组中
		const currentGroupId = tab.groupId;
		if (currentGroupId > 0) {
			// 标签已在组中，需要检查是否应该移到其他组
			console.log(`标签 ${tabId} 已在组 ${currentGroupId} 中`);
		}

		await processTab(tabId, changeInfo.url, domainGroupMap);
		sendMsg();
	}
}, 300));

chrome.tabs.onRemoved.addListener(debounce(async () => {
	await checkAndRemoveGroup(domainGroupMap);
	sendMsg();
}, 300));
