import type { PageLoad } from './$types'
export const load: PageLoad<{ slug: string }> = ({ params }) => {
  return {
    slug: params.slug,
  }
}
