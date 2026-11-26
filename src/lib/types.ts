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
  signatureSize?: ImageSize;
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
  | { type: 'image'; content: string; size?: ImageSize }
  | { type: 'video'; url: string; metadata?: VideoMetadata }
  | { type: 'audio'; content: string }
  | { type: 'emoticon'; content: { id: string; description: string } }
  | { type: 'url'; content: { url: string; text: string } }
  | { type: 'username'; content: { text: string; userId: number } }
  | { type: 'album'; content: { url: string; description: string; size?: ImageSize }[] };

export interface ImageSize {
  width: number;
  height: number;
}

/** 来自v4 video表，存在即表示CDN上有可播放的视频 */
export interface VideoMetadata {
  id: string;
  size: ImageSize;
  coverUrl?: string;
  coverSize?: ImageSize;
  /** 以下仅外部视频（优酷、腾讯视频） */
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
  media: ContentItem[] | null;
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
  media?: ContentItem[] | null;
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
  requestId: number;
}

// 成功时带data，失败时带error
export type WorkerResponse =
  | { requestId: number; data: unknown }
  | { requestId: number; error: string };
