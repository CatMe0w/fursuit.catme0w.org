<script lang="ts">
	import '../app.css'
</script>

<body>
  <header
    id="navbar"
    class="max-w-5xl mx-auto bg-white flex justify-between items-center border-b-2 border-gray-100 py-6 md:justify-start md:space-x-10"
  >
    <div class="hidden md:flex justify-start lg:w-0 lg:flex-1" />
    <nav class="hidden md:flex space-x-10">
      <a href="./" class="text-base font-medium text-gray-500 hover:text-gray-900">首页</a
      >
      <a href="./browse" class="text-base font-medium text-gray-500 hover:text-gray-900"
        >档案馆</a
      >
      <a href="./browse?time=0" class="text-base font-medium text-gray-500 hover:text-gray-900"
        >时间机器</a
      >
      <a href="./download" class="text-base font-medium text-gray-500 hover:text-gray-900"
        >下载</a
      >
      <a
        href="https://eminent-knife-7e7.notion.site/150710e8b10645a3ae199911cf332549"
        class="text-base font-medium text-gray-500 hover:text-gray-900">幕后故事</a
      >
    </nav>
    <div class="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
      <a href="https://catme0w.org" class="text-base font-medium text-gray-500 hover:text-gray-900"
        >catme0w.org</a
      >
    </div>
    <div class="md:hidden ml-auto mr-2 -my-4">
      <button
        type="button"
        onclick="toggle()"
        class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-500"
        aria-expanded="false"
      >
        <span class="sr-only">Open menu</span>
        <!-- Heroicon name: outline/menu -->
        <svg
          class="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
    <div
      id="mobile-nav"
      class="absolute top-0 inset-x-0 p-2 transition transform origin-top-right hidden"
    >
      <div class="rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5">
        <div class="p-5">
          <div class="flex">
            <div class="ml-auto">
              <button type="button" onclick="toggle()" class="bg-white text-gray-500">
                <span class="sr-only">Close menu</span>
                <!-- Heroicon name: outline/x -->
                <svg
                  class="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div class="mt-6">
            <nav class="grid gap-y-8">
              <a href="./index" class="text-base font-medium text-gray-700 text-center">首页</a
              >
              <a href="./browse" class="text-base font-medium text-gray-700 text-center"
                >档案馆</a
              >
              <a href="./browse?time=0" class="text-base font-medium text-gray-700 text-center"
                >时间机器</a
              >
              <a href="./download" class="text-base font-medium text-gray-700 text-center"
                >下载</a
              >
              <a
                href="https://eminent-knife-7e7.notion.site/150710e8b10645a3ae199911cf332549"
                class="text-base font-medium text-gray-700 text-center">幕后故事</a
              >
              <a
                href="https://catme0w.org"
                class="text-base font-medium text-gray-700 text-center pt-4 -mt-4 border-t"
                >catme0w.org</a
              >
            </nav>
          </div>
        </div>
      </div>
    </div>
  </header>
  <slot />
</body>

<!-- TODO: toggle in index.html-->
<!-- <script>
  const toggle = () => {
    let mobileNav = document.getElementById("mobile-nav");
    if (mobileNav.style.display !== "block") {
      mobileNav.style.display = "block";
    } else {
      mobileNav.style.display = "none";
    }
  }
</script> -->