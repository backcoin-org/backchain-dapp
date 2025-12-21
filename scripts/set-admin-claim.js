const admin = require('firebase-admin');

// Inicializa com sua service account
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// UID do usuário Firebase (não é a carteira, é o UID do Firebase Auth)
// Você precisa encontrar o UID no Firebase Console → Authentication → Users
const USER_UID = 'COLE_O_UID_AQUI'; 

// Carteira admin
const ADMIN_WALLET = '0x8e0ff08ebee07a48bfaf95c1846d33ba694bd8c3';

async function setAdminClaim() {
  try {
    await admin.auth().setCustomUserClaims(USER_UID, {
      wallet: ADMIN_WALLET
    });
    console.log('✅ Custom claim "wallet" adicionado com sucesso!');
    
    // Verifica
    const user = await admin.auth().getUser(USER_UID);
    console.log('Claims atuais:', user.customClaims);
  } catch (error) {
    console.error('Erro:', error);
  }
  process.exit();
}

setAdminClaim();