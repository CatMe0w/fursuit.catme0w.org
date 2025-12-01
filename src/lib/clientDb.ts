import type { Thread, SearchOptions, SearchResult, SearchResponse, UserInfo, ThreadDetailResponse, WorkerResponse } from "./types";
import { DB_VERSION } from "./dbConfig";

type ProgressCallback = (loaded: number, total: number, stage: string) => void;
type ErrorCallback = (error: Error) => void;

// Worker类型的统一接口
interface WorkerLike {
  postMessage(message: any): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  terminate?(): void;
}

class ClientDatabase {
  private worker: WorkerLike | null = null;
  private isSharedWorker = false;
  private initPromise: Promise<void> | null = null;
  private progressCallbacks: Set<ProgressCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  private ready = false;
  private requestIdCounter = 0;
  private cacheName = `clientdb-query-cache-${DB_VERSION}`;
  private cacheAvailable = typeof caches !== "undefined";

  /**
   * 清理旧版本的查询缓存
   */
  private async cleanupOldQueryCaches() {
    if (!this.cacheAvailable) return;

    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("clientdb-query-cache-") && key !== this.cacheName).map((key) => caches.delete(key)));
    } catch (error) {
      console.warn("Failed to cleanup old query caches:", error);
    }
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(type: string, payload?: any): string {
    const params = payload ? `?data=${encodeURIComponent(JSON.stringify(payload))}` : "";
    return `https://cache.clientdb/${type}${params}`;
  }

  /**
   * 从缓存获取数据
   */
  private async getFromCache<T>(type: string, payload?: any): Promise<T | null> {
    if (!this.cacheAvailable) return null;

    try {
      const cache = await caches.open(this.cacheName);
      const cacheKey = this.getCacheKey(type, payload);
      const response = await cache.match(cacheKey);

      if (response) {
        const data = await response.json();
        return data as T;
      }
    } catch (error) {
      console.warn("Cache read failed:", error);
    }

    return null;
  }

  /**
   * 将数据存入缓存
   */
  private async putToCache<T>(type: string, payload: any | undefined, data: T): Promise<void> {
    if (!this.cacheAvailable) return;

    try {
      const cache = await caches.open(this.cacheName);
      const cacheKey = this.getCacheKey(type, payload);
      const response = new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Time": new Date().toISOString(),
        },
      });
      await cache.put(cacheKey, response);
    } catch (error) {
      console.warn("Cache write failed:", error);
    }

    // 清理旧版本缓存，fire-and-forget
    this.cleanupOldQueryCaches();
  }

  /**
   * 初始化Worker
   */
  private initWorker() {
    // 只在浏览器环境中初始化Worker
    if (typeof window === "undefined") {
      return;
    }

    try {
      // 优先尝试使用SharedWorker
      if (typeof SharedWorker !== "undefined") {
        const sharedWorker = new SharedWorker(new URL("../workers/sqlSharedWorker.ts", import.meta.url), { type: "module", name: "fursuit-sql-db" });

        this.worker = sharedWorker.port as WorkerLike;
        this.isSharedWorker = true;

        sharedWorker.port.start();
      } else if (typeof Worker !== "undefined") {
        // Fallback到普通Worker
        this.worker = new Worker(new URL("../workers/sqlWorker.ts", import.meta.url), { type: "module" }) as WorkerLike;

        this.isSharedWorker = false;
      } else {
        console.error("Web Workers not supported");
        return;
      }

      this.worker.addEventListener("message", (e: Event) => {
        const event = e as MessageEvent<WorkerResponse>;
        const { type, loaded, total, stage, message } = event.data;

        switch (type) {
          case "progress":
            if (loaded !== undefined && total !== undefined && stage !== undefined) {
              this.progressCallbacks.forEach((cb) => cb(loaded, total, stage));
            }
            break;

          case "ready":
            this.ready = true;
            break;

          case "error":
            const error = new Error(message || "Unknown worker error");
            this.errorCallbacks.forEach((cb) => cb(error));
            break;
        }
      });
    } catch (error) {
      console.error("Failed to initialize worker:", error);
    }
  }

  /**
   * 注册进度回调
   */
  onProgress(callback: ProgressCallback) {
    this.progressCallbacks.add(callback);
  }

  /**
   * 注销进度回调
   */
  offProgress(callback: ProgressCallback) {
    this.progressCallbacks.delete(callback);
  }

  /**
   * 注册错误回调
   */
  onError(callback: ErrorCallback) {
    this.errorCallbacks.add(callback);
  }

  /**
   * 注销错误回调
   */
  offError(callback: ErrorCallback) {
    this.errorCallbacks.delete(callback);
  }

  /**
   * 确保数据库已初始化
   */
  async ensureReady(): Promise<void> {
    if (this.ready) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.request<void>("init");
    return this.initPromise;
  }

  /**
   * 通用请求方法
   */
  private async request<T>(type: string, payload?: any): Promise<T> {
    // 先检查缓存（init请求不缓存）
    if (type !== "init") {
      const cached = await this.getFromCache<T>(type, payload);
      if (cached !== null) {
        return cached;
      }
    }

    // 缓存未命中，初始化并查询Worker
    if (type !== "init") {
      await this.ensureReady();
    }
    const result = await this.queryWorker<T>(type, payload);

    // 将结果存入缓存（init请求不缓存）
    if (type !== "init") {
      await this.putToCache(type, payload, result);
    }

    return result;
  }

  /**
   * 向Worker发送请求并获取结果
   */
  private async queryWorker<T>(type: string, payload?: any): Promise<T> {
    // 延迟初始化，第一次实际需要Worker时才创建
    if (!this.worker) {
      this.initWorker();
    }

    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    const requestId = ++this.requestIdCounter;

    return new Promise((resolve, reject) => {
      const handleMessage = (e: Event) => {
        const event = e as MessageEvent<WorkerResponse>;
        if (event.data.requestId === requestId) {
          cleanup();
          if (event.data.type === "result" || event.data.type === "ready") {
            resolve(event.data.data as T);
          } else if (event.data.type === "error") {
            reject(new Error(event.data.message));
          }
        }
      };

      const handleError = (e: Event) => {
        const event = e as MessageEvent<WorkerResponse>;
        if (event.data.requestId === requestId && event.data.type === "error") {
          cleanup();
          reject(new Error(event.data.message));
        }
      };

      const cleanup = () => {
        this.worker?.removeEventListener("message", handleMessage);
        this.worker?.removeEventListener("message", handleError);
      };

      this.worker!.addEventListener("message", handleMessage);
      this.worker!.addEventListener("message", handleError);
      this.worker!.postMessage({ type, payload, requestId });
    });
  }

  /**
   * 获取指定时间点的帖子列表（带分页）
   */
  async getThreadsAtTime(datetime: string, keyword?: string, limit?: number, offset?: number, featured?: boolean): Promise<{ threads: Thread[]; totalCount: number }> {
    return this.request("getThreadsAtTime", { datetime, keyword, limit, offset, featured });
  }

  /**
   * 搜索帖子
   */
  async searchThreads(keyword: string): Promise<SearchResponse> {
    return this.request("searchThreads", { keyword });
  }

  /**
   * 统一搜索接口
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    return this.request("search", options);
  }

  /**
   * 获取指定用户在指定时间点的所有帖子和评论（带分页）
   */
  async getUserPostsAtTime(userId: number, datetime: string, limit?: number, offset?: number): Promise<SearchResponse> {
    return this.request("getUserPostsAtTime", { userId, datetime, limit, offset });
  }

  /**
   * 获取用户信息
   */
  async getUserById(userId: number): Promise<UserInfo | null> {
    return this.request("getUserById", { userId });
  }

  /**
   * 获取指定帖子在指定时间点的楼层列表（带分页，包含评论）
   */
  async getThreadPostsAtTime(threadId: number, datetime: string, limit?: number, offset?: number): Promise<ThreadDetailResponse> {
    return this.request("getThreadPostsAtTime", { threadId, datetime, limit, offset });
  }

  /**
   * 销毁Worker
   * 如果是普通Worker，会立即终止以释放内存
   * 如果是SharedWorker，则什么都不做（供新标签页连接）
   */
  destroy() {
    if (this.isSharedWorker) {
      return;
    }

    if (this.worker?.terminate) {
      this.worker.terminate();
    }

    this.worker = null;
    this.ready = false;
    this.initPromise = null;
    this.progressCallbacks.clear();
    this.errorCallbacks.clear();
  }
}

export const clientDb = new ClientDatabase();
export type { Thread, SearchOptions, SearchResult, SearchResponse };
