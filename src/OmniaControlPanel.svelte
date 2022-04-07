<script lang="ts">
  export let time: string | null;

  if (time) {
    let lastTimeDeparted = localStorage.getItem("lastTimeDeparted");
    localStorage.setItem("lastTimeDeparted", time);
  }

  // todo: bttf style time circuit panel, button to switch between tm and standard, button to view in public archives, search box (tbd)
</script>

<div class="rounded shadow bg-white mx-1 my-2">
  <div class="p-6">
    <h1 class="text-xl mb-4">时间机器</h1>
    <div class="text-center">
      <p class="mt-6 mb-2">上一次前往的时间</p>
      <p class="font-sevenseg text-2xl text-gray-500">2022-02-04<br />09:18:10</p>
      <p class="mt-5 mb-2 pt-5 border-t">当前所在时间</p>
      <p class="font-sevenseg text-2xl text-gray-700">2016-07-08<br />00:42:42</p>
      <p class="mt-5 mb-2 pt-5 border-t">前往下一个时间</p>
      <div class="flex flex-col items-center">
        <input
          id="date"
          type="date"
          value="2011-03-19"
          min="2011-03-19"
          max="2022-02-16"
          class="font-sevenseg text-gray-600 mb-2 text-xl w-full border-2 border-gray-200 rounded text-center"
        />
        <input id="time" type="time" step="1" value="04:42" class="font-sevenseg text-gray-600 text-xl w-full border-2 border-gray-200 rounded text-center" />
        <button class="mt-3 bg-blue-600 text-white font-bold px-8 py-1.5 rounded">发射</button>
      </div>
    </div>
  </div>
</div>
