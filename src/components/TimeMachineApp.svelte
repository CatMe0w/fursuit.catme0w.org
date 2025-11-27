<script lang="ts">
  import { tick } from "svelte";
  import { clientDb } from "../lib/clientDb";
  import { parseCompactTime, isValidCompactTime } from "../lib/time-utils";
  import ThreadListItem from "./ThreadListItem.svelte";
  import ThreadPost from "./ThreadPost.svelte";
  import UserHeader from "./UserHeader.svelte";
  import Pagination from "./Pagination.svelte";
  import UserRecordItem from "./UserRecordItem.svelte";
  import VandalWarning from "./VandalWarning.svelte";
  import type { Thread, ThreadPost as ThreadPostType, SearchResult, UserInfo, ModerationLog, VideoMetadata } from "../lib/types";
  import { isVandal } from "../lib/content-utils";

  // 状态
  let loading = $state(true);
  let error = $state<string | null>(null);
  let scope = $state<"archive" | "thread" | "user">("archive");
  let time = $state("20160727-000000");
  let page = $state(1);
  let resourceId = $state<string | null>(null);
  let standardTime = $state("");

  // 数据
  let threads = $state<Thread[]>([]);
  let threadPosts = $state<ThreadPostType[]>([]);
  let moderationLogs = $state<ModerationLog[]>([]);
  let userResults = $state<SearchResult[]>([]);
  let userInfo = $state<UserInfo | null>(null);
  let threadTitle = $state("");
  let totalCount = $state(0);
  let showSkeleton = $state(false);
  let videoMetadata = $state<Record<string, VideoMetadata>>({});

  const ITEMS_PER_PAGE = 30;

  $effect(() => {
    setTimeout(() => {
      if (loading) {
        showSkeleton = true;
        const placeholder = document.getElementById("tm-placeholder");
        if (placeholder) placeholder.style.display = "none";
      }
    }, 300);
    init();
  });

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const threadIdParam = params.get("thread");
    const userIdParam = params.get("user");
    let timeParam = params.get("time");
    const pageParam = params.get("page");

    // 时间参数处理逻辑
    if (!timeParam || !isValidCompactTime(timeParam)) {
      const presentTime = localStorage.getItem("presentTime");
      const lastTimeDeparted = localStorage.getItem("lastTimeDeparted");

      if (presentTime && isValidCompactTime(presentTime)) {
        timeParam = presentTime;
      } else if (lastTimeDeparted && isValidCompactTime(lastTimeDeparted)) {
        timeParam = lastTimeDeparted;
      } else {
        timeParam = "20160727-000000";
      }

      // 更新URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("time", timeParam);
      if (!pageParam) newUrl.searchParams.set("page", "1");
      history.replaceState(null, "", newUrl.toString());
    }

    if (timeParam && isValidCompactTime(timeParam)) {
      localStorage.setItem("presentTime", timeParam);
    }

    // 更新状态
    time = timeParam || "20160727-000000";
    standardTime = parseCompactTime(time);
    page = parseInt(pageParam || "1");

    if (threadIdParam) {
      scope = "thread";
      resourceId = threadIdParam;
    } else if (userIdParam) {
      scope = "user";
      resourceId = userIdParam;
    } else {
      scope = "archive";
      resourceId = null;
    }

    try {
      await loadData();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      updateTitle();
    } finally {
      loading = false;
      // 加载完成后移除白屏/骨架屏占位符
      const placeholder = document.getElementById("tm-placeholder");
      if (placeholder) placeholder.remove();

      // 等待DOM更新
      await tick();

      // 数据加载完成后，销毁Worker以释放内存
      // SharedWorker会忽略此调用，普通Worker会被销毁
      clientDb.destroy();

      // 滚动到锚点（如果有）
      // 同ThreadView
      const hash = window.location.hash;
      if (hash) {
        const id = hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView();

          const container = document.querySelector(".shadow");
          if (container) {
            const observer = new ResizeObserver(() => {
              element.scrollIntoView();
            });
            observer.observe(container);

            const stop = () => {
              observer.disconnect();
              window.removeEventListener("wheel", stop);
              window.removeEventListener("touchmove", stop);
              window.removeEventListener("keydown", stop);
            };

            window.addEventListener("wheel", stop);
            window.addEventListener("touchmove", stop);
            window.addEventListener("keydown", stop);

            setTimeout(stop, 3000);
          }
        }
      }
    }
  }

  async function loadData() {
    const offset = (page - 1) * ITEMS_PER_PAGE;

    if (scope === "archive") {
      const result = await clientDb.getThreadsAtTime(standardTime, undefined, ITEMS_PER_PAGE, offset);
      threads = result.threads;
      totalCount = result.totalCount;
    } else if (scope === "user") {
      const uid = parseInt(resourceId!);
      const [result, user] = await Promise.all([clientDb.getUserPostsAtTime(uid, standardTime, ITEMS_PER_PAGE, offset), clientDb.getUserById(uid)]);
      userResults = result.items;
      totalCount = result.totalCount;
      userInfo = user;
    } else if (scope === "thread") {
      const tid = parseInt(resourceId!);
      const result = await clientDb.getThreadPostsAtTime(tid, standardTime, ITEMS_PER_PAGE, offset);
      threadPosts = result.posts;
      totalCount = result.totalCount;
      threadTitle = result.threadTitle;
      moderationLogs = result.moderation_logs;
      videoMetadata = result.video_metadata;
    }

    updateTitle();
  }

  function updateTitle() {
    const baseSuffix = "时间机器 - fursuit吧·档案馆与时间机器：为了无法忘却的往事";

    if (scope === "thread" && threadTitle) {
      document.title = `${threadTitle} - ${baseSuffix}`;
    } else if (scope === "user" && userInfo) {
      const userName = userInfo.nickname || userInfo.username || "";
      document.title = `${userName} - ${baseSuffix}`;
    } else {
      document.title = baseSuffix;
    }
  }

  function getBaseUrl() {
    let url = `/time-machine?time=${time}`;
    if (scope === "thread") url += `&thread=${resourceId}`;
    if (scope === "user") url += `&user=${resourceId}`;
    return url;
  }
</script>

{#if !loading || showSkeleton}
  <div class="bg-gray-50 lg:mx-1 my-2">
    <div class="shadow lg:rounded bg-white">
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
          加载失败：{error}
        </div>
      {:else}
        <!-- Archive View -->
        {#if scope === "archive"}
          {#if threads.length === 0}
            <div class="p-5 text-center text-gray-600">
              <p class="text-lg mb-2">在这个时刻没有任何帖子</p>
              <p class="text-sm">请尝试前往更晚的时间点。</p>
            </div>
          {:else}
            {#if page !== 1}
              <div class="p-5 border-b border-gray-100 flex justify-end">
                <Pagination currentPage={page} totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)} baseUrl={getBaseUrl()} />
              </div>
            {/if}
            <div class="grid grid-cols-1">
              {#each threads as thread (thread.id)}
                <ThreadListItem {thread} {time} />
              {/each}
            </div>
            <div class="p-5 flex justify-end">
              <Pagination currentPage={page} totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)} baseUrl={getBaseUrl()} />
            </div>
          {/if}

        <!-- Thread View -->
        {:else if scope === "thread"}
          {#if threadPosts.length === 0}
            <div class="p-5 text-center text-gray-600">
              <p class="text-lg mb-2">在这个时刻，该帖子尚未发布或已被删除</p>
              <p class="text-sm">请尝试前往更晚的时间点。</p>
            </div>
          {:else}
            <div class="grid grid-cols-1">
              <div class="p-5 border-b-2 border-gray-100 flex flex-row justify-between items-baseline">
                <p class="truncate">{threadTitle}</p>
                <div class="hidden lg:block">
                  <Pagination currentPage={page} totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)} baseUrl={getBaseUrl()} />
                </div>
              </div>
              {#if isVandal(threadPosts[0].user_id)}
                <VandalWarning userId={threadPosts[0].user_id} />
              {/if}
              {#each threadPosts as post (post.id)}
                <ThreadPost {post} {time} {moderationLogs} {videoMetadata} />
              {/each}
              <div class="p-5 flex justify-end">
                <Pagination currentPage={page} totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)} baseUrl={getBaseUrl()} />
              </div>
            </div>
          {/if}

        <!-- User View -->
        {:else if scope === "user"}
          {#if userInfo}
            <UserHeader user={userInfo} currentPage={page} totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)} baseUrl={getBaseUrl()} />
            <VandalWarning userId={userInfo.id} />
          {/if}

          {#if userResults.length === 0}
            <div class="p-5 text-center text-gray-600">
              <p class="text-lg mb-2">在这个时刻，该用户没有任何记录</p>
              <p class="text-sm">请尝试前往更晚的时间点。</p>
            </div>
          {:else}
            <div class="grid grid-cols-1">
              {#each userResults as item}
                <UserRecordItem {item} {time} />
              {/each}
            </div>
            <div class="p-5 flex justify-end">
              <Pagination currentPage={page} totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)} baseUrl={getBaseUrl()} />
            </div>
          {/if}
        {/if}
      {/if}
    </div>
  </div>
{/if}
