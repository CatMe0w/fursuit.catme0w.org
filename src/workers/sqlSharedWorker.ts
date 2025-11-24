// sql.js SharedWorker - 在多个页面间共享数据库实例，节约宝贵的金子内存

import { initDatabase } from './db';
import { getThreadsAtTime, getThreadPostsAtTime } from './queries/thread';
import { searchEntries, searchThreads } from './queries/search';
import { getUserById, getUserPostsAtTime } from './queries/user';
import { getVideoMetadata } from './queries/video';
import type { WorkerMessage, WorkerResponse, SearchOptions } from '../lib/types';

// SharedWorker类型定义
interface SharedWorkerGlobalScope {
  onconnect: ((this: SharedWorkerGlobalScope, ev: MessageEvent) => any) | null;
}
declare const self: SharedWorkerGlobalScope;

// 跟踪所有连接的端口
const ports = new Set<MessagePort>();

// 监听新的连接
self.onconnect = (e: MessageEvent) => {
  const port = e.ports[0];
  ports.add(port);

  port.onmessage = async (event: MessageEvent<WorkerMessage>) => {
    const { type, payload, requestId } = event.data;
    
    try {
      switch (type) {
        case 'init':
          // SharedWorker使用广播
          await initDatabase((msg) => broadcastMessage(msg));
          if (requestId) port.postMessage({ type: 'ready', requestId } as WorkerResponse);
          break;
          
        case 'getVideoMetadata':
          await initDatabase((msg) => broadcastMessage(msg));
          const videoMetadata = getVideoMetadata(payload.id);
          port.postMessage({ type: 'result', data: videoMetadata, requestId } as WorkerResponse);
          break;
          
        case 'getThreadsAtTime':
          await initDatabase((msg) => broadcastMessage(msg));
          const { datetime, keyword, limit, offset } = payload;
          const result = getThreadsAtTime(datetime, keyword, limit, offset);
          port.postMessage({ type: 'result', data: result, requestId } as WorkerResponse);
          break;
          
        case 'searchThreads':
          await initDatabase((msg) => broadcastMessage(msg));
          const searchResults = searchThreads(payload.keyword);
          port.postMessage({ type: 'result', data: searchResults, requestId } as WorkerResponse);
          break;

        case 'search':
          await initDatabase((msg) => broadcastMessage(msg));
          const opts: SearchOptions = payload;
          const data = searchEntries(opts);
          port.postMessage({ type: 'result', data, requestId } as WorkerResponse);
          break;

        case 'getUserPostsAtTime':
          await initDatabase((msg) => broadcastMessage(msg));
          const { userId, datetime: userDatetime, limit: userLimit, offset: userOffset } = payload;
          const userResult = getUserPostsAtTime(userId, userDatetime, userLimit, userOffset);
          port.postMessage({ type: 'result', data: userResult, requestId } as WorkerResponse);
          break;

        case 'getUserById':
          await initDatabase((msg) => broadcastMessage(msg));
          const user = getUserById(payload.userId);
          port.postMessage({ type: 'result', data: user, requestId } as WorkerResponse);
          break;

        case 'getThreadPostsAtTime':
          await initDatabase((msg) => broadcastMessage(msg));
          const { threadId, datetime: threadTime, limit: threadLimit, offset: threadOffset } = payload;
          const threadResult = getThreadPostsAtTime(threadId, threadTime, threadLimit, threadOffset);
          port.postMessage({ type: 'result', data: threadResult, requestId } as WorkerResponse);
          break;

        default:
          throw new Error(`Unknown message type: ${type}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      port.postMessage({ type: 'error', message, requestId } as WorkerResponse);
    }
  };

  port.onmessageerror = (error) => {
    console.error('SharedWorker message error:', error);
  };

  port.start();
};

/**
 * 向所有连接的端口广播消息
 */
function broadcastMessage(msg: WorkerResponse) {
  ports.forEach(port => {
    try {
      port.postMessage(msg);
    } catch (e) {
      // 端口可能已关闭，从集合中移除
      ports.delete(port);
    }
  });
}
