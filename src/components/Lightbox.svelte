<script lang="ts">
  import PhotoSwipeLightbox from "photoswipe/lightbox";
  import "photoswipe/style.css";

  let { children } = $props();

  let gallery: HTMLElement;

  $effect(() => {
    let lightbox = new PhotoSwipeLightbox({
      gallery: gallery,
      children: "a.gallery-item",
      pswpModule: () => import("photoswipe"),
    });

    lightbox.init();

    return () => {
      lightbox.destroy();
    };
  });
</script>

<div bind:this={gallery}>
  {@render children()}
</div>
