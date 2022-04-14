<script lang="ts">
  export let time: string | null;

  let title: string;
  let subtitle: string;

  if (time) {
    title = "时间机器";
    subtitle = "回到过去的每一刻。";
  } else {
    title = "档案馆";
    subtitle = "一切存在过的帖子与回复。";
  }

  const backToThreads = () => {
    const currentUrl = new URL(location.href);
    const currentParams = new URLSearchParams(currentUrl.search);
    const time = currentParams.get("time");
    const newParams = new URLSearchParams();
    if (time) newParams.set("time", time);
    return currentUrl.origin + currentUrl.pathname + "?" + newParams.toString();
  };

  const switchToAdminLogs = () => {
    const currentUrl = new URL(location.href);
    const newParams = new URLSearchParams();
    newParams.set("a", "post");
    return currentUrl.origin + currentUrl.pathname + "?" + newParams.toString();
  };
</script>

<header class="p-6 mt-12">
  <div class="mb-12">
    <h1 class="text-3xl mb-3"><a href={backToThreads()}>{title}</a></h1>
    <p>{subtitle}</p>
  </div>
  <div class="flex flex-row items-baseline gap-2">
    <button on:click={() => history.go(-1)} class="text-sky-700 hover:text-sky-900 grow text-left">返回上一页</button>
    <a href={switchToAdminLogs()} class="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 px-4 py-1.5 rounded">吧务后台日志</a>
  </div>
</header>
