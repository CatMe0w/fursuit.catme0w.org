<script lang="ts">
  let scope = $state<'archive' | 'thread' | 'user'>('archive');
  let resourceId = $state<string | null>(null);
  let page = $state(1);

  let archiveUrl = $state("/archive");
  let tiebaUrl = $state("https://tieba.baidu.com/f?kw=fursuit");
  let tiebaText = $state("百度贴吧");
  let internetArchiveUrl = $state("https://web.archive.org/web/*/https://tieba.baidu.com/f?kw=fursuit");
  let internetArchiveText = $state("Internet Archive存档");

  $effect(() => {
    const placeholder = document.getElementById('tm-sidebar-links-placeholder');
    if (placeholder) placeholder.remove();

    updateLinks();

    // 拦截搜索form以加入参数
    const searchForm = document.querySelector("form[action='/search']");
    if (searchForm) {
      searchForm.addEventListener("submit", handleSearchSubmit);
    }

    return () => {
      if (searchForm) {
        searchForm.removeEventListener("submit", handleSearchSubmit);
      }
    };
  });

  function handleSearchSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const q = formData.get("q");

    if (q) {
      const params = new URLSearchParams(window.location.search);
      let time = params.get("time");
      if (!time) {
         const stored = localStorage.getItem("presentTime");
         time = stored || "20160727-000000";
      }

      const url = new URL("/search", window.location.origin);
      url.searchParams.set("q", q.toString());
      url.searchParams.set("time", time);

      if (scope === "user" && resourceId) {
           url.searchParams.set("scope", "user");
           url.searchParams.set("user_id", resourceId);
      } else {
           url.searchParams.set("scope", "global");
      }

      window.location.href = url.toString();
    }
  }

  function updateLinks() {
    const params = new URLSearchParams(window.location.search);
    const threadId = params.get("thread");
    const userId = params.get("user");
    const pageParam = params.get("page");

    if (threadId) {
      scope = "thread";
      resourceId = threadId;
    } else if (userId) {
      scope = "user";
      resourceId = userId;
    } else {
      scope = "archive";
      resourceId = null;
    }
    page = parseInt(pageParam || "1");

    // 更新“切换到档案馆”按钮
    if (scope === "thread" && resourceId) {
      archiveUrl = `/thread/${resourceId}`;
    } else if (scope === "user" && resourceId) {
      archiveUrl = `/user/${resourceId}`;
    } else {
      archiveUrl = "/archive";
    }

    // 更新外部链接按钮
    if (scope === "thread" && resourceId) {
      tiebaText = "原帖（百度贴吧）";
      tiebaUrl = `https://tieba.baidu.com/p/${resourceId}`;
      internetArchiveText = "原帖（网页存档）";
      internetArchiveUrl = `https://web.archive.org/web/*/https://tieba.baidu.com/p/${resourceId}`;
    } else if (scope === "user" && resourceId) {
      tiebaText = "用户页（百度贴吧）";
      tiebaUrl = `https://tieba.baidu.com/home/main?id=${resourceId}`;
      internetArchiveText = "用户页（网页存档）";
      internetArchiveUrl = `https://web.archive.org/web/*/https://tieba.baidu.com/home/main?id=${resourceId}`;
    } else {
      tiebaText = "百度贴吧";
      tiebaUrl = "https://tieba.baidu.com/f?kw=fursuit";
      internetArchiveText = "Internet Archive存档";
      internetArchiveUrl = "https://web.archive.org/web/*/https://tieba.baidu.com/f?kw=fursuit";
    }
  }
</script>

<a href={archiveUrl} class="bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white px-4 py-1.5 transition-colors rounded block text-center">切换到档案馆</a>
<a href="/moderation-logs/post" class="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 px-4 py-1.5 transition-colors rounded block">吧务后台日志</a>
<div class="border-2 border-b border-gray-100 my-1"></div>
<a href={tiebaUrl} target="_blank" rel="noreferrer nofollow noopener" class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 transition-colors rounded block text-center">{tiebaText}</a>
<a href={internetArchiveUrl} target="_blank" rel="noreferrer nofollow noopener" class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 transition-colors rounded block text-center">{internetArchiveText}</a>
