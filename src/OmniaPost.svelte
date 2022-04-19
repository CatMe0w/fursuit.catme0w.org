<script lang="ts">
  export let page: number;
  export let time: string | null;
  export let threadId: number;

  import OmniaPagination from "./OmniaPagination.svelte";

  const currentUrl = new URL(location.href);

  const getPosts = async () => {
    let url = "https://catme0w.org/ex_nihilo_vault/post/" + threadId + "/" + page;
    let params = new URLSearchParams();
    if (time) params.set("time_machine_datetime", time);

    let response = await fetch(url + "?" + params.toString());
    if (!response.ok) throw response.status;
    let json = await response.json();
    if (json.admin_logs.length !== 0 && json.posts.length === 0) throw 410;

    document.title = json.title;
    document.getElementById("loading-overflow-padding").remove();

    return json;
  };

  const getUserUrlById = (userId: string) => {
    const newParams = new URLSearchParams();
    if (time) newParams.set("time", time);
    newParams.set("u", "user_id");
    newParams.set("c", userId);
    return new URL(currentUrl.origin + currentUrl.pathname + "?" + newParams.toString()).toString();
  };

  const renderTail = (tail: string | null) => {
    if (tail) {
      return tail + "  ";
    } else {
      return "";
    }
  };

  const isControversial = (datetime: string) => {
    let isControversial = false;
    let year = parseInt(datetime.substring(0, 4));
    let month = parseInt(datetime.substring(5, 7));
    if ((year === 2017 && month >= 7 && month <= 12) || (year === 2018 && month >= 1 && month <= 7)) isControversial = true;
    return isControversial;
  };

  const getEmoticonUrl = (emoticonId: string) => {
    if (emoticonId === "image_emoticon") emoticonId = "image_emoticon1";
    if (emoticonId.startsWith("image_emoticon")) return "https://tb2.bdstatic.com/tb/editor/images/client/image_emoticon" + emoticonId.slice(14) + ".png";
    if (emoticonId.startsWith("i_f")) return "https://img.baidu.com/hi/face/i_f" + emoticonId.slice(3) + ".gif";
    if (emoticonId.startsWith("t_00")) return "https://tb2.bdstatic.com/tb/editor/images/tsj/t_00" + emoticonId.slice(4) + ".gif";
    if (emoticonId.startsWith("w_00")) return "https://tb2.bdstatic.com/tb/editor/images/ldw/w_00" + emoticonId.slice(4) + ".gif";
    if (emoticonId.startsWith("ali_0")) return "https://tb2.bdstatic.com/tb/editor/images/ali/ali_0" + emoticonId.slice(5) + ".gif";
    if (emoticonId.startsWith("yz_0")) return "https://tb2.bdstatic.com/tb/editor/images/shadow/yz_0" + emoticonId.slice(4) + ".gif";
    if (emoticonId.startsWith("bearchildren_")) return "https://tb2.bdstatic.com/tb/editor/images/bearchildren/bearchildren_" + emoticonId.slice(13) + ".gif";
    if (emoticonId.startsWith("B_00")) return "https://tb2.bdstatic.com/tb/editor/images/bobo/B_00" + emoticonId.slice(4) + ".gif";
    if (emoticonId.startsWith("b")) return "https://tb2.bdstatic.com/tb/editor/images/qpx_n/b" + emoticonId.slice(1) + ".gif";
    return "";
  };

  const getScaledImageUrl = (originalUrl: string) => {
    let filename = originalUrl.split("/").slice(-1)[0];
    if (filename.length <= 24) return originalUrl; // ignore image type emoticons
    return "https://imgsrc.baidu.com/forum/w%3D580/sign=1/" + filename;
  };
</script>

<div class="bg-gray-50 lg:mx-1 my-2">
  <div class="shadow lg:rounded bg-white">
    {#await getPosts()}
      <p class="p-5">刷刷刷……</p>
    {:then json}
      <div class="grid grid-cols-1">
        {#if isControversial(json.posts[0].time)}
          <div class="px-6 py-8 border-b-2 border-gray-100">
            <h1 class="text-3xl mb-4">可能存在争议内容</h1>
            <p>当前查看的帖子发布于爆吧时段。</p>
            <p>该帖子及帖子内的回复可能包含争议性内容，或者由脚本/自动化程序/机器人等发出，请仔细甄别。</p>
          </div>
        {/if}
        <div class="p-5 border-b-2 border-gray-100 flex flex-row justify-between items-baseline">
          <p>{json.title}</p>
          <div class="hidden lg:block">
            <OmniaPagination {page} lastPage={json.max_page} />
          </div>
        </div>
        {#each json.posts as post, i}
          <div class="p-5 border-b border-gray-100">
            <div class="lg:flex flex-row">
              <div class="basis-24 shrink-0 mr-7 mb-3 flex flex-row lg:flex-col gap-3 items-center">
                <a href={getUserUrlById(json.users[i].user_id)} title={"用户名：" + json.users[i].username}>
                  <img
                    class="border-2 lg:border-4 border-gray-100 rounded-md w-10 h-10 lg:w-24 lg:h-24"
                    loading="lazy"
                    src={"https://himg.bdimg.com/sys/portrait/item/" + json.users[i].avatar}
                    alt={json.users[i].nickname}
                  />
                </a>
                <a
                  href={getUserUrlById(json.users[i].user_id)}
                  title={"用户名：" + json.users[i].username}
                  class="text-sky-700 hover:underline text-sm lg:text-xs text-center break-all inline"
                >
                  {json.users[i].nickname}
                </a>
              </div>
              <div class="grow mt-1 whitespace-pre-line lg:text-sm lg:leading-6">
                {#each post.content as item}
                  {#if item.type === "text"}
                    <span>{item.content}</span>
                  {:else if item.type === "text_bold"}
                    <span class="font-bold">{item.content}</span>
                  {:else if item.type === "text_red"}
                    <span class="text-red-600">{item.content}</span>
                  {:else if item.type === "text_bold_red"}
                    <span class="font-bold text-red-600">{item.content}</span>
                  {:else if item.type === "emoticon"}
                    <img class="inline" loading="lazy" src={getEmoticonUrl(item.content.id)} alt={item.content.description} />
                  {:else if item.type === "username"}
                    <a href={getUserUrlById(item.content.user_id)} class="text-sky-700 hover:underline">{item.content.text}</a>
                  {:else if item.type === "url"}
                    <a href={item.content.url} rel="noreferrer" class="text-sky-700 hover:underline break-all">{item.content.text}</a>
                  {:else if item.type === "image"}
                    <a href={item.content}>
                      <img class="w-auto lg:max-w-xl my-2 inline" loading="lazy" src={getScaledImageUrl(item.content)} alt={item.content} />
                    </a>
                  {:else if item.type === "video"}
                    <!-- XXX -->
                    <div class="bg-gray-100 rounded p-5">
                      <p class="text-xl mb-1">视频链接</p>
                      <a href={item.content} class="text-sky-700 hover:underline break-all">{item.content}</a>
                    </div>
                    <!-- {:else if item.type === "audio"} -->
                    <!-- TODO -->
                  {/if}
                {/each}
              </div>
            </div>
            <p class="text-xs text-right -mb-1 mt-12 text-gray-500 whitespace-pre">
              {renderTail(post.tail) + post.floor + "楼  " + post.time}
            </p>
            {#if post.comment_num}
              <div class="grid grid-cols-1 gap-6 p-5 mt-3 lg:ml-[7.75rem] rounded bg-gray-50">
                {#each json.comments[i] as comment, j}
                  <div class="text-sm">
                    <div class="flex flex-row gap-2">
                      <a class="basis-9 shrink-0" href={getUserUrlById(comment.user_id)}>
                        <img
                          class="border-2 border-gray-100 rounded-md w-9 h-9 mr-1 inline"
                          loading="lazy"
                          src={"https://himg.bdimg.com/sys/portrait/item/" + json.comment_users[i][j].avatar}
                          alt={json.comment_users[i][j].nickname}
                          title={"用户名：" + json.comment_users[i][j].username}
                        />
                      </a>
                      <div class="grow">
                        <a
                          class="text-sky-700 hover:underline text-xs"
                          href={getUserUrlById(comment.user_id)}
                          title={"用户名：" + json.comment_users[i][j].username}
                        >
                          {json.comment_users[i][j].nickname}:
                        </a>
                        {#each comment.content as item}
                          {#if item.type === "text"}
                            <span>{item.content}</span>
                          {:else if item.type === "emoticon"}
                            <img class="inline w-5 h-5" loading="lazy" src={getEmoticonUrl(item.content.id)} alt={item.content.description} />
                          {:else if item.type === "username"}
                            <a href={getUserUrlById(item.content.user_id)} class="text-sky-700 hover:underline">{item.content.text}</a>
                          {:else if item.type === "url"}
                            <a href={item.content.url} rel="noreferrer" class="text-sky-700 hover:underline break-all">{item.content.text}</a>
                          {/if}
                        {/each}
                        <p class="text-xs text-right mt-2 -mb-1 text-gray-500">{post.time}</p>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
        <div class="flex p-5 justify-end">
          <OmniaPagination {page} lastPage={json.max_page} />
        </div>
      </div>
    {:catch err}
      <div class="px-6 py-8">
        {#if err === 404 && time}
          <h1 class="text-3xl mb-4">没有这个帖子</h1>
          <p>可能在你选定的时间内尚不存在，或已被删除。</p>
          <p>可尝试切换到档案馆。</p>
        {:else if err === 404 && !time}
          <h1 class="text-3xl mb-4">没有这个帖子</h1>
          <p>如果你确信这个帖子曾存在过，或许可以去 Internet Archive 碰碰运气，他们也许保存过这个帖子。</p>
        {:else if err === 410}
          <h1 class="text-3xl mb-4">找到吧务操作记录，但没有找到帖子</h1>
          <p>这代表这个帖子被百度删除，或被发帖者自行删除。</p>
          <p>这类帖子无法保存。或许可以去 Internet Archive 碰碰运气，也许他们保存过这个帖子。</p>
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
