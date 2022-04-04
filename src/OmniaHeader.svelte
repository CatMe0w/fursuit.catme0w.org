<script lang="ts">
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

  // todo: back button, and...?
</script>

<header class="p-6 mt-12">
  <div class="mb-12">
    <h1 class="text-3xl mb-3">{title}</h1>
    <p>{subtitle}</p>
  </div>
</header>
