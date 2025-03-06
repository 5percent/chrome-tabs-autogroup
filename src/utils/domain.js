// 从URL中提取域名和简化域名
export function extractDomain(url) {
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
export function simplifyDomain(domain) {
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