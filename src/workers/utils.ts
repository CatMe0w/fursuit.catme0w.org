export function parseContent(contentStr: string | null): any[] {
  if (!contentStr) return [];
  try {
    return JSON.parse(contentStr);
  } catch {
    return [];
  }
}

export function buildMultiWordLike(words: string[], qualifiedColumns: string[]): { clause: string; params: string[] } {
  if (words.length === 0) return { clause: '1=1', params: [] };
  const parts: string[] = [];
  const params: string[] = [];
  for (const w of words) {
    parts.push(`(${qualifiedColumns.map(c => `${c} LIKE ?`).join(' OR ')})`);
    for (let i = 0; i < qualifiedColumns.length; i++) params.push(`%${w}%`);
  }
  return { clause: parts.join(' AND '), params };
}

export function getYoukuId(url: string): string | null {
  const match1 = url.match(/id_(X[a-zA-Z0-9]+)/);
  if (match1) return match1[1];

  const match2 = url.match(/sid\/(X[a-zA-Z0-9]+)/);
  if (match2) return match2[1];

  return null;
}

export function getQQVideoId(url: string): string | null {
  const match = url.match(/\/([a-zA-Z0-9]+)\.html/);
  if (match) return match[1];
  return null;
}

/**
 * 注入视频元数据到 content 数组中
 * 将视频的 content 字段转换为 url 字段，并注入 metadata
 */
export function injectVideoMetadataIntoContent(content: any[], getVideoMetadata: (id: string) => any | null): void {
  for (const item of content) {
    if (item.type === 'video' && typeof item.content === 'string') {
      const url = item.content;
      const youkuId = getYoukuId(url);
      const qqId = getQQVideoId(url);
      const videoId = youkuId || qqId;

      // 将 content 改为 url
      delete item.content;
      item.url = url;

      if (videoId) {
        const metadata = getVideoMetadata(videoId);
        if (metadata) {
          item.metadata = { ...metadata, id: videoId };
        }
      }
    }
  }
}
