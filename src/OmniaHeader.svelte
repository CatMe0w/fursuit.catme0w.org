<script lang="ts">
  import { makeNewUrl, timeParam } from "./util";

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
    const newParams = new URLSearchParams();
    if (timeParam) newParams.set("time", time);
    return makeNewUrl(newParams);
  };

  const switchToAdminLogs = () => {
    const newParams = new URLSearchParams();
    newParams.set("a", "post");
    return makeNewUrl(newParams);
  };
</script>

<header class="p-6 mt-12">
  <div class="mb-12">
    <h1 class="text-3xl mb-3"><a href={backToThreads()} class="hover:text-sky-700">{title}</a></h1>
    <p>{subtitle}</p>
  </div>
  <div class="flex flex-row items-baseline gap-2">
    <button on:click={() => history.go(-1)} class="text-sky-700 hover:underline grow text-left">返回上一页</button>
    <a href={switchToAdminLogs()} class="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 px-4 py-1.5 rounded">吧务后台日志</a>
  </div>
</header>
