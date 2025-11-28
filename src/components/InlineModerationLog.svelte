<script lang="ts">
  import { isVandal, isVandalUsername } from "../lib/content-utils";
  import type { ModerationLog } from "../lib/types";

  interface Props {
    log: ModerationLog;
  }

  let { log }: Props = $props();

  function getUserUrl(username: string | null) {
    return `/search?scope=moderation&q=${username}`;
  }

  function shouldMarkAsVandal(uid: number | null | undefined, t: string | null, u: string | null): boolean {
    if (uid && isVandal(uid)) return true;
    if (u && isVandalUsername(u)) return true;
    if (!uid && t) {
      const date = new Date(t);
      const start = new Date("2017-06-21T00:00:00").getTime();
      const end = new Date("2019-07-05T23:59:59").getTime();
      const timeVal = date.getTime();
      return !isNaN(timeVal) && timeVal >= start && timeVal <= end;
    }
    return false;
  }

  let isVandalOperator = $derived(shouldMarkAsVandal(log.operator_id, log.operation_time, log.operator));
  let vandalTitle = $derived(log.operator_id ? "该账号在爆吧期间参与了破坏行为。" : "该账号在爆吧期间参与了破坏行为，并且已被百度封禁。");

  let config = $derived(
    (() => {
      switch (log.operation) {
        case "删贴":
          return {
            color: "bg-red-50",
            text: log.post_id ? "删除了这条回复" : "删除了这个帖子",
          };
        case "恢复删贴":
          return { color: "bg-emerald-50", text: "恢复了这个帖子" };
        case "加精":
          return { color: "bg-yellow-50", text: "加精了这个帖子" };
        case "取消加精":
          return { color: "bg-yellow-50", text: "将这个帖子取消加精" };
        case "置顶":
          return { color: "bg-blue-50", text: "置顶了这个帖子" };
        case "取消置顶":
          return { color: "bg-blue-50", text: "将这个帖子取消置顶" };
        default:
          return null;
      }
    })()
  );
</script>

{#if config}
  <div class="mt-4 p-3 rounded {config.color} text-sm">
    <p>
      <a href={getUserUrl(log.operator)} class="text-sky-700 hover:underline">
        {log.operator}
        {#if isVandalOperator}
          <span title={vandalTitle} class="text-red-600 text-base">[破坏者]</span>
        {/if}
      </a>
      于{log.operation_time}{config.text}。
    </p>
  </div>
{/if}
