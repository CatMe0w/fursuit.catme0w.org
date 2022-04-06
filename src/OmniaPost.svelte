<script lang="ts">
  export let page: number;
  export let time: string | null;
  export let threadId: number;

  const currentUrl = new URL(location.href);

  const getPosts = async () => {
    let url = "https://catme0w.org/ex_nihilo_vault/post/" + threadId + "/" + page;
    let params = new URLSearchParams();
    if (time) params.set("time_machine_datetime", time);

    let response = await fetch(url + "?" + params.toString());
    let json = await response.json();

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
</script>

<div class="bg-gray-50 mx-1 my-2">
  <div class="shadow rounded bg-white">
    {#await getPosts()}
      <p class="p-5">刷刷刷……</p>
    {:then json}
      <div class="grid grid-cols-1">
        {#each json.posts as post, i}
          <div class="p-5 border-b border-gray-100">
            <div class="flex flex-row">
              <div class="basis-24 shrink-0 mr-7">
                <a href={getUserUrlById(json.users[i].user_id)} title={"用户名：" + json.users[i].username}>
                  <img
                    class="border-4 border-gray-100 rounded-md"
                    src={"https://himg.bdimg.com/sys/portrait/item/" + json.users[i].avatar}
                    alt={json.users[i].nickname}
                  />
                  <p class="text-sky-700 text-xs mt-3 text-center break-all">
                    {json.users[i].nickname}
                  </p>
                </a>
              </div>
              <div class="grow mt-1 text-sm whitespace-pre-line" style="line-height: 1.5rem;">
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
                    <img class="inline" src={getEmoticonUrl(item.content.id)} alt={item.content.description} />
                  {:else if item.type === "username"}
                    <a href={getUserUrlById(item.content.user_id)} class="text-sky-700 hover:text-sky-900">{item.content.text}</a>
                  {:else if item.type === "url"}
                    <a href={item.content.url} class="text-sky-700 hover:text-sky-900 break-all">{item.content.text}</a>
                  {:else if item.type === "image"}
                    <a href={item.content}>
                      <img class="w-auto max-w-xl my-2 inline" src={item.content} alt={item.content} />
                    </a>
                  {:else if item.type === "video"}
                    <!-- XXX -->
                    <a href={item.content} class="text-sky-700 hover:text-sky-900 break-all">{"视频：" + item.content}</a>
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
              <div class="grid grid-cols-1 gap-6 p-5 mt-5 ml-[7.75rem] rounded bg-gray-50">
                {#each json.comments[i] as comment, j}
                  <div class="text-sm">
                    <div class="flex flex-row gap-2">
                      <a class="basis-9 shrink-0" href={getUserUrlById(comment.user_id)}>
                        <img
                          class="border-2 border-gray-100 rounded-md w-9 h-9 mr-1 inline"
                          src={"https://himg.bdimg.com/sys/portrait/item/" + json.comment_users[i][j].avatar}
                          alt={json.comment_users[i][j].nickname}
                          title={"用户名：" + json.comment_users[i][j].username}
                        />
                      </a>
                      <div class="grow">
                        <a
                          class="text-sky-700 hover:text-sky-900 text-xs"
                          href={getUserUrlById(comment.user_id)}
                          title={"用户名：" + json.comment_users[i][j].username}
                        >
                          {json.comment_users[i][j].nickname}:
                        </a>
                        {#each comment.content as item}
                          {#if item.type === "text"}
                            <span>{item.content}</span>
                          {:else if item.type === "emoticon"}
                            <img class="inline w-5 h-5" src={getEmoticonUrl(item.content.id)} alt={item.content.description} />
                          {:else if item.type === "username"}
                            <a href={getUserUrlById(item.content.user_id)} class="text-sky-700 hover:text-sky-900">{item.content.text}</a>
                          {:else if item.type === "url"}
                            <a href={item.content.url} class="text-sky-700 hover:text-sky-900 break-all">{item.content.text}</a>
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
      </div>
    {:catch err}
      <div class="px-6 py-8">
        <h1 class="text-3xl mb-4">坏耶</h1>
        <pre class="whitespace-pre-wrap">{err}</pre>
      </div>
    {/await}
  </div>
</div>
