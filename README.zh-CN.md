# IT Tools · 中文说明

> 本文件是 [htmax/it-tools](https://github.com/htmax/it-tools) 这份 fork 的中文介绍，记录自建改动与部署方式。上游原始说明见 [`README.md`](./README.md)。
>
> 线上地址：<https://tools.htmax.cn>

IT Tools 是一组面向开发者的日常小工具：编码 / 加密、格式化与转换、UUID 与哈希、时间戳、正则测试、颜色处理、JSON 处理等。整站纯前端，数据不上传。

## 这份 fork 改了什么

| 分类 | 改动 |
| --- | --- |
| 收藏 | 修复收藏持久化；无 `path` 的工具不再写入收藏，避免脏数据 |
| JSON 工具 | `json-viewer` 功能增强 |
| 时间戳 | `date-converter` 支持日期时间与 Unix 时间戳**双向**转换，并补各语言获取当前时间戳的示例 |
| PWA | 摘掉 Service Worker（解决「硬刷新能拖、普通刷新又失效」的缓存问题），保留 manifest 以便安装 |
| 界面 | 工具详情页默认内容宽度提升到 1000px；中文与多语言文案调整 |
| 构建 | 修复两处阻塞生产构建的类型错误；支持 dedicated-host |
| 上游 | 定期 merge `upstream/main`（最近一次带入 14 个提交，含收藏拖拽排序） |

## 本地开发

```bash
pnpm install
pnpm dev            # 开发服务器
pnpm build          # 生产构建，产物在 dist/
pnpm preview        # 预览构建结果
pnpm type-check     # 类型检查
```

需要 Node 18+ 与 pnpm。

## 构建与部署

镜像在本仓库构建，容器编排在 <https://github.com/htmax/it-tools-deploy>：

```bash
docker build -t it-tools:local .
cd /root/it-tools && docker compose up -d
```

- 容器只监听 `127.0.0.1:40116`，对外由 OpenResty 反代到 `tools.htmax.cn`
- 镜像 tag 固定为 `it-tools:local`，不会被上游镜像覆盖
- compose 显式声明项目名 `it-tools-local`，避免与 1Panel 应用商店那份同名项目互相 `down`

## 许可

上游 IT Tools 为 MIT；本 fork 的自建改动同样以 MIT 提供。
