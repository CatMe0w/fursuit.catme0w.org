<script lang="ts">
  import { isVandal, isVandalUsername } from "../lib/content-utils";

  interface Props {
    userId?: number | null;
    username?: string | null;
    time?: string;
  }

  let { userId = undefined, username = undefined, time = undefined }: Props = $props();

  function shouldMarkAsVandal(uid: number | null | undefined, t: string | undefined, u: string | null | undefined): boolean {
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

  let isVandalUser = $derived(shouldMarkAsVandal(userId, time, username));
  let userUrl = $derived(userId ? `/user/${userId}` : null);
  let title = $derived(isVandalUser ? (userId ? "该账号在爆吧期间参与了破坏行为。" : "该账号在爆吧期间参与了破坏行为，并且已被百度封禁。") : undefined);
</script>

{#if userId}
  <a href={userUrl} {title} class="text-sky-700 hover:underline relative z-10">
    {username}
    {#if isVandalUser}
      <span class="text-red-600 text-base">[破坏者]</span>
    {/if}
  </a>
{:else}
  <span {title} class="text-gray-500">
    {username}
    {#if isVandalUser}
      <span class="text-red-600 text-base">[破坏者]</span>
    {/if}
  </span>
{/if}
