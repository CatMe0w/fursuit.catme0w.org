<script lang="ts">
  export let time: string | null;
  export let postId: number;
  export let comments: any[];
  export let commentUsers: any[];
  export let commentMaxPage: number;

  let page = 1;
  let isPendingUpdate = false;

  const currentUrl = new URL(location.href);

  const getUserUrlById = (userId: string) => {
    const newParams = new URLSearchParams();
    if (time) newParams.set("time", time);
    newParams.set("u", "user_id");
    newParams.set("c", userId);
    return new URL(currentUrl.origin + currentUrl.pathname + "?" + newParams.toString()).toString();
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

  const updateComments = async () => {
    isPendingUpdate = true;
    let url = "https://catme0w.org/ex_nihilo_vault/comment/" + postId + "/" + page;
    let params = new URLSearchParams();
    if (time) params.set("time_machine_datetime", time);

    let response = await fetch(url + "?" + params.toString());
    let json = await response.json();

    comments = json.comments;
    commentUsers = json.users;
    isPendingUpdate = false;
  };
</script>

<div class="grid grid-cols-1 gap-6 p-5 mt-3 lg:ml-[7.75rem] rounded bg-gray-50">
  {#each comments as comment, i}
    <div class="text-sm">
      <div class="flex flex-row gap-2">
        <a class="basis-9 shrink-0" href={getUserUrlById(comment.user_id)}>
          <img
            class="border-2 border-gray-100 rounded-md w-9 h-9 mr-1 inline"
            loading="lazy"
            src={"https://himg.bdimg.com/sys/portrait/item/" + commentUsers[i].avatar}
            alt={commentUsers[i].nickname}
            title={"用户名：" + commentUsers[i].username}
          />
        </a>
        <div class="grow">
          <a class="text-sky-700 hover:underline text-xs" href={getUserUrlById(comment.user_id)} title={"用户名：" + commentUsers[i].username}>
            {commentUsers[i].nickname}:
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
          <p class="text-xs text-right mt-2 -mb-1 text-gray-500">{comment.time}</p>
        </div>
      </div>
    </div>
  {/each}
  <div class="flex justify-end text-gray-700">
    <div class={"flex flex-row gap-1 items-baseline text-xs"}>
      {#if page !== 1}
        <button
          on:click={() => {
            page = 1;
            updateComments();
          }}
          class="text-sky-700 hover:underline px-1">首页</button
        >
        <button
          on:click={() => {
            page -= 1;
            updateComments();
          }}
          class="text-sky-700 hover:underline px-1">上一页</button
        >
      {/if}
      <p>
        {#if isPendingUpdate}
          刷刷刷...
        {:else}
          第 {page} 页，共 {commentMaxPage} 页
        {/if}
      </p>
      {#if page !== commentMaxPage}
        <button
          on:click={() => {
            page += 1;
            updateComments();
          }}
          class="text-sky-700 hover:underline px-1">下一页</button
        >
        <button
          on:click={() => {
            page = commentMaxPage;
            updateComments();
          }}
          class="text-sky-700 hover:underline px-1">末页</button
        >
      {/if}
    </div>
  </div>
</div>
