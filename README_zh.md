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

### V2 版本数据库更新说明

自重制版（1.0.0）起，项目使用 V2 版本数据库。变更内容见 `migrations` 目录下的 SQL 脚本。

如需从 V1 数据库升级至 V2，可在 [ex_nihilo_vault](https://github.com/CatMe0w/ex_nihilo_vault) 取得 V1 版本数据库后，运行脚本以升级至 V2。

## 安装依赖

需要 Node.js。推荐使用 pnpm。

`pnpm i`

## 使用方法

### 启动开发服务器

`pnpm dev`

在 http://localhost:4321/ 访问开发服务器。

### 构建

`pnpm build`

## 开源许可

[MIT License](https://opensource.org/licenses/MIT)
