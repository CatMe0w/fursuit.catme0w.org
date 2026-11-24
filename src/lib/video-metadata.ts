import type { Database } from "sql.js";
import type { ContentItem, VideoMetadata } from "./types";

/**
 * 视频元数据注入（v2 video_metadata表）
 * 档案馆（data.ts）与时间机器worker共用
 */

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
  const stmt = db.prepare("SELECT metadata FROM video_metadata WHERE id = ?");
  stmt.bind([id]);

  let metadataStr: string | null = null;
  if (stmt.step()) metadataStr = stmt.getAsObject().metadata as string;
  stmt.free();
  if (metadataStr === null) return null;

  try {
    const metadata = JSON.parse(metadataStr);
    return {
      id: id,
      title: metadata.title,
      uploader: metadata.uploader,
      uploaderUrl: metadata.uploader_url,
    };
  } catch (e) {
    console.error("Failed to parse video metadata", e);
    return null;
  }
}

/**
 * 将数据库中视频项的content字段转换为url字段，并为优酷、腾讯视频注入元数据
 */
export function injectVideoMetadataIntoContent(db: Database, content: ContentItem[]): void {
  for (const item of content as any[]) {
    if (item.type !== "video" || typeof item.content !== "string") continue;

    const url: string = item.content;
    delete item.content;
    item.url = url;

    const videoId = getYoukuId(url) || getQQVideoId(url);
    if (!videoId) continue;

    const metadata = getVideoMetadata(db, videoId);
    if (metadata) item.metadata = { ...metadata, id: videoId };
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
