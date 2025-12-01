import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import initSqlJs, { type Database } from "sql.js";
import type { VideoMetadata } from "./types";
import { DB_URL } from "./dbConfig";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 数据类型定义
export interface User {
  id: number;
  username: string | null;
  nickname: string | null;
  avatar: string | null;
}

export interface Thread {
  id: number;
  title: string;
  user_id: number; // 对于列表查询：最后回复的用户ID；对于单个查询：楼主的user_id
  reply_num: number;
  featured: boolean;
  op_user_id?: number; // 楼主的用户ID（仅在列表查询中返回）
  time?: string; // 最后回复时间（仅在列表查询中返回）
  op_post_content?: ContentItem[]; // 1楼内容（仅在列表查询中返回）
}

export interface ContentItem {
  type: string;
  content?: string;
  text?: string;
  link?: string;
  c?: string;
  un?: string;
  uid?: number;
  bsize?: string;
  size?: string;
}

export interface Post {
  id: number;
  floor: number;
  user_id: number;
  content: ContentItem[];
  time: string;
  comment_num: number;
  signature: string | null;
  tail: string | null;
  thread_id: number;
}

export interface Comment {
  id: number;
  user_id: number;
  content: ContentItem[];
  time: string;
  post_id: number;
}

export interface ModerationLog {
  thread_id: number | null;
  post_id: number | null;
  user_id: number | null;
  username: string | null;
  title: string | null;
  operation: string;
  operator: string;
  operation_time: string;
  reason: string | null;
  duration: string | null;
  content_preview?: string | null;
  media?: string | null;
  post_time?: string | null;
  operator_id?: number | null;
  target_user_id?: number | null;
}

export interface UserRecord {
  type: "post" | "comment";
  thread_id: number;
  title: string;
  post_id: number;
  floor: number;
  post_content: ContentItem[];
  comment_id?: number;
  comment_content?: ContentItem[];
  time: string;
  page: number;
}

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
           la.user_id AS last_user_id, la.time, p.content
    FROM pr_thread t
    JOIN latest_activity la ON t.id = la.thread_id AND la.rn = 1
    JOIN pr_post p ON t.id = p.thread_id AND p.floor = 1
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
      op_user_id: Number(row.op_user_id),
      user_id: Number(row.last_user_id),
      time: String(row.time),
      reply_num: Number(row.reply_num),
      featured: featuredSet.has(Number(row.id)),
      op_post_content: opPostContent,
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
 * 根据ID获取帖子
 */
export function getThreadById(id: number): Thread | undefined {
  const db = cachedDb;
  if (!db) return undefined;

  const stmt = db.prepare("SELECT * FROM pr_thread WHERE id = ?");
  stmt.bind([id]);

  let thread: Thread | undefined;
  if (stmt.step()) {
    const row = stmt.getAsObject();
    thread = {
      id: Number(row.id),
      title: String(row.title),
      user_id: Number(row.user_id),
      reply_num: Number(row.reply_num),
      featured: Boolean(row.is_good),
    };
  }
  stmt.free();

  return thread;
}

/**
 * 获取帖子的所有楼层（按楼层号升序）
 */
export function getPostsByThreadId(threadId: number): Post[] {
  const db = cachedDb;
  if (!db) return [];

  const stmt = db.prepare("SELECT * FROM pr_post WHERE thread_id = ? ORDER BY floor");
  stmt.bind([threadId]);

  const posts: Post[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    posts.push({
      id: Number(row.id),
      floor: Number(row.floor),
      user_id: Number(row.user_id),
      content: parseContent(row.content as string | null),
      time: String(row.time),
      comment_num: Number(row.comment_num),
      signature: row.signature ? String(row.signature) : null,
      tail: row.tail ? String(row.tail) : null,
      thread_id: Number(row.thread_id),
    });
  }
  stmt.free();

  injectVideoMetadataIntoPosts(posts);

  return posts;
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
 * 获取用户的所有发帖（按时间降序）
 */
export function getPostsByUserId(userId: number): Post[] {
  const db = cachedDb;
  if (!db) return [];

  const stmt = db.prepare("SELECT * FROM pr_post WHERE user_id = ? ORDER BY time DESC");
  stmt.bind([userId]);

  const posts: Post[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    posts.push({
      id: Number(row.id),
      floor: Number(row.floor),
      user_id: Number(row.user_id),
      content: parseContent(row.content as string | null),
      time: String(row.time),
      comment_num: Number(row.comment_num),
      signature: row.signature ? String(row.signature) : null,
      tail: row.tail ? String(row.tail) : null,
      thread_id: Number(row.thread_id),
    });
  }
  stmt.free();

  // 注入视频元数据
  injectVideoMetadataIntoPosts(posts);

  return posts;
}

/**
 * 获取楼层的所有评论（按时间升序）
 */
export function getCommentsByPostId(postId: number): Comment[] {
  const db = cachedDb;
  if (!db) return [];

  const stmt = db.prepare("SELECT * FROM pr_comment WHERE post_id = ? ORDER BY time");
  stmt.bind([postId]);

  const comments: Comment[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    comments.push({
      id: Number(row.id),
      user_id: Number(row.user_id),
      content: parseContent(row.content as string | null),
      time: String(row.time),
      post_id: Number(row.post_id),
    });
  }
  stmt.free();

  return comments;
}

/**
 * 获取指定类别的吧务日志（按时间降序）
 */
export function getModerationLogsByCategory(category: "post" | "user" | "bawu"): ModerationLog[] {
  const db = cachedDb;
  if (!db) return [];

  let sql: string;
  if (category === "post") {
    // 过滤rewinder和rollwinder的时间戳：为导出贴吧完整数据而临时恢复或再次删除，不计入操作记录
    sql = `SELECT u.*, op_user.id AS operator_id, target_user.id AS target_user_id
           FROM un_post u
           LEFT JOIN pr_user op_user ON u.operator = op_user.username
           LEFT JOIN pr_user target_user ON u.username = target_user.username
           WHERE operation_time NOT LIKE '2022-02-26 23:%'
           AND operation_time NOT LIKE '2022-02-16 01:%'
           ORDER BY operation_time DESC`;
  } else if (category === "user") {
    sql = `SELECT u.*, op_user.id AS operator_id, target_user.id AS target_user_id
           FROM un_user u
           LEFT JOIN pr_user op_user ON u.operator = op_user.username
           LEFT JOIN pr_user target_user ON u.username = target_user.username
           ORDER BY operation_time DESC`;
  } else {
    sql = `SELECT u.*, op_user.id AS operator_id, target_user.id AS target_user_id
           FROM un_bawu u
           LEFT JOIN pr_user op_user ON u.operator = op_user.username
           LEFT JOIN pr_user target_user ON u.username = target_user.username
           ORDER BY operation_time DESC`;
  }

  const stmt = db.prepare(sql);
  const logs: ModerationLog[] = [];

  while (stmt.step()) {
    const row = stmt.getAsObject();
    if (category === "post") {
      logs.push({
        thread_id: row.thread_id ? Number(row.thread_id) : null,
        post_id: row.post_id ? Number(row.post_id) : null,
        user_id: null,
        username: String(row.username),
        title: String(row.title),
        operation: String(row.operation),
        operator: String(row.operator),
        operation_time: String(row.operation_time),
        reason: null,
        duration: null,
        content_preview: row.content_preview ? String(row.content_preview) : null,
        media: row.media ? String(row.media) : null,
        post_time: row.post_time ? String(row.post_time) : null,
        operator_id: row.operator_id ? Number(row.operator_id) : null,
        target_user_id: row.target_user_id ? Number(row.target_user_id) : null,
      });
    } else if (category === "user") {
      logs.push({
        thread_id: null,
        post_id: null,
        user_id: null,
        username: String(row.username),
        title: null,
        operation: String(row.operation),
        operator: String(row.operator),
        operation_time: String(row.operation_time),
        reason: null,
        duration: row.duration ? String(row.duration) : null,
        operator_id: row.operator_id ? Number(row.operator_id) : null,
        target_user_id: row.target_user_id ? Number(row.target_user_id) : null,
      });
    } else {
      logs.push({
        thread_id: null,
        post_id: null,
        user_id: null,
        username: String(row.username),
        title: null,
        operation: String(row.operation),
        operator: row.operator ? String(row.operator) : "",
        operation_time: String(row.operation_time),
        reason: null,
        duration: null,
        operator_id: row.operator_id ? Number(row.operator_id) : null,
        target_user_id: row.target_user_id ? Number(row.target_user_id) : null,
      });
    }
  }
  stmt.free();

  return logs;
}

/**
 * 根据用户名获取用户（用于moderation-logs链接转换）
 */
export function getUserByUsername(username: string): User | undefined {
  const db = cachedDb;
  if (!db) return undefined;

  const stmt = db.prepare("SELECT * FROM pr_user WHERE username = ? LIMIT 1");
  stmt.bind([username]);

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
        thread_id: Number(row.thread_id),
        title: String(row.title),
        post_id: Number(row.post_id),
        floor: Number(row.floor),
        post_content: parseContent(row.post_content as string | null),
        comment_id: Number(row.comment_id),
        comment_content: parseContent(row.comment_content as string | null),
        time: String(row.time),
        page: Number(row.page),
      });
    } else {
      records.push({
        type: "post",
        thread_id: Number(row.thread_id),
        title: String(row.title),
        post_id: Number(row.post_id),
        floor: Number(row.floor),
        post_content: parseContent(row.post_content as string | null),
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
export function getModerationLogsByThreadId(threadId: number): ModerationLog[] {
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
      thread_id: row.thread_id ? Number(row.thread_id) : null,
      post_id: row.post_id ? Number(row.post_id) : null,
      user_id: null,
      username: String(row.username),
      title: String(row.title),
      operation: String(row.operation),
      operator: String(row.operator),
      operation_time: String(row.operation_time),
      reason: null,
      duration: null,
      content_preview: row.content_preview ? String(row.content_preview) : null,
      media: row.media ? String(row.media) : null,
      post_time: row.post_time ? String(row.post_time) : null,
      operator_id: row.operator_id ? Number(row.operator_id) : null,
      target_user_id: row.target_user_id ? Number(row.target_user_id) : null,
    });
  }
  stmt.free();

  return logs;
}

/**
 * 批量获取楼层的评论
 */
export function getCommentsByPostIds(postIds: number[]): Map<number, Comment[]> {
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
      user_id: Number(row.user_id),
      content: parseContent(row.content as string | null),
      time: String(row.time),
      post_id: postId,
    });
  }
  stmt.free();

  return commentsMap;
}

/**
 * 批量获取用户
 */
export function getUsersByIds(userIds: number[]): Map<number, User> {
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
export function getVideoMetadata(id: string): VideoMetadata | null {
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
        uploader_url: metadata.uploader_url,
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
 * 从QQ视频URL中提取视频ID
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
 * 注入视频元数据到帖子内容中
 */
export function injectVideoMetadataIntoPosts(posts: Post[]): void {
  for (const post of posts) {
    injectVideoMetadataIntoContent(post.content);
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
