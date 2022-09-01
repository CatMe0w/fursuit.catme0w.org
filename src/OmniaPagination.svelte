<script lang="ts">
  import { currentParams, makeNewUrl } from "./util";

  export let page: number;
  export let lastPage: number;

  const getPageUrl = (page: number) => {
    if (page < 1) page = 1;
    if (page > lastPage) page = lastPage;
    currentParams.set("p", page.toString());
    return makeNewUrl(currentParams);
  };
</script>

<div class="flex flex-row gap-1 items-baseline text-sm">
  {#if page !== 1}
    <a href={getPageUrl(1)} class="text-sky-700 hover:underline px-1">首页</a>
    <a href={getPageUrl(page - 1)} class="text-sky-700 hover:underline px-1">上一页</a>
  {/if}
  <p class="px-1">第 {page} 页，共 {lastPage} 页</p>
  {#if page !== lastPage}
    <a href={getPageUrl(page + 1)} class="text-sky-700 hover:underline px-1">下一页</a>
    <a href={getPageUrl(lastPage)} class="text-sky-700 hover:underline px-1">末页</a>
  {/if}
</div>
