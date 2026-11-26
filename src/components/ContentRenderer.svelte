<script lang="ts">
  import type { ContentItem } from "../lib/types";
  import { getEmoticonUrl, getImageUrl, getAudioUrl, getVideoUrl, isContentPhotoUrl } from "../lib/content-utils";
  import ContentImage from "./ContentImage.svelte";

  interface Props {
    content?: ContentItem[];
    time?: string;
  }

  let { content = [], time = undefined }: Props = $props();

  function getUserUrl(uid: number) {
    if (time) return `/time-machine?time=${time}&user=${uid}`;
    return `/user/${uid}`;
  }

  function processUrl(url: string): string {
    // 重定向tieba.baidu.com/p/[id]到档案馆或时间机器
    const tiebaMatch = url.match(/tieba\.baidu\.com\/p\/(\d+)/);
    if (tiebaMatch) {
      const threadId = tiebaMatch[1];
      if (time) {
        return `https://fursuit.catme0w.org/time-machine?time=${time}&thread=${threadId}`;
      } else {
        return `https://fursuit.catme0w.org/thread/${threadId}`;
      }
    }
    return url;
  }
</script>

<div class="grow mt-1 whitespace-pre-line lg:text-sm lg:leading-6">
  {#each content as item}
    {#if item.type === "text"}
      <span>{item.content}</span>
    {:else if item.type === "text_bold"}
      <strong>{item.content}</strong>
    {:else if item.type === "text_red"}
      <span class="text-red-600">{item.content}</span>
    {:else if item.type === "text_bold_red"}
      <strong class="text-red-600">{item.content}</strong>
    {:else if item.type === "url"}
      <a href={processUrl(item.content.url)} target="_blank" rel="noreferrer nofollow noopener" class="text-sky-700 hover:underline break-all">
        {item.content.text || item.content.url}
      </a>
    {:else if item.type === "username"}
      <a href={getUserUrl(item.content.userId)} class="text-sky-700 hover:underline">
        {item.content.text}
      </a>
    {:else if item.type === "emoticon"}
      <img class="inline" src={getEmoticonUrl(item.content.id)} alt="" />
    {:else if item.type === "image"}
      {@const imageSrc = item.content}
      {@const imageUrl = getImageUrl(imageSrc)}
      {#if isContentPhotoUrl(imageSrc)}
        <ContentImage src={imageUrl} size={item.size} />
      {:else}
        <!-- 可能是表情包 -->
        <img class="lg:max-w-xl my-2 inline" src={imageUrl} alt="" width={item.size?.width} height={item.size?.height} loading="lazy" />
      {/if}
    {:else if item.type === "video"}
      {#if item.metadata}
        <!-- 贴吧短视频与外部视频（优酷、腾讯视频） -->
        <!-- 固定为视频本身的比例，封面在其中按比例留黑边 -->
        <!-- 不能使用width/height属性，其比例为auto，播放前浏览器会使用封面的比例，开始播放时再切换到视频比例 -->
        <!-- svelte-ignore a11y_media_has_caption -->
        <video
          controls
          poster={item.metadata.coverUrl}
          style="aspect-ratio: {item.metadata.size.width} / {item.metadata.size.height}"
          class="w-full max-w-2xl bg-black"
        >
          <source src={getVideoUrl(item.metadata)} type="video/mp4" />
        </video>
        {#if item.metadata.title}
          <div class="bg-gray-100 rounded-b p-5 w-full max-w-2xl">
            <p class="text-lg text-gray-700">{item.metadata.title}</p>
            {#if item.metadata.uploader}
              <p class="text-xs text-gray-600 mt-1.5">
                上传者：{#if item.metadata.uploaderUrl}
                  <a href={item.metadata.uploaderUrl} target="_blank" rel="noreferrer nofollow noopener" class="text-sky-700 hover:underline break-all"
                    >{item.metadata.uploader}</a
                  >
                {:else}
                  {item.metadata.uploader}
                {/if}
              </p>
            {/if}
            <p class="text-xs text-gray-600">
              视频链接：<a href={item.url} target="_blank" rel="noreferrer nofollow noopener" class="text-sky-700 hover:underline break-all">
                {item.url}
              </a>
            </p>
          </div>
        {/if}
      {:else}
        <!-- 失效视频 -->
        <div class="bg-gray-100 rounded p-5">
          <p class="text-xl mb-1">失效视频</p>
          <p>
            视频链接：<a href={item.url} target="_blank" rel="noreferrer nofollow noopener" class="text-sky-700 hover:underline break-all">
              {item.url}
            </a>
          </p>
        </div>
      {/if}
    {:else if item.type === "audio"}
      {@const audioUrl = getAudioUrl(item.content)}
      <audio controls class="my-2">
        <source src={audioUrl} type="audio/mpeg" />
      </audio>
    {:else if item.type === "album"}
      <div class="columns-2 md:columns-3 gap-2 my-2">
        {#each item.content as albumItem}
          {@const imageUrl = getImageUrl(albumItem.url)}
          <ContentImage src={imageUrl} variant="album" size={albumItem.size} />
        {/each}
      </div>
    {/if}
  {/each}
</div>
