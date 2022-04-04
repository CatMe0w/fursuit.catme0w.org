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
    <h1 class="text-xl mb-6">时间机器（施工中）</h1>
    <p>
      乱数假文，英文又称“Lorem
      ipsum”，是指一篇常用于排版设计领域的拉丁文文章，主要的目的为测试文章或文字在不同字型、版型下看起来的效果，通常网站还没建设好时会出现这段文字。Lorem
      ipsum从15世纪开始就被广泛地使用在西方的印刷、设计领域中，在电脑排版盛行之后，这段被传统印刷产业使用几百年的无意义文字又再度流行。由于这段文字以“Lorem
      ipsum”起头，并且常被用于标题的测试中，所以一般称为Lorem
      ipsum，简称为Lipsum。
      网站没有建设完时，也会出现这样的段落，甚至有些是故意的，包括使用网页制作软件，网页模板等，新建时一般都会出现Lorem
      ipsum段落。
    </p>
  </div>
</div>
