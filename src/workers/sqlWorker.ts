// sql.js Worker - 在Worker中加载数据库并执行查询

import { initDatabase } from './db';
import { getThreadsAtTime, getThreadPostsAtTime } from './queries/thread';
import { searchEntries, searchThreads } from './queries/search';
import { getUserById, getUserPostsAtTime } from './queries/user';
import type { WorkerMessage, WorkerResponse, SearchOptions } from '../lib/types';

// 监听主线程消息
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, payload, requestId } = e.data;

  try {
    switch (type) {
      case 'init':
        await initDatabase(postMessage);
        if (requestId) postMessage({ type: 'ready', requestId } as WorkerResponse);
        break;

      case 'getThreadsAtTime':
        await initDatabase(postMessage);
        const { datetime, keyword, limit, offset } = payload;
        const result = getThreadsAtTime(datetime, keyword, limit, offset);
        postMessage({ type: 'result', data: result, requestId } as WorkerResponse);
        break;
        
      case 'searchThreads':
        await initDatabase(postMessage);
        const searchResults = searchThreads(payload.keyword);
        postMessage({ type: 'result', data: searchResults, requestId } as WorkerResponse);
        break;

      case 'search':
        await initDatabase(postMessage);
        const opts: SearchOptions = payload;
        const data = searchEntries(opts);
        postMessage({ type: 'result', data, requestId } as WorkerResponse);
        break;

      case 'getUserPostsAtTime':
        await initDatabase(postMessage);
        const { userId, datetime: userDatetime, limit: userLimit, offset: userOffset } = payload;
        const userResult = getUserPostsAtTime(userId, userDatetime, userLimit, userOffset);
        postMessage({ type: 'result', data: userResult, requestId } as WorkerResponse);
        break;

      case 'getUserById':
        await initDatabase(postMessage);
        const user = getUserById(payload.userId);
        postMessage({ type: 'result', data: user, requestId } as WorkerResponse);
        break;

      case 'getThreadPostsAtTime':
        await initDatabase(postMessage);
        const { threadId, datetime: threadTime, limit: threadLimit, offset: threadOffset } = payload;
        const threadResult = getThreadPostsAtTime(threadId, threadTime, threadLimit, threadOffset);
        postMessage({ type: 'result', data: threadResult, requestId } as WorkerResponse);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    postMessage({ type: 'error', message, requestId } as WorkerResponse);
  }
};
