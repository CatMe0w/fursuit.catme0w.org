<script lang="ts">
  export let page: number;
  export let time: string | null;
  export let userType: string;
  export let userClue: string;

  const getUser = async () => {
    if (userType !== "user_id" && userType !== "username" && userType !== "nickname" && userType !== "avatar") return {};
    
    let url = "https://catme0w.org/ex_nihilo_vault/user/" + userType + "/" + userClue + "/" + page;
    let params = new URLSearchParams();
    if (time) params.set("time_machine_datetime", time);

    let response = await fetch(url + "?" + params.toString());
    let json = await response.json();

    document.title = "用户：" + json.nickname;
    document.getElementById('loading-overflow-padding').remove();

    return json;
  };
</script>

<div class="bg-gray-50 mx-1 my-2">
  <div class="shadow rounded bg-white">
    {#await getUser()}
      <p class="p-5">刷刷刷……</p>
    {:then json}
      <div class="grid grid-cols-1">
        {#each json.records as record}
          <div class="p-5 border-b border-gray-100">
            <div class="flex flex-row">
              <!-- TODO -->
            </div>
          </div>
        {/each}
      </div>
    {/await}
  </div>
</div>
