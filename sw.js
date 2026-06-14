const CACHE_NAME = 'bayan-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    }).catch(function(){ /* ignore if some assets are unavailable */ })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  var req = event.request;

  // Never cache/intercept translation API calls - always go to network
  if(req.url.indexOf('translate.googleapis.com') !== -1 ||
     req.url.indexOf('mymemory.translated.net') !== -1){
    return;
  }

  event.respondWith(
    caches.match(req).then(function(cached){
      return cached || fetch(req).then(function(res){
        if(req.method === 'GET' && res && res.status === 200 && res.type === 'basic'){
          var resClone = res.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(req, resClone);
          });
        }
        return res;
      }).catch(function(){
        return cached;
      });
    })
  );
});
