<script lang="ts">
  import ContentRenderer from "./ContentRenderer.svelte";
  import CommentList from "./CommentList.svelte";
  import InlineModerationLog from "./InlineModerationLog.svelte";
  import type { Post, ModerationLog } from "../lib/types";
  import { getUserDisplayName, getAvatarUrl, getImageUrl } from "../lib/content-utils";
  import { isVandal } from "../lib/content-utils";

  interface Props {
    post: Post;
    time?: string;
    moderationLogs?: ModerationLog[];
  }

  let { post, time = undefined, moderationLogs = [] }: Props = $props();

  let highlightClass = $state("");

  function renderTail(tail: string | null): string {
    return tail ? tail + "  " : "";
  }

  function getUserUrl(uid: number) {
    if (time) return `/time-machine?time=${time}&user=${uid}`;
    return `/user/${uid}`;
  }

  let displayName = $derived(getUserDisplayName(post.username, post.nickname));
  let avatarUrl = $derived(getAvatarUrl(post.avatar));
  let isAlbum = $derived(post.floor === 1 && post.content.some((c) => c.type === "album"));

  $effect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.substring(1);
      if (hash === post.id.toString()) {
        highlightClass = "bg-yellow-50";
        setTimeout(() => {
          highlightClass = "";
        }, 2000);
      }
    }
  });
</script>

<div class="p-5 border-b border-gray-100 transition-colors duration-1000 {highlightClass}" id={post.id.toString()}>
  <div class={isAlbum ? "flex-row" : "lg:flex flex-row"}>
    <div class={"basis-24 shrink-0 mr-7 mb-3 flex flex-row gap-3 items-center" + (isAlbum ? "" : " lg:flex-col")}>
      <a href={getUserUrl(post.user_id)} title={`用户名：${post.username || ""}`}>
        <img class={"border-2 lg:border-4 border-gray-100 rounded-md w-10 h-10" + (isAlbum ? "" : " lg:w-24 lg:h-24")} src={avatarUrl} alt="" />
      </a>
      <a
        href={getUserUrl(post.user_id)}
        title={`用户名：${post.username || ""}`}
        class={"text-sky-700 hover:underline text-center break-all inline text-sm " + (isAlbum ? "" : " lg:text-xs")}
      >
        {displayName}
      </a>
    </div>
    <ContentRenderer content={post.content} {time} />
  </div>
  <div class="mt-12">
    {#if isVandal(post.user_id)}
      <a
        href={getUserUrl(post.user_id)}
        title="该账号在爆吧期间参与了破坏行为，请勿将其内容视为可信信息。"
        class="text-red-600 hover:underline break-all inline"
      >
        <p class="text-xs text-right mb-1 whitespace-pre">请勿将本层内容视为可信信息。点此了解详情</p>
      </a>
    {/if}
    <p class="text-xs text-right -mb-1 text-gray-500 whitespace-pre">{renderTail(post.tail) + post.floor + "楼  " + post.time}</p>
  </div>

  {#if moderationLogs && moderationLogs.length > 0}
    {#each moderationLogs.slice().reverse() as log}
      {#if (log.post_id === null && post.floor === 1) || log.post_id === post.id}
        <div class="lg:ml-31">
          <InlineModerationLog {log} />
        </div>
      {/if}
    {/each}
  {/if}

  <div>
    {#if post.comments && post.comments.length > 0}
      <CommentList comments={post.comments} {time} />
    {/if}
  </div>

  {#if post.signature}
    <div class="hidden lg:block mt-4 pt-4 border-t border-gray-200 ml-31">
      <img src={getImageUrl(post.signature)} alt="签名档" class="max-h-[200px] max-w-full" loading="lazy" />
    </div>
  {/if}
</div>
