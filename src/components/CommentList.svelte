<script lang="ts">
  import CommentItem from "./CommentItem.svelte";
  import type { ThreadComment } from "../lib/types";

  interface Props {
    comments?: ThreadComment[];
    pageSize?: number;
    time?: string;
  }

  let { comments = [], pageSize = 10, time = undefined }: Props = $props();

  let currentPage = $state(1);

  let totalPages = $derived(Math.ceil(comments.length / pageSize));
  let visibleComments = $derived(comments.slice((currentPage - 1) * pageSize, currentPage * pageSize));

  function goToPage(p: number) {
    currentPage = p;
  }
</script>

<div class="grid grid-cols-1 gap-6 p-4 mt-3 lg:ml-31 rounded bg-gray-50 text-sm">
  {#each visibleComments as comment (comment.id)}
    <CommentItem {comment} {time} />
  {/each}

  {#if totalPages > 1}
    <div class="flex justify-end text-gray-700 mt-1">
      <div class="flex flex-row gap-1 items-baseline text-xs">
        {#if currentPage > 1}
          <button
            onclick={(e) => {
              e.preventDefault();
              goToPage(1);
            }}
            class="px-1 text-sky-700 hover:underline cursor-pointer">首页</button
          >
          <button
            onclick={(e) => {
              e.preventDefault();
              goToPage(currentPage - 1);
            }}
            class="px-1 text-sky-700 hover:underline cursor-pointer">上一页</button
          >
        {/if}

        <div class="flex items-center gap-1 px-1">
          <select
            class="border border-gray-200 rounded px-1 py-0.5 bg-white"
            bind:value={currentPage}
            aria-label="选择评论页"
            onchange={(event) => goToPage(Number((event.target as HTMLSelectElement).value))}
          >
            {#each Array(totalPages) as _, index (index)}
              <option value={index + 1}>{index + 1}</option>
            {/each}
          </select>
          <span>/</span>
          <span class="font-medium">{totalPages}</span>
        </div>

        {#if currentPage < totalPages}
          <button
            onclick={(e) => {
              e.preventDefault();
              goToPage(currentPage + 1);
            }}
            class="px-1 text-sky-700 hover:underline cursor-pointer">下一页</button
          >
          <button
            onclick={(e) => {
              e.preventDefault();
              goToPage(totalPages);
            }}
            class="px-1 text-sky-700 hover:underline cursor-pointer">末页</button
          >
        {/if}
      </div>
    </div>
  {/if}
</div>
