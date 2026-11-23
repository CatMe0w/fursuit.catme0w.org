// sql.js Worker - 在Worker中加载数据库并执行查询

import { handleMessage } from "./handler";
import type { WorkerMessage } from "../lib/types";

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  postMessage(await handleMessage(e.data));
};
