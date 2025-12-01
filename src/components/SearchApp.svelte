<script lang="ts">
  import { clientDb } from "../lib/clientDb";
  import { parseCompactTime } from "../lib/time-utils";
  import Pagination from "./Pagination.svelte";
  import UserRecordItem from "./UserRecordItem.svelte";
  import ModerationLogItem from "./ModerationLogItem.svelte";
  import type { SearchResult, SearchOptions } from "../lib/types";

  let loading = $state(true);
  let error = $state<string | null>(null);
  let results = $state<SearchResult[]>([]);
  let totalCount = $state(0);
  let userNickname = $state<string | null>(null);
  let showSkeleton = $state(false);
  const LIMIT = 30;

  // CSR app使用query string，同TimeMachineApp
  const params = new URLSearchParams(window.location.search);
  let query = params.get("q") || "";
  let scope: "global" | "user" | "moderation" = (params.get("scope") as any) || "global";
  let userId = params.get("user_id");
  let time = params.get("time");
  let page = parseInt(params.get("page") || "1", 10);
  let onlyThread = params.get("only_thread") === "true";

  $effect(() => {
    setTimeout(() => {
      if (loading) {
        showSkeleton = true;
        const placeholder = document.getElementById("search-placeholder");
        if (placeholder) placeholder.style.display = "none";
      }
    }, 300);

    if (!query) {
      if (document.referrer && document.referrer !== window.location.href) {
        window.location.href = document.referrer;
      } else {
        window.location.href = "/archive";
      }
      return;
    }

    performSearch();
  });

  async function performSearch() {
    loading = true;
    error = null;
    try {
      await clientDb.ensureReady();

      if (scope === "user" && userId) {
        try {
          const user = await clientDb.getUserById(parseInt(userId));
          if (user) {
            userNickname = user.nickname || user.username;
          }
        } catch (e) {
          console.error("Failed to fetch user info", e);
        }
      }

      const offset = (page - 1) * LIMIT;
      const opts: SearchOptions = {
        scope,
        keyword: query,
        limit: LIMIT,
        offset,
        onlyThread,
      };
      if (userId) opts.userId = parseInt(userId);
      if (time) opts.snapshotTime = parseCompactTime(time);

      const res = await clientDb.search(opts);
      results = res.items;
      totalCount = res.totalCount;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
      const placeholder = document.getElementById("search-placeholder");
      if (placeholder) placeholder.remove();

      // 数据加载完成后，销毁Worker以释放内存
      // SharedWorker会忽略此调用，普通Worker会被销毁
      clientDb.destroy();
    }
  }

  function getBaseUrl() {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (scope) params.set("scope", scope);
    if (userId) params.set("user_id", userId);
    if (time) params.set("time", time);
    if (onlyThread) params.set("only_thread", "true");
    return `/search?${params.toString()}`;
  }

  function getScopeLabel() {
    const labelMap: Record<string, string> = { global: "全吧搜索", user: "用户搜索", moderation: "后台日志搜索" };
    let label = labelMap[scope] || "全吧搜索";
    if (scope === "user" && userNickname) {
      label += `：${userNickname}`;
    }
    return label;
  }
</script>

{#if !loading || showSkeleton}
  <div class="bg-gray-50 lg:mx-1 my-2">
    <div class="shadow lg:rounded bg-white">
      <div class="grid grid-cols-1">
        {#if !loading}
          <div class="p-5 border-b-2 border-gray-100 flex flex-row justify-between items-baseline">
            <div class="flex flex-row items-baseline gap-4 w-full justify-between lg:w-auto lg:justify-start">
              <span class="text-gray-600 truncate">{getScopeLabel()}</span>
              {#if totalCount > 0}
                <span class="text-sm text-gray-500 whitespace-nowrap text-right lg:text-left">共{totalCount}条结果</span>
              {/if}
            </div>
            {#if totalCount > 0}
              <div class="hidden lg:block">
                <Pagination currentPage={page} totalPages={Math.ceil(totalCount / LIMIT)} baseUrl={getBaseUrl()} />
              </div>
            {/if}
          </div>
        {/if}

        {#if loading}
          <div class="p-5 space-y-4 animate-pulse">
            {#each Array(50) as _}
              <div class="border-b border-gray-100 pb-4">
                <div class="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-gray-100 rounded w-1/4"></div>
              </div>
            {/each}
          </div>
        {:else if error}
          <div class="p-5 text-center text-gray-600">
            <p>搜索失败：{error}</p>
          </div>
        {:else if results.length === 0}
          <div class="p-5 text-center text-gray-600 text-lg">
            没有找到匹配的结果
            {#if time}
              <p class="text-sm mt-2">请尝试前往更晚的时间点。</p>
            {/if}
          </div>
        {:else}
          <div class="grid grid-cols-1">
            {#each results as item}
              {#if item.result_type.startsWith("moderation_")}
                <ModerationLogItem {item} />
              {:else}
                <UserRecordItem {item} time={time || undefined} showAuthor={scope !== "user"} />
              {/if}
            {/each}
          </div>
          <div class="p-5 flex justify-end">
            <Pagination currentPage={page} totalPages={Math.ceil(totalCount / LIMIT)} baseUrl={getBaseUrl()} forceFullWidth={true} />
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
