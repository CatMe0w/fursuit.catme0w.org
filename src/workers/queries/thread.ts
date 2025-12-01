import { getDb } from '../db';
import { parseContent, injectVideoMetadataIntoContent } from '../utils';
import type { Thread, ThreadDetailResponse, ModerationLog } from '../../lib/types';
import { getVideoMetadata } from './video';

/**
 * 获取指定时间点的帖子列表（带分页）
 */
export function getThreadsAtTime(datetime: string, keyword?: string, limit?: number, offset?: number, featured?: boolean): { threads: Thread[]; totalCount: number } {
  const db = getDb();

  const kw = (keyword || '').trim();
  const firstKw = kw ? `%${kw.split(/\s+/)[0]}%` : '%%';

  // 获取所有加精的帖子ID（截止到指定时间）
  const featuredSql = `SELECT DISTINCT thread_id FROM un_post WHERE operation = '加精' AND operation_time < ?1`;
  const featuredStmt = db.prepare(featuredSql);
  featuredStmt.bind([datetime]);
  const featuredSet = new Set<number>();
  while (featuredStmt.step()) {
    const row = featuredStmt.getAsObject();
    featuredSet.add(Number(row.thread_id));
  }
  featuredStmt.free();

  // 构建featured过滤条件
  let featuredFilter = "";
  if (featured) {
    if (featuredSet.size === 0) {
      return { threads: [], totalCount: 0 };
    }
    const ids = Array.from(featuredSet).join(",");
    featuredFilter = `AND z.thread_id IN (${ids})`;
  }

  const cteSql = `
    WITH last_posts AS (
      SELECT p.thread_id, p.user_id, p.time, p.content
      FROM pr_post p
      JOIN (
        SELECT thread_id, MAX(time) AS time
        FROM pr_post
        WHERE time < ?1 AND content LIKE ?2
        GROUP BY thread_id
      ) lp ON p.thread_id = lp.thread_id AND p.time = lp.time
    ),
    last_comments AS (
      SELECT pr_post.thread_id AS thread_id, pr_comment.user_id AS user_id, pr_comment.time AS time, pr_comment.content AS content
      FROM pr_comment
      JOIN pr_post ON pr_comment.post_id = pr_post.id
      JOIN (
        SELECT pr_post.thread_id AS thread_id, MAX(pr_comment.time) AS time
        FROM pr_comment
        JOIN pr_post ON pr_comment.post_id = pr_post.id
        WHERE pr_comment.time < ?1 AND pr_comment.content LIKE ?2
        GROUP BY pr_post.thread_id
      ) lc ON pr_post.thread_id = lc.thread_id AND pr_comment.time = lc.time
    ),
    unioned AS (
      SELECT * FROM last_posts
      UNION ALL
      SELECT * FROM last_comments
    ),
    z AS (
      SELECT u1.*
      FROM unioned u1
      JOIN (
        SELECT thread_id, MAX(time) AS time
        FROM unioned
        GROUP BY thread_id
      ) mx ON u1.thread_id = mx.thread_id AND u1.time = mx.time
    )`;

  // 先查询总数
  const countSql = `
    ${cteSql}
    SELECT COUNT(*) as total
    FROM z
    JOIN pr_thread t ON z.thread_id = t.id
    WHERE NOT EXISTS (
      SELECT 1 FROM un_post u
      WHERE u.thread_id = z.thread_id
        AND u.post_id IS NULL
        AND u.operation = '删贴'
        AND u.operation_time < ?1
        AND u.operation_time NOT LIKE '2022-02-26 23:%'
        AND u.operation_time NOT LIKE '2022-02-16 01:%'
    ) ${featuredFilter}`;

  const countStmt = db.prepare(countSql);
  countStmt.bind([datetime, firstKw]);
  countStmt.step();
  const totalCount = Number(countStmt.getAsObject().total || 0);
  countStmt.free();

  // 查询分页数据
  const sql = `
    ${cteSql}
    SELECT z.thread_id, t.user_id AS op_user_id, t.title AS title, z.user_id, z.time, t.reply_num, p.content,
           op_user.username AS op_username, op_user.nickname AS op_nickname,
           last_user.username AS last_reply_username, last_user.nickname AS last_reply_nickname
    FROM z
    JOIN pr_thread t ON z.thread_id = t.id
    JOIN pr_post p ON z.thread_id = p.thread_id AND p.floor = 1
    LEFT JOIN pr_user op_user ON t.user_id = op_user.id
    LEFT JOIN pr_user last_user ON z.user_id = last_user.id
    WHERE NOT EXISTS (
      SELECT 1 FROM un_post u
      WHERE u.thread_id = z.thread_id
        AND u.post_id IS NULL
        AND u.operation = '删贴'
        AND u.operation_time < ?1
        AND u.operation_time NOT LIKE '2022-02-26 23:%'
        AND u.operation_time NOT LIKE '2022-02-16 01:%'
    ) ${featuredFilter}
    ORDER BY z.time DESC
    LIMIT ?3 OFFSET ?4`;

  const stmt = db.prepare(sql);
  stmt.bind([datetime, firstKw, limit || -1, offset || 0]);

  const threads: Thread[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const opPostContent = parseContent(row.content as string | null);

    // 注入视频元数据到op_post_content
    injectVideoMetadataIntoContent(opPostContent, getVideoMetadata);

    threads.push({
      id: Number(row.thread_id),
      title: String(row.title),
      op_user_id: Number(row.op_user_id),
      user_id: Number(row.user_id),
      time: String(row.time),
      reply_num: Number(row.reply_num),
      featured: featuredSet.has(Number(row.thread_id)),
      op_post_content: opPostContent,
      op_username: row.op_username ? String(row.op_username) : undefined,
      op_nickname: row.op_nickname ? String(row.op_nickname) : undefined,
      last_reply_username: row.last_reply_username ? String(row.last_reply_username) : undefined,
      last_reply_nickname: row.last_reply_nickname ? String(row.last_reply_nickname) : undefined
    });
  }
  stmt.free();

  return { threads, totalCount };
}

/**
 * 获取指定帖子在指定时间点的楼层列表（带分页，包含评论）
 */
export function getThreadPostsAtTime(threadId: number, datetime: string, limit: number, offset: number): ThreadDetailResponse {
  const db = getDb();

  // 1. 获取帖子标题
  const threadStmt = db.prepare('SELECT title FROM pr_thread WHERE id = ?');
  threadStmt.bind([threadId]);
  let threadTitle = '';
  if (threadStmt.step()) {
    threadTitle = String(threadStmt.getAsObject().title);
  }
  threadStmt.free();

  // 2. 获取楼层总数
  const countSql = `
    SELECT COUNT(*) as total
    FROM pr_post p
    WHERE p.thread_id = ?1
      AND p.time < ?2
      AND NOT EXISTS (
        SELECT 1 FROM un_post u
        WHERE u.thread_id = p.thread_id
          AND u.post_id = p.id
          AND u.operation = '删贴'
          AND u.operation_time < ?2
          AND u.operation_time NOT LIKE '2022-02-26 23:%'
          AND u.operation_time NOT LIKE '2022-02-16 01:%'
      )`;
  
  const countStmt = db.prepare(countSql);
  countStmt.bind([threadId, datetime]);
  countStmt.step();
  const totalCount = Number(countStmt.getAsObject().total || 0);
  countStmt.free();

  // 3. 获取相关的管理日志
  const moderationLogsSql = `
    SELECT u.thread_id, u.post_id, u.title, u.content_preview, u.media, u.username, u.post_time, u.operation, u.operator, u.operation_time,
           op_user.id AS operator_id, target_user.id AS target_user_id
    FROM un_post u
    LEFT JOIN pr_user op_user ON u.operator = op_user.username
    LEFT JOIN pr_user target_user ON u.username = target_user.username
    WHERE u.thread_id = ?1
      AND u.operation_time < ?2
      AND u.operation_time NOT LIKE '2022-02-26 23:%'
      AND u.operation_time NOT LIKE '2022-02-16 01:%'
    ORDER BY u.operation_time ASC, u.rowid DESC`;
  
  const moderationLogsStmt = db.prepare(moderationLogsSql);
  moderationLogsStmt.bind([threadId, datetime]);
  
  const moderationLogs: ModerationLog[] = [];
  while (moderationLogsStmt.step()) {
    const row = moderationLogsStmt.getAsObject();
    moderationLogs.push({
      thread_id: row.thread_id !== null ? Number(row.thread_id) : null,
      post_id: row.post_id !== null ? Number(row.post_id) : null,
      title: row.title ? String(row.title) : null,
      content_preview: row.content_preview ? String(row.content_preview) : null,
      media: row.media ? String(row.media) : null,
      username: row.username ? String(row.username) : null,
      post_time: row.post_time ? String(row.post_time) : null,
      operation: row.operation ? String(row.operation) : null,
      operator: row.operator ? String(row.operator) : null,
      operation_time: row.operation_time ? String(row.operation_time) : null,
      operator_id: row.operator_id ? Number(row.operator_id) : null,
      target_user_id: row.target_user_id ? Number(row.target_user_id) : null,
    });
  }
  moderationLogsStmt.free();

  // 4. 获取楼层列表
  const postsSql = `
    SELECT p.id, p.floor, p.user_id, p.content, p.time, p.comment_num, p.signature, p.tail,
           u.username, u.nickname, u.avatar
    FROM pr_post p
    LEFT JOIN pr_user u ON p.user_id = u.id
    WHERE p.thread_id = ?1
      AND p.time < ?2
      AND NOT EXISTS (
        SELECT 1 FROM un_post up
        WHERE up.thread_id = p.thread_id
          AND up.post_id = p.id
          AND up.operation = '删贴'
          AND up.operation_time < ?2
          AND up.operation_time NOT LIKE '2022-02-26 23:%'
          AND up.operation_time NOT LIKE '2022-02-16 01:%'
      )
    ORDER BY p.floor ASC
    LIMIT ?3 OFFSET ?4`;

  const stmt = db.prepare(postsSql);
  stmt.bind([threadId, datetime, limit, offset]);

  const posts: any[] = [];
  const postIds: number[] = [];

  while (stmt.step()) {
    const row = stmt.getAsObject();
    const postId = Number(row.id);
    postIds.push(postId);

    posts.push({
      id: postId,
      floor: Number(row.floor),
      user_id: Number(row.user_id),
      content: parseContent(row.content as string | null),
      time: String(row.time),
      comment_num: Number(row.comment_num),
      signature: row.signature ? String(row.signature) : null,
      tail: row.tail ? String(row.tail) : null,
      username: row.username ? String(row.username) : null,
      nickname: row.nickname ? String(row.nickname) : null,
      avatar: row.avatar ? String(row.avatar) : null,
      comments: [] // 初始化为空数组，稍后填充
    });
  }
  stmt.free();

  // 批量获取评论
  if (postIds.length > 0) {
    const placeholders = postIds.map(() => '?').join(',');
    const commentsSql = `
      SELECT c.id, c.post_id, c.user_id, c.content, c.time,
             u.username, u.nickname, u.avatar
      FROM pr_comment c
      LEFT JOIN pr_user u ON c.user_id = u.id
      WHERE c.post_id IN (${placeholders})
        AND c.time < ?
      ORDER BY c.time ASC`;
    
    const commentStmt = db.prepare(commentsSql);
    // 绑定参数：所有postIds + datetime
    commentStmt.bind([...postIds, datetime]);

    const commentsByPostId = new Map<number, any[]>();

    while (commentStmt.step()) {
      const cRow = commentStmt.getAsObject();
      const postId = Number(cRow.post_id);
      
      if (!commentsByPostId.has(postId)) {
        commentsByPostId.set(postId, []);
      }

      commentsByPostId.get(postId)!.push({
        id: Number(cRow.id),
        user_id: Number(cRow.user_id),
        content: parseContent(cRow.content as string | null),
        time: String(cRow.time),
        username: cRow.username ? String(cRow.username) : null,
        nickname: cRow.nickname ? String(cRow.nickname) : null,
        avatar: cRow.avatar ? String(cRow.avatar) : null
      });
    }
    commentStmt.free();

    // 将评论分配给对应的帖子
    for (const post of posts) {
      if (commentsByPostId.has(post.id)) {
        post.comments = commentsByPostId.get(post.id);
      }
    }
  }

  // 注入视频元数据到content
  for (const post of posts) {
    injectVideoMetadataIntoContent(post.content, getVideoMetadata);
  }

  return { posts, totalCount, threadTitle, moderation_logs: moderationLogs };
}
