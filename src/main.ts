import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createHead } from '@vueuse/head';

import shadow from 'vue-shadow-dom';
import { plausible } from './plugins/plausible.plugin';

import 'virtual:uno.css';

import { naive } from './plugins/naive.plugin';

import App from './App.vue';
import router from './router';
import { i18nPlugin } from './plugins/i18n.plugin';

// 旧版本注册过 Service Worker，会让刷新一直命中旧构建（“硬刷能拖、普通刷新又失效”）。
// 这里主动注销所有 SW 并清空 Cache Storage，新构建立即生效。
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()));
  if ('caches' in window) {
    caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
  }
}

const app = createApp(App);

app.use(createPinia());
app.use(createHead());
app.use(i18nPlugin);
app.use(router);
app.use(naive);
app.use(plausible);
app.use(shadow);

app.mount('#app');
