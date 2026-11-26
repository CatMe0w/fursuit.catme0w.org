import type { Database } from "sql.js";
import type { ContentItem, VideoMetadata } from "./types";

/**
 * 视频元数据注入（v4 video表）
 * 档案馆（data.ts）与时间机器worker共用
 */

const CDN = "https://fursuit-static.catme0w.org";

/**
 * 从贴吧短视频URL中提取视频ID（video参数）
 * URL格式: https://tieba.baidu.com/mo/q/movideo/page?thumbnail=...&video=...
 * 旧版播放器（见于管理日志）: https://tb1.bdstatic.com/tb/zt/movideo/video.swf?thumbnail=...&video=...
 */
function getTiebaVideoId(url: string): string | null {
  if (!url.includes("/movideo/")) return null;
  try {
    return new URL(url).searchParams.get("video");
  } catch {
    return null;
  }
}

/**
 * 从优酷URL中提取视频ID
 */
function getYoukuId(url: string): string | null {
  const match = url.match(/id_(X[a-zA-Z0-9]+)/) || url.match(/sid\/(X[a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * 从腾讯视频URL中提取视频ID
 * 支持页面地址（.../{id}.html）与旧版播放器地址（TPout.swf?vid={id}，见于管理日志）
 */
function getQQVideoId(url: string): string | null {
  if (!url.includes("qq.com")) return null;
  const match = url.match(/\/([a-zA-Z0-9]+)\.html/) || url.match(/[?&]vid=([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function getVideoMetadata(db: Database, id: string): VideoMetadata | null {
  const stmt = db.prepare("SELECT width, height, cover, cover_width, cover_height, title, uploader, uploader_url FROM video WHERE id = ?");
  stmt.bind([id]);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  if (!row) return null;

  const metadata: VideoMetadata = { id, size: { width: Number(row.width), height: Number(row.height) } };
  if (row.cover) {
    metadata.coverUrl = `${CDN}/${row.cover}`;
    if (row.cover_width && row.cover_height) metadata.coverSize = { width: Number(row.cover_width), height: Number(row.cover_height) };
  }
  if (row.title) metadata.title = String(row.title);
  if (row.uploader) metadata.uploader = String(row.uploader);
  if (row.uploader_url) metadata.uploaderUrl = String(row.uploader_url);
  return metadata;
}

/**
 * 将数据库中视频项的content字段转换为url字段，并为可播放的视频注入元数据
 * 无元数据即为失效视频（CDN上没有对应的mp4）
 */
export function injectVideoMetadataIntoContent(db: Database, content: ContentItem[]): void {
  for (const item of content as any[]) {
    if (item.type !== "video" || typeof item.content !== "string") continue;

    const url: string = item.content;
    delete item.content;
    item.url = url;

    const videoId = getTiebaVideoId(url) || getYoukuId(url) || getQQVideoId(url);
    if (!videoId) continue;

    const metadata = getVideoMetadata(db, videoId);
    if (metadata) item.metadata = metadata;
  }
}

const IMAGE_EXTENSION = /\.(jpe?g|png|gif|webp|bmp)$/i;

/**
 * 解析管理日志中换行分隔的媒体URL
 * 按扩展名区分图片与视频（数据中的图片URL均带图片扩展名），为视频项注入元数据
 */
export function parseMediaUrls(db: Database, media: string | null): ContentItem[] | null {
  if (!media) return null;
  const items = media
    .split("\n")
    .filter(Boolean)
    .map((url) => (IMAGE_EXTENSION.test(url.split("?")[0]) ? { type: "image", content: url } : { type: "video", content: url })) as ContentItem[];
  injectVideoMetadataIntoContent(db, items);
  return items.length > 0 ? items : null;
}
