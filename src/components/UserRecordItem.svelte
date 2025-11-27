<script lang="ts">
  import type { SearchResult } from "../lib/types";
  import { extractTextContent, extractImages, getImageThumbnailUrl } from "../lib/content-utils";

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

  let isComment = $derived(item.result_type === "comment");
  let anchorId = $derived(item.floor === 1 || item.result_type === "thread" ? null : item.post_id);
  let threadUrl = $derived(getThreadUrl(item.thread_id, anchorId, item.page));

  // Badge
  let badge = $derived(
    {
      thread: "主题帖",
      post: "回复",
      comment: "评论",
    }[item.result_type as "thread" | "post" | "comment"] || item.result_type
  );

  // 提取内容
  let contentText = $derived(extractTextContent(item.content_json || []));
  let contentImages = $derived(extractImages(item.content_json || []));
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
        <p class="text-sm mt-2 text-gray-700 line-clamp-3 leading-6">
          {#if showAuthor && item.nickname}
            <a href={`/user/${item.user_id}`} class="text-sky-700 hover:underline font-medium mr-1 relative z-10">
              {item.nickname}:
            </a>
          {/if}
          <a href={threadUrl}>
            {contentText}
          </a>
        </p>
      {/if}

      {#if contentImages.length > 0}
        <div class="mt-4 flex flex-row flex-nowrap justify-start gap-4 overflow-x-auto">
          {#each contentImages as image}
            <a href={threadUrl}>
              <img class="h-auto rounded" src={getImageThumbnailUrl(image)} alt="" />
            </a>
          {/each}
        </div>
      {/if}
    </div>
    <div class="lg:-mb-1.5 text-xs text-gray-500 self-end">{item.time}</div>
  </div>
</div>
