// 数据处理逻辑
export default class GroupModel {

  static organizeTabsIntoGroups(groups, tabs) {
    // 创建映射以快速查找组信息
    const groupMap = {};
    groups.forEach(group => {
      groupMap[group.id] = {
        id: group.id,
        title: group.title,
        color: group.color,
        collapsed: group.collapsed, // 确保传递折叠状态
        tabs: []
      };
    });

    // 添加未分组标签的特殊组
    const ungroupedTabs = [];

    // 为每个标签找到其所属组
    tabs.forEach(tab => {
      if (tab.groupId && groupMap[tab.groupId]) {
        groupMap[tab.groupId].tabs.push(tab);
      } else {
        ungroupedTabs.push(tab);
      }
    });

    // 转换为数组并添加未分组标签
    const result = Object.values(groupMap);

    if (ungroupedTabs.length > 0) {
      result.push({
        id: 'ungrouped',
        title: '未分组标签',
        color: 'grey',
        collapsed: false, // 未分组标签默认展开
        tabs: ungroupedTabs
      });
    }

    // 按组ID排序，确保未分组标签在最后
    return result.sort((a, b) => {
      if (a.id === 'ungrouped') return 1;
      if (b.id === 'ungrouped') return -1;
      return a.id - b.id;
    });
  }
}