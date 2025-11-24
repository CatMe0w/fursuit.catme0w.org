<script lang="ts">
  import { isVandal } from "../lib/content-utils";

  interface Props {
    userId: number;
  }

  let { userId }: Props = $props();
</script>

{#if isVandal(userId)}
  <div class="px-6 py-8 border-b border-gray-100 text-red-600 bg-red-50">
    <h1 class="text-3xl mb-4">这是一位破坏者</h1>
    <p>该账号在爆吧期间参与了破坏行为，<strong>请勿将其内容视为可信信息。</strong></p>
    <p>爆吧脚本会搬运正常帖子伪装为真人发言，请仔细甄别。</p>
  </div>
{/if}
