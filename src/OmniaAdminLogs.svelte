<script lang="ts">
  export let page: number;
  export let adminLogsType: string;
  export let hideTheShowdown: boolean;

  const currentUrl = new URL(location.href);

  const getAdminLogs = async () => {
    if (adminLogsType !== "post" && adminLogsType !== "user" && adminLogsType !== "bawu") throw 404;

    let url = "https://catme0w.org/ex_nihilo_vault/admin_log/" + adminLogsType + "/" + page;
    const params = new URLSearchParams();
    if (hideTheShowdown) params.set("hide_the_showdown", "true");

    let response = await fetch(url + "?" + params.toString());
    let json = await response.json();

    document.title = "吧务后台日志";
    document.getElementById("loading-overflow-padding").remove();

    return json;
  };

  const getThreadUrl = (threadId: string) => {
    const params = new URLSearchParams();
    params.set("t", threadId);
    return new URL(currentUrl.origin + currentUrl.pathname + "?" + params.toString()).toString();
  };

  const getUserUrlByUsername = (username: string) => {
    const newParams = new URLSearchParams();
    newParams.set("u", "username");
    newParams.set("c", username);
    return new URL(currentUrl.origin + currentUrl.pathname + "?" + newParams.toString()).toString();
  };
</script>

<div class="bg-gray-50 lg:mx-1 my-2">
  <div class="shadow lg:rounded bg-white">
    {#await getAdminLogs()}
      <p class="p-5">刷刷刷……</p>
    {:then json}
      <div class="grid grid-cols-1">
        {#each json as log}
          <div class="p-5 border-b border-gray-100">
            <div class="flex flex-row flex-wrap">
              <div class="truncate basis-full lg:basis-3/4 grow mb-5">
                <a href={getThreadUrl(log.thread_id)} class="text-sky-700 hover:text-sky-900">
                  {log.title}
                </a>
                <p class="text-sm mt-2 truncate text-gray-700">
                  <a href={getThreadUrl(log.thread_id)}>{log.content_preview}</a>
                </p>
                {#if log.media}
                  <div class="mt-4 flex flex-row flex-nowrap justify-start gap-4">
                    {#each log.media.split("\n") as image}
                      <a href={getThreadUrl(log.thread_id)}>
                        <img class="h-32 rounded" loading="lazy" src={image} alt={log.title} />
                      </a>
                    {/each}
                  </div>
                {/if}
              </div>
              <div class="text-xs text-gray-500 leading-6">
                <p class="flex flex-row flex-wrap items-baseline">
                  <span class="mr-2 text-gray-700 bg-gray-200 rounded px-1.5">{log.operation}</span>
                  <span class="mr-3">操作人：<a href={getUserUrlByUsername(log.operator)} class="text-sky-700 hover:text-sky-900">{log.operator}</a></span>
                  <span>操作时间：<span class="text-gray-700">{log.operation_time}</span></span>
                </p>
                <p class="flex flex-row flex-wrap">
                  <span class="mr-3">帖子作者：<a href={getUserUrlByUsername(log.username)} class="text-sky-700 hover:text-sky-900">{log.username}</a></span>
                  <span>发帖时间：<span class="text-gray-700">{log.post_time}</span></span>
                </p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:catch err}
      <div class="px-6 py-8">
        {#if err === 500}
          <h1 class="text-3xl mb-4">服务器故障</h1>
          <p>别担心，这不是你的问题。</p>
        {:else if err === 429}
          <h1 class="text-3xl mb-4">太快了</h1>
          <p>请等几分钟。</p>
          <p>你知道你其实可以直接下载所有数据，而不需要像这样狂暴爬取吗？</p>
        {:else if err.message === "Failed to fetch" || err.message === "Load failed"}
          <h1 class="text-3xl mb-4">服务器离线</h1>
          <p>别担心，这不是你的问题。</p>
        {:else if typeof err === "number"}
          <h1 class="text-3xl mb-4">未知故障</h1>
          HTTP 错误
          <pre class="whitespace-pre-wrap">{err}</pre>
          <p>坏耶</p>
        {:else}
          <h1 class="text-3xl mb-4">未知故障</h1>
          <pre class="whitespace-pre-wrap">{err}</pre>
          <p>坏耶</p>
        {/if}
      </div>
    {/await}
  </div>
</div>
