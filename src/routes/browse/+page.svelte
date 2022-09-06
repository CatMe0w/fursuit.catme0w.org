<script lang="ts">
  import { page } from '$app/stores';
  // import OmniaAdminLogs from '$lib/OmniaAdminLogs.svelte';
  // import OmniaControlPanel from '$lib/OmniaControlPanel.svelte';
  // import OmniaPost from '$lib/OmniaPost.svelte';
  // import OmniaThread from '$lib/OmniaThread.svelte';
  // import OmniaUser from '$lib/OmniaUser.svelte';
  const params = $page.url.searchParams;
  const userType = params.get('u');
  const userClue = params.get('c');
  const threadId = parseInt(params.get('t') || '0');
  const searchKeyword = params.get('s') || null;
  const adminLogsType = params.get('a') || null;
  const hideTheShowdown = params.get('h') !== 'false';
  let time = params.get('time') || null;
  let pageNum = parseInt(params.get('p'));
  if (typeof window !== 'undefined') {
    let lastTimeDeparted = localStorage.getItem('lastTimeDeparted');
    if (!lastTimeDeparted) {
      lastTimeDeparted = '2016-07-27 00:00:00';
      localStorage.setItem('lastTimeDeparted', lastTimeDeparted);
    }
    if (time === '0') {
      // time=0 indicates time machine mode and will be immediately replaced with the last time departed
      time = lastTimeDeparted;
    }
    if (!pageNum) pageNum = 1;
  }
</script>

<main class="border-t-2 border-gray-100">
  <div class="flex flex-col lg:flex-row max-w-5xl mx-auto">
    <!--omnia-main-->
    <div id="omnia-main" class="basis-3/4 order-2">
      <!-- {#if adminLogsType}
        <OmniaAdminLogs page={pageNum} {adminLogsType} {hideTheShowdown} />
      {:else if userType}
        <OmniaUser page={pageNum} {time} {userType} {userClue} />
      {:else if threadId}
        <OmniaPost page={pageNum} {time} {threadId} />
      {:else}
        <OmniaThread page={pageNum} {time} {searchKeyword} />
      {/if} -->
    </div>
    <!--omnia-control-panel-->
    <!-- {#if !adminLogsType}
      <div id="omnia-control-panel" class="basis-1/4 order-1 lg:order-3">
        <OmniaControlPanel {time} {threadId} {userType} {searchKeyword} />
      </div>
    {/if} -->
  </div>
  <div id="loading-overflow-padding" class="min-h-screen" />
</main>
<footer class="h-8" />
