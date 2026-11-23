import initSqlJs, { type Database } from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { DB_URL, DB_VERSION } from "../lib/dbConfig";

const CACHE_NAME = `fursuit-vault-${DB_VERSION}`;

let db: Database | null = null;
let initPromise: Promise<void> | null = null;

/**
 * 加载资源
 */
async function loadWithCache(url: string): Promise<ArrayBuffer> {
  const cacheAvailable = typeof caches !== "undefined";
  let response: Response | undefined;

  // 尝试从缓存读取
  if (cacheAvailable) {
    try {
      const cache = await caches.open(CACHE_NAME);
      response = await cache.match(url);
    } catch (error) {
      console.warn("Cache read failed:", error);
    }
  }

  if (!response) {
    // 缓存未命中或不可用，下载资源
    response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    // 尝试写入缓存
    if (cacheAvailable) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(url, response.clone());
      } catch (error) {
        console.warn("Cache write failed:", error);
      }
    }
  }

  return response.arrayBuffer();
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
export async function initDatabase(): Promise<void> {
  if (db) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // 加载sql.js
    const SQL = await initSqlJs({
      locateFile: () => sqlWasmUrl,
    });

    // 加载数据库文件
    const dbBuffer = await loadWithCache(DB_URL);

    // 初始化数据库
    db = new SQL.Database(new Uint8Array(dbBuffer));

    // 清理旧缓存
    await cleanupOldCaches();
  })();

  return initPromise;
}

export function getDb(): Database {
  if (!db) throw new Error("Database not initialized");
  return db;
}
