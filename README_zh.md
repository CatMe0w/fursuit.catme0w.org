# fursuit.catme0w.org 重制版

Project Ex Nihilo 网页。

Project Ex Nihilo 是一个互联网存档项目，包含了百度贴吧“fursuit 吧”于 2022 年 2 月的完整存档。

**立即访问**： https://fursuit.catme0w.org/

## 重制版更新说明

项目已完全重写，版本号跳至 1.0.0。旧有 Rust 后端已被废除，原有逻辑已全部迁移至前端，即本仓库。

URL 结构有更改，仍向前兼容旧有链接。

### 主要更新内容

- 大幅改善设计与交互逻辑
- 大幅改善移动端浏览体验
- 大幅改善搜索功能
- 大幅改善爆吧事件的标注，现在可以明确区分爆吧事件中的破坏者（爆吧机器人，以及在此次事件中夺权成为吧主的各类虚假账号）
- 修复显示为“参数错误”的大量图片
- 图片、视频、语音资源迁移至自购 S3 存储，不再依赖百度的网络服务
- 补齐视频与语音播放功能
- 补齐红字和加粗渲染
- 补齐签名档显示

## 安装依赖

需要 Node.js。推荐使用 pnpm。

`pnpm i`

## 使用方法

### 启动开发服务器

`pnpm dev`

在 http://localhost:4321/ 访问开发服务器。

### 构建

`pnpm build`

## 数据库

默认无需任何操作。本地不存在 `data/vault.db` 时，`pnpm dev` 与 `pnpm build` 会自动从我们的 S3 存储下载。数据库版本由 `src/lib/dbConfig.ts` 指定，版本更新后，删除本地的 `data/vault.db` 即可重新下载。

如需自行创建数据库，可在 [ex_nihilo_vault](https://github.com/CatMe0w/ex_nihilo_vault) 取得 V1 版本数据库，依次运行 `migrations` 目录下的脚本（`v1_to_v2.sql`、`v2_to_v3.sql`……），并将结果保存为 `data/vault.db`。

## 开源许可

[MIT License](https://opensource.org/licenses/MIT)
