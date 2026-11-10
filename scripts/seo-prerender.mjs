#!/usr/bin/env node
// 构建后处理：为 dist 中 86 个工具路由生成独立静态页（唯一 title/description/canonical）、
// 首页工具导航、sitemap 与 robots。Vue 挂载后会替换静态内容，SPA 功能不受影响。

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const SITE = "https://tools.htmax.cn";
const ALT_SITE = "https://json.htmax.cn";
const today = new Date().toISOString().slice(0, 10);
const tools = JSON.parse(readFileSync(join(root, "seo/tools-zh.json"), "utf8"));

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const stripMarkers = (html) =>
  html
    .replace(/<!-- seo-head:start -->[\s\S]*?<!-- seo-head:end -->\n?/g, "")
    .replace(/<!-- seo-body:start -->[\s\S]*?<!-- seo-body:end -->\n?/g, "");

const cleanHead = (html) =>
  html
    .replace(/<title>[\s\S]*?<\/title>\s*/, "")
    .replace(/<meta\s+itemprop="(?:name|description)"[\s\S]*?\/>\s*/g, "")
    .replace(/<meta\s+name="description"[\s\S]*?\/>\s*/g, "")
    .replace(/<meta\s+property="og:[^"]*"[\s\S]*?\/>\s*/g, "")
    .replace(/<meta\s+name="twitter:[^"]*"[\s\S]*?\/>\s*/g, "")
    .replace(/<link rel="canonical"[\s\S]*?\/>\s*/g, "")
    .replace('<html lang="en">', '<html lang="zh-CN">');

const base = cleanHead(stripMarkers(readFileSync(join(dist, "index.html"), "utf8")));

const ld = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c");

const headBlock = ({ title, description, keywords, url, jsonld }) => `<!-- seo-head:start -->
<title>${esc(title)}</title>
<link rel="canonical" href="${url}" />
<meta name="description" content="${esc(description)}" />
<meta name="keywords" content="${esc(keywords)}" />
<meta property="og:url" content="${url}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${SITE}/banner.png" />
<meta property="og:site_name" content="IT Tools 在线工具箱" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${SITE}/banner.png" />
<script type="application/ld+json">${ld(jsonld)}</script>
<!-- seo-head:end -->`;

const render = (body, head) =>
  base
    .replace("</head>", `${head}\n  </head>`)
    .replace('<div id="app"></div>', `<div id="app"><!-- seo-body:start -->${body}<!-- seo-body:end --></div>`);

const bodyStyle = `max-width:860px;margin:0 auto;padding:40px 16px;font-family:system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;color:#333;line-height:1.75`;
const linkStyle = "color:#18a058;text-decoration:none";

const toolBody = (t) => `<main style="${bodyStyle}">
<nav style="font-size:13px;color:#888;margin-bottom:14px"><a href="/" style="${linkStyle}">IT Tools 在线工具箱</a> / ${esc(t.categoryZh)} / ${esc(t.title)}</nav>
<h1 style="font-size:26px;margin:0 0 14px">${esc(t.title)}</h1>
<p style="margin:0 0 10px">${esc(t.description)}</p>
<p style="margin:0 0 18px;color:#666">免费在线使用，无需注册；所有计算在浏览器本地完成，数据不会上传服务器。</p>
<p style="font-size:14px;margin:0"><a href="/" style="${linkStyle}">← 返回工具列表（共 ${tools.length} 个工具）</a></p>
</main>`;

const homeBody = () => {
  const groups = [];
  for (const t of tools) {
    const g = groups.find((x) => x.name === t.categoryZh);
    if (g) g.items.push(t);
    else groups.push({ name: t.categoryZh, items: [t] });
  }
  const sections = groups
    .map(
      (g) => `<section style="margin:22px 0">
<h2 style="font-size:18px;margin:0 0 8px;border-bottom:1px solid #eee;padding-bottom:6px">${esc(g.name)}</h2>
<ul style="margin:0;padding-left:20px;font-size:14px">
${g.items.map((t) => `<li style="margin:4px 0"><a href="${t.path}/" style="${linkStyle}">${esc(t.title)}</a> — ${esc(t.description)}</li>`).join("\n")}
</ul>
</section>`
    )
    .join("\n");
  return `<main style="max-width:1080px;margin:0 auto;padding:40px 16px;font-family:system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;color:#333;line-height:1.75">
<h1 style="font-size:28px;margin:0 0 14px">IT Tools 在线工具箱</h1>
<p style="margin:0 0 8px">收录 ${tools.length} 个免费在线开发者工具：JSON 格式化、Base64 编解码、UUID/ULID 生成、哈希与加密、二维码、正则测试、CRON 表达式、IP/子网计算、单位换算等，打开即用。</p>
<p style="margin:0 0 4px;color:#666;font-size:14px">全部工具在浏览器本地运行，不上传任何数据；无需注册登录。</p>
${sections}
</main>`;
};

const homeTitle = `IT Tools 在线工具箱 - ${tools.length} 个免费开发者工具`;
const homeDescription = `IT Tools 在线工具箱提供 ${tools.length} 个免费开发者工具，包括 JSON 格式化、Base64 编解码、UUID 生成、哈希加密、二维码生成、正则测试、CRON 表达式、IP 子网计算等，打开即用，数据不上传服务器。`;
const homeKeywords =
  "IT Tools,在线工具箱,开发者工具,JSON格式化,Base64编解码,UUID生成,哈希加密,二维码生成,正则测试,CRON表达式,时间戳转换,IP子网计算";

const homeHead = headBlock({
  title: homeTitle,
  description: homeDescription,
  keywords: homeKeywords,
  url: `${SITE}/`,
  jsonld: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "IT Tools 在线工具箱",
    url: `${SITE}/`,
    description: homeDescription,
    inLanguage: "zh-CN",
  },
});

writeFileSync(join(dist, "index.html"), render(homeBody(), homeHead));

for (const t of tools) {
  const url = `${SITE}${t.path}/`;
  const desc =
    t.description.length > 110 ? `${t.description.slice(0, 110)}…` : t.description;
  const title = `${t.title} - 在线${t.categoryZh}工具 | IT Tools 在线工具箱`;
  const keywords = [
    t.title,
    `${t.categoryZh}工具`,
    ...t.keywords,
    "在线工具",
    "IT Tools",
  ]
    .filter((v, i, arr) => v && arr.indexOf(v) === i)
    .join(",");
  const head = headBlock({
    title,
    description: `${desc}免费在线使用，无需注册，数据在浏览器本地处理。`,
    keywords,
    url,
    jsonld: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: t.title,
      url,
      description: t.description,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      inLanguage: "zh-CN",
      offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
    },
  });
  const out = join(dist, t.path.slice(1), "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, render(toolBody(t), head));
}

const urls = [
  { loc: `${SITE}/`, priority: "1.0", changefreq: "weekly" },
  ...tools.map((t) => ({ loc: `${SITE}${t.path}/`, priority: "0.8", changefreq: "monthly" })),
];
const sitemap = (host) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc.replace(SITE, host)}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
  )
  .join("\n")}
</urlset>
`;
writeFileSync(join(dist, "sitemap.xml"), sitemap(SITE));
writeFileSync(join(dist, "sitemap-json.xml"), sitemap(ALT_SITE));

const robots = (host) => `User-agent: *
Allow: /

Sitemap: ${host}/sitemap.xml
`;
writeFileSync(join(dist, "robots.txt"), robots(SITE));
writeFileSync(join(dist, "robots-json.txt"), robots(ALT_SITE));

console.log(`seo-prerender: ${tools.length} tool pages, sitemap (${tools.length + 1} urls), robots ok`);
