import sveltePreprocess from 'svelte-preprocess'
import adapter from '@sveltejs/adapter-static'

export default {
  preprocess: sveltePreprocess(),
  kit: {
    adapter: adapter({ precompress: true }),
  }
};
