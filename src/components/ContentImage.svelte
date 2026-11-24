<script lang="ts">
  import type { ImageSize } from "../lib/types";

  interface Props {
    src: string;
    alt?: string;
    variant?: "default" | "album";
    size?: ImageSize;
  }

  let { src, alt = "", variant = "default", size }: Props = $props();
</script>

<a href={src} data-pswp-width={size?.width} data-pswp-height={size?.height} target="_blank" class="gallery-item">
  <img
    class={variant === "album" ? "w-full mb-2 block rounded" : "lg:max-w-xl my-2 inline"}
    {src}
    {alt}
    width={size?.width}
    height={size?.height}
    loading="lazy"
  />
</a>
