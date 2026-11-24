// 包装 @astrojs/svelte 的服务端渲染器
// Svelte 5 的 render() 总会输出水合标记注释（<!--[-->、<!--]-->、<!---->等），其数量震撼人心
// 对不水合的静态组件而言这些注释毫无用处，注意到我们可以在此剥离
// https://github.com/withastro/astro/issues/13732
// https://github.com/sveltejs/svelte/issues/14337
// https://github.com/sveltejs/svelte/issues/15200
import svelteRenderer from "@astrojs/svelte/server.js";

const HYDRATION_MARKER = /<!--(?:\[!?-?\d*|\]|)-->/g;

async function renderToStaticMarkup(Component, props, slotted, metadata) {
  const result = await svelteRenderer.renderToStaticMarkup.call(this, Component, props, slotted, metadata);
  // 需要水合的island必须保留标记，插槽内含island时也保留，以免破坏其水合
  if (metadata?.hydrate || result.html.includes("<astro-island")) return result;
  return { ...result, html: result.html.replace(HYDRATION_MARKER, "") };
}

export default {
  ...svelteRenderer,
  renderToStaticMarkup,
};
