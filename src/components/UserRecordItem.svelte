<script lang="ts">
  import type { SearchResult } from "../lib/types";
  import { extractTextContent, extractMedia, getThumbnailUrl } from "../lib/content-utils";

  interface Props {
    item: SearchResult;
    time?: string;
    showAuthor?: boolean;
  }

  let { item, time = undefined, showAuthor = false }: Props = $props();

  function getThreadUrl(tid: number | null, anchor: number | null, page: number | undefined) {
    if (!tid) return "#";
    let url = "";
    if (time) {
      url = `/time-machine?time=${time}&thread=${tid}`;
      if (page && page > 1) {
        url += `&page=${page}`;
      }
    } else {
      url = `/thread/${tid}`;
      if (page && page > 1) {
        url += `/${page}`;
      }
    }
    if (anchor) {
      url += `#${anchor}`;
    }
    return url;
  }

  let isComment = $derived(item.resultType === "comment");
  let anchorId = $derived(item.floor === 1 || item.resultType === "thread" ? null : item.postId);
  let threadUrl = $derived(getThreadUrl(item.threadId, anchorId, item.page));

  // Badge
  let badge = $derived(
    {
      thread: "主题帖",
      post: "回复",
      comment: "评论",
    }[item.resultType as "thread" | "post" | "comment"] || item.resultType,
  );

  // 提取内容
  let contentText = $derived(extractTextContent(item.content || []));
  let contentMedia = $derived(extractMedia(item.content || []));
  let postPreviewText = $derived(item.post_content_json ? extractTextContent(item.post_content_json) : "");
</script>

<div class="p-5 border-b border-gray-100 relative">
  <a href={threadUrl} class="absolute inset-0 z-0 lg:hidden" aria-hidden="true"></a>
  <div class="flex flex-col gap-2">
    <div class="min-w-0 w-full">
      <div class="text-base">
        {#if item.title}
          <a class="text-sky-700 hover:underline" href={threadUrl}>
            {item.title}
          </a>
        {:else}
          <span>{badge}</span>
        {/if}
      </div>

      <div class="text-xs text-gray-500 mt-1 flex flex-row gap-1">
        {#if isComment}
          <span>回复{item.floor}楼</span>
        {:else}
          <span>{item.floor || 1}楼</span>
        {/if}
      </div>

      {#if isComment}
        <p class="text-sm mt-2 mb-2 text-gray-700 flex flex-col lg:flex-row gap-3 items-baseline">
          <a class="rounded bg-slate-100 px-2.5 py-1 truncate shrink max-w-full" href={threadUrl}>
            <span>{item.floor}</span> 楼：<span>{postPreviewText}</span>
          </a>
        </p>
      {/if}

      {#if contentText}
        <p class="text-sm mt-2 text-gray-700 line-clamp-3 leading-6 break-all">
          {#if showAuthor && item.nickname}
            <a href={`/user/${item.userId}`} class="text-sky-700 hover:underline font-medium mr-1 relative z-10">
              {item.nickname}:
            </a>
          {/if}
          <a href={threadUrl}>
            {contentText}
          </a>
        </p>
      {/if}

      {#if contentMedia.length > 0}
        <div class="mt-4 flex flex-row flex-nowrap justify-start gap-4 overflow-x-auto">
          {#each contentMedia as media}
            {@const thumbnailUrl = getThumbnailUrl(media)}
            {#if thumbnailUrl}
              <a href={threadUrl}>
                <img class="max-h-32 w-auto rounded" src={thumbnailUrl} alt="" />
              </a>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
    <div class="lg:-mb-1.5 text-xs text-gray-500 self-end">{item.time}</div>
  </div>
</div>
