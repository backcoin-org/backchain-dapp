// modules/firebase-auth-service.js
// ✅ VERSION V2.1: Fixed getPublicAirdropData to return platformUsageConfig

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
// Importações necessárias do Firestore
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, getDocs, updateDoc, deleteDoc, query, where, increment, orderBy, limit, serverTimestamp, Timestamp, writeBatch } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- Configuração Firebase ---
// Substitua pelas suas credenciais reais
const firebaseConfig = {
  apiKey: "AIzaSyDKhF2_--fKtot96YPS8twuD0UoCpS-3T4",
  authDomain: "airdropbackchainnew.firebaseapp.com",
  projectId: "airdropbackchainnew",
  storageBucket: "airdropbackchainnew.appspot.com",
  messagingSenderId: "108371799661",
  appId: "1:108371799661:web:d126fcbd0ba56263561964",
  measurementId: "G-QD9EBZ0Y09"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null; // Armazena o usuário Firebase autenticado (para PERMISSÕES)
let currentWalletAddress = null; // A "chave primária" real do usuário
let currentAirdropProfile = null; // Cache do perfil do usuário

// =======================================================
//  FUNÇÕES DE UTILIDADE (AJUSTADA)
// =======================================================

/**
 * Converte um valor de token (em WEI, string BigInt) para o formato decimal legível ($BKC$).
 * USA BigInt nativo para lidar com números grandes com 18 casas decimais.
 * @param {string} weiString Valor em wei (ex: "300000000000000000").
 * @param {number} decimals Número de casas decimais (18 para $BKC$).
 * @returns {string} O valor formatado (ex: "0.3").
 */
export function formatWeiToBKC(weiString, decimals = 18) {
    if (!weiString || weiString === '0') return '0.00';
    
    try {
        const bigIntWei = BigInt(weiString);
        const divisor = BigInt(10) ** BigInt(decimals);
        
        // Simplesmente divide e retorna a parte inteira e decimal com um pouco de precisão
        const integerPart = (bigIntWei / divisor).toString();
        
        // Calcula a parte decimal, preenchendo com zeros à esquerda
        let decimalPart = (bigIntWei % divisor).toString();
        const padding = decimals - decimalPart.length;
        if (padding > 0) {
            decimalPart = '0'.repeat(padding) + decimalPart;
        }
        
        // Remove zeros desnecessários no final
        decimalPart = decimalPart.replace(/0+$/, '');
        
        return `${integerPart}.${decimalPart || '0'}`; // Retorna a string formatada

    } catch (e) {
        console.error("Erro ao formatar valor BigInt:", e);
        return '0.00';
    }
}


// =======================================================
//  FUNÇÕES DE AUTENTICAÇÃO (MANTIDAS)
// =======================================================

/**
 * Garante que o usuário esteja autenticado (pode ser anonimamente)
 * e associa/cria o perfil do Airdrop para o endereço da carteira fornecido.
 * @param {string} walletAddress Endereço da carteira Ethereum.
 * @returns {Promise<User>} O objeto do usuário Firebase autenticado.
 */
export async function signIn(walletAddress) {
    if (!walletAddress) throw new Error("Wallet address is required for Firebase sign-in.");

    // <-- CORREÇÃO: Normaliza e armazena a carteira como ID principal
    const normalizedWallet = walletAddress.toLowerCase();
    currentWalletAddress = normalizedWallet; // Salva globalmente

    // Se já temos um usuário Firebase logado na sessão atual
    if (currentUser) {
        // <-- CORREÇÃO: Busca o perfil pela CARTEIRA
        currentAirdropProfile = await getAirdropUser(normalizedWallet); 
        return currentUser;
    }

    // Tenta usar o usuário Firebase da sessão anterior (se a página foi recarregada)
    if (auth.currentUser) {
        currentUser = auth.currentUser;
        // <-- CORREÇÃO: Busca o perfil pela CARTEIRA
        currentAirdropProfile = await getAirdropUser(normalizedWallet);
        return currentUser;
    }

    // Se não há usuário, tenta logar anonimamente
    return new Promise((resolve, reject) => {
        // Usa onAuthStateChanged para garantir que o login anônimo (se necessário) complete
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe(); // Roda só uma vez
            if (user) {
                currentUser = user;
                try {
                    // <-- CORREÇÃO: Busca o perfil pela CARTEIRA
                    currentAirdropProfile = await getAirdropUser(normalizedWallet); // Cria/associa perfil Airdrop
                    resolve(user);
                } catch (error) {
                    console.error("Error linking airdrop user profile:", error);
                    reject(error); // Rejeita se falhar em criar/associar o perfil
                }
            } else {
                // Se onAuthStateChanged retornar null (inesperado após tentativa de login),
                // tenta logar anonimamente de novo explicitamente.
                signInAnonymously(auth)
                    .then(async (userCredential) => {
                        currentUser = userCredential.user;
                        // <-- CORREÇÃO: Busca o perfil pela CARTEIRA
                        currentAirdropProfile = await getAirdropUser(normalizedWallet);
                        resolve(currentUser);
                    })
                    .catch((error) => {
                        console.error("Firebase Anonymous sign-in failed:", error);
                        reject(error); // Rejeita se o login anônimo falhar
                    });
            }
        }, (error) => {
             // Erro no listener do onAuthStateChanged
             console.error("Firebase Auth state change error:", error);
             unsubscribe();
             reject(error);
        });
    });
}

/**
 * Verifica se currentUser (usuário Firebase) está definido E se a carteira está definida.
 */
function ensureAuthenticated() {
    if (!currentUser) {
        throw new Error("User not authenticated with Firebase. Please sign-in first.");
    }
    // <-- CORREÇÃO: Garante que a carteira (ID real) esteja definida
    if (!currentWalletAddress) { 
        throw new Error("Wallet address not set. Please connect wallet first.");
    }
}


// =======================================================
//  FUNÇÕES DE DADOS PÚBLICOS (MANTIDAS)
// =======================================================

/**
 * Busca os dados públicos do Airdrop (configurações, tarefas ativas, rankings).
 * @returns {Promise<object>} Objeto contendo config, leaderboards e dailyTasks ativas.
 */
export async function getPublicAirdropData() {
    const dataRef = doc(db, "airdrop_public_data", "data_v1");
    const dataSnap = await getDoc(dataRef);

    if (dataSnap.exists()) {
        const data = dataSnap.data();

        // Processa e valida as tarefas diárias
        const tasks = (data.dailyTasks || []).map(task => {
            // Garante que timestamps sejam objetos Date
            const startDate = task.startDate?.toDate ? task.startDate.toDate() : (task.startDate ? new Date(task.startDate) : null);
            const endDate = task.endDate?.toDate ? task.endDate.toDate() : (task.endDate ? new Date(task.endDate) : null);
            return {
                ...task,
                id: task.id || null, // Garante que a tarefa tenha um ID
                startDate: startDate instanceof Date && !isNaN(startDate) ? startDate : null, // Valida Date
                endDate: endDate instanceof Date && !isNaN(endDate) ? endDate : null,       // Valida Date
            };
        }).filter(task => task.id); // Remove tarefas sem ID

        const now = Date.now();

        // Filtra apenas tarefas ativas (agora >= início E agora < fim)
        const activeTasks = tasks.filter(task => {
             const startTime = task.startDate ? task.startDate.getTime() : 0; // Início padrão: sempre ativo
             const endTime = task.endDate ? task.endDate.getTime() : Infinity; // Fim padrão: nunca expira
             return startTime <= now && now < endTime;
        });

        // Retorna os dados públicos, garantindo que objetos existam
        return {
            config: data.config || { ugcBasePoints: {} }, // Garante config e ugcBasePoints
            leaderboards: data.leaderboards || { top100ByPoints: [], top100ByPosts: [], lastUpdated: null },
            dailyTasks: activeTasks, // Lista de tarefas ativas e validadas
            platformUsageConfig: data.platformUsageConfig || null // Config de Platform Usage
        };
    } else {
        // Se o documento não existe, retorna valores padrão
        console.warn("Public airdrop data document 'airdrop_public_data/data_v1' not found. Returning defaults.");
        return {
            config: { isActive: false, roundName: "Loading...", ugcBasePoints: {} },
            leaderboards: { top100ByPoints: [], top100ByPosts: [], lastUpdated: null },
            dailyTasks: [],
            platformUsageConfig: null
        };
    }
}

// =======================================================
//  FUNÇÕES DE DADOS DO USUÁRIO (MANTIDAS)
// =======================================================

/**
 * Gera um código de referência aleatório de 6 caracteres.
 * @returns {string} Código de referência.
 */
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ==========================================================
//  INÍCIO DA ALTERAÇÃO (Função Multiplicador)
// ==========================================================

/**
 * Calcula o multiplicador de pontos baseado no número de posts aprovados.
 * @param {number} approvedCount O número de posts aprovados.
 * @returns {number} O multiplicador (ex: 1.0, 2.0, ... 10.0).
 */
function getMultiplierByTier(approvedCount) {
    if (approvedCount >= 100) return 10.0;
    if (approvedCount >= 90) return 9.0;
    if (approvedCount >= 80) return 8.0;
    if (approvedCount >= 70) return 7.0;
    if (approvedCount >= 60) return 6.0;
    if (approvedCount >= 50) return 5.0;
    if (approvedCount >= 40) return 4.0;
    if (approvedCount >= 30) return 3.0;
    if (approvedCount >= 20) return 2.0;
    return 1.0; // Padrão para 0-19 posts
}

// ==========================================================
//  FIM DA ALTERAÇÃO
// ==========================================================


/**
 * Busca o perfil do usuário Airdrop no Firestore. Se não existir, cria um novo.
 * Garante que campos essenciais existam no perfil.
 * * [IMPORTANTE]: O ID do documento é o walletAddress, garantindo que NÃO haja
 * duplicatas para a mesma carteira.
 * * @param {string} walletAddress Endereço da carteira do usuário (normalizado/minúsculo).
 * @returns {Promise<object>} O objeto de dados do usuário Airdrop.
 */
export async function getAirdropUser(walletAddress) {
    ensureAuthenticated(); 
    
    // ==========================================================
    //  INÍCIO DA CORREÇÃO (Bug Carteira Duplicada)
    // ==========================================================
    // Garante que o ID do documento seja SEMPRE minúsculo,
    // independentemente de como esta função foi chamada.
    if (!walletAddress) {
        // Se por algum motivo o walletAddress for nulo, usa o global (que já é minúsculo)
        walletAddress = currentWalletAddress;
    }
    const normalizedWallet = walletAddress.toLowerCase();
    // ==========================================================
    //  FIM DA CORREÇÃO
    // ==========================================================

    // O ID do documento é a CARTEIRA
    const userRef = doc(db, "airdrop_users", normalizedWallet); // <-- USA A VARIÁVEL NORMALIZADA
    const userSnap = await getDoc(userRef); 

    if (userSnap.exists()) { 
        // Usuário existe, verifica e preenche campos padrão se necessário
        const userData = userSnap.data(); 
        const updates = {}; 

        // Garante que campos essenciais existam e tenham o tipo correto
        if (!userData.referralCode) updates.referralCode = generateReferralCode(); 
        if (typeof userData.approvedSubmissionsCount !== 'number') updates.approvedSubmissionsCount = 0; 
        if (typeof userData.rejectedCount !== 'number') updates.rejectedCount = 0; 
        if (typeof userData.isBanned !== 'boolean') updates.isBanned = false; 
        if (typeof userData.totalPoints !== 'number') updates.totalPoints = 0; 
        
        // --- CORREÇÃO: Esta lógica de "pointsMultiplier" estava errada ---
        // Não vamos mais salvar o multiplicador no perfil, ele será calculado
        // dinamicamente. Mas, por segurança, garantimos que o campo exista.
        if (typeof userData.pointsMultiplier !== 'number') updates.pointsMultiplier = 1.0; 
        // --- FIM CORREÇÃO ---
        
        // Garante que o endereço da carteira no documento seja minúsculo
        if (userData.walletAddress !== normalizedWallet) {
            updates.walletAddress = normalizedWallet; // <-- USA A VARIÁVEL NORMALIZADA
        }

        // Se precisa atualizar, salva no Firestore
        if (Object.keys(updates).length > 0) { 
             try { 
                 await updateDoc(userRef, updates); 
                 // Retorna dados combinados
                 return { id: userSnap.id, ...userData, ...updates }; 
             } catch (updateError) { 
                  console.error("Error updating user default fields:", updateError); 
                  // Retorna dados originais mesmo se a atualização falhar
                  return { id: userSnap.id, ...userData }; 
             }
        }
        // Se não precisou atualizar, retorna os dados lidos
        return { id: userSnap.id, ...userData }; 

    } else {
        // Usuário não existe, cria um novo perfil
        const referralCode = generateReferralCode(); 
        const newUser = { 
            walletAddress: normalizedWallet, // <-- Salva a carteira (ID) minúscula
            referralCode: referralCode, 
            totalPoints: 0, 
            pointsMultiplier: 1.0, // <-- Mantém o campo por consistência
            approvedSubmissionsCount: 0, 
            rejectedCount: 0, 
            isBanned: false, 
            createdAt: serverTimestamp() 
        };
        await setDoc(userRef, newUser); 
        // Retorna dados do novo usuário
        return { id: userRef.id, ...newUser, createdAt: new Date() }; 
    }
}

/**
 * Verifica se o usuário pode realizar uma tarefa diária baseado no cooldown.
 * @param {string} taskId ID da tarefa.
 * @param {number} cooldownHours Duração do cooldown em horas.
 * @returns {Promise<{eligible: boolean, timeLeft: number}>} Objeto indicando elegibilidade e tempo restante em ms.
 */
export async function isTaskEligible(taskId, cooldownHours) {
    ensureAuthenticated();
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
        console.warn(`isTaskEligible called with invalid taskId: ${taskId}`);
        return { eligible: false, timeLeft: 0 };
    }

    // <-- CORREÇÃO: Usa currentWalletAddress (ID real)
    const lastClaimRef = doc(db, "airdrop_users", currentWalletAddress, "task_claims", taskId);
    const lastClaimSnap = await getDoc(lastClaimRef);

    const cooldownMs = cooldownHours * 60 * 60 * 1000; // Cooldown em milissegundos

    // Se nunca fez a tarefa, está elegível
    if (!lastClaimSnap.exists()) {
        return { eligible: true, timeLeft: 0 };
    }

    const lastClaimData = lastClaimSnap.data();
    const lastClaimTimestamp = lastClaimData?.timestamp; // Timestamp salvo como string ISO

    // Se timestamp ausente ou inválido, permite claim (corrige dados antigos/inválIDOS)
    if (typeof lastClaimTimestamp !== 'string' || lastClaimTimestamp.trim() === '') {
        console.warn(`Missing/invalid timestamp for task ${taskId}. Allowing claim.`);
        return { eligible: true, timeLeft: 0 };
    }

    try {
        const lastClaimDate = new Date(lastClaimTimestamp);
        if (isNaN(lastClaimDate.getTime())) { // Verifica se a data é válida
             console.warn(`Invalid timestamp format for task ${taskId}:`, lastClaimTimestamp, ". Allowing claim.");
             return { eligible: true, timeLeft: 0 };
        }

        const lastClaimTime = lastClaimDate.getTime();
        const now = Date.now();
        const elapsed = now - lastClaimTime; // Tempo desde o último claim

        if (elapsed >= cooldownMs) {
            return { eligible: true, timeLeft: 0 }; // Cooldown passou
        } else {
            return { eligible: false, timeLeft: cooldownMs - elapsed }; // Cooldown ativo, retorna tempo restante
        }
    } catch (dateError) {
         console.error(`Error parsing timestamp string for task ${taskId}:`, lastClaimTimestamp, dateError);
         return { eligible: true, timeLeft: 0 }; // Erro ao processar, permite claim por segurança
    }
}

/**
 * Registra a conclusão de uma tarefa diária pelo usuário, atualiza pontos e cooldown.
 * @param {object} task Objeto da tarefa (com id, points, cooldownHours).
 * @param {number} currentMultiplier Multiplicador atual do usuário (NÃO USADO AQUI).
 * @returns {Promise<number>} Os pontos ganhos.
 */
export async function recordDailyTaskCompletion(task, currentMultiplier) {
    ensureAuthenticated();

    if (!task || !task.id) throw new Error("Invalid task data provided.");

    // Verifica elegibilidade ANTES de continuar
    const eligibility = await isTaskEligible(task.id, task.cooldownHours);
    if (!eligibility.eligible) {
        throw new Error("Cooldown period is still active for this task.");
    }

    // <-- CORREÇÃO: Usa currentWalletAddress (ID real)
    const userRef = doc(db, "airdrop_users", currentWalletAddress);

    // Valida e arredonda os pontos da tarefa
    const pointsToAdd = Math.round(task.points);
    if (isNaN(pointsToAdd) || pointsToAdd < 0) throw new Error("Invalid points value for the task.");

    // Atualiza total de pontos do usuário
    await updateDoc(userRef, { totalPoints: increment(pointsToAdd) });

    // <-- CORREÇÃO: Usa currentWalletAddress (ID real)
    const claimRef = doc(db, "airdrop_users", currentWalletAddress, "task_claims", task.id);
    await setDoc(claimRef, {
        timestamp: new Date().toISOString(), // Salva como string ISO
        points: pointsToAdd // Salva os pontos concedidos (para referência)
    });

    return pointsToAdd; // Retorna os pontos adicionados
}


// --- Helper Interno: Detecta Plataforma, Valida URL e Busca Pontos Base (CORRIGIDO PARA MÚLTIPLAS REDES E SHORTS) ---
/**
 * Analisa uma URL, detecta a plataforma (YouTube, YouTube Shorts, Instagram, X/Twitter, Other),
 * valida o formato (ex: YouTube deve ser vídeo), e busca os pontos base na config.
 * @param {string} url A URL enviada pelo usuário.
 * @returns {Promise<{platform: string, basePoints: number, isValid: boolean, normalizedUrl: string}>}
 * @throws {Error} Se a URL for inválida ou a configuração não for encontrada.
 */
async function detectPlatformAndValidate(url) {
    const normalizedUrl = url.trim().toLowerCase();
    let platform = 'Other'; // Padrão
    let isValid = true; // Assume válido

    // 1. Detecção e Validação Específica
    
    // YOUTUBE SHORTS
    if (normalizedUrl.includes('youtube.com/shorts/')) {
        platform = 'YouTube Shorts';
        const shortIdMatch = normalizedUrl.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
        if (!shortIdMatch || !shortIdMatch[1]) {
            isValid = false;
            throw new Error("Invalid YouTube Shorts URL: Video ID not found or incorrect format.");
        }
    }
    // VÍDEO REGULAR DO YOUTUBE
    else if (normalizedUrl.includes('youtube.com/watch?v=') || normalizedUrl.includes('youtu.be/')) {
        platform = 'YouTube';
        const videoIdMatch = normalizedUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[?&]|$)/);
        if (!videoIdMatch || videoIdMatch[1].length !== 11) {
            isValid = false;
            throw new Error("Invalid YouTube URL: Video ID not found or incorrect format.");
        }
    }
    // OUTROS LINKS DO YOUTUBE
    else if (normalizedUrl.includes('youtube.com/')) { 
        platform = 'YouTube';
        isValid = false;
        throw new Error("Invalid YouTube URL: Only video links (youtube.com/watch?v=... or youtu.be/...) or Shorts links are accepted.");
    }
    // Instagram
    else if (normalizedUrl.includes('instagram.com/p/') || normalizedUrl.includes('instagram.com/reel/')) {
        platform = 'Instagram';
        const postIdMatch = normalizedUrl.match(/\/(?:p|reel)\/([a-zA-Z0-9_.-]+)/);
        if (!postIdMatch || !postIdMatch[1]) isValid = false; // Se não houver ID, marca inválido
    } 
    // X/Twitter
    else if (normalizedUrl.includes('twitter.com/') || normalizedUrl.includes('x.com/')) {
        if (normalizedUrl.match(/(\w+)\/(?:status|statuses)\/(\d+)/)) {
             platform = 'X/Twitter';
        } 
    }
    // Facebook
    else if (normalizedUrl.includes('facebook.com/') && normalizedUrl.includes('/posts/')) {
        platform = 'Facebook';
    } 
    // Telegram (links de postagem/canais públicos)
    else if (normalizedUrl.includes('t.me/') || normalizedUrl.includes('telegram.org/')) {
        platform = 'Telegram';
    } 
    // TikTok
    else if (normalizedUrl.includes('tiktok.com/')) {
        platform = 'TikTok';
    } 
    // Reddit
    else if (normalizedUrl.includes('reddit.com/r/')) {
        platform = 'Reddit';
    } 
    // LinkedIn
    else if (normalizedUrl.includes('linkedin.com/posts/')) {
        platform = 'LinkedIn';
    }

    // Links não identificados permanecem como 'Other'

    // 2. Busca Pontos Base da Configuração Pública
    const publicData = await getPublicAirdropData(); // Reutiliza a função
    const ugcPointsConfig = publicData.config?.ugcBasePoints || {}; // Pega pontos da config

    // Busca ponto da plataforma, senão 'Other', senão fallback 1000
    const basePoints = ugcPointsConfig[platform] || ugcPointsConfig['Other'] || 1000;

    // Valida os pontos buscados
    if (isNaN(basePoints) || basePoints < 0) { // Permite 0
        throw new Error(`Invalid base points configured for platform: ${platform}. Please contact admin.`);
    }

    return { platform, basePoints, isValid, normalizedUrl };
}


/**
 * Adiciona uma submissão UGC, detectando plataforma, validando, verificando duplicatas,
 * e salvando-a como 'pending' sem conceder pontos imediatamente.
 * @param {string} url URL da postagem.
 * @throws {Error} Se a URL for inválida, duplicada, ou outro erro ocorrer.
 */
export async function addSubmission(url) { // Recebe apenas URL
    ensureAuthenticated();
    
    // <-- CORREÇÃO: Usa currentWalletAddress (ID real)
    const userRef = doc(db, "airdrop_users", currentWalletAddress);
    const userSubmissionsCol = collection(db, "airdrop_users", currentWalletAddress, "submissions");
    const logSubmissionsCol = collection(db, "all_submissions_log");

    // Validação básica de URL (início http/https)
    const trimmedUrl = url.trim();
    if (!trimmedUrl || (!trimmedUrl.toLowerCase().startsWith('http://') && !trimmedUrl.toLowerCase().startsWith('https://'))) {
        throw new Error(`The provided URL must start with http:// or https://.`);
    }

    // --- Detecta Plataforma, Valida Específica e Busca Pontos ---
    let detectionResult;
    try {
        detectionResult = await detectPlatformAndValidate(trimmedUrl);
    } catch (validationError) {
        // Repassa erros específicos de validação (ex: YouTube não-vídeo)
        throw validationError;
    }
    const { platform, basePoints, isValid, normalizedUrl } = detectionResult;
    // Se a validação específica falhou (ex: Instagram sem ID)
    if (!isValid) {
         throw new Error(`The provided URL for ${platform} does not appear valid for submission.`);
    }
    // --- Fim Detecção/Validação ---

    
    // ==========================================================
    //  INÍCIO DA ALTERAÇÃO (Rate Limit Global de 5 Minutos)
    // ==========================================================
    
    // Verifica o último post DESTE usuário (QUALQUER plataforma)
    // Isso não precisa mais do índice composto (platform + submittedAt)
    const qLastPost = query(userSubmissionsCol,
        orderBy("submittedAt", "desc"),   // Ordena pela mais recente
        limit(1)                          // Pega apenas a última
    );
    
    const lastPostSnapshot = await getDocs(qLastPost);

    if (!lastPostSnapshot.empty) {
        const lastSubmission = lastPostSnapshot.docs[0].data();
        // Converte o Timestamp do Firebase para um objeto Date do JS
        const lastSubmittedAt = lastSubmission.submittedAt?.toDate(); 
        
        if (lastSubmittedAt) {
            const now = new Date(); // Data/hora atual
            const fiveMinutesMs = 5 * 60 * 1000; // 5 minutos em milissegundos
            const timeSinceLastPost = now.getTime() - lastSubmittedAt.getTime();

            // Se o tempo passado for MENOR que 5 minutos, bloqueia.
            if (timeSinceLastPost < fiveMinutesMs) {
                const timeLeftMs = fiveMinutesMs - timeSinceLastPost;
                // Arredonda para cima para o minuto mais próximo
                const minutesLeft = Math.ceil(timeLeftMs / 60000); 
                
                // --- MENSAGEM GLOBAL ATUALIZADA (EM INGLÊS) ---
                // Não menciona mais a plataforma específica
                throw new Error(`We're building a strong community, and we value quality over quantity. To prevent spam, please wait ${minutesLeft} more minute(s) before submitting another post. We appreciate your thoughtful contribution!`);
            }
        }
    }
    // ==========================================================
    //  FIM DA ALTERAÇÃO
    // ==========================================================


    // --- Verificação de Duplicatas no Log Central ---
    const qLog = query(logSubmissionsCol,
        where("normalizedUrl", "==", normalizedUrl),
        // Verifica se já existe com status que não seja 'rejected' ou 'deleted_by_user'
        where("status", "in", ["pending", "approved", "auditing", "flagged_suspicious"])
    );
    const logSnapshot = await getDocs(qLog);
    if (!logSnapshot.empty) {
        throw new Error("This content link has already been submitted. Repeatedly submitting duplicate or fraudulent content may lead to account suspension.");
    }
    // --- Fim Verificação ---

    // --- Pega dados do usuário para calcular pontos ---
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User profile not found.");
    const userData = userSnap.data();

    // ==========================================================
    //  INÍCIO DA ALTERAÇÃO (Cálculo de Pontos)
    // ==========================================================
    const currentApprovedCount = userData.approvedSubmissionsCount || 0;
    // Multiplicador baseado na contagem ATUAL (não +1, pois esta não foi aprovada ainda)
    const multiplierApplied = getMultiplierByTier(currentApprovedCount); // <-- MUDANÇA
    const pointsAwarded = Math.round(basePoints * multiplierApplied); // <-- MUDANÇA
    // ==========================================================
    //  FIM DA ALTERAÇÃO
    // ==========================================================


    // --- Prepara Dados para Salvar ---
    const submissionTimestamp = serverTimestamp(); // Timestamp único para ambos
    // Subcoleção do usuário
    const submissionDataUser = {
        url: trimmedUrl, // URL Original
        platform: platform, // Plataforma Detectada
        status: 'pending', // Status inicial é PENDING
        basePoints: basePoints, //
        _pointsCalculated: pointsAwarded, // Guarda pontos (base * multiplicador)
        _multiplierApplied: multiplierApplied, // Guarda multiplicador usado
        pointsAwarded: 0, // Pontos ainda não foram concedidos
        submittedAt: submissionTimestamp, //
        resolvedAt: null, //
    };
    // Log central
    const submissionDataLog = {
        // <-- CORREÇÃO: O 'userId' agora é a CARTEIRA
        userId: currentWalletAddress,
        walletAddress: userData.walletAddress,
        normalizedUrl: normalizedUrl,
        platform: platform,
        status: 'pending', // Status inicial é PENDING
        basePoints: basePoints,
        submittedAt: submissionTimestamp,
        resolvedAt: null,
    };

    // --- Salva submissão (SEM ATUALIZAR PONTOS/CONTAGEM) ---
    const batch = writeBatch(db);
    const newUserSubmissionRef = doc(userSubmissionsCol); // Gera ID
    batch.set(newUserSubmissionRef, submissionDataUser); // Salva na subcoleção
    const newLogSubmissionRef = doc(logSubmissionsCol, newUserSubmissionRef.id); // Usa mesmo ID no log
    batch.set(newLogSubmissionRef, submissionDataLog); // Salva no log
    
    // NENHUMA ATUALIZAÇÃO NO PERFIL DO USUÁRIO AQUI
    
    await batch.commit(); // Executa
}

/**
 * Busca o histórico de submissões de um usuário.
 * @returns {Promise<Array<object>>} Lista de submissões.
 */
export async function getUserSubmissions() {
    ensureAuthenticated();
    // <-- CORREÇÃO: Usa currentWalletAddress (ID real)
    const submissionsCol = collection(db, "airdrop_users", currentWalletAddress, "submissions");
    // Busca TUDO, ordenado
    const q = query(submissionsCol, orderBy("submittedAt", "desc")); // Mais recentes primeiro
    const snapshot = await getDocs(q);
    // Mapeia e converte timestamps
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            submissionId: doc.id,
            ...data,
            // Converte timestamps para Date
            submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : null,
            resolvedAt: data.resolvedAt?.toDate ? data.resolvedAt.toDate() : null,
        };
    });
}

/**
 * Busca as submissões flagradas de um usuário que precisam de resolução.
 * (Esta função não é mais necessária, mas mantida por segurança)
 * @returns {Promise<Array<object>>} Lista de submissões flagradas.
 */
export async function getUserFlaggedSubmissions() {
    ensureAuthenticated();
    // <-- CORREÇÃO: Usa currentWalletAddress (ID real)
    const submissionsCol = collection(db, "airdrop_users", currentWalletAddress, "submissions");
    // Busca apenas as flagradas, ordenadas pelas mais recentes
    const q = query(submissionsCol, where("status", "==", "flagged_suspicious"), orderBy("submittedAt", "desc"));
    const snapshot = await getDocs(q);
    // Mapeia e converte timestamps
    return snapshot.docs.map(doc => {
         const data = doc.data();
        return {
            submissionId: doc.id,
            ...data,
            submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : null,
            // resolvedAt não é necessário aqui
        };
    });
}


/**
 * Permite ao usuário resolver uma submissão que foi flagrada pelo sistema.
 * @param {string} submissionId ID da submissão flagrada.
 * @param {string} resolution Resolução do usuário ('not_fraud' ou 'is_fraud').
 */
export async function resolveFlaggedSubmission(submissionId, resolution) {
    ensureAuthenticated();
    // <-- CORREÇÃO: Usa currentWalletAddress (ID real)
    const userRef = doc(db, "airdrop_users", currentWalletAddress);
    const submissionRef = doc(db, "airdrop_users", currentWalletAddress, "submissions", submissionId);
    const logSubmissionRef = doc(db, "all_submissions_log", submissionId);

    const submissionSnap = await getDoc(submissionRef);
    if (!submissionSnap.exists() || submissionSnap.data().status !== 'flagged_suspicious') {
        throw new Error("Submission not found or not flagged for review.");
    }

    const submissionData = submissionSnap.data();
    const batch = writeBatch(db);

    if (resolution === 'not_fraud') {
        // --- AGE COMO 'confirmSubmission' ---
        // Usuário diz que é legítimo, então APROVA e DÁ OS PONTOS
        
        // ==========================================================
        //  INÍCIO DA CORREÇÃO (Bug dos Pontos Legados / NaN)
        // ==========================================================
        let pointsToAward = submissionData._pointsCalculated;
        let multiplierApplied = submissionData._multiplierApplied;

        // ADICIONADO: "isNaN(pointsToAward)"
        if (typeof pointsToAward !== 'number' || isNaN(pointsToAward) || pointsToAward <= 0) {
            console.warn(`[ResolveFlagged] Legacy/Invalid submission ${submissionId} missing/invalid _pointsCalculated. Recalculating...`);
            const basePoints = submissionData.basePoints || 0;
            const userSnap = await getDoc(userRef); // Precisa ler o usuário
            if (!userSnap.exists()) throw new Error("User profile not found for recalculation.");
            const userData = userSnap.data();
            const currentApprovedCount = userData.approvedSubmissionsCount || 0;
            
            multiplierApplied = getMultiplierByTier(currentApprovedCount); // Recalcula multiplicador
            pointsToAward = Math.round(basePoints * multiplierApplied);

            // ADICIONADO: "isNaN(pointsToAward)"
            if (isNaN(pointsToAward) || pointsToAward <= 0) {
                 console.warn(`[ResolveFlagged] Recalculation failed (basePoints: ${basePoints}). Using fallback 1000.`);
                 pointsToAward = Math.round(1000 * multiplierApplied);
            }
        }
        // ==========================================================
        //  FIM DA CORREÇÃO
        // ==========================================================
        
        // Atualiza perfil do usuário
        batch.update(userRef, {
            totalPoints: increment(pointsToAward),
            approvedSubmissionsCount: increment(1)
        });

        // Atualiza submissão
        batch.update(submissionRef, {
            status: 'approved',
            pointsAwarded: pointsToAward, // Salva os pontos concedidos
            _pointsCalculated: pointsToAward, // Garante que foi salvo
            _multiplierApplied: multiplierApplied, // Garante que foi salvo
            resolvedAt: serverTimestamp()
        });

        // Atualiza log
        if (await getDoc(logSubmissionRef).then(s => s.exists())) {
            batch.update(logSubmissionRef, {
                status: 'approved',
                resolvedAt: serverTimestamp()
            });
        }

    } else { // resolution === 'is_fraud'
        // --- AGE COMO 'deleteSubmission' (mas para rejeição) ---
        // Usuário diz que é fraude, então REJEITA.
        // Nenhum ponto é dado (pois nunca foi dado).
        // Apenas incrementa a contagem de rejeição.
        
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("User profile not found.");
        const userData = userSnap.data();
        const userUpdates = {};

        // Incrementa rejeição e aplica banimento
        const currentRejectedCount = userData.rejectedCount || 0;
        userUpdates.rejectedCount = increment(1);
        if (currentRejectedCount + 1 >= 3) {
            userUpdates.isBanned = true;
        }

        // Aplica atualizações no usuário
        if (Object.keys(userUpdates).length > 0) {
            batch.update(userRef, userUpdates);
        }

        // Atualiza submissão do usuário para 'rejected'
        batch.update(submissionRef, {
            status: 'rejected',
            pointsAwarded: 0,
            // multiplierApplied: 0, // <-- CORREÇÃO: Não zera, mantém o original para histórico
            resolvedAt: serverTimestamp()
        });

        // Atualiza log central para 'rejected'
        if (await getDoc(logSubmissionRef).then(s => s.exists())) {
             batch.update(logSubmissionRef, {
                status: 'rejected',
                resolvedAt: serverTimestamp()
            });
        }
    }

    await batch.commit();
}


/**
 * Permite ao usuário confirmar que a submissão, após auditoria visual, é legítima.
 * O status é alterado de 'pending' para 'approved' E CONCEDE OS PONTOS.
 * [CORRIGIDO: Adicionado fallback para posts legados sem _pointsCalculated]
 * @param {string} submissionId ID da submissão.
 */
export async function confirmSubmission(submissionId) { 
    ensureAuthenticated();
    // <-- CORREÇÃO: Usa currentWalletAddress (ID real)
    const userId = currentWalletAddress; 
    
    // Referências necessárias
    const userRef = doc(db, "airdrop_users", userId); // Ref ao perfil do usuário
    const submissionRef = doc(db, "airdrop_users", userId, "submissions", submissionId);
    const logSubmissionRef = doc(db, "all_submissions_log", submissionId);

    // --- 1. Verificar a existência do documento ANTES de iniciar o batch ---
    const submissionSnap = await getDoc(submissionRef);
    if (!submissionSnap.exists()) {
        throw new Error("Cannot confirm submission: Document not found or already processed.");
    }
    
    const submissionData = submissionSnap.data();
    const currentStatus = submissionData.status;
    
    // Se já estiver aprovado ou rejeitado, não processar novamente.
    if (currentStatus === 'approved' || currentStatus === 'rejected') {
        throw new Error(`Submission is already in status: ${currentStatus}.`);
    }

    // ==========================================================
    //  INÍCIO DA CORREÇÃO (Bug dos Pontos Legados / NaN)
    // ==========================================================
    
    // Pega os pontos a serem concedidos
    let pointsToAward = submissionData._pointsCalculated;
    let multiplierApplied = submissionData._multiplierApplied; // Pega o multiplicador salvo

    // Fallback para submissões antigas (legacy) que não têm _pointsCalculated
    // ADICIONADO: "isNaN(pointsToAward)"
    if (typeof pointsToAward !== 'number' || isNaN(pointsToAward) || pointsToAward <= 0) {
        console.warn(`[ConfirmSubmission] Legacy/Invalid submission ${submissionId} missing/invalid _pointsCalculated. Recalculating...`);
        
        // 1. Pega os pontos base da submissão
        const basePoints = submissionData.basePoints || 0;
        
        // 2. Pega o perfil do usuário (precisa ler)
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("User profile not found for recalculation.");
        const userData = userSnap.data();
        
        // 3. Pega a contagem de aprovados ATUAL (antes deste)
        const currentApprovedCount = userData.approvedSubmissionsCount || 0;
        
        // 4. Calcula o multiplicador
        multiplierApplied = getMultiplierByTier(currentApprovedCount); // Recalcula
        
        // 5. Calcula os pontos
        pointsToAward = Math.round(basePoints * multiplierApplied);

        // Se ainda for 0, busca um fallback (ex: se basePoints também faltar)
        // ADICIONADO: "isNaN(pointsToAward)"
        if (isNaN(pointsToAward) || pointsToAward <= 0) {
             console.warn(`[ConfirmSubmission] Recalculation failed (basePoints: ${basePoints}). Using fallback 1000.`);
             // Tenta um fallback final
             pointsToAward = Math.round(1000 * multiplierApplied); // Usa 1000 como base
        }
    }
    // ==========================================================
    //  FIM DA CORREÇÃO
    // ==========================================================


    // Usa um batch para garantir atomicidade das atualizações
    const batch = writeBatch(db);
    
    // --- 2. ATUALIZA O PERFIL DO USUÁRIO ---
    // Concede os pontos e incrementa a contagem de aprovação
    batch.update(userRef, {
        totalPoints: increment(pointsToAward), // <-- Usa o valor corrigido
        approvedSubmissionsCount: increment(1)
    });

    // 3. Atualiza status para 'approved' na subcoleção do usuário
    batch.update(submissionRef, { 
        status: 'approved',
        pointsAwarded: pointsToAward, // Salva o valor concedido
        _pointsCalculated: pointsToAward, // Salva o valor (para corrigir dados legados)
        _multiplierApplied: multiplierApplied, // Salva o multiplicador (para corrigir dados legados)
        resolvedAt: serverTimestamp() 
    });

    // 4. Atualiza status para 'approved' no log central (se existir)
    if (await getDoc(logSubmissionRef).then(s => s.exists())) {
        batch.update(logSubmissionRef, { 
            status: 'approved',
            resolvedAt: serverTimestamp()
        });
    }

    // Executa as atualizações
    await batch.commit();
}


/**
 * Permite ao usuário deletar uma submissão reportada como erro (Report Error).
 * Nenhum ponto é descontado (pois nunca foram dados).
 * @param {string} submissionId ID da submissão.
 */
export async function deleteSubmission(submissionId) { 
    ensureAuthenticated();
    // <-- CORREÇÃO: Usa currentWalletAddress (ID real)
    const userId = currentWalletAddress; 
    
    const submissionRef = doc(db, "airdrop_users", userId, "submissions", submissionId);
    const logSubmissionRef = doc(db, "all_submissions_log", submissionId);

    const submissionSnap = await getDoc(submissionRef);
    if (!submissionSnap.exists()) {
        // Se já não existe, apenas retorna sucesso para evitar erros no frontend.
        return console.warn(`Delete submission skipped: Document ${submissionId} not found.`);
    }
    
    const currentStatus = submissionSnap.data().status;

    // Apenas permite deletar se AINDA não foi processado
    if (currentStatus === 'approved' || currentStatus === 'rejected') {
        throw new Error(`This submission was already ${currentStatus} and cannot be deleted.`);
    }
    if (currentStatus === 'flagged_suspicious') {
        throw new Error("Flagged submissions must be resolved, not deleted.");
    }
    
    const batch = writeBatch(db);
    
    // --- NENHUMA MUDANÇA EM PONTOS/CONTAGEM ---
    // (Apenas muda o status)

    // Deleta o documento na subcoleção do usuário (ou marca como deleted)
    // Vamos marcar como 'deleted' para manter no histórico "Finalizados"
    batch.update(submissionRef, {
        status: 'deleted_by_user',
        resolvedAt: serverTimestamp()
    });

    // Atualiza o log central
    if (await getDoc(logSubmissionRef).then(s => s.exists())) {
         batch.update(logSubmissionRef, {
             status: 'deleted_by_user',
             resolvedAt: serverTimestamp(),
             pointsAwarded: 0 // Garante que a pontuação no log seja 0
         });
    }

    await batch.commit();
}


// =======================================================
//  FUNÇÕES DE ADMIN (MANTIDAS)
// =======================================================

/**
 * Atualiza os pontos base para plataformas UGC no documento de config pública.
 * @param {object} newPoints Objeto com { 'PlatformName': points }.
 */
export async function updateUgcBasePoints(newPoints) {
    const dataRef = doc(db, "airdrop_public_data", "data_v1");
    // Usa setDoc com merge: true para atualizar apenas config.ugcBasePoints
    await setDoc(dataRef, {
        config: {
            ugcBasePoints: newPoints
        }
    }, { merge: true }); // Merge evita apagar outros campos em 'config'
}

/**
 * Busca todas as tarefas diárias (ativas e inativas) para o painel admin.
 * @returns {Promise<Array<object>>} Lista de tarefas.
 */
export async function getAllTasksForAdmin() {
    const tasksCol = collection(db, "daily_tasks");
    const q = query(tasksCol, orderBy("endDate", "asc"));
    const snapshot = await getDocs(q);
    // Mapeia e converte timestamps para Date
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate ? doc.data().startDate.toDate() : null,
        endDate: doc.data().endDate?.toDate ? doc.data().endDate.toDate() : null,
    }));
}

/**
 * Cria ou atualiza uma tarefa diária no Firestore.
 * @param {object} taskData Dados da tarefa (com ou sem id).
 */
export async function addOrUpdateDailyTask(taskData) {
     const dataToSave = { ...taskData };
     // Converte Date para Timestamp antes de salvar
    if (dataToSave.startDate instanceof Date) dataToSave.startDate = Timestamp.fromDate(dataToSave.startDate);
    if (dataToSave.endDate instanceof Date) dataToSave.endDate = Timestamp.fromDate(dataToSave.endDate);

     const taskId = taskData.id;
     // Remove ID se for criação ou se estiver vazio/null
     if (!taskId) {
         delete dataToSave.id;
         await addDoc(collection(db, "daily_tasks"), dataToSave); // Cria novo
     } else {
         // Atualiza documento existente
         const taskRef = doc(db, "daily_tasks", taskId);
         delete dataToSave.id; // Não salva o ID dentro do documento
         await setDoc(taskRef, dataToSave, { merge: true }); // Merge para atualização
     }
}

/**
 * Deleta uma tarefa diária pelo ID.
 * @param {string} taskId ID da tarefa a ser deletada.
 */
export async function deleteDailyTask(taskId) {
    if (!taskId) throw new Error("Task ID is required for deletion.");
    await deleteDoc(doc(db, "daily_tasks", taskId));
}


// -----------------------------------------------------------------
// NOTA: O 'userId' nos parâmetros das funções abaixo agora é o 
// endereço da carteira, o que está correto.
// -----------------------------------------------------------------


/**
 * Busca todas as submissões pendentes, em auditoria ou flagradas para revisão do admin.
 * (VERSÃO OTIMIZADA: Busca do 'all_submissions_log' em vez de fazer N+1 queries)
 * @returns {Promise<Array<object>>} Lista de submissões para revisão.
 */
export async function getAllSubmissionsForAdmin() {
    // 1. Referencia a coleção de LOG CENTRAL
    const logCol = collection(db, "all_submissions_log");

    // 2. Cria a consulta para buscar apenas os status relevantes
    const q = query(logCol,
        where("status", "in", ["pending", "auditing", "flagged_suspicious"]),
        orderBy("submittedAt", "desc") // Ordena pelos mais recentes
    );

    // 3. Executa APENAS UMA CONSULTA
    const logSnapshot = await getDocs(q);

    // 4. Mapeia os resultados
    return logSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            // O log já contém userId e walletAddress
            // <-- NOTA: data.userId AGORA É O ENDERÇO DA CARTEIRA
            userId: data.userId,
            walletAddress: data.walletAddress,
            submissionId: doc.id, // O ID do documento é o ID da submissão
            ...data,
            // Converte timestamps
            submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : null,
            resolvedAt: data.resolvedAt?.toDate ? data.resolvedAt.toDate() : null,
        };
    });
}


/**
 * Atualiza o status de uma submissão (pelo Admin).
 * Se aprovar, concede os pontos. Se rejeitar, apenas incrementa a rejeição.
 * [CORRIGIDO: Adicionado fallback para posts legados sem _pointsCalculated]
 * @param {string} userId ID do usuário (AGORA É A CARTEIRA).
 * @param {string} submissionId ID da submissão.
 * @param {string} status Novo status ('approved' ou 'rejected').
 */
export async function updateSubmissionStatus(userId, submissionId, status) {
    
    // ==========================================================
    //  INÍCIO DA CORREÇÃO (Bug Carteira Duplicada)
    // ==========================================================
    if (!userId) throw new Error("User ID (walletAddress) is required.");
    const normalizedUserId = userId.toLowerCase();
    // ==========================================================
    //  FIM DA CORREÇÃO
    // ==========================================================

    // <-- NOTA: userId aqui é a CARTEIRA (vindo do log)
    const userRef = doc(db, "airdrop_users", normalizedUserId); // <-- USA A VARIÁVEL NORMALIZADA
    const submissionRef = doc(db, "airdrop_users", normalizedUserId, "submissions", submissionId); // <-- USA A VARIÁVEL NORMALIZADA
    const logSubmissionRef = doc(db, "all_submissions_log", submissionId);

    // Lê os 3 documentos
    const [userSnap, submissionSnap, logSnap] = await Promise.all([
         getDoc(userRef), getDoc(submissionRef), getDoc(logSubmissionRef)
    ]);

    if (!submissionSnap.exists()) throw new Error("Submission not found in user collection.");
    if (!userSnap.exists()) throw new Error("User profile not found.");
    if (!logSnap.exists()) console.warn(`Log entry ${submissionId} not found. Log will not be updated.`);

    const submissionData = submissionSnap.data();
    const userData = userSnap.data();
    const currentStatus = submissionData.status;

    // Evita processamento desnecessário
    if (currentStatus === status) {
        console.warn(`Admin action ignored: Submission ${submissionId} already has status ${status}.`);
        return;
    }

    const batch = writeBatch(db);
    const userUpdates = {};
    let finalPointsAwarded = 0;
    // --- CORREÇÃO: Mantém o multiplicador salvo na submissão ---
    let finalMultiplier = submissionData._multiplierApplied || 0; 
    // --- FIM CORREÇÃO ---


    // --- Lógica de Aprovação pelo Admin ---
    if (status === 'approved') {
        
        // ==========================================================
        //  INÍCIO DA CORREÇÃO (Bug dos Pontos Legados / NaN)
        // ==========================================================
        
        let pointsToAward = submissionData._pointsCalculated;

        // Fallback para submissões antigas (legacy) que não têm _pointsCalculated
        // ADICIONADO: "isNaN(pointsToAward)"
        if (typeof pointsToAward !== 'number' || isNaN(pointsToAward) || pointsToAward <= 0) {
            console.warn(`[Admin] Legacy/Invalid submission ${submissionId} missing/invalid _pointsCalculated. Recalculating...`);
            
            // 1. Pega os pontos base da submissão (salvos em addSubmission)
            const basePoints = submissionData.basePoints || 0; 
            
            // 2. Pega a contagem de aprovados do usuário (ANTES de incrementar)
            const currentApprovedCount = userData.approvedSubmissionsCount || 0;
            
            // 3. Pega o multiplicador que DEVERIA ter sido aplicado
            const multiplierApplied = getMultiplierByTier(currentApprovedCount);
            
            // 4. Calcula os pontos
            pointsToAward = Math.round(basePoints * multiplierApplied);
            
            // Se ainda for 0, busca um fallback
            // ADICIONADO: "isNaN(pointsToAward)"
            if (isNaN(pointsToAward) || pointsToAward <= 0) {
                 console.warn(`[Admin] Recalculation failed (basePoints: ${basePoints}). Using fallback 1000.`);
                 const fallbackMultiplier = getMultiplierByTier(currentApprovedCount);
                 pointsToAward = Math.round(1000 * fallbackMultiplier); // Usa 1000 como base
            }
            finalMultiplier = multiplierApplied; // Salva o multiplicador recém-calculado
        }
        // ==========================================================
        //  FIM DA CORREÇÃO
        // ==========================================================
        
        finalPointsAwarded = pointsToAward;

        userUpdates.totalPoints = increment(pointsToAward);
        userUpdates.approvedSubmissionsCount = increment(1);
        
        // Se estava 'rejected' anteriormente, reverte a contagem de rejeição
        if (currentStatus === 'rejected') {
             userUpdates.rejectedCount = increment(-1); // Reduz contagem de rejeição
        }

    // --- Lógica de Rejeição pelo Admin ---
    } else if (status === 'rejected') {
        
        // NENHUM PONTO É DESCONTADO (pois nunca foram dados)

        // Incrementa rejeição e aplica banimento, *apenas se não estava rejeitado antes*
        if (currentStatus !== 'rejected') {
            const currentRejectedCount = userData.rejectedCount || 0;
            userUpdates.rejectedCount = increment(1);
            if (currentRejectedCount + 1 >= 3) { // Limite para banimento
                userUpdates.isBanned = true;
            }
        }
        // Se estava 'approved' antes, remove os pontos
        else if (currentStatus === 'approved') {
             const pointsToRemove = submissionData.pointsAwarded || 0;
             userUpdates.totalPoints = increment(-pointsToRemove);
             userUpdates.approvedSubmissionsCount = increment(-1);
             // E adiciona a rejeição
             const currentRejectedCount = userData.rejectedCount || 0;
             userUpdates.rejectedCount = increment(1);
             if (currentRejectedCount + 1 >= 3) {
                 userUpdates.isBanned = true;
             }
        }


        // Zera os campos na submissão ao rejeitar
        finalPointsAwarded = 0;
        // --- CORREÇÃO: Mantém o multiplicador salvo para referência ---
        // finalMultiplier = 0; // (Não zera, apenas os pontos)
        // --- FIM CORREÇÃO ---
    }

    // --- Aplica Atualizações ---
    // Garante que contagens/pontos não fiquem negativos
    if (userUpdates.approvedSubmissionsCount?.operand < 0 && (userData.approvedSubmissionsCount || 0) <= 0) userUpdates.approvedSubmissionsCount = 0;
    if (userUpdates.rejectedCount?.operand < 0 && (userData.rejectedCount || 0) <= 0) userUpdates.rejectedCount = 0;
    
    // ==========================================================
    //  INÍCIO DA CORREÇÃO (Evitar Pontos Negativos)
    // ==========================================================
    // Lógica de verificação de pontos negativos (para setar para 0 se o resultado for < 0)
    if (userUpdates.totalPoints?.operand < 0) {
         const currentPoints = userData.totalPoints || 0;
         const pointsToRemove = Math.abs(userUpdates.totalPoints.operand);
         if (currentPoints < pointsToRemove) {
             userUpdates.totalPoints = 0; // Seta para 0 em vez de incrementar negativamente
         }
    }
    // ==========================================================
    //  FIM DA CORREÇÃO
    // ==========================================================


    // Aplica atualizações no usuário (se houver)
    if (Object.keys(userUpdates).length > 0) {
        batch.update(userRef, userUpdates);
    }

    // Atualiza submissão do usuário
    batch.update(submissionRef, {
        status: status,
        pointsAwarded: finalPointsAwarded, // Salva 0 se rejeitado, ou os pontos calculados se aprovado
        // Salva o valor (para corrigir dados legados), mas não se for rejeitado
        _pointsCalculated: (status === 'approved' ? finalPointsAwarded : (submissionData._pointsCalculated || 0)), 
        _multiplierApplied: finalMultiplier, // <-- Salva o multiplicador usado
        resolvedAt: serverTimestamp() // Marca como resolvido pelo admin
    });

    // Atualiza log central (se existir)
    if (logSnap.exists()) {
        batch.update(logSubmissionRef, {
            status: status,
            resolvedAt: serverTimestamp()
        });
    }

    // Executa o batch
    await batch.commit();
}


/**
 * Busca todos os perfis de usuário do Airdrop para o painel admin.
 * @returns {Promise<Array<object>>} Lista de usuários.
 */
export async function getAllAirdropUsers() {
    const usersCol = collection(db, "airdrop_users");
    const q = query(usersCol, orderBy("totalPoints", "desc")); // Ordena por pontos
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id, // <-- NOTA: Este ID AGORA É A CARTEIRA
        ...doc.data(),
    }));
}

/**
 * Busca submissões de um usuário específico para o admin (ex: 'rejected').
 * @param {string} userId O ID do usuário (AGORA É A CARTEIRA).
 * @param {string} status O status para filtrar ('rejected', 'approved', etc.)
 * @returns {Promise<Array<object>>} Lista de submissões.
 */
export async function getUserSubmissionsForAdmin(userId, status) {
    if (!userId) throw new Error("User ID is required.");
    
    // ==========================================================
    //  INÍCIO DA CORREÇÃO (Bug Carteira Duplicada)
    // ==========================================================
    const normalizedUserId = userId.toLowerCase();
    // ==========================================================
    //  FIM DA CORREÇÃO
    // ==========================================================

    // <-- NOTA: userId aqui é a CARTEIRA
    const submissionsCol = collection(db, "airdrop_users", normalizedUserId, "submissions"); // <-- USA A VARIÁVEL NORMALIZADA
    const q = query(submissionsCol, where("status", "==", status), orderBy("resolvedAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        submissionId: doc.id,
        userId: normalizedUserId, // Adiciona o userId (carteira) normalizado
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate ? doc.data().submittedAt.toDate() : null,
        resolvedAt: doc.data().resolvedAt?.toDate ? doc.data().resolvedAt.toDate() : null,
    }));
}

/**
 * Define manualmente o status de banimento de um usuário.
 * @param {string} userId O ID do usuário (AGORA É A CARTEIRA).
 * @param {boolean} isBanned True para banir, False para desbanir.
 */
export async function setBanStatus(userId, isBanned) {
    if (!userId) throw new Error("User ID is required.");
    
    // ==========================================================
    //  INÍCIO DA CORREÇÃO (Bug Carteira Duplicada)
    // ==========================================================
    const normalizedUserId = userId.toLowerCase();
    // ==========================================================
    //  FIM DA CORREÇÃO
    // ==========================================================

    // <-- NOTA: userId aqui é a CARTEIRA
    const userRef = doc(db, "airdrop_users", normalizedUserId); // <-- USA A VARIÁVEL NORMALIZADA
    // Atualiza o status de ban e zera as rejeições se for desbanido
    const updates = { isBanned: isBanned };
    if (isBanned === false) {
        updates.rejectedCount = 0; // Zera a contagem de rejeição ao desbanir
    }
    await updateDoc(userRef, updates);
}


// ==========================================================
//  PLATFORM USAGE POINTS SYSTEM
//  Versão: 2.0
//  Registra pontos por uso das funcionalidades da plataforma
// ==========================================================

// Configuração padrão (sobrescrita pelo Firebase se existir)
const DEFAULT_PLATFORM_USAGE_CONFIG = {
    faucet:      { points: 1000,  maxCount: 1,  cooldownHours: 0,  enabled: true },
    delegation:  { points: 2000,  maxCount: 10, cooldownHours: 24, enabled: true },
    fortune:     { points: 1500,  maxCount: 10, cooldownHours: 1,  enabled: true },
    buyNFT:      { points: 2500,  maxCount: 10, cooldownHours: 0,  enabled: true },
    sellNFT:     { points: 1500,  maxCount: 10, cooldownHours: 0,  enabled: true },
    listRental:  { points: 1000,  maxCount: 10, cooldownHours: 0,  enabled: true },
    rentNFT:     { points: 2000,  maxCount: 10, cooldownHours: 0,  enabled: true },
    notarize:    { points: 2000,  maxCount: 10, cooldownHours: 0,  enabled: true },
    claimReward: { points: 1000,  maxCount: 10, cooldownHours: 24, enabled: true },
    unstake:     { points: 500,   maxCount: 10, cooldownHours: 0,  enabled: true },
};

/**
 * Busca a configuração de Platform Usage do Firebase.
 * Se não existir, retorna o config padrão.
 * @returns {Promise<object>} Configuração de platform usage
 */
export async function getPlatformUsageConfig() {
    try {
        const dataRef = doc(db, "airdrop_public_data", "data_v1");
        const dataSnap = await getDoc(dataRef);
        
        if (dataSnap.exists() && dataSnap.data().platformUsageConfig) {
            return dataSnap.data().platformUsageConfig;
        }
        return DEFAULT_PLATFORM_USAGE_CONFIG;
    } catch (error) {
        console.error("Error fetching platform usage config:", error);
        return DEFAULT_PLATFORM_USAGE_CONFIG;
    }
}

/**
 * Busca o uso de plataforma do usuário atual.
 * @returns {Promise<object>} Objeto com dados de uso por ação
 */
export async function getPlatformUsage() {
    ensureAuthenticated();
    
    try {
        const usageCol = collection(db, "airdrop_users", currentWalletAddress, "platform_usage");
        const snapshot = await getDocs(usageCol);
        
        const usage = {};
        snapshot.forEach(docSnap => {
            usage[docSnap.id] = docSnap.data();
        });
        
        return usage;
    } catch (error) {
        console.error("Error fetching platform usage:", error);
        return {};
    }
}

/**
 * Registra uma ação de uso da plataforma e concede pontos.
 * Chamada pelo frontend após uma transação bem-sucedida.
 * 
 * @param {string} actionType - Tipo da ação (delegation, fortune, buyNFT, etc.)
 * @param {string} txHash - Hash da transação on-chain (para verificação anti-fraude)
 * @returns {Promise<{success: boolean, pointsAwarded?: number, newCount?: number, maxCount?: number, reason?: string}>}
 */
export async function recordPlatformUsage(actionType, txHash) {
    ensureAuthenticated();
    
    // Buscar configuração
    const config = await getPlatformUsageConfig();
    const actionConfig = config[actionType];
    
    if (!actionConfig) {
        console.error(`Invalid action type: ${actionType}`);
        return { success: false, reason: 'invalid_action' };
    }
    
    // Verificar se a ação está habilitada
    if (actionConfig.enabled === false) {
        return { success: false, reason: 'action_disabled' };
    }
    
    try {
        const usageRef = doc(db, "airdrop_users", currentWalletAddress, "platform_usage", actionType);
        const usageSnap = await getDoc(usageRef);
        
        const currentData = usageSnap.exists() 
            ? usageSnap.data() 
            : { count: 0, totalPoints: 0, txHashes: [], lastClaimed: null };
        
        // Verificar limite máximo
        if (currentData.count >= actionConfig.maxCount) {
            console.log(`Max usage reached for ${actionType}: ${currentData.count}/${actionConfig.maxCount}`);
            return { success: false, reason: 'max_reached' };
        }
        
        // Verificar cooldown
        if (actionConfig.cooldownHours > 0 && currentData.lastClaimed) {
            const lastClaimed = new Date(currentData.lastClaimed);
            const hoursSince = (Date.now() - lastClaimed.getTime()) / (1000 * 60 * 60);
            
            if (hoursSince < actionConfig.cooldownHours) {
                const hoursLeft = actionConfig.cooldownHours - hoursSince;
                console.log(`Cooldown active for ${actionType}: ${hoursLeft.toFixed(1)}h remaining`);
                return { 
                    success: false, 
                    reason: 'cooldown', 
                    hoursLeft: Math.ceil(hoursLeft) 
                };
            }
        }
        
        // Verificar se txHash já foi usado (anti-fraude)
        if (txHash && currentData.txHashes?.includes(txHash)) {
            console.log(`Duplicate txHash for ${actionType}: ${txHash}`);
            return { success: false, reason: 'duplicate_tx' };
        }
        
        // Calcular novos valores
        const pointsToAward = actionConfig.points;
        const newCount = currentData.count + 1;
        const newTotalPoints = currentData.totalPoints + pointsToAward;
        const newTxHashes = txHash 
            ? [...(currentData.txHashes || []), txHash].slice(-20) // Manter últimos 20
            : currentData.txHashes || [];
        
        // Usar batch para atualizar atomicamente
        const batch = writeBatch(db);
        
        // Atualizar subcoleção platform_usage
        batch.set(usageRef, {
            count: newCount,
            totalPoints: newTotalPoints,
            lastClaimed: new Date().toISOString(),
            txHashes: newTxHashes
        });
        
        // Atualizar totais no perfil do usuário
        const userRef = doc(db, "airdrop_users", currentWalletAddress);
        batch.update(userRef, {
            platformUsagePoints: increment(pointsToAward),
            totalPoints: increment(pointsToAward)
        });
        
        await batch.commit();
        
        console.log(`✅ Platform usage recorded: ${actionType} +${pointsToAward} pts (${newCount}/${actionConfig.maxCount})`);
        
        return { 
            success: true, 
            pointsAwarded: pointsToAward,
            newCount: newCount,
            maxCount: actionConfig.maxCount
        };
        
    } catch (error) {
        console.error(`Error recording platform usage for ${actionType}:`, error);
        return { success: false, reason: 'error', message: error.message };
    }
}

/**
 * Verifica se o usuário pode realizar uma ação de plataforma.
 * Útil para mostrar na UI se a ação está disponível.
 * 
 * @param {string} actionType - Tipo da ação
 * @returns {Promise<{canDo: boolean, count: number, maxCount: number, points?: number, cooldownLeft?: number, reason?: string}>}
 */
export async function canDoPlatformAction(actionType) {
    ensureAuthenticated();
    
    const config = await getPlatformUsageConfig();
    const actionConfig = config[actionType];
    
    if (!actionConfig || actionConfig.enabled === false) {
        return { canDo: false, count: 0, maxCount: 0, reason: 'disabled' };
    }
    
    try {
        const usageRef = doc(db, "airdrop_users", currentWalletAddress, "platform_usage", actionType);
        const usageSnap = await getDoc(usageRef);
        
        const currentData = usageSnap.exists() 
            ? usageSnap.data() 
            : { count: 0, lastClaimed: null };
        
        // Verificar limite
        if (currentData.count >= actionConfig.maxCount) {
            return { 
                canDo: false, 
                count: currentData.count, 
                maxCount: actionConfig.maxCount,
                reason: 'max_reached'
            };
        }
        
        // Verificar cooldown
        if (actionConfig.cooldownHours > 0 && currentData.lastClaimed) {
            const lastClaimed = new Date(currentData.lastClaimed);
            const hoursSince = (Date.now() - lastClaimed.getTime()) / (1000 * 60 * 60);
            
            if (hoursSince < actionConfig.cooldownHours) {
                const hoursLeft = actionConfig.cooldownHours - hoursSince;
                return { 
                    canDo: false, 
                    count: currentData.count, 
                    maxCount: actionConfig.maxCount,
                    cooldownLeft: Math.ceil(hoursLeft * 60), // em minutos
                    reason: 'cooldown'
                };
            }
        }
        
        return { 
            canDo: true, 
            count: currentData.count, 
            maxCount: actionConfig.maxCount,
            points: actionConfig.points
        };
        
    } catch (error) {
        console.error(`Error checking platform action ${actionType}:`, error);
        return { canDo: false, count: 0, maxCount: 0, reason: 'error' };
    }
}

/**
 * Salva a configuração de Platform Usage (somente admin).
 * @param {object} config - Objeto de configuração
 * @returns {Promise<void>}
 */
export async function savePlatformUsageConfig(config) {
    ensureAuthenticated();
    
    const dataRef = doc(db, "airdrop_public_data", "data_v1");
    await updateDoc(dataRef, {
        platformUsageConfig: config
    });
    
    console.log("✅ Platform usage config saved:", config);
}