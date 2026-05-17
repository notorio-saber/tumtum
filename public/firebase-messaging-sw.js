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

// Intercepta e exibe notificações push em segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensagem recebida em segundo plano: ', payload);
    
    const notificationTitle = payload.notification.title || 'TumTum 💙';
    const notificationOptions = {
        body: payload.notification.body || 'Está na hora de aferir sua pressão.',
        icon: '/logo ok.png',
        badge: '/logo ok.png',
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
    console.log('[firebase-messaging-sw.js] Notificação clicada: ', event.notification);
    event.notification.close();

    // Tenta focar em uma janela existente ou abre uma nova
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Se o app já estiver aberto, envia um sinal postMessage e foca
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if ('focus' in client) {
                    client.postMessage({ action: 'open-register-modal' });
                    return client.focus();
                }
            }
            
            // Se o app estiver fechado, abre uma nova janela com a ação de registro
            if (clients.openWindow) {
                return clients.openWindow('/?action=register');
            }
        })
    );
});
