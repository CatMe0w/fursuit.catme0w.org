<script lang="ts">
  import type { User } from "../lib/types";
  import Pagination from "./Pagination.svelte";
  import { getAvatarUrl, getUserDisplayName } from "../lib/content-utils";

  interface Props {
    user: User;
    currentPage?: number;
    totalPages?: number;
    baseUrl?: string;
  }

  let { user, currentPage = undefined, totalPages = undefined, baseUrl = undefined }: Props = $props();

  let showPagination = $derived(currentPage !== undefined && totalPages !== undefined && baseUrl !== undefined && totalPages > 0);
</script>

<div class="flex flex-row border-b border-gray-100 p-5">
  <img class="h-[110px] w-[110px] rounded border-4 border-gray-100 bg-gray-200 object-cover" alt="" src={getAvatarUrl(user.avatar)} />
  <div class="ml-5 flex flex-col grow">
    <p class="text-2xl mb-2 mt-1">{getUserDisplayName(user)}</p>
    {#if user.username}
      <p class="text-gray-700">
        <span class="text-gray-500">用户名：</span><span>{user.username}</span>
      </p>
    {:else}
      <p class="text-gray-500">（没有用户名）</p>
    {/if}
    {#if showPagination}
      <div class="self-end mt-auto">
        <Pagination currentPage={currentPage!} totalPages={totalPages!} baseUrl={baseUrl!} />
      </div>
    {/if}
  </div>
</div>
