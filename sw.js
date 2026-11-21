/* 트랜스포머 도감 서비스 워커
   삼성 인터넷·크롬이 웹앱(WebAPK)으로 설치할 수 있게 해 주는 최소 SW.
   - 설치 시: 앱 화면과 22명(오토봇 12 + 디셉티콘 10) 실사 영화 모습을 미리 받아 둔다.
   - 화면(index.html·매니페스트)은 네트워크 우선 → 새 버전이 바로 반영된다.
   - 그림·아이콘은 캐시 우선 → 오프라인에서도 그림이 보인다.
*/
const VERSION = "transformers-dex-v9";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./app-icon-180.png",
  "./app-icon-192.png",
  "./app-icon-512.png",
  "./app-icon-maskable-192.png",
  "./app-icon-maskable-512.png",
  "./assets/bots/optimus.webp",
  "./assets/bots/bumblebee.webp",
  "./assets/bots/ironhide.webp",
  "./assets/bots/ratchet.webp",
  "./assets/bots/jazz.webp",
  "./assets/bots/wheeljack.webp",
  "./assets/bots/arcee.webp",
  "./assets/bots/prowl.webp",
  "./assets/bots/grimlock.webp",
  "./assets/bots/ultramagnus.webp",
  "./assets/bots/hound.webp",
  "./assets/bots/mirage.webp",
  "./assets/bots/megatron.webp",
  "./assets/bots/starscream.webp",
  "./assets/bots/soundwave.webp",
  "./assets/bots/shockwave.webp",
  "./assets/bots/barricade.webp",
  "./assets/bots/blackout.webp",
  "./assets/bots/lockdown.webp",
  "./assets/bots/brawl.webp",
  "./assets/bots/scourge.webp",
  "./assets/bots/nightbird.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(SHELL).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    } catch (e) { /* 캐시 정리 실패는 무시하고 제어권만 넘긴다 */ }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  const isDoc = req.mode === "navigate" || /\.(html|webmanifest)$/.test(url.pathname);

  if (isDoc) {
    // 화면은 네트워크 우선, 오프라인일 때만 캐시
    event.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: "no-cache" });
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      } catch (err) {
        const cached = await caches.match(req, { ignoreSearch: true });
        if (cached) return cached;
        const shell = await caches.match("./index.html", { ignoreSearch: true });
        if (shell) return shell;
        throw err;
      }
    })());
    return;
  }

  // 그림·아이콘은 캐시 우선
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === "basic") {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      throw err;
    }
  })());
});
