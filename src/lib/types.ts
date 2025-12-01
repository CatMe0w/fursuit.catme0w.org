export interface Thread {
  id: number;
  title: string;
  op_user_id: number;
  user_id: number;
  time: string;
  reply_num: number;
  is_good: boolean;
  op_post_content: any[];
  op_username?: string;
  op_nickname?: string;
  last_reply_username?: string;
  last_reply_nickname?: string;
}

export type SearchScope = 'global' | 'user' | 'moderation';

export interface SearchOptions {
  scope: SearchScope;
  keyword: string;
  userId?: number;
  snapshotTime?: string;
  limit?: number;
  offset?: number;
  onlyThread?: boolean;
}

export interface SearchResult {
  thread_id: number | null;
  post_id: number | null;
  comment_id: number | null;
  result_type: 'thread' | 'post' | 'comment' | 'moderation_post' | 'moderation_user' | 'moderation_bawu';
  time: string;
  user_id: number | null;
  title: string | null;
  floor: number | null;
  content_json: any[] | null;
  operation?: string | null;
  operator?: string | null;
  username?: string | null;
  nickname?: string | null;
  page?: number;
  // For comments in user search results
  post_content_json?: any[];
  // For moderation logs
  reason?: string | null;
  duration?: string | null;
  content_preview?: string | null;
  media?: string | null;
  post_time?: string | null;
  operator_id?: number | null;
  target_user_id?: number | null;
}

export interface SearchResponse {
  items: SearchResult[];
  totalCount: number;
}

export interface UserInfo {
  id: number;
  username: string | null;
  nickname: string | null;
  avatar: string | null;
}

export interface ThreadPost {
  id: number;
  floor: number;
  user_id: number;
  content: any[];
  time: string;
  comment_num: number;
  signature: string | null;
  tail: string | null;
  username: string | null;
  nickname: string | null;
  avatar: string | null;
  comments: ThreadComment[];
}

export interface ThreadComment {
  id: number;
  user_id: number;
  content: any[];
  time: string;
  username: string | null;
  nickname: string | null;
  avatar: string | null;
}

export type ContentItem =
  | { type: 'text' | 'text_bold' | 'text_red' | 'text_bold_red'; content: string }
  | { type: 'image'; content: string }
  | { type: 'video'; url: string; metadata?: VideoMetadata }
  | { type: 'audio'; content: string }
  | { type: 'emoticon'; content: { id: string; description: string } }
  | { type: 'url'; content: { url: string; text: string } }
  | { type: 'username'; content: { text: string; user_id: number } }
  | { type: 'album'; content: { url: string; description: string }[] };

export interface ModerationLog {
  thread_id: number | null;
  post_id: number | null;
  title: string | null;
  content_preview: string | null;
  media: string | null;
  username: string | null;
  post_time: string | null;
  operation: string | null;
  operator: string | null;
  operation_time: string | null;
  operator_id?: number | null;
  target_user_id?: number | null;
}

export interface VideoMetadata {
  id?: string;
  title?: string;
  uploader?: string;
  uploader_url?: string;
}

export interface ThreadDetailResponse {
  posts: ThreadPost[];
  totalCount: number;
  threadTitle: string;
  moderation_logs: ModerationLog[];
}

// Worker Message Types
export interface WorkerMessage {
  type: string;
  payload?: any;
  requestId?: number;
}

export interface WorkerResponse {
  type: 'progress' | 'ready' | 'result' | 'error';
  data?: any;
  loaded?: number;
  total?: number;
  stage?: string;
  message?: string;
  requestId?: number;
}
