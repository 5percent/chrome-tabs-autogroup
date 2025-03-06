// 数据处理逻辑
export default class GroupModel {

  static organizeTabsIntoGroups(groups, tabs) {
    const groupMap = {};

    // 初始化组信息
    groups.forEach(group => {
      groupMap[group.id] = {
        ...group,
        tabs: []
      };
    });

    // 添加未分组的标签容器
    groupMap['ungrouped'] = {
      id: 'ungrouped',
      title: '未分组标签',
      color: 'grey',
      tabs: []
    };

    // 将标签页归类到对应的组
    tabs.forEach(tab => {
      if (tab.groupId > 0 && groupMap[tab.groupId]) {
        groupMap[tab.groupId].tabs.push(tab);
      } else {
        groupMap['ungrouped'].tabs.push(tab);
      }
    });

    return Object.values(groupMap).filter(group => group.tabs.length > 0);
  }
}