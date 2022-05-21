<script lang="ts">
  export let page: number;
  export let time: string | null;
  export let userType: string;
  export let userClue: string;

  import { AvatarEndpoint, VaultEndpoint } from "./config";
  import OmniaPagination from "./OmniaPagination.svelte";

  const currentUrl = new URL(location.href);

  const getUser = async () => {
    if (userType !== "user_id" && userType !== "username" && userType !== "nickname" && userType !== "avatar") throw 404;

    let url = VaultEndpoint + "user/" + userType + "/" + userClue + "/" + page;
    let params = new URLSearchParams();
    if (time) params.set("time_machine_datetime", time);

    let response = await fetch(url + "?" + params.toString());
    if (!response.ok) throw response.status;
    let json = await response.json();

    document.title = "用户：" + json.nickname;
    document.getElementById("loading-overflow-padding").remove();

    return json;
  };

  const getThreadUrl = (threadId: string) => {
    const params = new URLSearchParams();
    params.set("t", threadId);
    return new URL(currentUrl.origin + currentUrl.pathname + "?" + params.toString()).toString();
  };

  const renderUserPost = (json: any[]) => {
    let post = "";
    json.forEach((item) => {
      if (item.type === "text") {
        post += item.content;
        post += " ";
      }
      if (item.type === "username") {
        post += item.content.text;
        post += " ";
      }
    });
    return post;
  };
</script>

<div class="bg-gray-50 lg:mx-1 my-2">
  <div class="shadow lg:rounded bg-white">
    {#await getUser()}
      <p class="p-5">刷刷刷……</p>
    {:then json}
      <div class="flex flex-row border-b border-gray-100 p-5">
        <img class="h-[110px] rounded border-4 border-gray-100" alt="" src={AvatarEndpoint + json.avatar} />
        <div class="ml-5 flex flex-col grow">
          <p class="text-2xl mb-2 mt-1">{json.nickname}</p>
          {#if json.username}
            <p class="text-gray-700"><span class="text-gray-500">用户名：</span>{json.username}</p>
          {:else}
            <p class="text-gray-500">（没有用户名）</p>
          {/if}
        </div>
        <div class="hidden lg:block place-self-end">
          <OmniaPagination {page} lastPage={json.max_page} />
        </div>
      </div>
      <div class="grid grid-cols-1">
        {#each json.records as record}
          <div class="p-5 border-b border-gray-100">
            <div class="flex flex-row flex-wrap">
              <div class="truncate w-full">
                <a href={getThreadUrl(record.thread_id)} class="text-sky-700 hover:underline">{record.title}</a>
                {#if record.type === "post"}
                  <p class="text-sm mt-2 text-gray-700 flex flex-col gap-3 items-baseline">
                    <span class="text-gray-800 bg-gray-100 rounded px-2.5 py-1 block">{record.floor} 楼</span>
                    <a class="text-gray-900 truncate" href={getThreadUrl(record.thread_id)}>{renderUserPost(record.post_content)}</a>
                  </p>
                {:else if record.type === "comment"}
                  <p class="text-sm mt-2 mb-2 text-gray-700 flex flex-col lg:flex-row gap-3 items-baseline">
                    <span class="text-gray-800 bg-gray-100 rounded px-2.5 py-1 block">回复 {record.floor} 楼</span>
                    <a class="rounded bg-slate-100 px-2.5 py-1 truncate shrink" href={getThreadUrl(record.thread_id)}>
                      {record.floor} 楼：{renderUserPost(record.post_content)}
                    </a>
                  </p>
                  <a class="text-sm text-gray-900 truncate" href={getThreadUrl(record.thread_id)}>{renderUserPost(record.comment_content)}</a>
                {/if}
                <p class="text-sm lg:text-xs text-gray-500 mt-4">{record.time}</p>
              </div>
            </div>
          </div>
        {/each}
        <div class="flex p-5 justify-end">
          <OmniaPagination {page} lastPage={json.max_page} />
        </div>
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
        {:else}
          <h1 class="text-3xl mb-4">服务器离线</h1>
          <p>别担心，这不是你的问题。</p>
        {/if}
      </div>
    {/await}
  </div>
</div>
