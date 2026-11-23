// sql.js SharedWorker - 在多个页面间共享数据库实例，节约宝贵的金子内存

import { handleMessage } from "./handler";
import type { WorkerMessage } from "../lib/types";

// SharedWorker类型定义
interface SharedWorkerGlobalScope {
  onconnect: ((this: SharedWorkerGlobalScope, ev: MessageEvent) => any) | null;
}
declare const self: SharedWorkerGlobalScope;

// 监听新的连接
self.onconnect = (e: MessageEvent) => {
  const port = e.ports[0];

  port.onmessage = async (event: MessageEvent<WorkerMessage>) => {
    port.postMessage(await handleMessage(event.data));
  };

  port.onmessageerror = (error) => {
    console.error("SharedWorker message error:", error);
  };

  port.start();
};
