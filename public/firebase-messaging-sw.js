// Service Worker oficial do Firebase Cloud Messaging (FCM)
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Configuração do Firebase inicializada no Service Worker
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

// Instalação rápida e ativação imediata do service worker de messaging
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Intercepta e exibe notificações push em segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensagem recebida em segundo plano: ', payload);
    
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

self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notificação clicada: ', event.notification);
    event.notification.close();

    const targetUrl = new URL('/?action=register', self.location.origin).href;

    // Tenta focar em uma janela existente ou abre uma nova
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Procura por um cliente aberto que corresponda ao nosso domínio
            let matchingClient = null;
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.indexOf(self.location.origin) === 0) {
                    matchingClient = client;
                    break;
                }
            }
            
            if (matchingClient) {
                // Envia sinal postMessage
                matchingClient.postMessage({ action: 'open-register-modal' });
                
                // Força navegação para garantir que o parâmetro de URL seja processado ao focar (iOS & Android)
                if ('navigate' in matchingClient) {
                    matchingClient.navigate(targetUrl);
                }
                return matchingClient.focus();
            } else {
                // Se o app estiver fechado, abre uma nova janela do PWA com a ação de registro
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            }
        })
    );
});
