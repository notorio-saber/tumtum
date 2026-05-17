const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Lembrete Diário da Manhã às 08:00 (Timezone São Paulo)
exports.morningScheduledReminder = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    console.log('Iniciando envio do lembrete matinal...');
    return sendGlobalReminder();
  });

// Lembrete Diário da Noite às 20:00 (Timezone São Paulo)
exports.eveningScheduledReminder = functions.pubsub
  .schedule('0 20 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    console.log('Iniciando envio do lembrete noturno...');
    return sendGlobalReminder();
  });

// Função centralizada para envio de lembretes e limpeza de tokens
async function sendGlobalReminder() {
  const db = admin.firestore();
  
  // Busca todos os pacientes com lembretes push ativados
  const snapshot = await db.collection('users')
    .where('pushEnabled', '==', true)
    .get();
    
  if (snapshot.empty) {
    console.log('Nenhum usuário com lembretes ativos encontrado.');
    return null;
  }
  
  const tokens = [];
  const userMap = {}; // Guarda a relação token -> userId para remoção posterior em caso de falha
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
      data.fcmTokens.forEach(token => {
        tokens.push(token);
        userMap[token] = doc.id;
      });
    }
  });
  
  if (tokens.length === 0) {
    console.log('Nenhum token FCM válido cadastrado.');
    return null;
  }
  
  console.log(`Enviando lembretes push para ${tokens.length} tokens...`);
  
  // Mensagem suave, preventiva e extremamente acolhedora
  const message = {
    notification: {
      title: 'TumTum 💙',
      body: 'Está na hora de aferir sua pressão.',
    },
    tokens: tokens
  };
  
  try {
    // Envia usando a API Multicast do FCM
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Multicast concluído. Sucesso: ${response.successCount}, Falhas: ${response.failureCount}`);
    
    // Tratamento e limpeza automática de tokens inválidos ou expirados
    if (response.failureCount > 0) {
      const batch = db.batch();
      let hasDeletions = false;
      
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error;
          const badToken = tokens[idx];
          const userId = userMap[badToken];
          
          if (userId && (
              error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered'
          )) {
            console.log(`Removendo token inválido ${badToken} do usuário ${userId}`);
            const userRef = db.collection('users').doc(userId);
            batch.update(userRef, {
              fcmTokens: admin.firestore.FieldValue.arrayRemove(badToken)
            });
            hasDeletions = true;
          }
        }
      });
      
      if (hasDeletions) {
        await batch.commit();
        console.log('Coleção de tokens inválidos atualizada e limpa com sucesso.');
      }
    }
    
  } catch (error) {
    console.error('Erro ao processar envio global de notificações push:', error);
  }
  
  return null;
}
