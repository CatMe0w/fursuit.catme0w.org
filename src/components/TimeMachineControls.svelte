<script lang="ts">
  import { parseCompactTimeForInput, formatCompactTimeForDisplay, toCompactTime, isValidCompactTime } from "../lib/time-utils";

  interface Props {
    presentTime?: string;
  }

  let { presentTime = "20160727-000000" }: Props = $props();

  let lastTimeDeparted = $state<string | null>(null);
  let destinationDate = $state("");
  let destinationTime = $state("");
  let supportsShowPicker = $state(false);

  let dateInputRef = $state<HTMLInputElement>();
  let timeInputRef = $state<HTMLInputElement>();

  $effect(() => {
    const placeholder = document.getElementById("tm-controls-placeholder");
    if (placeholder) placeholder.remove();

    // 检测是否支持showPicker，若支持则使用新版精致时间选择器
    const testInput = document.createElement("input");
    testInput.type = "date";
    // 辣鸡苹果，macOS上time没有picker，iOS上两者的showPicker都没有功能
    const isMobileApple = /iPad|iPhone|iPod/.test(navigator.userAgent);
    supportsShowPicker = typeof testInput.showPicker === "function" && !isMobileApple;

    // 读取上一次前往的时间
    const storedTime = localStorage.getItem("lastTimeDeparted");
    if (storedTime && isValidCompactTime(storedTime)) {
      lastTimeDeparted = storedTime;
    } else {
      lastTimeDeparted = "";
    }

    // 获取当前时间
    const params = new URLSearchParams(window.location.search);
    let timeParam = params.get("time");
    if (!timeParam || !isValidCompactTime(timeParam)) {
      const stored = localStorage.getItem("presentTime");
      timeParam = stored || "20160727-000000";
    }
    presentTime = timeParam;

    // 为旧版选择器初始化输入框内容，不然各路浏览器的<input>空白状态长成什么鬼样子都有可能
    if (!supportsShowPicker) {
      try {
        const parsed = parseCompactTimeForInput(presentTime);
        destinationDate = parsed.date;
        destinationTime = parsed.time;
      } catch (e) {
        destinationDate = "";
        destinationTime = "";
      }
      return;
    }
  });

  // 新版选择器：用户选择日期后自动填充时间为00:00:00（擦屁股：Firefox bug 1726107）
  $effect(() => {
    if (supportsShowPicker && destinationDate && !destinationTime) {
      destinationTime = "00:00:00";
    }
  });

  function handleLaunch() {
    if (destinationTime.length === 5) destinationTime += ":00"; // iOS Safari fix

    const destinationDateTime = destinationDate + " " + destinationTime;
    try {
      const destinationCompactTime = toCompactTime(destinationDateTime);

      if (presentTime !== destinationCompactTime) {
        localStorage.setItem("lastTimeDeparted", presentTime);
      }

      // 触发跳转，保留当前的scope (thread/user)
      const params = new URLSearchParams(window.location.search);
      params.set("time", destinationCompactTime);
      params.set("page", "1"); // 切换时间后重置页码

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.location.href = newUrl;
    } catch (e) {
      alert("时间格式不正确");
    }
  }
</script>

<div class="text-center">
  <div>
    <p class="mt-1 mb-2">上一次前往的时间</p>
    <div class="relative inline-block mx-auto">
      <p class="font-sevenseg text-2xl text-gray-100 whitespace-pre-line select-none" aria-hidden="true">{`8888-88-88\n88:88:88`}</p>
      <p class="font-sevenseg text-2xl text-gray-700 whitespace-pre-line absolute inset-0">
        {lastTimeDeparted ? formatCompactTimeForDisplay(lastTimeDeparted) : ""}
      </p>
    </div>
  </div>
  <p class="mt-5 mb-2 pt-5 border-t border-gray-200">当前所在时间</p>
  <div class="relative inline-block mx-auto">
    <p class="font-sevenseg text-2xl text-gray-100 whitespace-pre-line select-none" aria-hidden="true">{`8888-88-88\n88:88:88`}</p>
    <p class="font-sevenseg text-2xl text-gray-900 whitespace-pre-line absolute inset-0">{formatCompactTimeForDisplay(presentTime)}</p>
  </div>
  <p class="mt-5 mb-2 pt-5 border-t border-gray-200">前往下一个时间</p>
  <div class="flex flex-col items-center gap-2">
    {#if supportsShowPicker}
      <!-- 新版时间选择器 -->
      <button
        onclick={() => dateInputRef!.showPicker()}
        type="button"
        class="border-2 border-gray-300 hover:border-gray-400 rounded px-2 py-1 cursor-pointer transition-colors"
      >
        <div class="relative inline-block">
          <p class="font-sevenseg text-2xl text-gray-100 whitespace-pre select-none pointer-events-none" aria-hidden="true">8888-88-88</p>
          <p class="font-sevenseg text-2xl text-gray-700 whitespace-pre absolute inset-0 pointer-events-none">{destinationDate}</p>
        </div>
      </button>
      <input bind:this={dateInputRef} type="date" min="2011-03-19" max="2022-02-16" class="sr-only" bind:value={destinationDate} aria-label="选择日期" />

      <button
        onclick={() => timeInputRef!.showPicker()}
        type="button"
        class="border-2 border-gray-300 hover:border-gray-400 rounded px-2 py-1 cursor-pointer transition-colors"
      >
        <div class="relative inline-block">
          <p class="font-sevenseg text-2xl text-gray-100 whitespace-pre select-none pointer-events-none" aria-hidden="true">88:88:88</p>
          <p class="font-sevenseg text-2xl text-gray-700 whitespace-pre absolute inset-0 pointer-events-none">{destinationTime}</p>
        </div>
      </button>
      <input bind:this={timeInputRef} type="time" step="1" class="sr-only" bind:value={destinationTime} aria-label="选择时间" />
    {:else}
      <!-- 传统的input样式（不支持showPicker的浏览器） -->
      <input
        type="date"
        min="2011-03-19"
        max="2022-02-16"
        class="font-sevenseg text-gray-600 text-xl w-full border-2 border-gray-200 hover:border-gray-300 rounded text-center"
        bind:value={destinationDate}
      />
      <input
        type="time"
        step="1"
        class="font-sevenseg text-gray-600 text-xl w-full border-2 border-gray-200 hover:border-gray-300 rounded text-center"
        bind:value={destinationTime}
      />
    {/if}
    <button
      onclick={handleLaunch}
      class="mt-1 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-bold px-8 py-1.5 rounded transition-colors cursor-pointer">前往</button
    >
  </div>
</div>
