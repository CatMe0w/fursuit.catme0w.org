import type { ContentItem, ImageSize } from "./types";
import { extractTextContent, getImageUrl, isContentPhotoUrl } from "./content-utils";

// JSON-LD
// https://developers.google.com/search/docs/appearance/structured-data/discussion-forum
// https://developers.google.com/search/docs/appearance/structured-data/profile-page

// 转义 < 防止正文出现 </script> 提前闭合标签
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function getStructuredText(content: ContentItem[]): string {
  return extractTextContent(content, false) || extractTextContent(content, true) || "[无文字内容]";
}

export function getStructuredImages(content: ContentItem[]): string[] | undefined {
  if (!content || !Array.isArray(content)) return undefined;
  const images: string[] = [];
  for (const item of content) {
    if (item.type === "image" && typeof item.content === "string") {
      images.push(getImageUrl(item.content));
    } else if (item.type === "album" && Array.isArray(item.content)) {
      for (const albumItem of item.content) {
        if (albumItem?.url) images.push(getImageUrl(albumItem.url));
      }
    }
  }
  return images.length > 0 ? images : undefined;
}

export function buildPerson(site: URL | undefined, userId: number, username: string | null | undefined, nickname: string | null | undefined) {
  return {
    "@type": "Person",
    name: nickname || username || `用户${userId}`,
    url: new URL(`/user/${userId}`, site).href,
  };
}

export interface OgImage {
  url: string;
  width?: number;
  height?: number;
}

/**
 * Open Graph预览图，按顺序取第一张正文图片
 */
export function getOgImage(contents: ContentItem[][]): OgImage | undefined {
  const toOg = (url: string, size?: ImageSize): OgImage => ({ url: getImageUrl(url), width: size?.width, height: size?.height });
  for (const content of contents) {
    for (const item of content ?? []) {
      if (item.type === "image" && typeof item.content === "string" && isContentPhotoUrl(item.content)) return toOg(item.content, item.size);
      if (item.type === "album" && item.content?.[0]?.url) return toOg(item.content[0].url, item.content[0].size);
    }
  }
  return undefined;
}
