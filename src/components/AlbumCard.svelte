<script lang="ts">
  import type { Thread } from "../lib/types";
  import { getImageUrl } from "../lib/content-utils";

  let { thread }: { thread: Thread } = $props();

  let { coverUrl, imageCount } = $derived.by(() => {
    if (thread.opPostContent) {
      for (const item of thread.opPostContent) {
        if (item.type === "album" && Array.isArray(item.content) && item.content.length > 0) {
          return {
            coverUrl: getImageUrl(item.content[0].url),
            imageCount: item.content.length,
          };
        }
      }
    }
    return { coverUrl: "", imageCount: 0 };
  });
</script>

<a href={`/thread/${thread.id}`} class="group block bg-white rounded shadow-sm duration-200 overflow-hidden border border-gray-100">
  <div class="aspect-3/4 w-full bg-gray-100 relative overflow-hidden">
    {#if coverUrl}
      <img src={coverUrl} alt={thread.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
    {:else}
      <div class="w-full h-full flex items-center justify-center text-gray-400">
        <span class="text-sm">无封面</span>
      </div>
    {/if}

    {#if imageCount > 0}
      <div class="absolute bottom-2 right-2 bg-black/60 text-white text-sm px-2 py-1 rounded-full backdrop-blur-sm">
        {imageCount}张
      </div>
    {/if}
  </div>

  <div class="p-4">
    <h3 class="font-medium line-clamp-2 text-sky-700 group-hover:underline transition-colors mb-2">
      {thread.title}
    </h3>

    <div class="flex items-center justify-between text-xs text-gray-500">
      <span>{thread.opNickname || thread.opUsername || ""}</span>
      <span>{thread.time.split(" ")[0]}</span>
    </div>
  </div>
</a>
