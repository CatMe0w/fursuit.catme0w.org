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
