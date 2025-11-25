<script lang="ts">
  import TimeMachineControls from './TimeMachineControls.svelte';

  let query = $state("");
  let scope = $state<'global' | 'user' | 'moderation'>('global');
  let time = $state<string | null>(null);
  let userId = $state<string | null>(null);
  let defaultTime = $state("20160727-000000");

  $effect(() => {
    const placeholder = document.getElementById('search-sidebar-placeholder');
    if (placeholder) placeholder.remove();

    const params = new URLSearchParams(window.location.search);
    query = params.get("q") || "";
    scope = (params.get("scope") as any) || "global";
    time = params.get("time");
    userId = params.get("user_id");

    const stored = localStorage.getItem("presentTime");
    if (stored) defaultTime = stored;
  });

  function getUrl(newParams: Record<string, string | null>) {
    const url = new URL(window.location.href);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    url.searchParams.delete("page");
    return url.pathname + url.search;
  }

  function getPlaceholder() {
    if (scope === 'user') return "搜索该用户";
    if (scope === 'moderation') return "搜索操作记录";
    return "搜索全吧";
  }
</script>

<div class="flex flex-col gap-2">
  <!-- Search Box -->
  <div class="rounded shadow bg-white mx-2 lg:mx-1">
    <div class="p-6 flex flex-col">
      <form action="/search" method="get">
          {#if time}
            <input type="hidden" name="time" value={time} />
          {/if}
          <input type="hidden" name="scope" value={scope} />
          {#if scope === 'user' && userId}
            <input type="hidden" name="user_id" value={userId} />
          {/if}
          <div class="flex flex-row gap-1.5">
            <input 
              type="search" 
              name="q" 
              bind:value={query}
              placeholder={getPlaceholder()}
              class="flex-1 min-w-0 px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              autocomplete="off"
            />
            <button type="submit" class="bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white px-4 py-1.5 rounded shrink-0 whitespace-nowrap transition-colors cursor-pointer">搜索</button>
          </div>
      </form>
    </div>
  </div>

  <!-- Navigation Links -->
  <div class="rounded shadow bg-white mx-2 lg:mx-1">
    <div class="p-6 flex flex-col gap-5">
      <div class="text-xl">
        搜索其他内容
      </div>
      <div class="text-center flex flex-col gap-3">
        {#if scope !== 'moderation'}
          {#if time}
            <a href={getUrl({ time: null })} class="bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white px-4 py-1.5 rounded block text-center">切换到档案馆</a>
          {:else}
            <a href={getUrl({ time: defaultTime })} class="bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white px-4 py-1.5 rounded block text-center">切换到时间机器</a>
          {/if}
        {/if}

        {#if scope === 'global'}
          <a href={getUrl({ scope: 'moderation' })} class="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 px-4 py-1.5 rounded block text-center">搜索后台日志</a>
        {:else if scope === 'user'}
          <a href={getUrl({ scope: 'global', user_id: null })} class="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 px-4 py-1.5 rounded block text-center">搜索全吧</a>
          <a href={getUrl({ scope: 'moderation', user_id: null })} class="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 px-4 py-1.5 rounded block text-center">搜索后台日志</a>
        {:else if scope === 'moderation'}
          <a href={getUrl({ scope: 'global' })} class="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 px-4 py-1.5 rounded block text-center">搜索全吧</a>
        {/if}
      </div>
    </div>
  </div>

  {#if time && scope !== 'moderation'}
    <div class="rounded shadow bg-white mx-2 lg:mx-1">
      <div class="p-6 flex flex-col gap-5">
        <div class="text-xl">
          时间机器
        </div>
        <TimeMachineControls />
      </div>
    </div>
  {/if}
</div>
