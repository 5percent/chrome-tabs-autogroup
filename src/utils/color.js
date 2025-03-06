// 可用的标签组颜色
export const GROUP_COLORS = [
  'blue', 'red', 'yellow', 'green',
  'pink', 'purple', 'cyan', 'orange'
];

let usedColors = new Set();

// 获取随机未使用颜色
export function getRandomColor() {
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