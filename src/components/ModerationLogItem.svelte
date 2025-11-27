<script lang="ts">
  import type { SearchResult } from "../lib/types";
  import { getImageThumbnailUrl } from "../lib/content-utils";
  import ModerationLogUserLink from "./ModerationLogUserLink.svelte";

  interface Props {
    item: SearchResult;
  }

  let { item }: Props = $props();

  function getThreadUrl(tid: number | null) {
    if (!tid) return "#";
    return `/thread/${tid}`;
  }

  let isPost = $derived(item.result_type === "moderation_post");
  let isUser = $derived(item.result_type === "moderation_user");
  let isBawu = $derived(item.result_type === "moderation_bawu");

  let operationColor = $derived(
    {
      删贴: "bg-red-100",
      恢复删贴: "bg-emerald-100",
      加精: "bg-yellow-100",
      取消加精: "bg-yellow-100",
      置顶: "bg-blue-100",
      取消置顶: "bg-blue-100",
    }[item.operation || ""] || "bg-gray-100"
  );
</script>

<div class="p-5 border-b border-gray-100 relative">
  {#if isPost}
    <a href={getThreadUrl(item.thread_id)} class="absolute inset-0 z-0 lg:hidden" aria-hidden="true"></a>
    <div class="mb-5">
      <span class={`text-sm text-gray-800 rounded px-2 py-1 mr-2 ${operationColor}`}>{item.operation}</span>{#if item.title}
        <a href={getThreadUrl(item.thread_id)} class="text-sky-700 hover:underline">{item.title}</a>
      {/if}
      {#if item.content_preview}
        <p class="text-sm mt-2 leading-6 text-gray-700 line-clamp-3"><a href={getThreadUrl(item.thread_id)}>{item.content_preview}</a></p>
      {/if}
      {#if item.media}
        <div class="mt-4 flex flex-row flex-nowrap justify-start gap-4 overflow-x-auto">
          {#each item.media.split("\n").filter(Boolean) as image}
            <a href={getThreadUrl(item.thread_id)}>
              <img class="h-auto rounded" loading="lazy" src={getImageThumbnailUrl(image)} alt="" />
            </a>
          {/each}
        </div>
      {/if}
    </div>
    <div class="text-sm text-gray-500 leading-8 mt-4">
      {#if item.username}
        <p>
          帖子作者：<ModerationLogUserLink userId={item.target_user_id} username={item.username} time={item.post_time!} />
        </p>
      {/if}
      {#if item.post_time}
        <p>
          发帖时间：<span class="text-gray-800">{item.post_time}</span>
        </p>
      {/if}
      <p>
        操作人：
        <ModerationLogUserLink userId={item.operator_id} username={item.operator} time={item.time} />
      </p>
      <p>
        操作时间：<span class="text-gray-800">{item.time}</span>
      </p>
    </div>
  {:else}
    <div class="text-sm text-gray-500 leading-8">
      <p>
        <span class={`text-gray-800 rounded px-2 py-1 mr-2 ${operationColor}`}>{item.operation}{item.duration ? item.duration : ""}</span
        >{#if item.username}<ModerationLogUserLink userId={item.target_user_id} username={item.username} time={item.time} />{/if}
      </p>
      <p>
        操作人：<ModerationLogUserLink userId={item.operator_id} username={item.operator} time={item.time} />
      </p>
      <p>
        操作时间：<span class="text-gray-800">{item.time}</span>
      </p>
    </div>
  {/if}
</div>
