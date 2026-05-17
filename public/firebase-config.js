// Configuração do Firebase extraída das credenciais fornecidas
const firebaseConfig = {
  apiKey: "AIzaSyD_iwHuubgDX5N5nxLFmMS8QzuIj3A8Gpc",
  authDomain: "tumtum-28b8d.firebaseapp.com",
  projectId: "tumtum-28b8d",
  storageBucket: "tumtum-28b8d.firebasestorage.app",
  messagingSenderId: "751609980025",
  appId: "1:751609980025:web:6bda69fd364b8bdbf420a8"
};

// Inicializa o Firebase (usando a versão compat para facilitar o rascunho rápido)
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Exporta para uso no script.js
window.auth = auth;
window.db = db;

const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
window.googleProvider = googleProvider;
