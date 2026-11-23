// Worker和SharedWorker共用的请求分发逻辑

import { initDatabase } from "./db";
import { getThreadsAtTime, getThreadPostsAtTime } from "./queries/thread";
import { searchEntries } from "./queries/search";
import { getUserById, getUserPostsAtTime } from "./queries/user";
import type { WorkerMessage, WorkerResponse } from "../lib/types";

const handlers: Record<string, (payload: any) => unknown> = {
  init: () => undefined,
  getThreadsAtTime: (p) => getThreadsAtTime(p.datetime, p.keyword, p.limit, p.offset, p.featured),
  search: (p) => searchEntries(p),
  getUserPostsAtTime: (p) => getUserPostsAtTime(p.userId, p.datetime, p.limit, p.offset),
  getUserById: (p) => getUserById(p.userId),
  getThreadPostsAtTime: (p) => getThreadPostsAtTime(p.threadId, p.datetime, p.limit, p.offset),
};

/**
 * 处理一条请求，返回要回复给主线程的消息
 */
export async function handleMessage({ type, payload, requestId }: WorkerMessage): Promise<WorkerResponse> {
  try {
    const handler = handlers[type];
    if (!handler) throw new Error(`Unknown message type: ${type}`);

    await initDatabase();
    return { requestId, data: handler(payload) };
  } catch (error) {
    return { requestId, error: error instanceof Error ? error.message : String(error) };
  }
}
