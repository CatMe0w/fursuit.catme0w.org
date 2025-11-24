import type { User } from "./data";
import type { ContentItem } from "./types";

/**
 * 提取内容文本，多用于预览
 */
export function extractTextContent(content: ContentItem[]): string {
  if (!content || !Array.isArray(content)) return "";
  let text = "";
  content.forEach((item) => {
    if ((item.type === "text" || item.type === "text_bold" || item.type === "text_red" || item.type === "text_bold_red") && typeof item.content === "string") {
      text += item.content + " ";
    } else if (item.type === "username" && item.content && typeof item.content === "object" && "text" in item.content) {
      text += item.content.text + " ";
    } else if (item.type === "url" && item.content && typeof item.content === "object" && "text" in item.content) {
      text += (item.content.text || item.content.url) + " ";
    } else if (item.type === "image") {
      text += "[图片] ";
    } else if (item.type === "video") {
      text += "[视频] ";
    } else if (item.type === "audio") {
      text += "[语音] ";
    } else if (item.type === "emoticon" && item.content && typeof item.content === "object" && "description" in item.content) {
      if (item.content.description === "") {
        text += "[图片] ";
      } else {
        text += `[${item.content.description}] `;
      }
    }
  });
  return text.trim();
}

/**
 * 提取图片（最多3张）
 */
export function extractImages(content: ContentItem[]): string[] {
  if (!content || !Array.isArray(content)) return [];
  const images: string[] = [];
  content.forEach((item) => {
    if (item.type === "image" && item.content && typeof item.content === "string" && images.length < 3) {
      images.push(item.content);
    }
  });
  return images;
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
 * 获取缩略图URL
 */
export function getImageThumbnailUrl(url: string): string {
  const filename = url.split("/").slice(-1)[0];
  if (filename.length <= 24) return `https://fursuit-static.catme0w.org/images/full/${filename}`;
  const stem = filename.lastIndexOf(".") !== -1 ? filename.substring(0, filename.lastIndexOf(".")) : filename;
  return `https://fursuit-static.catme0w.org/images/thumb/${stem}.webp`;
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
  const filename = originalUrl.split("/").slice(-1)[0];
  return `https://fursuit-static.catme0w.org/images/full/${filename}`;
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
    3167937692, 3167954409, 3420903823, 3238825000, 3249550356, 3249632563, 1925359108, 3253890577, 3159627023, 3159639198, 3159511862,
  ]);
  if (userId > 3288 * 1e6 && userId < 3289 * 1e6) return true;
  if (userId > 3007 * 1e6 && userId < 3008 * 1e6) return true;
  if (userId > 3153 * 1e6 && userId < 3154 * 1e6) return true;
  if (userId > 2923 * 1e6 && userId < 2924 * 1e6) return true;
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
 * 从优酷URL中提取视频ID
 */
export function getYoukuId(url: string): string | null {
  const match1 = url.match(/id_(X[a-zA-Z0-9]+)/);
  if (match1) return match1[1];

  const match2 = url.match(/sid\/(X[a-zA-Z0-9]+)/);
  if (match2) return match2[1];

  return null;
}

/**
 * 从QQ视频URL中提取视频ID
 */
export function getQQVideoId(url: string): string | null {
  const match = url.match(/\/([a-zA-Z0-9]+)\.html/);
  if (match) return match[1];
  return null;
}
