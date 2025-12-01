<script lang="ts">
  import type { Thread } from "../lib/types";
  import { extractTextContent, extractMedia, getThumbnailUrl, getUserDisplayName } from "../lib/content-utils";

  interface Props {
    thread: Thread;
    time?: string;
  }

  let { thread, time = undefined }: Props = $props();

  function getThreadUrl(tid: number) {
    if (time) return `/time-machine?time=${time}&thread=${tid}`;
    return `/thread/${tid}`;
  }

  function getUserUrl(uid: number) {
    if (time) return `/time-machine?time=${time}&user=${uid}`;
    return `/user/${uid}`;
  }

  let opPostContentText = $derived(extractTextContent(thread.op_post_content));
  let opPostMedia = $derived(extractMedia(thread.op_post_content));

  let opDisplayName = $derived(getUserDisplayName(thread.op_username, thread.op_nickname));
  let lastReplyDisplayName = $derived(getUserDisplayName(thread.last_reply_username, thread.last_reply_nickname));

  let shortTime = $derived(thread.time ? thread.time.slice(0, -9) : "");
</script>

<div class="p-5 border-b border-gray-100 relative">
  <a href={getThreadUrl(thread.id)} class="absolute inset-0 z-0 lg:hidden" aria-hidden="true"></a>
  <div class="flex flex-row flex-wrap lg:justify-end">
    <div class="mr-4 basis-14 shrink-0 order-1 lg:order-0">
      <p class="py-1 lg:px-2 lg:py-1.5 bg-gray-100 rounded text-sm text-center">
        {thread.reply_num}
      </p>
    </div>
    <div class="basis-full lg:basis-3/4 grow mb-5">
      <a href={getThreadUrl(thread.id)} class="text-sky-700 hover:underline">
        {thread.title}
        {#if thread.featured}
          <span class="bg-red-400 text-white text-xs px-1 py-0.5 rounded ml-1 select-none" title="精品帖">精</span>
        {/if}
      </a>
      {#if opPostContentText}
        <p class="text-sm mt-2 text-gray-700 line-clamp-3 leading-6">
          <a href={getThreadUrl(thread.id)}>{opPostContentText}</a>
        </p>
      {/if}
      {#if opPostMedia.length > 0}
        <div class="mt-4 flex flex-row flex-nowrap justify-start gap-4 overflow-x-auto">
          {#each opPostMedia as media}
            {@const thumbnailUrl = getThumbnailUrl(media)}
            {#if thumbnailUrl}
              <a href={getThreadUrl(thread.id)}>
                <img class="max-h-32 w-auto rounded" loading="lazy" src={thumbnailUrl} alt="" />
              </a>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
    <div class="text-xs lg:-mb-1.5 truncate text-gray-500 flex flex-row justify-end gap-3 grow items-center order-2 lg:order-0 basis-px lg:basis-auto">
      <p class="truncate">
        <a href={getUserUrl(thread.op_user_id)} class="hover:underline relative z-10" title={`帖子作者：${opDisplayName}`}><span>{opDisplayName}</span></a>
        <span class="truncate hidden lg:inline"> / </span>
        <a class="truncate hidden lg:inline hover:underline relative z-10" href={getUserUrl(thread.user_id)} title={`最后回复：${lastReplyDisplayName}`}
          ><span>{lastReplyDisplayName}</span></a
        >
      </p>
      <p title={`最后回复时间：${thread.time}`}>
        <span>{shortTime}</span>
      </p>
    </div>
  </div>
</div>
