// Service Worker - オフライン対応 + 自動アップデート
const CACHE = 'kobe-marathon-v1';
const CORE_FILES = ['/kobe-marathon/', '/kobe-marathon/manifest.json', '/kobe-marathon/icon.png'];

// インストール時：コアファイルをキャッシュ
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE_FILES))
  );
  self.skipWaiting(); // すぐに有効化
});

// 有効化時：古いキャッシュを削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// フェッチ戦略：ネットワーク優先（オフライン時はキャッシュ）
// → サーバーが起動中は常に最新版を取得、オフライン時はキャッシュから
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // ネットワーク成功 → キャッシュも更新
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => {
        // オフライン → キャッシュから返す
        return caches.match(e.request).then(r => r || caches.match('/'));
      })
  );
});
