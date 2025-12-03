import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import initSqlJs, { type Database } from "sql.js";
import type { VideoMetadata, Thread, Post, Comment, ContentItem, ModerationLog, ThreadDetailResponse, User, UserRecord } from "./types";
import { DB_URL } from "./dbConfig";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let cachedDb: Database | null = null;
let cachedThreads: Thread[] | null = null;

/**
 * 下载 vault.db
 */
async function downloadVaultDb(dbPath: string): Promise<void> {
  console.log(`[Data] Downloading vault.db...`);
  try {
    const response = await fetch(DB_URL);
    if (!response.ok) {
      throw new Error(`Failed to download vault.db: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 确保目录存在
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(dbPath, uint8Array);
    console.log(`[Data] Downloaded vault.db`);
  } catch (error) {
    console.error("[Data] Failed to download vault.db:", error);
    throw error;
  }
}

/**
 * 初始化数据库
 */
async function initDatabase(): Promise<Database> {
  if (cachedDb) {
    return cachedDb;
  }

  console.log("[Data] Initializing sql.js...");
  const startTime = Date.now();

  const SQL = await initSqlJs();
  const dbPath = join(__dirname, "..", "..", "data", "vault.db");

  // 如果数据库文件不存在，尝试下载
  if (!existsSync(dbPath)) {
    console.log("[Data] vault.db not found locally, attempting to download...");
    await downloadVaultDb(dbPath);
  }

  const dbBuffer = readFileSync(dbPath);
  cachedDb = new SQL.Database(dbBuffer);

  const endTime = Date.now();
  console.log(`[Data] Database initialized in ${endTime - startTime}ms`);

  return cachedDb;
}

/**
 * 解析JSON content
 */
function parseContent(contentStr: string | null): ContentItem[] {
  if (!contentStr) return [];
  try {
    return JSON.parse(contentStr);
  } catch {
    return [];
  }
}

/**
 * 获取所有帖子（按最后活动时间降序）
 */
export function getAllThreads(): Thread[] {
  // 使用缓存避免重复查询
  if (cachedThreads) {
    return cachedThreads;
  }

  const db = cachedDb;
  if (!db) {
    throw new Error("Database not initialized");
  }

  console.log("[Data] Querying all threads...");
  const startTime = Date.now();

  // 获取每个帖子的最后回复时间（包括帖子和评论）
  const sql = `
    WITH all_activities AS (
      SELECT thread_id, user_id, time
      FROM pr_post
      WHERE time < ?1
      UNION ALL
      SELECT p.thread_id, c.user_id, c.time
      FROM pr_comment c
      JOIN pr_post p ON c.post_id = p.id
      WHERE c.time < ?1
    ),
    latest_activity AS (
      SELECT thread_id, user_id, time,
             ROW_NUMBER() OVER (PARTITION BY thread_id ORDER BY time DESC) as rn
      FROM all_activities
    )
    SELECT t.id, t.title, t.user_id AS op_user_id, t.reply_num,
           la.user_id AS last_user_id, la.time, p.content,
           op_u.username AS op_username, op_u.nickname AS op_nickname,
           last_u.username AS last_reply_username, last_u.nickname AS last_reply_nickname
    FROM pr_thread t
    JOIN latest_activity la ON t.id = la.thread_id AND la.rn = 1
    JOIN pr_post p ON t.id = p.thread_id AND p.floor = 1
    LEFT JOIN pr_user op_u ON t.user_id = op_u.id
    LEFT JOIN pr_user last_u ON la.user_id = last_u.id
    ORDER BY la.time DESC`;

  // 获取所有加精的帖子ID
  const featuredSql = `SELECT DISTINCT thread_id FROM un_post WHERE operation = '加精'`;
  const featuredStmt = db.prepare(featuredSql);
  const featuredSet = new Set<number>();
  while (featuredStmt.step()) {
    const row = featuredStmt.getAsObject();
    featuredSet.add(Number(row.thread_id));
  }
  featuredStmt.free();

  // 获取所有帖子的实际回复数（楼层数）
  const postCountSql = `SELECT thread_id, COUNT(*) as count FROM pr_post GROUP BY thread_id`;
  const postCountStmt = db.prepare(postCountSql);
  const postCountMap = new Map<number, number>();
  while (postCountStmt.step()) {
    const row = postCountStmt.getAsObject();
    postCountMap.set(Number(row.thread_id), Number(row.count));
  }
  postCountStmt.free();

  const stmt = db.prepare(sql);
  stmt.bind(["9999-12-31 23:59:59"]);

  const threads: Thread[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const opPostContent = parseContent(row.content as string | null);
    injectVideoMetadataIntoContent(opPostContent);

    threads.push({
      id: Number(row.id),
      title: String(row.title),
      opUserId: Number(row.op_user_id),
      userId: Number(row.last_user_id),
      time: String(row.time),
      replyNum: Number(row.reply_num),
      featured: featuredSet.has(Number(row.id)),
      opPostContent: opPostContent,
      opUsername: row.op_username ? String(row.op_username) : undefined,
      opNickname: row.op_nickname ? String(row.op_nickname) : undefined,
      lastReplyUsername: row.last_reply_username ? String(row.last_reply_username) : undefined,
      lastReplyNickname: row.last_reply_nickname ? String(row.last_reply_nickname) : undefined,
      postCount: postCountMap.get(Number(row.id)) || 0,
    });
  }
  stmt.free();

  const endTime = Date.now();
  console.log(`[Data] Loaded ${threads.length} threads in ${endTime - startTime}ms`);

  // 缓存结果
  cachedThreads = threads;
  return threads;
}

/**
 * 获取所有图册帖子（硬编码了，这样比较简单）
 */
export function getAlbumThreads(): Thread[] {
  const albumThreadIds = [3407450836, 3407935066, 3437549505];
  const threads: Thread[] = [];

  for (const id of albumThreadIds) {
    const thread = getThreadById(id);
    if (thread) {
      threads.push(thread);
    }
  }

  return threads;
}

/**
 * 根据ID获取帖子
 */
export function getThreadById(id: number): Thread | undefined {
  const db = cachedDb;
  if (!db) return undefined;

  const stmt = db.prepare(`
    SELECT t.*, u.username, u.nickname 
    FROM pr_thread t
    LEFT JOIN pr_user u ON t.user_id = u.id
    WHERE t.id = ?
  `);
  stmt.bind([id]);

  let thread: Thread | undefined;
  if (stmt.step()) {
    const row = stmt.getAsObject();

    // 获取一楼内容
    const postStmt = db.prepare("SELECT content, time FROM pr_post WHERE thread_id = ? AND floor = 1");
    postStmt.bind([id]);
    let opPostContent: ContentItem[] = [];
    let time = "";
    if (postStmt.step()) {
      const postRow = postStmt.getAsObject();
      opPostContent = parseContent(postRow.content as string | null);
      time = String(postRow.time);
    }
    postStmt.free();
    injectVideoMetadataIntoContent(opPostContent);

    // 获取楼层数
    const countStmt = db.prepare("SELECT COUNT(*) as count FROM pr_post WHERE thread_id = ?");
    countStmt.bind([id]);
    let postCount = 0;
    if (countStmt.step()) {
      postCount = Number(countStmt.getAsObject().count);
    }
    countStmt.free();

    thread = {
      id: Number(row.id),
      title: String(row.title),
      opUserId: Number(row.user_id),
      userId: Number(row.user_id),
      time: time,
      replyNum: Number(row.reply_num),
      featured: Boolean(row.is_good),
      opPostContent: opPostContent,
      opUsername: row.username ? String(row.username) : undefined,
      opNickname: row.nickname ? String(row.nickname) : undefined,
      postCount: postCount,
    };
  }
  stmt.free();

  return thread;
}

/**
 * 获取帖子详情（包含帖子内容、评论、用户信息）
 */
export function getThreadDetail(threadId: number, page: number = 1): ThreadDetailResponse {
  const db = cachedDb;
  if (!db) {
    throw new Error("Database not initialized");
  }

  // Get Thread Info
  const thread = getThreadById(threadId);
  if (!thread) {
    throw new Error("Thread not found");
  }

  // Get Posts for the page
  const limit = 30;
  const offset = (page - 1) * limit;

  const postsStmt = db.prepare("SELECT * FROM pr_post WHERE thread_id = ? ORDER BY floor LIMIT ? OFFSET ?");
  postsStmt.bind([threadId, limit, offset]);

  const posts: any[] = []; // Temporary raw posts
  const userIds = new Set<number>();
  const postIds: number[] = [];

  while (postsStmt.step()) {
    const row = postsStmt.getAsObject();
    posts.push(row);
    userIds.add(Number(row.user_id));
    postIds.push(Number(row.id));
  }
  postsStmt.free();

  // Get Comments for these posts
  const commentsMap = getCommentsByPostIds(postIds);
  commentsMap.forEach((comments) => {
    comments.forEach((c) => userIds.add(c.userId));
  });

  // Get Users
  const usersMap = getUsersByIds(Array.from(userIds));

  // Assemble Posts
  const threadPosts: Post[] = posts.map((row) => {
    const user = usersMap.get(Number(row.user_id));
    const comments = commentsMap.get(Number(row.id)) || [];

    // Map comments to Comment
    const threadComments: Comment[] = comments.map((c) => {
      const cUser = usersMap.get(c.userId);
      return {
        id: c.id,
        userId: c.userId,
        content: c.content,
        time: c.time,
        username: cUser?.username || null,
        nickname: cUser?.nickname || null,
        avatar: cUser?.avatar || null,
      };
    });

    const content = parseContent(row.content as string | null);
    injectVideoMetadataIntoContent(content);

    return {
      id: Number(row.id),
      floor: Number(row.floor),
      userId: Number(row.user_id),
      content: content,
      time: String(row.time),
      commentNum: Number(row.comment_num),
      signature: row.signature ? String(row.signature) : null,
      tail: row.tail ? String(row.tail) : null,
      username: user?.username || null,
      nickname: user?.nickname || null,
      avatar: user?.avatar || null,
      comments: threadComments,
    };
  });

  // Get Moderation Logs
  const moderationLogs = getModerationLogsByThreadId(threadId);

  // Get Total Count (for pagination)
  const countStmt = db.prepare("SELECT COUNT(*) as count FROM pr_post WHERE thread_id = ?");
  countStmt.bind([threadId]);
  let totalCount = 0;
  if (countStmt.step()) {
    totalCount = Number(countStmt.getAsObject().count);
  }
  countStmt.free();

  return {
    posts: threadPosts,
    totalCount,
    threadTitle: thread.title,
    moderationLogs: moderationLogs,
  };
}

/**
 * 根据ID获取用户
 */
export function getUserById(id: number): User | undefined {
  const db = cachedDb;
  if (!db) return undefined;

  const stmt = db.prepare("SELECT * FROM pr_user WHERE id = ?");
  stmt.bind([id]);

  let user: User | undefined;
  if (stmt.step()) {
    const row = stmt.getAsObject();
    user = {
      id: Number(row.id),
      username: row.username ? String(row.username) : null,
      nickname: row.nickname ? String(row.nickname) : null,
      avatar: String(row.avatar),
    };
  }
  stmt.free();

  return user;
}



/**
 * 获取指定类别的吧务日志（按时间降序）
 */
export function getModerationLogsByCategory(category: "post" | "user" | "bawu", page: number = 1, limit: number = 30): ModerationLog[] {
  const db = cachedDb;
  if (!db) return [];

  const offset = (page - 1) * limit;
  let sql: string;
  if (category === "post") {
    // 过滤rewinder和rollwinder的时间戳：为导出贴吧完整数据而临时恢复或再次删除，不计入操作记录
    sql = `SELECT u.*, op_user.id AS operator_id, target_user.id AS target_user_id
           FROM un_post u
           LEFT JOIN pr_user op_user ON u.operator = op_user.username
           LEFT JOIN pr_user target_user ON u.username = target_user.username
           WHERE operation_time NOT LIKE '2022-02-26 23:%'
           AND operation_time NOT LIKE '2022-02-16 01:%'
           ORDER BY operation_time DESC
           LIMIT ? OFFSET ?`;
  } else if (category === "user") {
    sql = `SELECT u.*, op_user.id AS operator_id, target_user.id AS target_user_id
           FROM un_user u
           LEFT JOIN pr_user op_user ON u.operator = op_user.username
           LEFT JOIN pr_user target_user ON u.username = target_user.username
           ORDER BY operation_time DESC
           LIMIT ? OFFSET ?`;
  } else {
    sql = `SELECT u.*, op_user.id AS operator_id, target_user.id AS target_user_id
           FROM un_bawu u
           LEFT JOIN pr_user op_user ON u.operator = op_user.username
           LEFT JOIN pr_user target_user ON u.username = target_user.username
           ORDER BY operation_time DESC
           LIMIT ? OFFSET ?`;
  }

  const stmt = db.prepare(sql);
  stmt.bind([limit, offset]);
  const logs: ModerationLog[] = [];

  while (stmt.step()) {
    const row = stmt.getAsObject();
    if (category === "post") {
      logs.push({
        threadId: row.thread_id ? Number(row.thread_id) : null,
        postId: row.post_id ? Number(row.post_id) : null,
        username: String(row.username),
        title: String(row.title),
        operation: String(row.operation),
        operator: String(row.operator),
        operationTime: String(row.operation_time),
        duration: null,
        contentPreview: row.content_preview ? String(row.content_preview) : null,
        media: row.media ? String(row.media) : null,
        postTime: row.post_time ? String(row.post_time) : null,
        operatorId: row.operator_id ? Number(row.operator_id) : null,
        targetUserId: row.target_user_id ? Number(row.target_user_id) : null,
      });
    } else if (category === "user") {
      logs.push({
        threadId: null,
        postId: null,
        username: String(row.username),
        title: null,
        operation: String(row.operation),
        operator: String(row.operator),
        operationTime: String(row.operation_time),
        duration: row.duration ? String(row.duration) : null,
        contentPreview: null,
        media: null,
        postTime: null,
        operatorId: row.operator_id ? Number(row.operator_id) : null,
        targetUserId: row.target_user_id ? Number(row.target_user_id) : null,
      });
    } else {
      logs.push({
        threadId: null,
        postId: null,
        username: String(row.username),
        title: null,
        operation: String(row.operation),
        operator: row.operator ? String(row.operator) : "",
        operationTime: String(row.operation_time),
        duration: null,
        contentPreview: null,
        media: null,
        postTime: null,
        operatorId: row.operator_id ? Number(row.operator_id) : null,
        targetUserId: row.target_user_id ? Number(row.target_user_id) : null,
      });
    }
  }
  stmt.free();

  return logs;
}

/**
 * 获取指定类别的吧务日志总数
 */
export function getModerationLogsCountByCategory(category: "post" | "user" | "bawu"): number {
  const db = cachedDb;
  if (!db) return 0;

  let sql: string;
  if (category === "post") {
    sql = `SELECT COUNT(*) as count FROM un_post
           WHERE operation_time NOT LIKE '2022-02-26 23:%'
           AND operation_time NOT LIKE '2022-02-16 01:%'`;
  } else if (category === "user") {
    sql = `SELECT COUNT(*) as count FROM un_user`;
  } else {
    sql = `SELECT COUNT(*) as count FROM un_bawu`;
  }

  const stmt = db.prepare(sql);
  let count = 0;
  if (stmt.step()) {
    count = Number(stmt.getAsObject().count);
  }
  stmt.free();
  return count;
}

/**
 * 获取用户的所有记录（发帖 + 评论），按时间降序
 */
export function getUserRecords(userId: number): UserRecord[] {
  const db = cachedDb;
  if (!db) return [];

  const sql = `SELECT thread_id, pr_thread.title AS title, pr_post.id AS post_id, floor, content AS post_content, NULL AS comment_id, NULL AS comment_content, time,
                (SELECT COUNT(*) FROM pr_post p2 WHERE p2.thread_id = pr_post.thread_id AND p2.floor < pr_post.floor) / 30 + 1 AS page
                FROM pr_post
                JOIN pr_thread
                ON pr_post.thread_id = pr_thread.id
                WHERE pr_post.user_id = ?1
                AND pr_post.time < ?2
                UNION ALL
                SELECT pr_thread.id, pr_thread.title, post_id, pr_post.floor, pr_post.content, pr_comment.id, pr_comment.content, pr_comment.time,
                (SELECT COUNT(*) FROM pr_post p2 WHERE p2.thread_id = pr_post.thread_id AND p2.floor < pr_post.floor) / 30 + 1 AS page
                FROM pr_comment
                JOIN pr_post
                ON pr_comment.post_id = pr_post.id
                JOIN pr_thread
                ON pr_post.thread_id = pr_thread.id
                WHERE pr_comment.user_id = ?1
                AND pr_comment.time < ?2
                ORDER BY time DESC`;

  const stmt = db.prepare(sql);
  stmt.bind([userId, "9999-12-31 23:59:59"]);

  const records: UserRecord[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const isComment = row.comment_id !== null;

    if (isComment) {
      records.push({
        type: "comment",
        threadId: Number(row.thread_id),
        title: String(row.title),
        postId: Number(row.post_id),
        floor: Number(row.floor),
        postContent: parseContent(row.post_content as string | null),
        commentId: Number(row.comment_id),
        commentContent: parseContent(row.comment_content as string | null),
        time: String(row.time),
        page: Number(row.page),
      });
    } else {
      records.push({
        type: "post",
        threadId: Number(row.thread_id),
        title: String(row.title),
        postId: Number(row.post_id),
        floor: Number(row.floor),
        postContent: parseContent(row.post_content as string | null),
        time: String(row.time),
        page: Number(row.page),
      });
    }
  }
  stmt.free();

  return records;
}

/**
 * 获取指定帖子的吧务日志
 */
function getModerationLogsByThreadId(threadId: number): ModerationLog[] {
  const db = cachedDb;
  if (!db) return [];

  const sql = `SELECT u.*, op_user.id AS operator_id, target_user.id AS target_user_id
               FROM un_post u
               LEFT JOIN pr_user op_user ON u.operator = op_user.username
               LEFT JOIN pr_user target_user ON u.username = target_user.username
               WHERE u.thread_id = ?1
               AND operation_time NOT LIKE '2022-02-26 23:%'
               AND operation_time NOT LIKE '2022-02-16 01:%'
               ORDER BY operation_time ASC`;

  const stmt = db.prepare(sql);
  stmt.bind([threadId]);

  const logs: ModerationLog[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    logs.push({
      threadId: row.thread_id ? Number(row.thread_id) : null,
      postId: row.post_id ? Number(row.post_id) : null,
      username: String(row.username),
      title: String(row.title),
      operation: String(row.operation),
      operator: String(row.operator),
      operationTime: String(row.operation_time),
      duration: null,
      contentPreview: row.content_preview ? String(row.content_preview) : null,
      media: row.media ? String(row.media) : null,
      postTime: row.post_time ? String(row.post_time) : null,
      operatorId: row.operator_id ? Number(row.operator_id) : null,
      targetUserId: row.target_user_id ? Number(row.target_user_id) : null,
    });
  }
  stmt.free();

  return logs;
}

/**
 * 批量获取楼层的评论
 */
function getCommentsByPostIds(postIds: number[]): Map<number, Comment[]> {
  const db = cachedDb;
  if (!db || postIds.length === 0) return new Map();

  const placeholders = postIds.map(() => "?").join(",");
  const stmt = db.prepare(`SELECT * FROM pr_comment WHERE post_id IN (${placeholders}) ORDER BY time`);
  stmt.bind(postIds);

  const commentsMap = new Map<number, Comment[]>();
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const postId = Number(row.post_id);
    if (!commentsMap.has(postId)) {
      commentsMap.set(postId, []);
    }
    commentsMap.get(postId)!.push({
      id: Number(row.id),
      userId: Number(row.user_id),
      content: parseContent(row.content as string | null),
      time: String(row.time),
      username: null,
      nickname: null,
      avatar: null
    });
  }
  stmt.free();

  return commentsMap;
}

/**
 * 批量获取用户
 */
function getUsersByIds(userIds: number[]): Map<number, User> {
  const db = cachedDb;
  if (!db || userIds.length === 0) return new Map();

  const uniqueIds = [...new Set(userIds)];
  const placeholders = uniqueIds.map(() => "?").join(",");
  const stmt = db.prepare(`SELECT * FROM pr_user WHERE id IN (${placeholders})`);
  stmt.bind(uniqueIds);

  const usersMap = new Map<number, User>();
  while (stmt.step()) {
    const row = stmt.getAsObject();
    usersMap.set(Number(row.id), {
      id: Number(row.id),
      username: row.username ? String(row.username) : null,
      nickname: row.nickname ? String(row.nickname) : null,
      avatar: String(row.avatar),
    });
  }
  stmt.free();

  return usersMap;
}

/**
 * 获取视频元数据（SSG/SSR）
 */
function getVideoMetadata(id: string): VideoMetadata | null {
  const db = cachedDb;
  if (!db) return null;

  const stmt = db.prepare("SELECT metadata FROM video_metadata WHERE id = ?");
  stmt.bind([id]);

  if (stmt.step()) {
    const row = stmt.getAsObject();
    const metadataStr = row.metadata as string;
    stmt.free();

    try {
      const metadata = JSON.parse(metadataStr);
      return {
        id: id,
        title: metadata.title,
        uploader: metadata.uploader,
        uploaderUrl: metadata.uploader_url,
      };
    } catch (e) {
      console.error("Failed to parse video metadata", e);
      return null;
    }
  }

  stmt.free();
  return null;
}

/**
 * 从优酷URL中提取视频ID
 */
function getYoukuId(url: string): string | null {
  const match1 = url.match(/id_(X[a-zA-Z0-9]+)/);
  if (match1) return match1[1];

  const match2 = url.match(/sid\/(X[a-zA-Z0-9]+)/);
  if (match2) return match2[1];

  return null;
}

/**
 * 从腾讯视频URL中提取视频ID
 */
function getQQVideoId(url: string): string | null {
  const match = url.match(/\/([a-zA-Z0-9]+)\.html/);
  if (match) return match[1];
  return null;
}

/**
 * 注入视频元数据到单个content中
 */
function injectVideoMetadataIntoContent(content: ContentItem[]): void {
  for (const item of content) {
    if (item.type === "video" && typeof (item as any).content === "string") {
      const url = (item as any).content;
      const youkuId = getYoukuId(url);
      const qqId = getQQVideoId(url);
      const videoId = youkuId || qqId;

      // 将content改为url
      delete (item as any).content;
      (item as any).url = url;

      if (videoId) {
        const metadata = getVideoMetadata(videoId);
        if (metadata) {
          (item as any).metadata = { ...metadata, id: videoId };
        }
      }
    }
  }
}

/**
 * 获取所有有过发言（帖子或评论）的用户ID
 */
export function getAllUserIds(): number[] {
  const db = cachedDb;
  if (!db) return [];

  console.log("[Data] Querying all user IDs...");
  const startTime = Date.now();

  const sql = `
    SELECT DISTINCT user_id FROM pr_post
    UNION
    SELECT DISTINCT user_id FROM pr_comment
  `;

  const stmt = db.prepare(sql);
  const userIds: number[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    userIds.push(Number(row.user_id));
  }
  stmt.free();

  const endTime = Date.now();
  console.log(`[Data] Loaded ${userIds.length} users in ${endTime - startTime}ms`);

  return userIds;
}

await initDatabase();
