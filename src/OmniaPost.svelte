<script lang="ts">
  export let page: number;
  export let time: string | null;
  export let threadId: number;

  const currentUrl = new URL(location.href);

  const getPosts = async () => {
    let url =
      "https://catme0w.org/ex_nihilo_vault/post/" + threadId + "/" + page;
    let params = new URLSearchParams();
    if (time) params.set("time_machine_datetime", time);
    let response = await fetch(url + "?" + params.toString());
    let json = await response.json();
    return json;
  };

  const getUserUrlById = (userId: string) => {
    const newParams = new URLSearchParams();
    if (time) newParams.set("time", time);
    newParams.set("u", "user_id");
    newParams.set("c", userId);
    return new URL(
      currentUrl.origin + currentUrl.pathname + "?" + newParams.toString()
    ).toString();
  };

  const renderTail = (tail: string | null) => {
    if (tail) {
      return tail + "  ";
    } else {
      return "";
    }
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
                <a
                  href={getUserUrlById(json.users[i].user_id)}
                  title={"用户名：" + json.users[i].username}
                >
                  <img
                    class="border-4 border-gray-100 rounded-md"
                    src={"https://himg.bdimg.com/sys/portrait/item/" +
                      json.users[i].avatar}
                    alt={json.users[i].nickname}
                  />
                  <p class="text-sky-700 text-sm mt-3 text-center break-all">
                    {json.users[i].nickname}
                  </p>
                </a>
              </div>
              <div
                class="grow mt-1 text-sm whitespace-pre-line"
                style="line-height: 1.5rem;"
              >
                {#each post.content as item}
                  {#if item.type === "text"}
                    <span>{item.content}</span>
                  {:else if item.type === "text_bold"}
                    <span class="font-bold">{item.content}</span>
                  {:else if item.type === "text_red"}
                    <span class="text-red-600">
                      {item.content}
                    </span>
                  {:else if item.type === "text_bold_red"}
                    <span class="font-bold text-red-600">
                      {item.content}
                    </span>
                  {:else if item.type === "emoticon"}
                    <img
                      src={"https://tb2.bdstatic.com/tb/editor/images/client/" +
                        item.content.id +
                        ".png"}
                      alt={item.content.description}
                    />
                  {:else if item.type === "username"}
                    <a
                      href={getUserUrlById(item.content.user_id)}
                      class="text-sky-700 hover:text-sky-900"
                    >
                      {item.content.text}
                    </a>
                  {:else if item.type === "url"}
                    <a
                      href={item.content.url}
                      class="text-sky-700 hover:text-sky-900 break-all"
                    >
                      {item.content.text}
                    </a>
                  {:else if item.type === "image"}
                    <a href={item.content}>
                      <img
                        class="w-auto max-w-xl my-3"
                        src={item.content}
                        alt={item.content}
                      />
                    </a>
                  {:else if item.type === "video"} <!-- XXX -->
                    <a
                      href={item.content}
                      class="text-sky-700 hover:text-sky-900 break-all"
                    >
                      {"视频：" + item.content}
                    </a>
                  <!-- {:else if item.type === "audio"} -->
                    <!-- TODO -->
                  {/if}
                {/each}
              </div>
            </div>
            <p
              class="text-xs float-right -mb-1.5 mt-2.5 text-gray-500 whitespace-pre"
            >
              {renderTail(post.tail) + post.floor + "楼  " + post.time}
            </p>
          </div>
        {/each}
      </div>
    {/await}
  </div>
</div>
