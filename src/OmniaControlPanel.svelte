<script lang="ts">
  export let time: string | null;

  const currentUrl = new URL(location.href);

  // https://stackoverflow.com/a/8876069/10144204
  let showControlPanel = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) >= 1024;
  const togglerEnabled = !showControlPanel;

  let lastTimeDeparted = localStorage.getItem("lastTimeDeparted");

  let targetDate: string | null = null;
  let targetTime: string | null = null;
  if (time) [targetDate, targetTime] = time.split(" ");

  const handleLaunch = () => {
    if (time !== targetDate + " " + targetTime) localStorage.setItem("lastTimeDeparted", time);

    // Fix for Apple IE6 (aka Safari): iOS Safari doesn't allow entering seconds in <input> time picker
    if (targetTime.length === 5) targetTime += ":00";

    let params = new URLSearchParams(currentUrl.search);
    params.set("time", targetDate + " " + targetTime);
    location.href = currentUrl.origin + currentUrl.pathname + "?" + params.toString();
  };

  // todo: button to switch between tm and standard, button to view in public archives, search box (tbd)
</script>

<div class="rounded shadow bg-white mx-2 lg:mx-1 mt-2 mb-0.5">
  <div class="p-6 flex flex-col gap-6">
    {#if showControlPanel}
      {#if time}
        <div>
          <h1 class="text-xl">时间机器</h1>
          <div class="text-center">
            <p class="mt-6 mb-2">上一次前往的时间</p>
            <p class="font-sevenseg text-2xl text-gray-500 whitespace-pre-line">{lastTimeDeparted.replace(" ", "\n")}</p>
            <p class="mt-5 mb-2 pt-5 border-t">当前所在时间</p>
            <p class="font-sevenseg text-2xl text-gray-700 whitespace-pre-line">{time.replace(" ", "\n")}</p>
            <p class="mt-5 mb-2 pt-5 border-t">前往下一个时间</p>
            <div class="flex flex-col items-center">
              <input
                bind:value={targetDate}
                type="date"
                min="2011-03-19"
                max="2022-02-16"
                class="font-sevenseg text-gray-600 mb-2 text-xl w-full border-2 border-gray-200 hover:border-gray-300 rounded text-center"
              />
              <input
                bind:value={targetTime}
                type="time"
                step="1"
                class="font-sevenseg text-gray-600 text-xl w-full border-2 border-gray-200 hover:border-gray-300 rounded text-center"
              />
              <button on:click={handleLaunch} class="mt-3 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-bold px-8 py-1.5 rounded"
                >发射</button
              >
            </div>
          </div>
        </div>
      {/if}
    {/if}
    {#if togglerEnabled}
      <button on:click={() => (showControlPanel = !showControlPanel)} class="w-full">
        <p class="text-center text-lg text-sky-700 hover:text-sky-900">{showControlPanel ? "收起" : "打开"} 控制面板</p>
        {#if time}
          <p class="text-center text-xs text-gray-500">调整时间机器</p>
        {/if}
      </button>
    {/if}
  </div>
</div>
