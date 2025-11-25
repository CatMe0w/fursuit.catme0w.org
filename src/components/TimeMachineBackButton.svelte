<script lang="ts">
  interface Props {
    variant: 'desktop' | 'mobile-icon' | 'mobile-text';
  }

  let { variant }: Props = $props();

  let isHomePage = $state(false);
  let backToArchive = $state(false);
  let mounted = $state(false);

  $effect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname.replace(/\/$/, "").replace(/\.html$/, "");

    // 将page=1视为默认值（相当于没有page参数）
    if (params.get('page') === '1') {
      params.delete('page');
    }

    const allParams = Array.from(params.keys());

    // 搜索（/search）：如果没有time参数，则不是时间机器模式
    if (pathname === '/search' && !params.has('time')) {
      // 不是时间机器模式，显示“返回吧首页”
      isHomePage = false;
      backToArchive = true;
    } else {
      // 是时间机器模式，但是没有参数，或者只有time参数，显示“返回项目首页”
      isHomePage = allParams.length === 0 || (allParams.length === 1 && allParams[0] === 'time');
      backToArchive = false;
    }

    // 移除占位符
    if (variant === 'desktop') {
      const placeholder = document.getElementById('back-to-home-link');
      if (placeholder) placeholder.remove();
    } else if (variant === 'mobile-icon') {
      const placeholder = document.getElementById('navbar-back-icon');
      if (placeholder) placeholder.remove();
    } else if (variant === 'mobile-text') {
      const placeholder = document.getElementById('navbar-back-text');
      if (placeholder) placeholder.remove();
    }

    mounted = true;
  });
</script>

{#if mounted}
  {#if variant === 'desktop'}
    {#if isHomePage}
      <a href="/" id="back-to-home-link" class="text-sky-700 hover:underline grow text-left my-2 cursor-pointer">
        返回项目首页
      </a>
    {:else}
      <a href={backToArchive ? "/archive" : "/time-machine"} id="back-to-home-link" class="text-sky-700 hover:underline grow text-left my-2 cursor-pointer">
        返回吧首页
      </a>
    {/if}
  {:else if variant === 'mobile-icon'}
    {#if isHomePage}
      <a type="button" href="/" id="navbar-back-icon" class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 cursor-pointer">
        <span class="sr-only">返回项目首页</span>
        <svg class="size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      </a>
    {:else}
      <a type="button" href={backToArchive ? "/archive" : "/time-machine"} id="navbar-back-icon" class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 cursor-pointer">
        <span class="sr-only">返回吧首页</span>
        <svg class="size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      </a>
    {/if}
  {:else if variant === 'mobile-text'}
    {#if isHomePage}
      <a href="/" id="navbar-back-text" class="text-lg text-gray-700">
        返回项目首页
      </a>
    {:else}
      <a href={backToArchive ? "/archive" : "/time-machine"} id="navbar-back-text" class="text-lg text-gray-700">
        返回吧首页
      </a>
    {/if}
  {/if}
{/if}
