<script lang="ts">
  interface Props {
    src: string;
    alt?: string;
  }

  let { src, alt = "" }: Props = $props();

  let width = $state(0);
  let height = $state(0);
  let loaded = $state(false);

  function onLoad(e: Event) {
    const img = e.target as HTMLImageElement;
    width = img.naturalWidth;
    height = img.naturalHeight;
    loaded = true;
  }
</script>

<a href={src} data-pswp-width={width} data-pswp-height={height} target="_blank" class:gallery-item={loaded}>
  <img class="w-auto lg:max-w-xl my-2 inline" {src} {alt} onload={onLoad} />
</a>
