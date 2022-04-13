<script lang="ts">
  export let page: number;
  export let time: string | null;
  export let userType: string;
  export let userClue: string;

  const getUser = async () => {
    if (userType !== "user_id" && userType !== "username" && userType !== "nickname" && userType !== "avatar") throw 404;

    let url = "https://catme0w.org/ex_nihilo_vault/user/" + userType + "/" + userClue + "/" + page;
    let params = new URLSearchParams();
    if (time) params.set("time_machine_datetime", time);

    let response = await fetch(url + "?" + params.toString());
    if (!response.ok) throw response.status;
    let json = await response.json();

    document.title = "用户：" + json.nickname;
    document.getElementById("loading-overflow-padding").remove();

    return json;
  };
</script>

<div class="bg-gray-50 mx-1 my-2">
  <div class="shadow rounded bg-white">
    {#await getUser()}
      <p class="p-5">刷刷刷……</p>
    {:then json}
      <div class="grid grid-cols-1">
        {#each json.records as record}
          <div class="p-5 border-b border-gray-100">
            <div class="flex flex-row">
              <!-- TODO -->
            </div>
          </div>
        {/each}
      </div>
    {:catch err}
      <div class="px-6 py-8">
        {#if err === 404 && time}
          <h1 class="text-3xl mb-4">没有记录</h1>
          <p>在所选定的时间内，尚未存在任何帖子。</p>
          <p>可尝试切换到档案馆。</p>
        {:else if err === 404 && !time}
          <h1 class="text-3xl mb-4">没有记录</h1>
          <p>这位用户自行删除了所有过往发言，或已被百度封禁，也可能从未在本吧发言过。</p>
        {:else if err === 429}
          <h1 class="text-3xl mb-4">太快了</h1>
          <p>请等几分钟。</p>
          <p>你知道你其实可以直接下载所有数据，而不需要像这样狂暴爬取吗？</p>
        {:else if err >= 500 || err.message === "Failed to fetch" || err.message === "Load failed"}
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
