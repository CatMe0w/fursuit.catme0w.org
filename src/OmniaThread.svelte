<script lang="ts">
  export let page: number;
  export let time: string | null;
  export let searchKeyword: string | null;

  const currentUrl = new URL(location.href);
  const currentParams = new URLSearchParams(currentUrl.search);
  const currentTimeParam = currentParams.get("time");

  const getThreads = async () => {
    let url = "https://catme0w.org/ex_nihilo_vault/thread/" + page;
    let params = new URLSearchParams();
    if (time) params.set("time_machine_datetime", time);
    if (searchKeyword) params.set("search_keyword", searchKeyword);
    let response = await fetch(url + "?" + params.toString());
    let json = await response.json();
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

  const getThreadUrl = (threadId: string) => {
    const newParams = new URLSearchParams();
    if (currentTimeParam) newParams.set("time", currentTimeParam);
    newParams.set("t", threadId);
    return new URL(
      currentUrl.origin + currentUrl.pathname + "?" + newParams.toString()
    ).toString();
  };

  const getUserUrlById = (userId: string) => {
    const newParams = new URLSearchParams();
    if (currentTimeParam) newParams.set("time", currentTimeParam);
    newParams.set("u", "user_id");
    newParams.set("c", userId);
    return new URL(
      currentUrl.origin + currentUrl.pathname + "?" + newParams.toString()
    ).toString();
  };

  // todo: pagnation, inner header, video preview, is_good tags, dark mode, responsive
</script>

<div class="bg-gray-50 mx-1 my-2">
  <div class="shadow rounded bg-white">
    {#await getThreads()}
      <p class="p-5">刷刷刷……</p>
    {:then json}
      <div class="grid grid-cols-1">
        {#each json.threads as thread, i}
          <div class="p-5 border-b border-gray-100">
            <div class="flex flex-row">
              <div class="mr-4 basis-14 shrink-0">
                <p class="px-2 py-1.5 bg-gray-100 rounded text-sm text-center">
                  {thread.reply_num}
                </p>
              </div>
              <div class="truncate grow">
                <a
                  href={getThreadUrl(thread.thread_id)}
                  class="text-sky-700 hover:text-sky-900"
                >
                  {thread.title}
                </a>
                <p class="text-sm mt-2 truncate text-gray-700">
                  {renderOpPost(thread.op_post_content)}
                </p>
                {#if hasImage(thread.op_post_content)}
                  <div
                    class="mt-4 flex flex-row flex-nowrap justify-start gap-4"
                  >
                    {#each truncateOpImages(thread.op_post_content) as image}
                      <a href={getThreadUrl(thread.thread_id)}>
                        <img
                          class="h-32 rounded"
                          src={image}
                          alt={thread.title}
                        />
                      </a>
                    {/each}
                  </div>
                {/if}
              </div>
              <div
                class="justify-self-end basis-28 shrink-0 text-xs pl-3 truncate text-gray-500"
              >
                <p
                  class="mb-1.5 truncate"
                  title={"帖子作者：" + json.op_users[i].nickname}
                >
                  <span class="grayscale">👤 </span>
                  <a href={getUserUrlById(json.op_users[i].user_id)}>
                    {json.op_users[i].nickname}
                  </a>
                </p>
                <p
                  class="mb-1.5 truncate"
                  title={"最后回复：" + json.last_reply_users[i].nickname}
                >
                  <span class="grayscale">💬 </span>
                  <a href={getUserUrlById(json.last_reply_users[i].user_id)}>
                    {json.last_reply_users[i].nickname}
                  </a>
                </p>
                <p title="最后回复时间：{thread.time}">
                  <span class="grayscale">🕒 </span>
                  {thread.time.slice(5, -3)}
                </p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/await}
  </div>
</div>
