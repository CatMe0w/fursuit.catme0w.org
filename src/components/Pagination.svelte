<script lang="ts">
  interface Props {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
  }

  let { currentPage, totalPages, baseUrl }: Props = $props();

  let selectValue = $derived(currentPage);

  function getPageUrl(page: number): string {
    if (baseUrl.includes("?")) {
      // Query paramm模式（时间机器）
      return page === 1 ? baseUrl : `${baseUrl}&page=${page}`;
    } else {
      // 路径模式（档案馆）
      // 移除末尾斜杠以防多余斜杠
      const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      return page === 1 ? base : `${base}/${page}`;
    }
  }

  function goToPage(page: number) {
    if (page === currentPage) return;
    if (page < 1 || page > totalPages) return;
    if (typeof window !== "undefined") {
      window.location.href = getPageUrl(page);
    }
  }

  function handleSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    const page = Number(target.value);
    if (!Number.isNaN(page)) {
      goToPage(page);
    }
  }
</script>

<div class="flex flex-row flex-nowrap gap-2 items-center text-sm whitespace-nowrap">
  {#if currentPage !== 1}
    <a href={getPageUrl(1)} class="text-sky-700 hover:underline px-1">首页</a>
    <a href={getPageUrl(currentPage - 1)} class="text-sky-700 hover:underline px-1">上一页</a>
  {/if}

  {#if totalPages === 1}
    <span class="px-1">共1页</span>
  {:else}
    <div class="flex items-center gap-1 px-1">
      <select class="border border-gray-200 rounded px-1 py-0.5 bg-white text-sm" aria-label="跳转到指定页" value={selectValue} onchange={handleSelect}>
        {#each Array(totalPages) as _, index (index)}
          <option value={index + 1}>{index + 1}</option>
        {/each}
      </select>
      <span>/</span>
      <span class="font-medium">{totalPages}</span>
    </div>
  {/if}

  {#if currentPage !== totalPages}
    <a href={getPageUrl(currentPage + 1)} class="text-sky-700 hover:underline px-1">下一页</a>
    <a href={getPageUrl(totalPages)} class="text-sky-700 hover:underline px-1">末页</a>
  {/if}
</div>
