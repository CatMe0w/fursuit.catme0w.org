import type { Database } from "sql.js";
import type { ContentItem, ImageSize, Post } from "./types";
import { getImageFilename } from "./content-utils";

/**
 * 图片宽高注入（v3 image_metadata表）
 * 档案馆（data.ts）与时间机器worker共用
 */

const QUERY_CHUNK = 500;

function collectFromContent(content: ContentItem[], out: Set<string>): void {
  for (const item of content) {
    if (item.type === "image") {
      out.add(getImageFilename(item.content));
    } else if (item.type === "album") {
      for (const albumItem of item.content) out.add(getImageFilename(albumItem.url));
    }
  }
}

function applyToContent(content: ContentItem[], sizes: Map<string, ImageSize>): void {
  for (const item of content) {
    if (item.type === "image") {
      const size = sizes.get(getImageFilename(item.content));
      if (size) item.size = size;
    } else if (item.type === "album") {
      for (const albumItem of item.content) {
        const size = sizes.get(getImageFilename(albumItem.url));
        if (size) albumItem.size = size;
      }
    }
  }
}

/**
 * 批量查询图片宽高
 */
function queryImageSizes(db: Database, filenames: Set<string>): Map<string, ImageSize> {
  const sizes = new Map<string, ImageSize>();
  const names = Array.from(filenames);
  for (let i = 0; i < names.length; i += QUERY_CHUNK) {
    const chunk = names.slice(i, i + QUERY_CHUNK);
    const placeholders = chunk.map(() => "?").join(",");
    const stmt = db.prepare(`SELECT filename, width, height FROM image_metadata WHERE filename IN (${placeholders})`);
    stmt.bind(chunk);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      sizes.set(String(row.filename), { width: Number(row.width), height: Number(row.height) });
    }
    stmt.free();
  }
  return sizes;
}

/**
 * 为楼层内容中的图片、图册和签名档注入宽高
 */
export function injectImageSizesIntoPosts(db: Database, posts: Pick<Post, "content" | "signature" | "signatureSize">[]): void {
  const filenames = new Set<string>();
  for (const post of posts) {
    collectFromContent(post.content, filenames);
    if (post.signature) filenames.add(getImageFilename(post.signature));
  }
  if (filenames.size === 0) return;

  const sizes = queryImageSizes(db, filenames);
  for (const post of posts) {
    applyToContent(post.content, sizes);
    if (post.signature) {
      const size = sizes.get(getImageFilename(post.signature));
      if (size) post.signatureSize = size;
    }
  }
}
