import type { User } from "./types";
import type { ContentItem, ImageSize } from "./types";

/**
 * 解析数据库中的JSON content，格式错误时返回空数组
 */
export function parseContent(contentStr: string | null): ContentItem[] {
  if (!contentStr) return [];
  try {
    return JSON.parse(contentStr);
  } catch {
    return [];
  }
}

/**
 * 提取内容文本，多用于预览
 * @param content 内容项数组
 * @param includePlaceholders 是否包含 [图片] 等占位符，用于吧主页（ArchiveView）预览一楼，默认 true
 */
export function extractTextContent(content: ContentItem[], includePlaceholders = true): string {
  if (!content || !Array.isArray(content)) return "";
  let text = "";
  content.forEach((item) => {
    if ((item.type === "text" || item.type === "text_bold" || item.type === "text_red" || item.type === "text_bold_red") && typeof item.content === "string") {
      text += item.content + " ";
    } else if (item.type === "username" && item.content && typeof item.content === "object" && "text" in item.content) {
      text += item.content.text + " ";
    } else if (item.type === "url" && item.content && typeof item.content === "object" && "text" in item.content) {
      text += (item.content.text || item.content.url) + " ";
    } else if (includePlaceholders) {
      if (item.type === "image") {
        text += "[图片] ";
      } else if (item.type === "video") {
        text += "[视频] ";
      } else if (item.type === "audio") {
        text += "[语音] ";
      } else if (item.type === "album") {
        text += `[图册]（${item.content.length}张）`;
      } else if (item.type === "emoticon" && item.content && typeof item.content === "object" && "description" in item.content) {
        if (item.content.description === "") {
          text += "[图片] ";
        } else {
          text += `[${item.content.description}] `;
        }
      }
    }
  });
  return text.trim();
}

/** 列表缩略图用的媒体项：图片，或已经过injectVideoMetadataIntoContent处理的视频 */
export type MediaItem = Extract<ContentItem, { type: "image" | "video" }>;

/**
 * 提取媒体（图片+视频）
 * @param content 内容项数组，其中的视频项需已注入元数据（content字段已转换为url）
 * @param limit 限制数量，默认为3，传入0或负数表示不限制
 */
export function extractMedia(content: ContentItem[], limit = 3): MediaItem[] {
  if (!content || !Array.isArray(content)) return [];
  const media: MediaItem[] = [];
  const hasLimit = limit > 0;

  for (const item of content) {
    if (hasLimit && media.length >= limit) break;
    if ((item.type === "image" && typeof item.content === "string") || (item.type === "video" && typeof item.url === "string")) {
      media.push(item);
    }
  }

  return media;
}

/**
 * 提取音频
 */
export function extractAudios(content: ContentItem[]): string[] {
  if (!content || !Array.isArray(content)) return [];
  const audios: string[] = [];
  content.forEach((item) => {
    if (item.type === "audio" && item.content && typeof item.content === "string") {
      audios.push(item.content);
    }
  });
  return audios;
}

/**
 * 获取图片文件名
 */
export function getImageFilename(url: string): string {
  return url.split("/").slice(-1)[0].split("?")[0];
}

/**
 * 获取图片缩略图URL
 */
function getImageThumbnailUrl(url: string): string {
  const filename = getImageFilename(url);
  if (filename.length <= 24) return `https://fursuit-static.catme0w.org/images/full/${filename}`;
  const stem = filename.lastIndexOf(".") !== -1 ? filename.substring(0, filename.lastIndexOf(".")) : filename;
  return `https://fursuit-static.catme0w.org/images/thumb/${stem}.webp`;
}

/**
 * 解析贴吧短视频URL
 * URL格式: https://tieba.baidu.com/mo/q/movideo/page?thumbnail=...&video=...
 * 旧版播放器（见于管理日志）: https://tb1.bdstatic.com/tb/zt/movideo/video.swf?thumbnail=...&video=...
 */
export function parseTiebaShortVideoUrl(url: string): { videoUrl: string; thumbnailUrl: string | null } | null {
  if (!url.includes("/movideo/")) return null;

  try {
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get("video");
    const thumbnail = urlObj.searchParams.get("thumbnail");

    if (videoId) {
      return {
        videoUrl: `https://fursuit-static.catme0w.org/videos/full/${videoId}.mp4`,
        thumbnailUrl: thumbnail ? `https://fursuit-static.catme0w.org/images/full/${thumbnail}.jpg` : null,
      };
    }
  } catch (e) { }
  return null;
}

/**
 * 获取列表缩略图URL
 * 图片返回缩略图，视频仅在CDN存有封面时返回封面
 * 贴吧短视频需带thumbnail参数，外部视频需有元数据
 */
export function getThumbnailUrl(item: MediaItem): string | null {
  if (item.type === "image") return getImageThumbnailUrl(item.content);

  const tiebaVideo = parseTiebaShortVideoUrl(item.url);
  if (tiebaVideo) return tiebaVideo.thumbnailUrl;

  if (item.metadata?.id) return `https://fursuit-static.catme0w.org/videos/cover/${item.metadata.id}.jpg`;
  return null;
}

/**
 * 获取缩略图的显示尺寸，与max-h-32（128px）一致，缩略图本身也按此高度生成
 */
export function getThumbnailSize(item: MediaItem): ImageSize | undefined {
  if (item.type !== "image" || !item.size) return undefined;
  const height = Math.min(128, item.size.height);
  return { width: Math.round((item.size.width * height) / item.size.height), height };
}

/**
 * 获取用户显示名称
 * 可传入User对象或username/nickname字符串
 */
export function getUserDisplayName(userOrUsername?: User | string | null, nickname?: string | null): string {
  if (typeof userOrUsername === "object" && userOrUsername !== null) {
    return userOrUsername.nickname || userOrUsername.username || "";
  }

  const username = userOrUsername as string | undefined;
  if (!username && !nickname) return "";
  return nickname || username || "";
}

/**
 * 获取头像URL
 */
export function getAvatarUrl(avatar: string | null): string {
  if (!avatar) return "";
  const cleanAvatar = avatar.split("?")[0];
  return `https://fursuit-static.catme0w.org/images/full/${cleanAvatar}.jpg`;
}

/**
 * 获取表情URL
 */
export function getEmoticonUrl(emoticonId: string): string {
  const BaseUrl = "https://fursuit-static.catme0w.org/images/full/";

  if (emoticonId === "image_emoticon") emoticonId = "image_emoticon1";

  if (emoticonId.startsWith("image_emoticon")) {
    return `${BaseUrl}${emoticonId}.png`;
  }

  const gifPrefixes = ["i_f", "t_00", "w_00", "ali_0", "yz_0", "bearchildren_", "B_00", "b"];
  if (gifPrefixes.some((prefix) => emoticonId.startsWith(prefix))) {
    return `${BaseUrl}${emoticonId}.gif`;
  }

  return "";
}

/**
 * 获取图片URL
 */
export function getImageUrl(originalUrl: string): string {
  const filename = getImageFilename(originalUrl);
  return `https://fursuit-static.catme0w.org/images/full/${filename}`;
}

/**
 * 是否为帖子正文图片
 */
export function isContentPhotoUrl(originalUrl: string): boolean {
  return originalUrl.startsWith("https://imgsrc.baidu.com/") || originalUrl.startsWith("https://tiebapic.baidu.com/");
}

/**
 * 获取音频URL
 * 浏览器不支持直接播放amr格式音频，此处使用转码后的mp3
 * 获取原始amr：https://fursuit-static.catme0w.org/audios/amr/{audioId}.amr
 */
export function getAudioUrl(audioId: string): string {
  return `https://fursuit-static.catme0w.org/audios/mp3/${audioId}.mp3`;
}

/**
 * 检查用户是否为已知破坏者
 */
export function isVandal(userId: number): boolean {
  const vandalUserIds = new Set([
    1092681533, 2770297246, 929918145, 3246637449, 1140272772, 1215914293, 44116606, 702253602, 7910917, 142661247, 14418690, 1054172080, 3167939744,
    3167937692, 3167954409, 3420903823, 3238825000, 3249550356, 3249632563, 1925359108, 3253890577, 3159627023, 3159639198, 3159511862, 1059195262,
  ]);
  if (userId > 3288e6 && userId < 3289e6) return true;
  if (userId > 3007e6 && userId < 3008e6) return true;
  if (userId > 3153e6 && userId < 3154e6) return true;
  if (userId > 2923e6 && userId < 2924e6) return true;
  return vandalUserIds.has(userId);
}

/**
 * 检查用户名是否为已知破坏者
 * 已被百度封禁的用户无法确定ID，使用这个函数检查
 */
export function isVandalUsername(username: string): boolean {
  const vandalUsernames = new Set<string>(["飛翔之龍"]);
  return vandalUsernames.has(username);
}

/**
 * 将数据库内的时间格式 "YYYY-MM-DD HH:mm:ss" 转换为 ISO 8601 "YYYY-MM-DDTHH:mm:ss+08:00"
 */
export function formatIsoDate(timeStr: string): string {
  if (!timeStr) return "";
  return timeStr.replace(" ", "T") + "+08:00";
}

/**
 * "YYYY-MM-DD HH:mm:ss" -> "2016年7月22日"
 */
export function formatCnDate(timeStr: string): string {
  const [y, m, d] = timeStr.split(/[- ]/);
  return `${y}年${Number(m)}月${Number(d)}日`;
}

/**
 * 两个时间之间的月份范围，如“2019年5月至2019年8月”，同月时只返回一个月份，顺序无关
 */
export function formatCnMonthRange(a: string, b: string): string {
  const [from, to] = a <= b ? [a, b] : [b, a];
  const month = (t: string) => {
    const [y, m] = t.split("-");
    return `${y}年${Number(m)}月`;
  };
  return month(from) === month(to) ? month(from) : `${month(from)}至${month(to)}`;
}

/**
 * 生成meta description：折叠空白，截断长文本
 */
export function toMetaDescription(text: string, max = 100): string {
  const chars = Array.from(text.replace(/\s+/g, " ").trim());
  return chars.length > max ? chars.slice(0, max - 1).join("").trimEnd() + "…" : chars.join("");
}
