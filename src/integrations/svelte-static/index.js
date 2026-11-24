import svelte from "@astrojs/svelte";

// 将 @astrojs/svelte 中的服务端渲染器替换成我们剥离水合标记的版本
export default function svelteStatic(options) {
  const integration = svelte(options);
  const setup = integration.hooks["astro:config:setup"];
  integration.hooks["astro:config:setup"] = (params) =>
    setup({
      ...params,
      addRenderer: (renderer) =>
        params.addRenderer({
          ...renderer,
          serverEntrypoint: new URL("./server.js", import.meta.url),
        }),
    });
  return integration;
}
