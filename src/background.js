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
chrome.tabs.onCreated.addListener(debounce(async (tab) => {
	// 等待标签加载完成
	if (!tab.url || tab.url === 'chrome://newtab/') {
		// 对于新标签页，等待它导航到实际URL
		const listener = async (tabId, changeInfo) => {
			if (tabId === tab.id && changeInfo.url) {
				await processTab(tabId, changeInfo.url, domainGroupMap);
				sendMsg();

				chrome.tabs.onUpdated.removeListener(listener);
			}
		};
		chrome.tabs.onUpdated.addListener(listener);
	} else {
		// 标签已有URL时直接处理
		await processTab(tab.id, tab.url);
		sendMsg();
	}
}, 50));

// 当标签被更新时，检查URL是否改变
chrome.tabs.onUpdated.addListener(debounce(async (tabId, changeInfo) => {
	if (changeInfo.url) {
		await processTab(tabId, changeInfo.url, domainGroupMap);
		sendMsg();
	}
}, 300));

chrome.tabs.onRemoved.addListener(debounce(async () => {
	await checkAndRemoveGroup(domainGroupMap);
	sendMsg();
}, 300));
