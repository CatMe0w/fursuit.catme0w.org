<script lang="ts">
  import type { ContentItem, VideoMetadata } from "../lib/types";
  import { getEmoticonUrl, getImageUrl, getAudioUrl, getYoukuId, getQQVideoId } from "../lib/content-utils";

  interface Props {
    content?: ContentItem[];
    time?: string;
    videoMetadataMap?: Map<string, VideoMetadata>;
  }

  let { content = [], time = undefined, videoMetadataMap = new Map() }: Props = $props();

  function getUserUrl(uid: number) {
    if (time) return `/time-machine?time=${time}&user=${uid}`;
    return `/user/${uid}`;
  }

  function getVideoData(url: string) {
    const youkuId = getYoukuId(url);
    const qqId = getQQVideoId(url);
    const videoId = youkuId || qqId;

    if (!videoId) return null;

    if (videoMetadataMap.has(videoId)) {
      const metadata = videoMetadataMap.get(videoId);
      return { ...metadata, videoId };
    }

    return null;
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
      <a href={item.content.url} target="_blank" rel="noreferrer nofollow noopener" class="text-sky-700 hover:underline break-all">
        {item.content.text || item.content.url}
      </a>
    {:else if item.type === "username"}
      <a href={getUserUrl(item.content.user_id)} class="text-sky-700 hover:underline">
        {item.content.text}
      </a>
    {:else if item.type === "emoticon"}
      <img class="inline" src={getEmoticonUrl(item.content.id)} alt="" />
    {:else if item.type === "image"}
      {@const imageSrc = item.content}
      {@const imageUrl = getImageUrl(imageSrc)}
      {#if imageSrc.startsWith("https://imgsrc.baidu.com/")}
        <a href={imageUrl}>
          <img class="w-auto lg:max-w-xl my-2 inline" src={imageUrl} alt="" />
        </a>
      {:else}
        <!-- 可能是表情包 -->
        <img class="w-auto lg:max-w-xl my-2 inline" src={imageUrl} alt="" />
      {/if}
    {:else if item.type === "video"}
      {@const videoData = getVideoData(item.content)}
      {#if videoData}
          <!-- svelte-ignore a11y_media_has_caption -->
          <video controls poster={`https://fursuit-static.catme0w.org/videos/cover/${videoData.videoId}.jpg`} class="w-full max-w-2xl bg-black">
            <source src={`https://fursuit-static.catme0w.org/videos/full/${videoData.videoId}.mp4`} type="video/mp4" />
          </video>
          {#if videoData.title}
            <div class="bg-gray-100 rounded-b p-5">
              <p class="text-lg text-gray-700">{videoData.title}</p>
              {#if videoData.uploader}
                <p class="text-xs text-gray-600">
                  {#if videoData.uploader_url}
                    上传者：<a href={videoData.uploader_url} target="_blank" rel="noreferrer nofollow noopener" class="text-sky-700 hover:underline break-all"
                      >{videoData.uploader}</a
                    >
                  {:else}
                    上传者：{videoData.uploader}
                  {/if}
                </p>
              {/if}
              <p class="text-xs text-gray-600">
                视频链接：<a href={item.content} target="_blank" rel="noreferrer nofollow noopener" class="text-sky-700 hover:underline break-all">
                  {item.content}
                </a>
              </p>
            </div>
          {/if}
      {:else}
        <div class="bg-gray-100 rounded p-5">
          <p class="text-xl mb-1">失效视频</p>
          <p>
            视频链接：<a href={item.content} target="_blank" rel="noreferrer nofollow noopener" class="text-sky-700 hover:underline break-all">
              {item.content}
            </a>
          </p>
        </div>
      {/if}
    {:else if item.type === "audio"}
      {@const audioUrl = getAudioUrl(item.content)}
      <audio controls class="my-2">
        <source src={audioUrl} type="audio/mpeg" />
      </audio>
    {/if}
  {/each}
</div>
