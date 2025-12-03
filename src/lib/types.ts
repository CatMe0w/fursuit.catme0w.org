export interface User {
  id: number;
  username: string | null;
  nickname: string | null;
  avatar: string | null;
}

export interface UserRecord {
  type: "post" | "comment";
  threadId: number;
  title: string;
  postId: number;
  floor: number;
  postContent: ContentItem[];
  commentId?: number;
  commentContent?: ContentItem[];
  time: string;
  page: number;
}

export interface Thread {
  id: number;
  title: string;
  opUserId: number;
  userId: number;
  time: string;
  replyNum: number;
  featured: boolean;
  opPostContent: ContentItem[];
  opUsername?: string;
  opNickname?: string;
  lastReplyUsername?: string;
  lastReplyNickname?: string;
  postCount: number;
}

export interface Post {
  id: number;
  floor: number;
  userId: number;
  content: ContentItem[];
  time: string;
  commentNum: number;
  signature: string | null;
  tail: string | null;
  username: string | null;
  nickname: string | null;
  avatar: string | null;
  comments: Comment[];
}

export interface Comment {
  id: number;
  userId: number;
  content: ContentItem[];
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
  | { type: 'username'; content: { text: string; userId: number } }
  | { type: 'album'; content: { url: string; description: string }[] };

export interface VideoMetadata {
  id?: string;
  title?: string;
  uploader?: string;
  uploaderUrl?: string;
}

export interface ThreadDetailResponse {
  posts: Post[];
  totalCount: number;
  threadTitle: string;
  moderationLogs: ModerationLog[];
}

export interface ModerationLog {
  threadId: number | null;
  postId: number | null;
  title: string | null;
  contentPreview: string | null;
  media: string | null;
  username: string | null;
  postTime: string | null;
  operation: string | null;
  operator: string | null;
  operationTime: string | null;
  duration: string | null;
  operatorId?: number | null;
  targetUserId?: number | null;
}

// Search
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
  threadId: number | null;
  postId: number | null;
  commentId: number | null;
  resultType: 'thread' | 'post' | 'comment' | 'moderation_post' | 'moderation_user' | 'moderation_bawu';
  time: string | null;
  userId: number | null;
  title: string | null;
  floor: number | null;
  content: ContentItem[] | null;
  operation?: string | null;
  operator?: string | null;
  username?: string | null;
  nickname?: string | null;
  page?: number;
  // For comments in user search results
  post_content_json?: ContentItem[];
  // For moderation logs
  duration?: string | null;
  contentPreview?: string | null;
  media?: string | null;
  postTime?: string | null;
  operatorId?: number | null;
  targetUserId?: number | null;
}

export interface SearchResponse {
  items: SearchResult[];
  totalCount: number;
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
