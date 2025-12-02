<script lang="ts">
  import type { Comment } from "../lib/types";
  import { getEmoticonUrl, getUserDisplayName, getAvatarUrl } from "../lib/content-utils";

  interface Props {
    comment: Comment;
    time?: string;
  }

  let { comment, time = undefined }: Props = $props();

  function getUserUrl(uid: number) {
    if (time) return `/time-machine?time=${time}&user=${uid}`;
    return `/user/${uid}`;
  }

  let displayName = $derived(getUserDisplayName(comment.username, comment.nickname));
  let avatarUrl = $derived(getAvatarUrl(comment.avatar));
</script>

<div class="text-sm comment-item" id={comment.id.toString()}>
  <div class="flex flex-row gap-2">
    <a class="basis-9 shrink-0" href={getUserUrl(comment.user_id)} title={`用户名：${comment.username || ""}`}>
      <img class="border-2 border-gray-100 rounded-md w-9 h-9 mr-1 inline" src={avatarUrl} alt="" />
    </a>
    <div class="grow">
      <a class="text-sky-700 hover:underline text-sm" href={getUserUrl(comment.user_id)} title={`用户名：${comment.username || ""}`}>
        {displayName + ":"}
      </a>
      <span>
        {#each comment.content as item}
          {#if item.type === "text"}
            <span>{item.content}</span>
          {:else if item.type === "text_bold"}
            <strong>{item.content}</strong>
          {:else if item.type === "text_red"}
            <span class="text-red-600">{item.content}</span>
          {:else if item.type === "text_bold_red"}
            <strong class="text-red-600">{item.content}</strong>
          {:else if item.type === "emoticon"}
            <img class="inline w-5 h-5" src={getEmoticonUrl(item.content.id)} alt="" />
          {:else if item.type === "username"}
            <a href={getUserUrl(item.content.user_id)} class="text-sky-700 hover:underline">
              {item.content.text}
            </a>
          {:else if item.type === "url"}
            <a href={item.content.url} target="_blank" rel="noreferrer nofollow noopener" class="text-sky-700 hover:underline break-all">
              {item.content.text || item.content.url}
            </a>
          {/if}
        {/each}
      </span>
      <p class="text-xs text-right mt-2 -mb-1 text-gray-500">{comment.time}</p>
    </div>
  </div>
</div>
