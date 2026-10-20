// 专用入口域名：这些域名只提供一个工具，隐藏首页/菜单等所有导航
// shortcut: 硬编码在代码里，要加新入口就改这张表并重新构建
const dedicatedToolByHost: Record<string, string> = {
  'json.htmax.cn': '/json-prettify',
};

export const dedicatedToolPath = dedicatedToolByHost[window.location.hostname];
export const isDedicatedHost = dedicatedToolPath !== undefined;
