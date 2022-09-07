import sveltePreprocess from 'svelte-preprocess'
import adapter from '@sveltejs/adapter-cloudflare'

export default {
  preprocess: sveltePreprocess(),
  kit: {
    adapter: adapter(),
    trailingSlash: 'always',
  },
}
