import { getDb } from '../db';
import { parseContent, buildMultiWordLike, injectVideoMetadataIntoContent } from '../utils';
import type { SearchOptions, SearchResponse, SearchResult } from '../../lib/types';
import type { Database } from 'sql.js';
import { getVideoMetadata } from './video';

/**
 * 统一搜索：scope=global/user/moderation
 */
export function searchEntries(options: SearchOptions): SearchResponse {
  const db = getDb();
  const { scope, keyword, userId, snapshotTime, limit = 200, offset = 0, onlyThread } = options;

  const words = keyword.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { items: [], totalCount: 0 };

  if (scope === 'moderation') {
    return searchModeration(db, words, limit, offset);
  } else {
    return searchContent(db, scope, words, userId, snapshotTime, limit, offset, onlyThread);
  }
}

/**
 * 管理日志搜索 (moderation scope)
 */
function searchModeration(db: Database, words: string[], limit: number, offset: number): SearchResponse {
  // 1. 构建各个子查询的WHERE条件
  const postLike = buildMultiWordLike(words, ['u.username', 'u.title', 'u.operation', 'u.operator', 'u.content_preview', 'u.media']);
  const userLike = buildMultiWordLike(words, ['u.username', 'u.operation', 'u.operator']);
  const bawuLike = buildMultiWordLike(words, ['u.username', 'u.operation', 'u.operator']);

  // 2. 定义子查询SQL
  // 统一列: thread_id, post_id, username, title, operation, operator, operation_time, content_preview, media, post_time, operator_id, target_user_id, result_type, duration

  const sqlPost = `
    SELECT u.thread_id, u.post_id, u.username, u.title, u.operation, u.operator, u.operation_time, u.content_preview, u.media, u.post_time,
           op_user.id AS operator_id, target_user.id AS target_user_id, 'moderation_post' AS result_type, NULL AS duration, u.rowid
    FROM un_post u
    LEFT JOIN pr_user op_user ON u.operator = op_user.username
    LEFT JOIN pr_user target_user ON u.username = target_user.username
    WHERE ${postLike.clause}
      AND u.operation_time NOT LIKE '2022-02-26 23:%'
      AND u.operation_time NOT LIKE '2022-02-16 01:%'
  `;

  const sqlUser = `
    SELECT NULL AS thread_id, NULL AS post_id, u.username, NULL AS title, u.operation, u.operator, u.operation_time, NULL AS content_preview, NULL AS media, NULL AS post_time,
           op_user.id AS operator_id, target_user.id AS target_user_id, 'moderation_user' AS result_type, u.duration, u.rowid
    FROM un_user u
    LEFT JOIN pr_user op_user ON u.operator = op_user.username
    LEFT JOIN pr_user target_user ON u.username = target_user.username
    WHERE ${userLike.clause}
      AND u.operation_time NOT LIKE '2022-02-26 23:%'
      AND u.operation_time NOT LIKE '2022-02-16 01:%'
  `;

  const sqlBawu = `
    SELECT NULL AS thread_id, NULL AS post_id, u.username, NULL AS title, u.operation, u.operator, u.operation_time, NULL AS content_preview, NULL AS media, NULL AS post_time,
           op_user.id AS operator_id, target_user.id AS target_user_id, 'moderation_bawu' AS result_type, NULL AS duration, u.rowid
    FROM un_bawu u
    LEFT JOIN pr_user op_user ON u.operator = op_user.username
    LEFT JOIN pr_user target_user ON u.username = target_user.username
    WHERE ${bawuLike.clause}
      AND u.operation_time NOT LIKE '2022-02-26 23:%'
      AND u.operation_time NOT LIKE '2022-02-16 01:%'
  `;

  // 3. 组合SQL
  const unionSql = `${sqlPost} UNION ALL ${sqlUser} UNION ALL ${sqlBawu}`;
  const allParams = [...postLike.params, ...userLike.params, ...bawuLike.params];

  // 4. 获取总数
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM (${unionSql})`);
  countStmt.bind(allParams);
  countStmt.step();
  const totalCount = Number(countStmt.getAsObject().total || 0);
  countStmt.free();

  // 5. 获取分页数据
  const querySql = `SELECT * FROM (${unionSql}) ORDER BY operation_time DESC, rowid ASC LIMIT ? OFFSET ?`;
  const stmt = db.prepare(querySql);
  stmt.bind([...allParams, limit, offset]);

  const items: SearchResult[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    items.push({
      thread_id: row.thread_id !== null ? Number(row.thread_id) : null,
      post_id: row.post_id !== null ? Number(row.post_id) : null,
      comment_id: null,
      result_type: row.result_type as any,
      time: String(row.operation_time),
      user_id: null,
      title: row.title ? String(row.title) : null,
      floor: null,
      content_json: null,
      operation: row.operation ? String(row.operation) : null,
      operator: row.operator ? String(row.operator) : null,
      content_preview: row.content_preview ? String(row.content_preview) : null,
      media: row.media ? String(row.media) : null,
      post_time: row.post_time ? String(row.post_time) : null,
      operator_id: row.operator_id ? Number(row.operator_id) : null,
      target_user_id: row.target_user_id ? Number(row.target_user_id) : null,
      username: row.username ? String(row.username) : null,
      duration: row.duration ? String(row.duration) : null,
    });
  }
  stmt.free();

  return { items, totalCount };
}

/**
 * 内容搜索 (global / user scope)
 */
function searchContent(
  db: Database,
  scope: string,
  words: string[],
  userId: number | undefined,
  snapshotTime: string | undefined,
  limit: number,
  offset: number,
  onlyThread: boolean | undefined
): SearchResponse {
  const tm = !!snapshotTime;
  
  // 1. 构建WHERE条件
  const timeCondPost = tm ? 'AND p.time < ?' : '';
  const timeCondComment = tm ? 'AND c.time < ?' : '';
  const timeCondThreadOp = tm ? 'AND p.time < ?' : '';
  
  // 时间机器模式下，排除已删除的帖子
  const tmThreadNotDeleted = tm
    ? `AND NOT EXISTS (
         SELECT 1 FROM un_post u
         WHERE u.thread_id = t.id
           AND u.post_id IS NULL
           AND u.operation = '删贴'
           AND u.operation_time < ?
           AND u.operation_time NOT LIKE '2022-02-26 23:%'
           AND u.operation_time NOT LIKE '2022-02-16 01:%'
       )`
    : '';
    
  const tmPostNotDeleted = tm 
    ? `AND NOT EXISTS (
          SELECT 1 FROM un_post u
          WHERE u.thread_id = p.thread_id
            AND u.post_id IS NULL
            AND u.operation = '删贴'
            AND u.operation_time < ?
            AND u.operation_time NOT LIKE '2022-02-26 23:%'
            AND u.operation_time NOT LIKE '2022-02-16 01:%'
        )` 
    : '';

  const tmCommentNotDeleted = tm
    ? `AND NOT EXISTS (
          SELECT 1 FROM un_post u
          WHERE u.thread_id = p.thread_id
            AND u.post_id IS NULL
            AND u.operation = '删贴'
            AND u.operation_time < ?
            AND u.operation_time NOT LIKE '2022-02-26 23:%'
            AND u.operation_time NOT LIKE '2022-02-16 01:%'
        )`
    : '';

  const wordsForThread = buildMultiWordLike(words, ['t.title', 'p.content']);
  const wordsForPost = buildMultiWordLike(words, ['p.content']);
  const wordsForComment = buildMultiWordLike(words, ['c.content']);

  const userCondThread = scope === 'user' && userId != null ? 'AND t.user_id = ?' : '';
  const userCondPost = scope === 'user' && userId != null ? 'AND p.user_id = ?' : '';
  const userCondComment = scope === 'user' && userId != null ? 'AND c.user_id = ?' : '';

  // 2. 定义子查询SQL
  // 统一列: thread_id, post_id, comment_id, user_id, time, result_type, title, floor, content, post_content, username, nickname, page

  // Thread Matches
  const sqlThread = `
    SELECT t.id AS thread_id, NULL AS post_id, NULL AS comment_id,
           t.user_id AS user_id, p.time AS time,
           'thread' AS result_type, t.title AS title, p.floor AS floor, p.content AS content,
           NULL AS post_content, u.username, u.nickname,
           1 AS page
    FROM pr_thread t
    JOIN pr_post p ON p.thread_id = t.id AND p.floor = 1
    LEFT JOIN pr_user u ON t.user_id = u.id
    WHERE ${wordsForThread.clause}
      ${userCondThread}
      ${timeCondThreadOp}
      ${tmThreadNotDeleted}
  `;
  const paramsThread: (string | number)[] = [...wordsForThread.params];
  if (scope === 'user' && userId != null) paramsThread.push(userId);
  if (tm && snapshotTime) { paramsThread.push(snapshotTime); paramsThread.push(snapshotTime); }

  // Post Matches
  const sqlPost = `
    SELECT p.thread_id AS thread_id, p.id AS post_id, NULL AS comment_id,
           p.user_id AS user_id, p.time AS time,
           'post' AS result_type, t.title AS title, p.floor AS floor, p.content AS content,
           NULL AS post_content, u.username, u.nickname,
           (SELECT COUNT(*) FROM pr_post p2 
            WHERE p2.thread_id = p.thread_id 
              AND p2.floor < p.floor
              ${tm ? `AND NOT EXISTS (
                SELECT 1 FROM un_post u
                WHERE u.thread_id = p2.thread_id
                  AND u.post_id = p2.id
                  AND u.operation = '删贴'
                  AND u.operation_time < '${snapshotTime}'
                  AND u.operation_time NOT LIKE '2022-02-26 23:%'
                  AND u.operation_time NOT LIKE '2022-02-16 01:%'
              )` : ''}
           ) / 30 + 1 AS page
    FROM pr_post p
    JOIN pr_thread t ON t.id = p.thread_id
    LEFT JOIN pr_user u ON p.user_id = u.id
    WHERE ${wordsForPost.clause}
      AND p.floor > 1
      ${userCondPost}
      ${timeCondPost}
      ${tmPostNotDeleted}
  `;
  const paramsPost: (string | number)[] = [...wordsForPost.params];
  if (scope === 'user' && userId != null) paramsPost.push(userId);
  if (tm && snapshotTime) { paramsPost.push(snapshotTime); paramsPost.push(snapshotTime); }

  // Comment Matches
  const sqlComment = `
    SELECT p.thread_id AS thread_id, NULL AS post_id, c.id AS comment_id,
           c.user_id AS user_id, c.time AS time,
           'comment' AS result_type, t.title AS title, p.floor AS floor, c.content AS content,
           p.content AS post_content, u.username, u.nickname,
           (SELECT COUNT(*) FROM pr_post p2 
            WHERE p2.thread_id = p.thread_id 
              AND p2.floor < p.floor
              ${tm ? `AND NOT EXISTS (
                SELECT 1 FROM un_post u
                WHERE u.thread_id = p2.thread_id
                  AND u.post_id = p2.id
                  AND u.operation = '删贴'
                  AND u.operation_time < '${snapshotTime}'
                  AND u.operation_time NOT LIKE '2022-02-26 23:%'
                  AND u.operation_time NOT LIKE '2022-02-16 01:%'
              )` : ''}
           ) / 30 + 1 AS page
    FROM pr_comment c
    JOIN pr_post p ON c.post_id = p.id
    JOIN pr_thread t ON t.id = p.thread_id
    LEFT JOIN pr_user u ON c.user_id = u.id
    WHERE ${wordsForComment.clause}
      ${userCondComment}
      ${timeCondComment}
      ${tmCommentNotDeleted}
  `;
  const paramsComment: (string | number)[] = [...wordsForComment.params];
  if (scope === 'user' && userId != null) paramsComment.push(userId);
  if (tm && snapshotTime) { paramsComment.push(snapshotTime); paramsComment.push(snapshotTime); }

  // 3. 组合SQL
  let unionSql = sqlThread;
  let allParams = [...paramsThread];

  if (!onlyThread) {
    unionSql += ` UNION ALL ${sqlPost} UNION ALL ${sqlComment}`;
    allParams.push(...paramsPost, ...paramsComment);
  }

  // 4. 获取总数
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM (${unionSql})`);
  countStmt.bind(allParams);
  countStmt.step();
  const totalCount = Number(countStmt.getAsObject().total || 0);
  countStmt.free();

  // 5. 获取分页数据
  const querySql = `SELECT * FROM (${unionSql}) ORDER BY time DESC LIMIT ? OFFSET ?`;
  const stmt = db.prepare(querySql);
  stmt.bind([...allParams, limit, offset]);

  const items: SearchResult[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const contentJson = parseContent(row.content as string | null);
    const postContentJson = parseContent(row.post_content as string | null);

    // 注入视频元数据
    injectVideoMetadataIntoContent(contentJson, getVideoMetadata);
    injectVideoMetadataIntoContent(postContentJson, getVideoMetadata);

    items.push({
      thread_id: Number(row.thread_id),
      post_id: row.post_id !== null ? Number(row.post_id) : null,
      comment_id: row.comment_id !== null ? Number(row.comment_id) : null,
      result_type: row.result_type as any,
      time: String(row.time),
      user_id: Number(row.user_id),
      title: String(row.title),
      floor: Number(row.floor),
      content_json: contentJson,
      post_content_json: postContentJson,
      username: row.username ? String(row.username) : null,
      nickname: row.nickname ? String(row.nickname) : null,
      page: Number(row.page)
    });
  }
  stmt.free();

  return { items, totalCount };
}

// 无scope视为全吧搜索
export function searchThreads(keyword: string): SearchResponse {
  return searchEntries({ scope: 'global', keyword });
}
