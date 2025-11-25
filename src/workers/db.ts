import initSqlJs, { type Database } from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import type { WorkerResponse } from "../lib/types";
import { DB_URL, DB_VERSION } from "../lib/dbConfig";

const CACHE_NAME = `fursuit-vault-${DB_VERSION}`;

let db: Database | null = null;
let initPromise: Promise<void> | null = null;

/**
 * 加载资源
 */
async function loadWithCache(url: string, stage: string, postMessage: (msg: WorkerResponse) => void): Promise<ArrayBuffer> {
  const cacheAvailable = typeof caches !== "undefined";
  let response: Response | undefined;

  // 尝试从缓存读取
  if (cacheAvailable) {
    const cache = await caches.open(CACHE_NAME);
    response = await cache.match(url);
  }

  if (!response) {
    // 缓存未命中或不可用，下载资源
    postMessage({ type: "progress", loaded: 0, total: 100, stage } as WorkerResponse);

    response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    // 尝试缓存响应
    if (cacheAvailable) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(url, response.clone());
    }
  }

  const reader = response.body?.getReader();
  const contentLength = parseInt(response.headers.get("Content-Length") || "0");
  let loaded = 0;
  const chunks: Uint8Array[] = [];

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      loaded += value.length;

      if (contentLength > 0) {
        postMessage({
          type: "progress",
          loaded,
          total: contentLength,
          stage,
        } as WorkerResponse);
      }
    }
  }

  // 合并所有chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}

/**
 * 清理旧版本缓存
 */
async function cleanupOldCaches() {
  if (typeof caches === "undefined") return;

  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("fursuit-vault-") && key !== CACHE_NAME).map((key) => caches.delete(key)));
  } catch (error) {
    console.warn("Failed to cleanup old caches:", error);
  }
}

/**
 * 初始化数据库
 */
export async function initDatabase(postMessage: (msg: WorkerResponse) => void): Promise<void> {
  if (db) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // 加载sql.js
      postMessage({ type: "progress", loaded: 0, total: 100, stage: "Loading sql.js" } as WorkerResponse);
      const SQL = await initSqlJs({
        locateFile: () => sqlWasmUrl,
      });

      // 加载数据库文件
      const dbBuffer = await loadWithCache(DB_URL, "Loading database", postMessage);

      // 初始化数据库
      db = new SQL.Database(new Uint8Array(dbBuffer));

      // 清理旧缓存
      await cleanupOldCaches();

      postMessage({ type: "ready" } as WorkerResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      postMessage({ type: "error", message } as WorkerResponse);
      throw error;
    }
  })();

  return initPromise;
}

export function getDb(): Database {
  if (!db) throw new Error("Database not initialized");
  return db;
}
