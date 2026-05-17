const CACHE_NAME = 'tumtum-pwa-v14';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/firebase-config.js',
  '/logo.jpg',
  '/logo.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições: Network First (Tenta rede primeiro. Se offline, vai para o cache)
self.addEventListener('fetch', (event) => {
  // Ignora requisições de outras origens (ex: Firebase, Google APIs)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, salva/atualiza no cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Sem internet: fallback para o cache
        return caches.match(event.request);
      })
  );
});

// ==========================================
// --- INTEGRATION OF FIREBASE CLOUD MESSAGING (FCM) ---
// ==========================================

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyD_iwHuubgDX5N5nxLFmMS8QzuIj3A8Gpc",
  authDomain: "tumtum-28b8d.firebaseapp.com",
  projectId: "tumtum-28b8d",
  storageBucket: "tumtum-28b8d.firebasestorage.app",
  messagingSenderId: "751609980025",
  appId: "1:751609980025:web:6bda69fd364b8bdbf420a8"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Intercepta e exibe notificações push em segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Mensagem recebida em segundo plano: ', payload);
    
    const notificationTitle = payload.notification.title || 'TumTum 💙';
    const notificationOptions = {
        body: payload.notification.body || 'Está na hora de aferir sua pressão.',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'tumtum-reminder',
        renotify: true,
        vibrate: [100, 50, 100], // Pulsação de batimento cardíaco
        data: {
            action: 'open-register'
        }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manipula o clique na notificação push
self.addEventListener('notificationclick', (event) => {
    console.log('[sw.js] Notificação clicada: ', event.notification);
    event.notification.close();

    const targetUrl = new URL('/?action=register', self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            let matchingClient = null;
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.indexOf(self.location.origin) === 0) {
                    matchingClient = client;
                    break;
                }
            }
            
            if (matchingClient) {
                try {
                    matchingClient.postMessage({ action: 'open-register-modal' });
                } catch(e) {
                    console.error("Erro ao enviar postMessage:", e);
                }
                
                // Traz o aplicativo imediatamente para o primeiro plano (foreground) no Android e iOS
                return matchingClient.focus();
            } else {
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            }
        })
    );
});
