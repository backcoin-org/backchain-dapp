// modules/firebase-auth-service.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
// Importações necessárias do Firestore
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, getDocs, updateDoc, deleteDoc, query, where, increment, orderBy, limit, serverTimestamp, Timestamp, writeBatch } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- Configuração Firebase ---
// Substitua pelas suas credenciais reais
const firebaseConfig = {
  apiKey: "AIzaSyDKhF2_--fKtot96YPS8twuD0UoCpS-3T4", //
  authDomain: "airdropbackchainnew.firebaseapp.com", //
  projectId: "airdropbackchainnew", //
  storageBucket: "airdropbackchainnew.appspot.com", // Verifique se este é o correto (.appspot.com)
  messagingSenderId: "108371799661", //
  appId: "1:108371799661:web:d126fcbd0ba56263561964", //
  measurementId: "G-QD9EBZ0Y09" //
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig); //
const auth = getAuth(app); //
const db = getFirestore(app); //

let currentUser = null; // Armazena o usuário Firebase autenticado

// =======================================================
//  FUNÇÕES DE AUTENTICAÇÃO
// =======================================================

/**
 * Garante que o usuário esteja autenticado (pode ser anonimamente)
 * e associa/cria o perfil do Airdrop para o endereço da carteira fornecido.
 * @param {string} walletAddress Endereço da carteira Ethereum.
 * @returns {Promise<User>} O objeto do usuário Firebase autenticado.
 */
export async function signIn(walletAddress) {
    if (!walletAddress) throw new Error("Wallet address is required for Firebase sign-in."); //

    // Se já temos um usuário Firebase logado na sessão atual
    if (currentUser) { //
        await getAirdropUser(walletAddress); // Garante que o perfil do Airdrop existe/está atualizado
        return currentUser; //
    }

    // Tenta usar o usuário Firebase da sessão anterior (se a página foi recarregada)
    if (auth.currentUser) { //
        currentUser = auth.currentUser; //
        await getAirdropUser(walletAddress); //
        return currentUser; //
    }

    // Se não há usuário, tenta logar anonimamente
    return new Promise((resolve, reject) => { //
        // Usa onAuthStateChanged para garantir que o login anônimo (se necessário) complete
        const unsubscribe = onAuthStateChanged(auth, async (user) => { //
            unsubscribe(); // Roda só uma vez
            if (user) { //
                currentUser = user; //
                try { //
                    await getAirdropUser(walletAddress); // Cria/associa perfil Airdrop
                    resolve(user); //
                } catch (error) { //
                    console.error("Error linking airdrop user profile:", error); //
                    reject(error); // Rejeita se falhar em criar/associar o perfil
                }
            } else {
                // Se onAuthStateChanged retornar null (inesperado após tentativa de login),
                // tenta logar anonimamente de novo explicitamente.
                signInAnonymously(auth) //
                    .then(async (userCredential) => { //
                        currentUser = userCredential.user; //
                        await getAirdropUser(walletAddress); //
                        resolve(currentUser); //
                    })
                    .catch((error) => { //
                        console.error("Firebase Anonymous sign-in failed:", error); //
                        reject(error); // Rejeita se o login anônimo falhar
                    });
            }
        }, (error) => { //
             // Erro no listener do onAuthStateChanged
             console.error("Firebase Auth state change error:", error); //
             unsubscribe(); //
             reject(error); //
        });
    });
}

/**
 * Verifica se currentUser (usuário Firebase) está definido. Lança erro se não estiver.
 */
function ensureAuthenticated() {
    if (!currentUser) { //
        throw new Error("User not authenticated with Firebase. Please connect wallet first."); //
    }
}


// =======================================================
//  FUNÇÕES DE DADOS PÚBLICOS
// =======================================================

/**
 * Busca os dados públicos do Airdrop (configurações, tarefas ativas, rankings).
 * @returns {Promise<object>} Objeto contendo config, leaderboards e dailyTasks ativas.
 */
export async function getPublicAirdropData() {
    const dataRef = doc(db, "airdrop_public_data", "data_v1"); // Referência ao documento único
    const dataSnap = await getDoc(dataRef); //

    if (dataSnap.exists()) { //
        const data = dataSnap.data(); //

        // Processa e valida as tarefas diárias
        const tasks = (data.dailyTasks || []).map(task => { //
            // Garante que timestamps sejam objetos Date
            const startDate = task.startDate?.toDate ? task.startDate.toDate() : (task.startDate ? new Date(task.startDate) : null); //
            const endDate = task.endDate?.toDate ? task.endDate.toDate() : (task.endDate ? new Date(task.endDate) : null); //
            return { //
                ...task, //
                id: task.id || null, // Garante que a tarefa tenha um ID
                startDate: startDate instanceof Date && !isNaN(startDate) ? startDate : null, // Valida Date
                endDate: endDate instanceof Date && !isNaN(endDate) ? endDate : null,       // Valida Date
            };
        }).filter(task => task.id); // Remove tarefas sem ID

        const now = Date.now(); //

        // Filtra apenas tarefas ativas (agora >= início E agora < fim)
        const activeTasks = tasks.filter(task => { //
             const startTime = task.startDate ? task.startDate.getTime() : 0; // Início padrão: sempre ativo
             const endTime = task.endDate ? task.endDate.getTime() : Infinity; // Fim padrão: nunca expira
             return startTime <= now && now < endTime; //
        });

        // Retorna os dados públicos, garantindo que objetos existam
        return { //
            config: data.config || { ugcBasePoints: {} }, // Garante config e ugcBasePoints
            leaderboards: data.leaderboards || { top100ByPoints: [], top100ByPosts: [], lastUpdated: null }, //
            dailyTasks: activeTasks // Lista de tarefas ativas e validadas
        };
    } else {
        // Se o documento não existe, retorna valores padrão
        console.warn("Public airdrop data document 'airdrop_public_data/data_v1' not found. Returning defaults."); //
        return { //
            config: { isActive: false, roundName: "Loading...", ugcBasePoints: {} }, //
            leaderboards: { top100ByPoints: [], top100ByPosts: [], lastUpdated: null }, //
            dailyTasks: [] //
        };
    }
}

// =======================================================
//  FUNÇÕES DE DADOS DO USUÁRIO
// =======================================================

/**
 * Gera um código de referência aleatório de 6 caracteres.
 * @returns {string} Código de referência.
 */
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; //
    let code = ''; //
    for (let i = 0; i < 6; i++) { //
        code += chars.charAt(Math.floor(Math.random() * chars.length)); //
    }
    return code; //
}

/**
 * Busca o perfil do usuário Airdrop no Firestore. Se não existir, cria um novo.
 * Garante que campos essenciais existam no perfil.
 * @param {string} walletAddress Endereço da carteira do usuário.
 * @returns {Promise<object>} O objeto de dados do usuário Airdrop.
 */
export async function getAirdropUser(walletAddress) {
    ensureAuthenticated(); // Garante currentUser definido
    const userRef = doc(db, "airdrop_users", currentUser.uid); // Referência ao documento do usuário
    const userSnap = await getDoc(userRef); //

    if (userSnap.exists()) { //
        // Usuário existe, verifica e preenche campos padrão se necessário
        const userData = userSnap.data(); //
        const updates = {}; // Objeto para guardar atualizações necessárias

        // Garante que campos essenciais existam e tenham o tipo correto
        if (!userData.referralCode) updates.referralCode = generateReferralCode(); //
        if (typeof userData.approvedSubmissionsCount !== 'number') updates.approvedSubmissionsCount = 0; //
        if (typeof userData.rejectedCount !== 'number') updates.rejectedCount = 0; //
        if (typeof userData.isBanned !== 'boolean') updates.isBanned = false; //
        if (typeof userData.totalPoints !== 'number') updates.totalPoints = 0; //
        if (typeof userData.pointsMultiplier !== 'number') updates.pointsMultiplier = 1.0; // Padrão 1.0

        // Se precisa atualizar, salva no Firestore
        if (Object.keys(updates).length > 0) { //
             try { //
                 await updateDoc(userRef, updates); //
                 // Retorna dados combinados
                 return { id: userSnap.id, ...userData, ...updates }; //
             } catch (updateError) { //
                  console.error("Error updating user default fields:", updateError); //
                  // Retorna dados originais mesmo se a atualização falhar
                  return { id: userSnap.id, ...userData }; //
             }
        }
        // Se não precisou atualizar, retorna os dados lidos
        return { id: userSnap.id, ...userData }; //

    } else {
        // Usuário não existe, cria um novo perfil
        const referralCode = generateReferralCode(); //
        const newUser = { //
            walletAddress: walletAddress, //
            referralCode: referralCode, //
            totalPoints: 0, //
            pointsMultiplier: 1.0, //
            approvedSubmissionsCount: 0, //
            rejectedCount: 0, //
            isBanned: false, //
            createdAt: serverTimestamp() // Usa timestamp do servidor para criação
        };
        await setDoc(userRef, newUser); //
        // Retorna dados do novo usuário
        return { id: userRef.id, ...newUser, createdAt: new Date() }; // Usa Date local como placeholder
    }
}

/**
 * Verifica se o usuário pode realizar uma tarefa diária baseado no cooldown.
 * @param {string} taskId ID da tarefa.
 * @param {number} cooldownHours Duração do cooldown em horas.
 * @returns {Promise<{eligible: boolean, timeLeft: number}>} Objeto indicando elegibilidade e tempo restante em ms.
 */
export async function isTaskEligible(taskId, cooldownHours) {
    ensureAuthenticated(); //
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') { //
        console.warn(`isTaskEligible called with invalid taskId: ${taskId}`); //
        return { eligible: false, timeLeft: 0 }; // Considera inelegível
    }

    // Referência ao documento de último claim da tarefa pelo usuário
    const lastClaimRef = doc(db, "airdrop_users", currentUser.uid, "task_claims", taskId); //
    const lastClaimSnap = await getDoc(lastClaimRef); //

    const cooldownMs = cooldownHours * 60 * 60 * 1000; // Cooldown em milissegundos

    // Se nunca fez a tarefa, está elegível
    if (!lastClaimSnap.exists()) { //
        return { eligible: true, timeLeft: 0 }; //
    }

    const lastClaimData = lastClaimSnap.data(); //
    const lastClaimTimestamp = lastClaimData?.timestamp; // Timestamp salvo como string ISO

    // Se timestamp ausente ou inválido, permite claim (corrige dados antigos/inválidos)
    if (typeof lastClaimTimestamp !== 'string' || lastClaimTimestamp.trim() === '') { //
        console.warn(`Missing/invalid timestamp for task ${taskId}. Allowing claim.`); //
        return { eligible: true, timeLeft: 0 }; //
    }

    try { //
        const lastClaimDate = new Date(lastClaimTimestamp); //
        if (isNaN(lastClaimDate.getTime())) { // Verifica se a data é válida
             console.warn(`Invalid timestamp format for task ${taskId}:`, lastClaimTimestamp, ". Allowing claim."); //
             return { eligible: true, timeLeft: 0 }; //
        }

        const lastClaimTime = lastClaimDate.getTime(); //
        const now = Date.now(); //
        const elapsed = now - lastClaimTime; // Tempo desde o último claim

        if (elapsed >= cooldownMs) { //
            return { eligible: true, timeLeft: 0 }; // Cooldown passou
        } else { //
            return { eligible: false, timeLeft: cooldownMs - elapsed }; // Cooldown ativo, retorna tempo restante
        }
    } catch (dateError) { //
         console.error(`Error parsing timestamp string for task ${taskId}:`, lastClaimTimestamp, dateError); //
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
    ensureAuthenticated(); //

    if (!task || !task.id) throw new Error("Invalid task data provided."); //

    // Verifica elegibilidade ANTES de continuar
    const eligibility = await isTaskEligible(task.id, task.cooldownHours); //
    if (!eligibility.eligible) { //
        throw new Error("Cooldown period is still active for this task."); //
    }

    const userRef = doc(db, "airdrop_users", currentUser.uid); //

    // Valida e arredonda os pontos da tarefa
    const pointsToAdd = Math.round(task.points); //
    if (isNaN(pointsToAdd) || pointsToAdd < 0) throw new Error("Invalid points value for the task."); //

    // Atualiza total de pontos do usuário
    await updateDoc(userRef, { totalPoints: increment(pointsToAdd) }); //

    // Registra o claim com timestamp atual (ISO string)
    const claimRef = doc(db, "airdrop_users", currentUser.uid, "task_claims", task.id); //
    await setDoc(claimRef, { //
        timestamp: new Date().toISOString(), // Salva como string ISO
        points: pointsToAdd // Salva os pontos concedidos (para referência)
    });

    return pointsToAdd; // Retorna os pontos adicionados
}


// --- Helper Interno: Detecta Plataforma, Valida URL e Busca Pontos Base (CORRIGIDO) ---
/**
 * Analisa uma URL, detecta a plataforma (YouTube, YouTube Shorts, Instagram, X/Twitter, Other),
 * valida o formato (ex: YouTube deve ser vídeo), e busca os pontos base na config.
 * @param {string} url A URL enviada pelo usuário.
 * @returns {Promise<{platform: string, basePoints: number, isValid: boolean, normalizedUrl: string}>}
 * @throws {Error} Se a URL for inválida ou a configuração não for encontrada.
 */
async function detectPlatformAndValidate(url) {
    const normalizedUrl = url.trim().toLowerCase(); //
    let platform = 'Other'; // Padrão
    let isValid = true; // Assume válido

    // 1. Detecção e Validação Específica
    
    // ** CORREÇÃO 1: Trata YouTube Shorts primeiro (youtube.com/shorts/...) **
    if (normalizedUrl.includes('youtube.com/shorts/')) {
        platform = 'YouTube Shorts';
        // Validação extra: ID do Short (deve ter algo após /shorts/)
        const shortIdMatch = normalizedUrl.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
        if (!shortIdMatch || !shortIdMatch[1]) {
            isValid = false;
            throw new Error("Invalid YouTube Shorts URL: Video ID not found or incorrect format.");
        }
    }
    // ** CORREÇÃO 2: Trata Vídeo Regular do YouTube (youtube.com/watch?v=... ou youtu.be/...) **
    else if (normalizedUrl.includes('youtube.com/watch?v=') || normalizedUrl.includes('youtu.be/')) { //
        platform = 'YouTube'; //
        // Validação extra: ID do vídeo
        const videoIdMatch = normalizedUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[?&]|$)/); //
        if (!videoIdMatch || videoIdMatch[1].length !== 11) { //
            isValid = false; //
            throw new Error("Invalid YouTube URL: Video ID not found or incorrect format."); //
        }
    }
    // ** CORREÇÃO 3: Lógica de erro de validação para outros links do YouTube **
    else if (normalizedUrl.includes('youtube.com/')) { // Outros links do YouTube (canais, playlists, etc.)
        platform = 'YouTube';
        isValid = false;
        throw new Error("Invalid YouTube URL: Only video links (youtube.com/watch?v=... or youtu.be/...) or Shorts links are accepted.");
    }
    // Instagram
    else if (normalizedUrl.includes('instagram.com/p/') || normalizedUrl.includes('instagram.com/reel/')) { //
        platform = 'Instagram'; //
        // Validação básica de ID (qualquer coisa após /p/ ou /reel/)
        const postIdMatch = normalizedUrl.match(/\/(?:p|reel)\/([a-zA-Z0-9_.-]+)/); //
        if (!postIdMatch || !postIdMatch[1]) isValid = false; // Se não houver ID, marca inválido

    } 
    // X/Twitter
    else if (normalizedUrl.includes('twitter.com/') || normalizedUrl.includes('x.com/')) { //
        // Tenta identificar se é um link de status/tweet
        if (normalizedUrl.match(/(\w+)\/(?:status|statuses)\/(\d+)/)) { //
             platform = 'X/Twitter'; //
        } else {
             // Deixamos cair em 'Other'
        }
    }
    // Links não identificados permanecem como 'Other'

    // 2. Busca Pontos Base da Configuração Pública
    const publicData = await getPublicAirdropData(); // Reutiliza a função
    const ugcPointsConfig = publicData.config?.ugcBasePoints || {}; // Pega pontos da config

    // Busca ponto da plataforma, senão 'Other', senão fallback 1000
    const basePoints = ugcPointsConfig[platform] || ugcPointsConfig['Other'] || 1000; //

    // Valida os pontos buscados
    if (isNaN(basePoints) || basePoints <= 0) { //
        throw new Error(`Invalid base points configured for platform: ${platform}. Please contact admin.`); //
    }

    return { platform, basePoints, isValid, normalizedUrl }; //
}


/**
 * Adiciona uma submissão UGC, detectando plataforma, validando, verificando duplicatas,
 * salvando em dois locais (usuário e log) e aplicando pontos/contagem imediatamente.
 * @param {string} url URL da postagem.
 * @throws {Error} Se a URL for inválida, duplicada, ou outro erro ocorrer.
 */
export async function addSubmission(url) { // Recebe apenas URL
    ensureAuthenticated(); //
    const userRef = doc(db, "airdrop_users", currentUser.uid); //
    const userSubmissionsCol = collection(db, "airdrop_users", currentUser.uid, "submissions"); //
    const logSubmissionsCol = collection(db, "all_submissions_log"); //

    // Validação básica de URL (início http/https)
    const trimmedUrl = url.trim(); //
    if (!trimmedUrl || (!trimmedUrl.toLowerCase().startsWith('http://') && !trimmedUrl.toLowerCase().startsWith('https://'))) { //
        throw new Error(`The provided URL must start with http:// or https://.`); //
    }

    // --- Detecta Plataforma, Valida Específica e Busca Pontos ---
    let detectionResult; //
    try { //
        detectionResult = await detectPlatformAndValidate(trimmedUrl); //
    } catch (validationError) { //
        // Repassa erros específicos de validação (ex: YouTube não-vídeo)
        throw validationError; //
    }
    const { platform, basePoints, isValid, normalizedUrl } = detectionResult; //
    // Se a validação específica falhou (ex: Instagram sem ID)
    if (!isValid) { //
         throw new Error(`The provided URL for ${platform} does not appear valid for submission.`); //
    }
    // --- Fim Detecção/Validação ---

    // --- Verificação de Duplicatas no Log Central ---
    const qLog = query(logSubmissionsCol, //
        where("normalizedUrl", "==", normalizedUrl), //
        // Verifica se já existe com status que não seja 'rejected'
        where("status", "in", ["pending", "approved", "auditing", "flagged_suspicious"]) //
    );
    const logSnapshot = await getDocs(qLog); //
    if (!logSnapshot.empty) { //
        throw new Error("This content link has already been submitted. Repeatedly submitting duplicate or fraudulent content may lead to account suspension."); //
    }
    // --- Fim Verificação ---

    // --- Pega dados do usuário para calcular pontos ---
    const userSnap = await getDoc(userRef); //
    if (!userSnap.exists()) throw new Error("User profile not found."); //
    const userData = userSnap.data(); //

    // --- Calcula Pontos e Multiplicador ---
    const currentApprovedCount = userData.approvedSubmissionsCount || 0; //
    // Multiplicador baseado na contagem + 1
    const multiplierApplied = Math.min(10.0, (currentApprovedCount + 1) * 0.1); //
    const pointsAwarded = Math.round(basePoints * multiplierApplied); //

    // --- Prepara Dados para Salvar ---
    const submissionTimestamp = serverTimestamp(); // Timestamp único para ambos
    // Subcoleção do usuário
    const submissionDataUser = { //
        url: trimmedUrl, // URL Original
        platform: platform, // Plataforma Detectada
        status: 'pending', // Status inicial é PENDING (para UI)
        basePoints: basePoints, //
        _pointsCalculated: pointsAwarded, // Guarda pontos calculados
        _multiplierApplied: multiplierApplied, // Guarda multiplicador usado
        pointsAwarded: 0, // Zera na submissão (UI mostra baseado no _pointsCalculated e status visual)
        submittedAt: submissionTimestamp, //
        resolvedAt: null, //
    };
    // Log central
    const submissionDataLog = { //
        userId: currentUser.uid, //
        walletAddress: userData.walletAddress, //
        normalizedUrl: normalizedUrl, //
        platform: platform, //
        status: 'pending', // Status inicial é PENDING
        basePoints: basePoints, //
        submittedAt: submissionTimestamp, //
        resolvedAt: null, //
    };

    // --- Salva submissão E ATUALIZA PONTOS/contagem do usuário ---
    const batch = writeBatch(db); //
    const newUserSubmissionRef = doc(userSubmissionsCol); // Gera ID
    batch.set(newUserSubmissionRef, submissionDataUser); // Salva na subcoleção
    const newLogSubmissionRef = doc(logSubmissionsCol, newUserSubmissionRef.id); // Usa mesmo ID no log
    batch.set(newLogSubmissionRef, submissionDataLog); // Salva no log
    // Atualiza perfil do usuário imediatamente
    batch.update(userRef, { //
        totalPoints: increment(pointsAwarded), //
        approvedSubmissionsCount: increment(1) // Incrementa contagem
    });
    await batch.commit(); // Executa
}

/**
 * Busca o histórico de submissões de um usuário.
 * @returns {Promise<Array<object>>} Lista de submissões.
 */
export async function getUserSubmissions() {
    ensureAuthenticated(); //
    const submissionsCol = collection(db, "airdrop_users", currentUser.uid, "submissions"); //
    const q = query(submissionsCol, orderBy("submittedAt", "desc")); // Mais recentes primeiro
    const snapshot = await getDocs(q); //
    // Mapeia e converte timestamps
    return snapshot.docs.map(doc => { //
        const data = doc.data(); //
        return { //
            submissionId: doc.id, //
            ...data, //
            // Converte timestamps para Date
            submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : null, //
            resolvedAt: data.resolvedAt?.toDate ? data.resolvedAt.toDate() : null, //
        };
    });
}

/**
 * Busca as submissões flagradas de um usuário que precisam de resolução.
 * @returns {Promise<Array<object>>} Lista de submissões flagradas.
 */
export async function getUserFlaggedSubmissions() {
    ensureAuthenticated(); //
    const submissionsCol = collection(db, "airdrop_users", currentUser.uid, "submissions"); //
    // Busca apenas as flagradas, ordenadas pelas mais recentes
    const q = query(submissionsCol, where("status", "==", "flagged_suspicious"), orderBy("submittedAt", "desc")); //
    const snapshot = await getDocs(q); //
    // Mapeia e converte timestamps
    return snapshot.docs.map(doc => { //
         const data = doc.data(); //
        return { //
            submissionId: doc.id, //
            ...data, //
            submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : null, //
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
    ensureAuthenticated(); //
    const userRef = doc(db, "airdrop_users", currentUser.uid); //
    const submissionRef = doc(db, "airdrop_users", currentUser.uid, "submissions", submissionId); //
    const logSubmissionRef = doc(db, "all_submissions_log", submissionId); //

    const submissionSnap = await getDoc(submissionRef); //
    if (!submissionSnap.exists() || submissionSnap.data().status !== 'flagged_suspicious') { //
        throw new Error("Submission not found or not flagged for review."); //
    }

    const submissionData = submissionSnap.data(); //
    // Determina o novo status baseado na resolução do usuário
    const newStatus = resolution === 'not_fraud' ? 'pending' : 'rejected'; // Volta para pending ou rejeita

    const batch = writeBatch(db); // Usa batch para atualizações

    if (newStatus === 'pending') { //
        // Se o usuário diz que não é fraude, apenas voltamos o status para pending
        // Os pontos já foram dados em addSubmission, não fazemos nada no perfil
        batch.update(submissionRef, { //
            status: newStatus, //
            resolvedAt: serverTimestamp() // Marca como resolvido (pelo usuário)
        });
        batch.update(logSubmissionRef, { //
            status: newStatus, //
            resolvedAt: serverTimestamp() //
        });
    } else { // resolution === 'is_fraud' -> newStatus === 'rejected'
        // --- APLICA A LÓGICA DE REJEIÇÃO (DESCONTO) ---
        const userSnap = await getDoc(userRef); //
        if (!userSnap.exists()) throw new Error("User profile not found."); //
        const userData = userSnap.data(); //
        const userUpdates = {}; //

        // Desconta pontos e contagem se foram dados (status era 'flagged', que veio de 'pending')
        const pointsToDecrement = submissionData._pointsCalculated || 0; //
        if (pointsToDecrement > 0) { //
             userUpdates.totalPoints = increment(-pointsToDecrement); //
        }
        // Decrementa contagem de aprovados (foi incrementada no addSubmission)
        userUpdates.approvedSubmissionsCount = increment(-1); //

        // Incrementa rejeição e aplica banimento
        const currentRejectedCount = userData.rejectedCount || 0; //
        userUpdates.rejectedCount = increment(1); //
        if (currentRejectedCount + 1 >= 3) { //
            userUpdates.isBanned = true; //
        }

        // Garante que contagens/pontos não fiquem negativos
        if (userUpdates.approvedSubmissionsCount?.operand < 0 && (userData.approvedSubmissionsCount || 0) <= 0) userUpdates.approvedSubmissionsCount = 0; //
        if (userUpdates.rejectedCount?.operand < 0 && (userData.rejectedCount || 0) <= 0) userUpdates.rejectedCount = 0; //
        if (userUpdates.totalPoints?.operand < 0 && (userData.totalPoints || 0) < Math.abs(userUpdates.totalPoints.operand)) userUpdates.totalPoints = 0; //

        // Aplica atualizações no usuário
        if (Object.keys(userUpdates).length > 0) { //
            batch.update(userRef, userUpdates); //
        }

        // Atualiza submissão do usuário para 'rejected'
        batch.update(submissionRef, { //
            status: newStatus, //
            pointsAwarded: 0, // Zera pontos na submissão
            multiplierApplied: 0, // Zera multiplicador na submissão
            resolvedAt: serverTimestamp() //
        });

        // Atualiza log central para 'rejected'
        const logSnap = await getDoc(logSubmissionRef); // Verifica se existe
        if (logSnap.exists()) { //
             batch.update(logSubmissionRef, { //
                status: newStatus, //
                resolvedAt: serverTimestamp() //
            });
        }
    }

    await batch.commit(); // Executa as atualizações
}


/**
 * Permite ao usuário confirmar que a submissão, após auditoria visual, é legítima.
 * O status é alterado de 'pending_confirmation' (visual) para 'approved' (real).
 * Nota: Como o `addSubmission` já concede os pontos, esta função apenas finaliza o status.
 * @param {string} userId ID do usuário Firebase.
 * @param {string} submissionId ID da submissão.
 */
export async function confirmSubmission(userId, submissionId) {
    ensureAuthenticated();
    
    // Referências necessárias
    const submissionRef = doc(db, "airdrop_users", userId, "submissions", submissionId);
    const logSubmissionRef = doc(db, "all_submissions_log", submissionId);

    // Usa um batch para garantir atomicidade das atualizações
    const batch = writeBatch(db);

    // Atualiza status para 'approved' na subcoleção do usuário
    batch.update(submissionRef, { 
        status: 'approved',
        resolvedAt: serverTimestamp() 
    });

    // Atualiza status para 'approved' no log central
    batch.update(logSubmissionRef, { 
        status: 'approved',
        resolvedAt: serverTimestamp()
    });

    // Executa as atualizações
    await batch.commit();
}


/**
 * Permite ao usuário deletar uma submissão reportada como erro (ou rejeitada),
 * descontando os pontos e a contagem que foram adicionados em addSubmission.
 * @param {string} userId ID do usuário Firebase.
 * @param {string} submissionId ID da submissão.
 */
export async function deleteSubmission(userId, submissionId) {
    ensureAuthenticated();
    
    const userRef = doc(db, "airdrop_users", userId);
    const submissionRef = doc(db, "airdrop_users", userId, "submissions", submissionId);
    const logSubmissionRef = doc(db, "all_submissions_log", submissionId);

    const submissionSnap = await getDoc(submissionRef);
    if (!submissionSnap.exists()) {
        throw new Error("Submission not found.");
    }
    
    const submissionData = submissionSnap.data();
    const currentStatus = submissionData.status;

    // Apenas permite deletar/descontar se o status for 'pending', 'auditing' ou 'pending_confirmation'
    if (currentStatus !== 'pending' && currentStatus !== 'auditing') {
        // Para simplificar, o frontend deve garantir que a ação só seja possível em status pré-aprovados.
        // Se o status for 'approved', o usuário não pode simplesmente deletar.
        if (currentStatus === 'approved') {
            throw new Error("Approved submissions cannot be deleted by the user.");
        }
    }

    const batch = writeBatch(db);
    
    // --- DESCONTO de pontos/contagem ---
    // Pontos e contagem foram adicionados em addSubmission, então precisamos reverter
    const pointsToDecrement = submissionData._pointsCalculated || 0;
    
    if (pointsToDecrement > 0) {
        batch.update(userRef, { 
            totalPoints: increment(-pointsToDecrement),
            approvedSubmissionsCount: increment(-1) // Reverte o incremento
        });
    }

    // Deleta o documento na subcoleção do usuário
    batch.delete(submissionRef);

    // Atualiza o log central para 'deleted' e zera pontos
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
//  FUNÇÕES DE ADMIN
// =======================================================

/**
 * Atualiza os pontos base para plataformas UGC no documento de config pública.
 * @param {object} newPoints Objeto com { 'PlatformName': points }.
 */
export async function updateUgcBasePoints(newPoints) {
    const dataRef = doc(db, "airdrop_public_data", "data_v1"); //
    // Usa setDoc com merge: true para atualizar apenas config.ugcBasePoints
    await setDoc(dataRef, { //
        config: { //
            ugcBasePoints: newPoints //
        }
    }, { merge: true }); // Merge evita apagar outros campos em 'config'
}

/**
 * Busca todas as tarefas diárias (ativas e inativas) para o painel admin.
 * @returns {Promise<Array<object>>} Lista de tarefas.
 */
export async function getAllTasksForAdmin() {
    const tasksCol = collection(db, "daily_tasks"); //
    const q = query(tasksCol, orderBy("endDate", "asc")); // Ordena por data de término
    const snapshot = await getDocs(q); //
    // Mapeia e converte timestamps para Date
    return snapshot.docs.map(doc => ({ //
        id: doc.id, //
        ...doc.data(), //
        startDate: doc.data().startDate?.toDate ? doc.data().startDate.toDate() : null, //
        endDate: doc.data().endDate?.toDate ? doc.data().endDate.toDate() : null, //
    }));
}

/**
 * Cria ou atualiza uma tarefa diária no Firestore.
 * @param {object} taskData Dados da tarefa (com ou sem id).
 */
export async function addOrUpdateDailyTask(taskData) {
     const dataToSave = { ...taskData }; //
     // Converte Date para Timestamp antes de salvar
    if (dataToSave.startDate instanceof Date) dataToSave.startDate = Timestamp.fromDate(dataToSave.startDate); //
    if (dataToSave.endDate instanceof Date) dataToSave.endDate = Timestamp.fromDate(dataToSave.endDate); //

     const taskId = taskData.id; //
     // Remove ID se for criação ou se estiver vazio/null
     if (!taskId) { //
         delete dataToSave.id; //
         await addDoc(collection(db, "daily_tasks"), dataToSave); // Cria novo
     } else { //
         // Atualiza documento existente
         const taskRef = doc(db, "daily_tasks", taskId); //
         delete dataToSave.id; // Não salva o ID dentro do documento
         await setDoc(taskRef, dataToSave, { merge: true }); // Merge para atualização
     }
}

/**
 * Deleta uma tarefa diária pelo ID.
 * @param {string} taskId ID da tarefa a ser deletada.
 */
export async function deleteDailyTask(taskId) {
    if (!taskId) throw new Error("Task ID is required for deletion."); //
    await deleteDoc(doc(db, "daily_tasks", taskId)); //
}

/**
 * Busca todas as submissões pendentes, em auditoria ou flagradas para revisão do admin.
 * @returns {Promise<Array<object>>} Lista de submissões para revisão.
 */
export async function getAllSubmissionsForAdmin() {
    // Mantendo a busca por usuário para pegar walletAddress atualizado
    const allSubmissions = []; //
    const usersSnapshot = await getDocs(collection(db, "airdrop_users")); //

    for (const userDoc of usersSnapshot.docs) { //
        const userId = userDoc.id; //
        const userData = userDoc.data(); //

        const submissionsCol = collection(db, "airdrop_users", userId, "submissions"); //
        // Busca status relevantes para admin
        const q = query(submissionsCol, //
            where("status", "in", ["pending", "auditing", "flagged_suspicious"]), //
            orderBy("submittedAt", "desc") //
        );
        const submissionsSnapshot = await getDocs(q); //

        submissionsSnapshot.forEach(subDoc => { //
             const subData = subDoc.data(); //
            allSubmissions.push({ //
                userId: userId, //
                walletAddress: userData.walletAddress, // Pega do perfil
                submissionId: subDoc.id, //
                ...subData, //
                submittedAt: subData.submittedAt?.toDate ? subData.submittedAt.toDate() : null, //
                resolvedAt: subData.resolvedAt?.toDate ? subData.resolvedAt.toDate() : null, //
            });
        });
    }
    // Reordena todas pela data de envio geral (mais recentes primeiro)
    allSubmissions.sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0)); //
    return allSubmissions; //
}


/**
 * Atualiza o status de uma submissão (pelo Admin).
 * Se rejeitar, desconta pontos/contagem que foram dados no envio.
 * @param {string} userId ID do usuário Firebase.
 * @param {string} submissionId ID da submissão.
 * @param {string} status Novo status ('approved' ou 'rejected').
 */
export async function updateSubmissionStatus(userId, submissionId, status) {
    const userRef = doc(db, "airdrop_users", userId); //
    const submissionRef = doc(db, "airdrop_users", userId, "submissions", submissionId); //
    const logSubmissionRef = doc(db, "all_submissions_log", submissionId); //

    // Lê os 3 documentos
    const [userSnap, submissionSnap, logSnap] = await Promise.all([ //
         getDoc(userRef), getDoc(submissionRef), getDoc(logSubmissionRef) //
    ]);

    if (!submissionSnap.exists()) throw new Error("Submission not found in user collection."); //
    if (!userSnap.exists()) throw new Error("User profile not found."); //
    if (!logSnap.exists()) console.warn(`Log entry ${submissionId} not found. Log will not be updated.`); //

    const submissionData = submissionSnap.data(); //
    const userData = userSnap.data(); //
    const currentStatus = submissionData.status; //

    // Evita processamento desnecessário
    if (currentStatus === status) { //
        console.warn(`Admin action ignored: Submission ${submissionId} already has status ${status}.`); //
        return; //
    }

    const batch = writeBatch(db); //
    const userUpdates = {}; // Atualizações para o perfil do usuário
    // Assume que os pontos/multiplicador na submissão serão os calculados (se aprovar) ou 0 (se rejeitar)
    let finalPointsAwarded = submissionData._pointsCalculated || 0; //
    let finalMultiplier = submissionData._multiplierApplied || 0; //

    // --- Lógica de Aprovação pelo Admin ---
    if (status === 'approved') { //
        // Se estava 'rejected' e o admin aprova: RE-ADICIONA pontos/contagem.
        if (currentStatus === 'rejected') { //
             // Usa os pontos salvos em _pointsCalculated ou default 0
             const pointsToReAdd = submissionData._pointsCalculated || 0; //
             // Incrementa pontos e contagem de aprovados, decrementa rejeição
             if(pointsToReAdd > 0) userUpdates.totalPoints = increment(pointsToReAdd); //
             userUpdates.approvedSubmissionsCount = increment(1); //
             userUpdates.rejectedCount = increment(-1); // Reduz contagem de rejeição
        }
        // Se estava 'pending', 'auditing', 'flagged', só muda o status na submissão/log.
        // Os pontos já foram dados no addSubmission. Mantemos os _pointsCalculated/_multiplierApplied.

    // --- Lógica de Rejeição pelo Admin ---
    } else if (status === 'rejected') { //
        // --- DESCONTO de pontos/contagem ---
        // Verifica se os pontos foram adicionados anteriormente (status NÃO era 'rejected')
        if (currentStatus !== 'rejected') { //
            const pointsToDecrement = submissionData._pointsCalculated || 0; //
            if (pointsToDecrement > 0) { //
                 userUpdates.totalPoints = increment(-pointsToDecrement); // Desconta
            }
            // Decrementa contagem de aprovados (foi incrementada no addSubmission)
            userUpdates.approvedSubmissionsCount = increment(-1); //
        }
        // --- FIM DESCONTO ---

        // Incrementa rejeição e aplica banimento
        const currentRejectedCount = userData.rejectedCount || 0; //
        userUpdates.rejectedCount = increment(1); //
        if (currentRejectedCount + 1 >= 3) { // Limite para banimento
            userUpdates.isBanned = true; //
        }

        // Zera os campos na submissão ao rejeitar
        finalPointsAwarded = 0; //
        finalMultiplier = 0; //
    }

    // --- Aplica Atualizações ---
    // Garante que contagens/pontos não fiquem negativos
    if (userUpdates.approvedSubmissionsCount?.operand < 0 && (userData.approvedSubmissionsCount || 0) <= 0) userUpdates.approvedSubmissionsCount = 0; //
    if (userUpdates.rejectedCount?.operand < 0 && (userData.rejectedCount || 0) <= 0) userUpdates.rejectedCount = 0; // Correção aqui
    if (userUpdates.totalPoints?.operand < 0 && (userData.totalPoints || 0) < Math.abs(userUpdates.totalPoints.operand)) userUpdates.totalPoints = 0; //

    // Aplica atualizações no usuário (se houver)
    if (Object.keys(userUpdates).length > 0) { //
        batch.update(userRef, userUpdates); //
    }

    // Atualiza submissão do usuário
    batch.update(submissionRef, { //
        status: status, //
        pointsAwarded: finalPointsAwarded, // Salva 0 se rejeitado, ou os pontos calculados se aprovado
        multiplierApplied: finalMultiplier, // Salva 0 se rejeitado, ou o multiplicador usado se aprovado
        resolvedAt: serverTimestamp() // Marca como resolvido pelo admin
    });

    // Atualiza log central (se existir)
    if (logSnap.exists()) { //
        batch.update(logSubmissionRef, { //
            status: status, //
            resolvedAt: serverTimestamp() //
        });
    }

    // Executa o batch
    await batch.commit(); //
}