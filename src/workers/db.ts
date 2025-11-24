import initSqlJs, { type Database } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type { WorkerResponse } from '../lib/types';

const DB_VERSION = 'v2';
const DB_URL = `https://fursuit-static.catme0w.org/db/${DB_VERSION}/vault.db`;
const CACHE_NAME = `fursuit-vault-${DB_VERSION}`;
const WASM_URL = sqlWasmUrl;

let db: Database | null = null;
let initPromise: Promise<void> | null = null;

/**
 * 使用Cache API加载资源
 */
async function loadWithCache(url: string, stage: string, postMessage: (msg: WorkerResponse) => void): Promise<ArrayBuffer> {
  const cache = await caches.open(CACHE_NAME);
  
  // 尝试从缓存读取
  let response = await cache.match(url);
  
  if (!response) {
    // 缓存未命中，下载并缓存
    postMessage({ type: 'progress', loaded: 0, total: 100, stage } as WorkerResponse);
    
    response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    
    // 克隆响应以便同时缓存和读取
    await cache.put(url, response.clone());
  }
  
  const reader = response.body?.getReader();
  const contentLength = parseInt(response.headers.get('Content-Length') || '0');
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
          type: 'progress',
          loaded,
          total: contentLength,
          stage
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
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter(key => key.startsWith('fursuit-vault-') && key !== CACHE_NAME)
      .map(key => caches.delete(key))
  );
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
      postMessage({ type: 'progress', loaded: 0, total: 100, stage: 'Loading sql.js' } as WorkerResponse);
      const SQL = await initSqlJs({
        locateFile: () => WASM_URL
      });
      
      // 加载数据库文件
      const dbBuffer = await loadWithCache(DB_URL, 'Loading database', postMessage);
      
      // 初始化数据库
      db = new SQL.Database(new Uint8Array(dbBuffer));
      
      // 清理旧缓存
      await cleanupOldCaches();
      
      postMessage({ type: 'ready' } as WorkerResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      postMessage({ type: 'error', message } as WorkerResponse);
      throw error;
    }
  })();
  
  return initPromise;
}

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}
