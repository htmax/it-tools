// 新版已不再注册 Service Worker（见 src/main.ts），这个文件只干一件事：
// 让老客户端里残留的 SW 在下次更新检查时把自己注销掉并清空缓存。
// 没有它，旧 SW 会一直从 precache 里返回旧构建 —— 表现就是"硬刷正常、普通刷新又变旧"。

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.registration.unregister();
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  })());
});
