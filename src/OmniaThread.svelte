<script lang="ts">
  export let page: number;
  export let time: string | null;
  export let searchKeyword: string | null;

  const currentUrl = new URL(location.href);

  const getThreads = async () => {
    let url = "https://catme0w.org/ex_nihilo_vault/thread/" + page;
    let params = new URLSearchParams();
    if (time) params.set("time_machine_datetime", time);
    if (searchKeyword) params.set("search_keyword", searchKeyword);

    let response = await fetch(url + "?" + params.toString());
    if (!response.ok) throw response.status;
    let json = await response.json();

    if (time) document.title = "时间机器";
    else document.title = "档案馆";
    document.getElementById("loading-overflow-padding").remove();

    return json;
  };

  const renderOpPost = (json: any[]) => {
    let opPost = "";
    json.forEach((item) => {
      if (item.type === "text") {
        opPost += item.content;
        opPost += " ";
      }
    });
    return opPost;
  };

  const hasImage = (json: any[]) => {
    let hasImage = false;
    json.forEach((item) => {
      if (item.type === "image") {
        hasImage = true;
      }
    });
    return hasImage;
  };

  const truncateOpImages = (json: any[]) => {
    let opImages: string[] = [];
    json.forEach((item) => {
      if (item.type === "image") {
        opImages.push(item.content);
      }
    });
    return opImages.slice(0, 3);
  };

  const getImageThumbnailUrl = (url: string) => {
    let filename = url.split("/").slice(-1)[0];
    if (filename.length <= 24) return url; // ignore image type emoticons
    return "https://imgsrc.baidu.com/forum/wh%3D256%2C128%3B/sign=396d3d17a5fe9925cb596152049872e6/" + filename;
  };

  const getThreadUrl = (threadId: string) => {
    const newParams = new URLSearchParams();
    if (time) newParams.set("time", time);
    newParams.set("t", threadId);
    return new URL(currentUrl.origin + currentUrl.pathname + "?" + newParams.toString()).toString();
  };

  const getUserUrlById = (userId: string) => {
    const newParams = new URLSearchParams();
    if (time) newParams.set("time", time);
    newParams.set("u", "user_id");
    newParams.set("c", userId);
    return new URL(currentUrl.origin + currentUrl.pathname + "?" + newParams.toString()).toString();
  };

  // todo: pagnation, inner header, video preview, is_good tags, dark mode, responsive
</script>

<div class="bg-gray-50 lg:mx-1 my-2">
  <div class="shadow lg:rounded bg-white">
    {#await getThreads()}
      <p class="p-5">刷刷刷……</p>
    {:then json}
      <div class="grid grid-cols-1">
        {#each json.threads as thread, i}
          <div class="p-5 border-b border-gray-100">
            <div class="flex flex-row flex-wrap lg:justify-end">
              <div class="mr-4 basis-14 shrink-0 order-1 lg:order-none">
                <p class="px-2 py-1.5 bg-gray-100 rounded text-sm text-center">
                  {thread.reply_num}
                </p>
              </div>
              <div class="truncate basis-full lg:basis-3/4 grow mb-5">
                <a href={getThreadUrl(thread.thread_id)} class="text-sky-700 hover:text-sky-900">
                  {thread.title}
                </a>
                <p class="text-sm mt-2 truncate text-gray-700">
                  <a href={getThreadUrl(thread.thread_id)}> {renderOpPost(thread.op_post_content)}</a>
                </p>
                {#if hasImage(thread.op_post_content)}
                  <div class="mt-4 flex flex-row flex-nowrap justify-start gap-4">
                    {#each truncateOpImages(thread.op_post_content) as image}
                      <a href={getThreadUrl(thread.thread_id)}>
                        <img class="h-32 rounded" loading="lazy" src={getImageThumbnailUrl(image)} alt={thread.title} />
                      </a>
                    {/each}
                  </div>
                {/if}
              </div>
              <div
                class="text-xs lg:-mb-1.5 truncate text-gray-500 flex flex-row justify-end gap-2 lg:gap-4
               grow items-center order-2 lg:order-none basis-px lg:basis-auto"
              >
                <p class="truncate" title={"帖子作者：" + json.op_users[i].nickname}>
                  <span class="grayscale">👤 </span>
                  <a href={getUserUrlById(json.op_users[i].user_id)}>
                    {json.op_users[i].nickname}
                  </a>
                </p>
                <p class="truncate" title={"最后回复：" + json.last_reply_users[i].nickname}>
                  <span class="grayscale">💬 </span>
                  <a href={getUserUrlById(json.last_reply_users[i].user_id)}>
                    {json.last_reply_users[i].nickname}
                  </a>
                </p>
                <p title="最后回复时间：{thread.time}">
                  <span class="grayscale">🕒 </span>
                  {thread.time.slice(0, -9)}
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
