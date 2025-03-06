// background.js
import { scanAndGroupTabs, collapseAllGroups } from './utils/tabs.js';

let domainGroupMap = {};

chrome.sidePanel
	.setPanelBehavior({ openPanelOnActionClick: true })
	.catch((error) => console.error(error));

chrome.runtime.onInstalled.addListener(async () => {
	await scanAndGroupTabs(domainGroupMap);
	await collapseAllGroups();
});
