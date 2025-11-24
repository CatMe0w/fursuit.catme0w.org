import { getDb } from '../db';
import { parseContent } from '../utils';
import type { SearchResponse, SearchResult, UserInfo } from '../../lib/types';

/**
 * 获取用户信息
 */
export function getUserById(userId: number): UserInfo | null {
  const db = getDb();

  const stmt = db.prepare('SELECT id, username, nickname, avatar FROM pr_user WHERE id = ?');
  stmt.bind([userId]);

  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return {
      id: Number(row.id),
      username: row.username ? String(row.username) : null,
      nickname: row.nickname ? String(row.nickname) : null,
      avatar: row.avatar ? String(row.avatar) : null,
    };
  }

  stmt.free();
  return null;
}

/**
 * 获取指定用户在指定时间点的所有帖子和评论（带分页）
 */
export function getUserPostsAtTime(userId: number, datetime: string, limit?: number, offset?: number): SearchResponse {
  const db = getDb();

  // 1. 获取总数
  const countSql = `
    SELECT COUNT(*) as total FROM (
      SELECT 1
      FROM pr_post
      WHERE user_id = ?1 AND time < ?2
      UNION ALL
      SELECT 1
      FROM pr_comment
      WHERE user_id = ?1 AND time < ?2
    )`;
  
  const countStmt = db.prepare(countSql);
  countStmt.bind([userId, datetime]);
  countStmt.step();
  const totalCount = Number(countStmt.getAsObject().total || 0);
  countStmt.free();

  // 2. 获取分页数据
  const sql = `
    SELECT thread_id, title, post_id, floor, post_content, NULL AS comment_id, NULL AS comment_content, time, page
    FROM (
      SELECT pr_post.thread_id, pr_thread.title, pr_post.id AS post_id, pr_post.floor, pr_post.content AS post_content, pr_post.time,
             (SELECT COUNT(*) FROM pr_post p2 
              WHERE p2.thread_id = pr_post.thread_id 
                AND p2.floor < pr_post.floor
                AND NOT EXISTS (
                  SELECT 1 FROM un_post u
                  WHERE u.thread_id = p2.thread_id
                    AND u.post_id = p2.id
                    AND u.operation = '删贴'
                    AND u.operation_time < ?2
                    AND u.operation_time NOT LIKE '2022-02-26 23:%'
                    AND u.operation_time NOT LIKE '2022-02-16 01:%'
                )
             ) / 30 + 1 AS page
      FROM pr_post
      JOIN pr_thread ON pr_post.thread_id = pr_thread.id
      WHERE pr_post.user_id = ?1
        AND pr_post.time < ?2
    )
    UNION ALL
    SELECT thread_id, title, post_id, floor, post_content, comment_id, comment_content, time, page
    FROM (
      SELECT pr_thread.id AS thread_id, pr_thread.title, pr_comment.post_id, pr_post.floor, pr_post.content AS post_content, pr_comment.id AS comment_id, pr_comment.content AS comment_content, pr_comment.time,
             (SELECT COUNT(*) FROM pr_post p2 
              WHERE p2.thread_id = pr_post.thread_id 
                AND p2.floor < pr_post.floor
                AND NOT EXISTS (
                  SELECT 1 FROM un_post u
                  WHERE u.thread_id = p2.thread_id
                    AND u.post_id = p2.id
                    AND u.operation = '删贴'
                    AND u.operation_time < ?2
                    AND u.operation_time NOT LIKE '2022-02-26 23:%'
                    AND u.operation_time NOT LIKE '2022-02-16 01:%'
                )
             ) / 30 + 1 AS page
      FROM pr_comment
      JOIN pr_post ON pr_comment.post_id = pr_post.id
      JOIN pr_thread ON pr_post.thread_id = pr_thread.id
      WHERE pr_comment.user_id = ?1
        AND pr_comment.time < ?2
    )
    ORDER BY time DESC
    LIMIT ?3 OFFSET ?4`;

  const stmt = db.prepare(sql);
  stmt.bind([userId, datetime, limit || -1, offset || 0]);

  const items: SearchResult[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const hasComment = row.comment_id !== null;

    const result: SearchResult = {
      thread_id: Number(row.thread_id),
      post_id: Number(row.post_id),
      comment_id: hasComment ? Number(row.comment_id) : null,
      result_type: hasComment ? 'comment' : 'post',
      time: String(row.time),
      user_id: userId,
      title: String(row.title),
      floor: Number(row.floor),
      content_json: parseContent(hasComment ? (row.comment_content as string | null) : (row.post_content as string | null)),
      page: Number(row.page)
    };

    // 对于comment类型，额外保存被回复的楼层帖子内容用于预览
    if (hasComment) {
      (result as any).post_content_json = parseContent(row.post_content as string | null);
    }

    items.push(result);
  }
  stmt.free();

  return { items, totalCount };
}
