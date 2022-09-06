<main class="border-t-2 border-gray-100 max-w-5xl mx-auto px-5">
  <header class="p-6 mt-12">
    <div class="mb-12">
      <h1 class="text-3xl mb-3">下载</h1>
      <p>下载本项目的所有数据。</p>
    </div>
  </header>
  <h1 class="text-3xl mt-12 mb-12 text-center">选择一个下载方式</h1>
  <div class="grid grid-rows-1 lg:grid-cols-3 gap-4">
    <div class="p-3 pb-10 border-b lg:border-b-0 lg:border-r">
      <p class="text-xl mb-6">从 GitHub 下载</p>
      <p class="mb-3">前往 GitHub Release：</p>
      <a
        class="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 px-4 py-2 rounded"
        href="https://github.com/CatMe0w/proma/releases/tag/trigger-1"
      >
        第一部分（proma）
      </a><br /><br />
      <a
        class="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 px-4 py-2 rounded"
        href="https://github.com/CatMe0w/backstage_uncover/releases/tag/trigger-1"
      >
        第二部分（uncover）
      </a>
    </div>
    <div class="p-3 pb-10 border-b lg:border-b-0 lg:border-r">
      <p class="text-xl mb-8">从 Internet Archive 下载</p>
      <a
        class="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 px-4 py-2 rounded"
        href="https://archive.org/details/project-ex-nihilo-data"
      >
        前往 Internet Archive
      </a>
    </div>
    <div class="p-3">
      <p class="text-xl mb-6">通过 BitTorrent 下载</p>
      <p class="mb-3">
        种子文件由 Internet Archive 生成，此处的磁力链接添加了额外 Tracker 服务器。
      </p>
      <a
        class="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 px-4 py-2 rounded"
        href="magnet:?xt=urn:btih:882353b26934f022243b3bbdec980508ffaa009a&dn=project-ex-nihilo-data&tr=udp%3a%2f%2ftracker.opentrackr.org%3a1337%2fannounce&tr=udp%3a%2f%2ftracker.openbittorrent.com%3a6969%2fannounce&tr=udp%3a%2f%2ftracker.moeking.me%3a6969%2fannounce&tr=http%3a%2f%2fbt1.archive.org%3a6969%2fannounce&tr=http%3a%2f%2fbt2.archive.org%3a6969%2fannounce&ws=http%3a%2f%2fia601404.us.archive.org%2f27%2fitems%2f&ws=https%3a%2f%2farchive.org%2fdownload%2f"
      >
        使用磁力链接下载
      </a>
    </div>
  </div>
  <h1 class="text-3xl mt-12 mb-8 text-center">校验数据完整性</h1>
  <div class="flex flex-col gap-3">
    <p>建议对下载后的数据进行完整性校验，以确保数据未经篡改。</p>
    <p>各文件的 SHA-256 散列值如下：</p>
    <div class="p-6 rounded bg-gray-100">
      <pre
        class="whitespace-pre-line break-all">03d38b56a4c3e9c9a1319b6def61f206316f10449e24e37c8d806a57cb67c8e3 proma-raw.tar.xz
51ce1366d82343e4fa7b82598e6990340cd47bda3be75917229f4f4ae81ec452 proma.db.xz
2f27224bb87815c94ebd86e1f88bb54059d619be72176384172895688d645e38 proma.log.xz

b5f6e8d188512608ff3101711df91cea761d172af2c61a1174b0948bcaa8e5c0 uncover-raw.tar.xz
9b30ff39aafbb4d53d445671cc7237a1767a5b4b2fd996f9b6eb51d1ecbf1027 uncover.db.xz
6b985e4478542b63dd35cbc69a48a3a6e58bab3a3fd63a49c6018cbcff580e65 uncover.log.xz</pre>
    </div>
    <p>若这里列出的 SHA-256 散列值与您下载的文件所计算出的相同，即证明文件未经篡改。</p>
    <p class="text-gray-500 text-sm mb-6">
      （通过 Internet Archive 及对应 BitTorrent 种子与磁力链接下载的文件包含来自 Internet Archive
      的额外元数据，未在这里列出的文件可以忽略。）
    </p>
    <p>以上的 SHA-256 散列值应与 GitHub Release 及 GitHub Actions 中呈现的完全相同。</p>
    <p>
      查看 GitHub Actions 中的散列值：
      <a
        class="text-sky-700 hover:underline"
        href="https://github.com/CatMe0w/proma/runs/5237411738?check_suite_focus=true#step:8:1"
        >第一部分（proma）</a
      >
      <a
        class="text-sky-700 hover:underline"
        href="https://github.com/CatMe0w/backstage_uncover/runs/5345249075?check_suite_focus=true#step:7:1"
        >第二部分（uncover）</a
      >
    </p>
    <p class="text-gray-500 text-sm mb-6">
      GitHub Actions 运行日志于 2022 年 5 月失效，若已经失效，请查看 archive.today 中的网页存档：
      <a class="text-sky-700 hover:underline" href="https://archive.is/MNrT9">第一部分（proma）</a>
      <a class="text-sky-700 hover:underline" href="https://archive.is/UFoVi">第二部分（uncover）</a
      >
    </p>
    <p class="mb-6 p-5 bg-red-50 rounded">
      若您从其他来源取得这些文件，且 SHA-256
      散列值与此处所呈现的不同，代表您的文件已被他人篡改，请不要使用。<br
      />同时，希望您能将经过篡改的文件样本发送给我们：<span class="font-mono"
        >archive@catme0w.org</span
      >
    </p>
    <p class="mb-12">
      作为公开数据的收集，这些数据我们不保留著作权或附加额外技术限制。内容的著作权归各帖子的原始作者。您可以任意使用这些数据，惟须遵守百度贴吧协议，并在发布时您的作品时提供指向本页面的链接。
    </p>
  </div>
</main>
