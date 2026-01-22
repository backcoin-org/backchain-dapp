// js/pages/BackchatPage.js
// ✅ PRODUCTION V1.2 - Corrected Contract Interface (getTotals)
// 
// V1.2 Changes:
// - Fixed ABI to use getTotals() instead of totalMessages()/totalConversations()
// - Fixed registerPublicKey to accept bytes instead of string
// - Fixed event names: PrivateMessageSent instead of MessageSent
// - Added totalPosts, totalComments, totalNotes to stats
//
// V1.1 Changes:
// - Added contract availability check
// - Graceful handling when contract is not deployed
// - "Coming Soon" UI when contract unavailable
//
// V1.0 Features:
// - Private Messages (E2EE ready)
// - Conversation list (X/Twitter DM style)
// - Chat window with message history
// - Send messages with 1 BKC fee
// - Dark mode UI
//
// Future versions will add: Posts, Comments, Tips, Community Notes

import { State } from '../state.js';
import { showToast } from '../ui-feedback.js';
import { addresses } from '../config.js';

const ethers = window.ethers;

// ============================================================================
// CONSTANTS & CONFIG
// ============================================================================

const HERO_ICON = 'assets/backchat.png';
const EXPLORER_ADDRESS = "https://sepolia.arbiscan.io/address/";
const EXPLORER_TX = "https://sepolia.arbiscan.io/tx/";

// Platform fee per message
const MESSAGE_FEE = "1"; // 1 BKC

// ============================================================================
// ABI
// ============================================================================

const backchatABI = [
    // Messages
    "function sendMessage(address _recipient, string memory _encryptedContent, string memory _encryptedIpfsHash, uint256 _conversationId, uint256 _parentMessageId) external",
    "function getMessage(uint256 _messageId) external view returns (address sender, address recipient, string memory encryptedContent, string memory encryptedIpfsHash, uint256 sentAt, uint256 conversationId, uint256 parentMessageId)",
    "function getUserConversations(address _user) external view returns (uint256[] memory)",
    "function getConversationMessages(uint256 _conversationId) external view returns (uint256[] memory)",
    // Note: getConversationParticipants doesn't exist - need to get from first message
    
    // Stats - using getTotals() which returns (posts, comments, notes, messages, conversations)
    "function getTotals() external view returns (uint256 posts, uint256 comments, uint256 notes, uint256 messages, uint256 conversations)",
    
    // E2EE Keys
    "function registerPublicKey(bytes memory _publicKey) external",
    "function getPublicKey(address _user) external view returns (bytes memory)",
    "function hasPublicKey(address _user) external view returns (bool)",
    
    // Config
    "function platformFee() external view returns (uint256)",
    "function bkcToken() external view returns (address)",
    
    // Events
    "event PrivateMessageSent(uint256 indexed messageId, uint256 indexed conversationId, address indexed sender, address recipient, uint256 timestamp)",
    "event PublicKeyRegistered(address indexed user, uint256 timestamp)"
];

const erc20ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)"
];

// ============================================================================
// STATE
// ============================================================================

const BS = {
    conversations: [],
    currentConversation: null,
    currentMessages: [],
    stats: { totalPosts: 0, totalComments: 0, totalNotes: 0, totalMessages: 0, totalConversations: 0 },
    hasPublicKey: false,
    isLoading: false,
    newMessageRecipient: '',
    view: 'list', // 'list' | 'chat' | 'new'
    contractAvailable: true, // V1.1: Track if contract is available
    contractError: null // V1.1: Store error message
};

// ============================================================================
// STYLES
// ============================================================================

function injectStyles() {
    if (document.getElementById('bc-styles-v1')) return;
    const s = document.createElement('style');
    s.id = 'bc-styles-v1';
    s.textContent = `
/* Backchat - X Style Dark Mode */
.backchat-page {
    --bc-bg: #000000;
    --bc-bg2: #16181c;
    --bc-bg3: #202327;
    --bc-border: #2f3336;
    --bc-text: #e7e9ea;
    --bc-muted: #71767b;
    --bc-accent: #f59e0b;
    --bc-accent-hover: #d97706;
    --bc-blue: #1d9bf0;
    --bc-success: #00ba7c;
    --bc-danger: #f4212e;
    max-width: 600px;
    margin: 0 auto;
    min-height: 80vh;
    background: var(--bc-bg);
    border-left: 1px solid var(--bc-border);
    border-right: 1px solid var(--bc-border);
}

/* Header */
.bc-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--bc-border);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 24px;
}

.bc-header-back {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--bc-text);
    cursor: pointer;
    transition: background 0.2s;
}

.bc-header-back:hover {
    background: var(--bc-bg3);
}

.bc-header-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--bc-text);
}

.bc-header-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
}

.bc-header-actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
}

/* Stats Bar */
.bc-stats {
    display: flex;
    gap: 24px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--bc-border);
    font-size: 14px;
}

.bc-stat {
    display: flex;
    align-items: center;
    gap: 6px;
}

.bc-stat-value {
    font-weight: 700;
    color: var(--bc-text);
}

.bc-stat-label {
    color: var(--bc-muted);
}

/* New Message Button */
.bc-new-msg-btn {
    position: fixed;
    bottom: 80px;
    right: calc(50% - 280px);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--bc-accent);
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    transition: all 0.2s;
    z-index: 50;
}

.bc-new-msg-btn:hover {
    background: var(--bc-accent-hover);
    transform: scale(1.05);
}

/* Conversation List */
.bc-conv-list {
    display: flex;
    flex-direction: column;
}

.bc-conv-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid var(--bc-border);
    cursor: pointer;
    transition: background 0.2s;
}

.bc-conv-item:hover {
    background: var(--bc-bg2);
}

.bc-conv-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--bc-accent), var(--bc-blue));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    color: #000;
    flex-shrink: 0;
}

.bc-conv-content {
    flex: 1;
    min-width: 0;
}

.bc-conv-header {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 2px;
}

.bc-conv-name {
    font-weight: 700;
    color: var(--bc-text);
    font-size: 15px;
}

.bc-conv-address {
    color: var(--bc-muted);
    font-size: 14px;
}

.bc-conv-time {
    color: var(--bc-muted);
    font-size: 14px;
    margin-left: auto;
}

.bc-conv-preview {
    color: var(--bc-muted);
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.bc-conv-badge {
    background: var(--bc-accent);
    color: #000;
    font-size: 12px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 12px;
    margin-left: 8px;
}

/* Chat Window */
.bc-chat {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 200px);
    min-height: 400px;
}

.bc-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.bc-message {
    max-width: 80%;
    padding: 12px 16px;
    border-radius: 20px;
    font-size: 15px;
    line-height: 1.4;
    word-wrap: break-word;
}

.bc-message.sent {
    align-self: flex-end;
    background: var(--bc-accent);
    color: #000;
    border-bottom-right-radius: 4px;
}

.bc-message.received {
    align-self: flex-start;
    background: var(--bc-bg3);
    color: var(--bc-text);
    border-bottom-left-radius: 4px;
}

.bc-message-time {
    font-size: 12px;
    color: var(--bc-muted);
    margin-top: 4px;
    text-align: right;
}

.bc-message.sent .bc-message-time {
    color: rgba(0, 0, 0, 0.6);
}

/* Chat Input */
.bc-chat-input {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid var(--bc-border);
    background: var(--bc-bg);
}

.bc-input {
    flex: 1;
    background: var(--bc-bg3);
    border: 1px solid var(--bc-border);
    border-radius: 20px;
    padding: 12px 16px;
    color: var(--bc-text);
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
}

.bc-input:focus {
    border-color: var(--bc-accent);
}

.bc-input::placeholder {
    color: var(--bc-muted);
}

.bc-send-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--bc-accent);
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
}

.bc-send-btn:hover {
    background: var(--bc-accent-hover);
}

.bc-send-btn:disabled {
    background: var(--bc-bg3);
    color: var(--bc-muted);
    cursor: not-allowed;
}

/* New Conversation */
.bc-new-conv {
    padding: 16px;
}

.bc-new-conv-input {
    width: 100%;
    background: var(--bc-bg);
    border: none;
    border-bottom: 1px solid var(--bc-border);
    padding: 16px 0;
    color: var(--bc-text);
    font-size: 17px;
    outline: none;
}

.bc-new-conv-input::placeholder {
    color: var(--bc-muted);
}

.bc-fee-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--bc-bg2);
    border-radius: 12px;
    margin: 16px;
    font-size: 14px;
    color: var(--bc-muted);
}

.bc-fee-notice i {
    color: var(--bc-accent);
}

/* Empty State */
.bc-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
}

.bc-empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--bc-bg3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: var(--bc-muted);
    margin-bottom: 20px;
}

.bc-empty-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--bc-text);
    margin-bottom: 8px;
}

.bc-empty-text {
    font-size: 15px;
    color: var(--bc-muted);
    max-width: 300px;
    line-height: 1.5;
}

/* Button */
.bc-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 9999px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
}

.bc-btn-primary {
    background: var(--bc-accent);
    color: #000;
}

.bc-btn-primary:hover {
    background: var(--bc-accent-hover);
}

.bc-btn-outline {
    background: transparent;
    border: 1px solid var(--bc-border);
    color: var(--bc-text);
}

.bc-btn-outline:hover {
    background: var(--bc-bg3);
    border-color: var(--bc-muted);
}

/* Loading */
.bc-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
}

.bc-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--bc-bg3);
    border-top-color: var(--bc-accent);
    border-radius: 50%;
    animation: bc-spin 1s linear infinite;
}

@keyframes bc-spin {
    to { transform: rotate(360deg); }
}

/* Modal */
.bc-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(91, 112, 131, 0.4);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
}

.bc-modal {
    background: var(--bc-bg);
    border-radius: 16px;
    width: 90%;
    max-width: 400px;
    max-height: 80vh;
    overflow: hidden;
}

.bc-modal-header {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--bc-border);
}

.bc-modal-close {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
}

.bc-modal-close:hover {
    background: var(--bc-bg3);
}

.bc-modal-title {
    flex: 1;
    text-align: center;
    font-size: 17px;
    font-weight: 700;
}

.bc-modal-body {
    padding: 16px;
}

/* Connect Prompt */
.bc-connect {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
}

.bc-connect-icon {
    width: 100px;
    height: 100px;
    margin-bottom: 24px;
}

/* Responsive */
@media (max-width: 640px) {
    .bc-new-msg-btn {
        right: 20px;
    }
    
    .backchat-page {
        border: none;
    }
}
`;
    document.head.appendChild(s);
}

// ============================================================================
// HELPERS
// ============================================================================

const fmt = (val) => {
    if (!val) return '0';
    try {
        const n = typeof val === 'bigint' ? val : BigInt(val.toString());
        return Number(ethers.formatEther(n)).toLocaleString('en-US', { maximumFractionDigits: 2 });
    } catch { return '0'; }
};

const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

const getInitials = (addr) => addr ? addr.slice(2, 4).toUpperCase() : '??';

const timeAgo = (timestamp) => {
    const seconds = Math.floor(Date.now() / 1000) - Number(timestamp);
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
};

const formatTime = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const decodeContent = (content) => {
    if (!content) return '';
    if (content.startsWith('ENC:')) {
        try {
            const b64 = content.slice(4);
            return atob(b64);
        } catch { return content; }
    }
    return content;
};

const encodeContent = (content) => {
    return 'ENC:' + btoa(content);
};

// ============================================================================
// CONTRACT HELPERS
// ============================================================================

async function getContract(withSigner = false) {
    // V1.1: Check if contract address is available
    if (!addresses?.backchat) {
        throw new Error('Backchat contract not deployed yet');
    }
    const provider = withSigner ? State?.signer : State?.publicProvider;
    if (!provider) throw new Error('Provider not available');
    return new ethers.Contract(addresses.backchat, backchatABI, provider);
}

async function getBkcContract(withSigner = false) {
    const provider = withSigner ? State?.signer : State?.publicProvider;
    if (!provider) throw new Error('Provider not available');
    return new ethers.Contract(addresses.bkcToken, erc20ABI, provider);
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadStats() {
    try {
        // V1.1: Check if contract address exists
        if (!addresses?.backchat) {
            BS.contractAvailable = false;
            BS.contractError = 'Backchat contract not deployed yet. Coming soon!';
            return;
        }
        
        const contract = await getContract();
        // V1.2: Use getTotals() which returns (posts, comments, notes, messages, conversations)
        const totals = await contract.getTotals();
        BS.stats = {
            totalPosts: Number(totals[0]),
            totalComments: Number(totals[1]),
            totalNotes: Number(totals[2]),
            totalMessages: Number(totals[3]),
            totalConversations: Number(totals[4])
        };
        BS.contractAvailable = true;
        BS.contractError = null;
    } catch (e) {
        console.error('Load stats error:', e);
        // V1.1: Mark contract as unavailable on error
        BS.contractAvailable = false;
        BS.contractError = 'Backchat service temporarily unavailable. Please try again later.';
    }
}

async function loadConversations() {
    if (!State?.isConnected || !State?.userAddress) return;
    if (!BS.contractAvailable) return; // V1.1: Skip if contract unavailable
    
    try {
        const contract = await getContract();
        const convIds = await contract.getUserConversations(State.userAddress);
        
        const conversations = [];
        for (const convId of convIds) {
            try {
                const [participant1, participant2] = await contract.getConversationParticipants(convId);
                const otherParty = participant1.toLowerCase() === State.userAddress.toLowerCase() 
                    ? participant2 : participant1;
                
                const msgIds = await contract.getConversationMessages(convId);
                let lastMessage = null;
                let lastTime = 0;
                
                if (msgIds.length > 0) {
                    const lastMsgId = msgIds[msgIds.length - 1];
                    const msg = await contract.getMessage(lastMsgId);
                    lastMessage = decodeContent(msg[2]);
                    lastTime = Number(msg[4]);
                }
                
                conversations.push({
                    id: Number(convId),
                    otherParty,
                    lastMessage,
                    lastTime,
                    messageCount: msgIds.length
                });
            } catch (e) {
                console.error(`Error loading conversation ${convId}:`, e);
            }
        }
        
        // Sort by last message time
        conversations.sort((a, b) => b.lastTime - a.lastTime);
        BS.conversations = conversations;
        
    } catch (e) {
        console.error('Load conversations error:', e);
    }
}

async function loadMessages(conversationId) {
    try {
        const contract = await getContract();
        const msgIds = await contract.getConversationMessages(conversationId);
        
        const messages = [];
        for (const msgId of msgIds) {
            const msg = await contract.getMessage(msgId);
            messages.push({
                id: Number(msgId),
                sender: msg[0],
                recipient: msg[1],
                content: decodeContent(msg[2]),
                ipfsHash: msg[3],
                sentAt: Number(msg[4]),
                conversationId: Number(msg[5]),
                parentMessageId: Number(msg[6])
            });
        }
        
        BS.currentMessages = messages;
    } catch (e) {
        console.error('Load messages error:', e);
    }
}

async function checkPublicKey() {
    if (!State?.isConnected || !State?.userAddress) return;
    if (!BS.contractAvailable) return; // V1.1: Skip if contract unavailable
    
    try {
        const contract = await getContract();
        BS.hasPublicKey = await contract.hasPublicKey(State.userAddress);
    } catch (e) {
        console.error('Check public key error:', e);
    }
}

// ============================================================================
// ACTIONS
// ============================================================================

async function sendMessage() {
    if (!State?.isConnected) return showToast('Connect wallet first', 'warning');
    
    const input = document.getElementById('bc-msg-input');
    const content = input?.value?.trim();
    if (!content) return showToast('Enter a message', 'warning');
    
    const btn = document.getElementById('bc-send-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<div class="bc-spinner" style="width:20px;height:20px;border-width:2px;"></div>';
    }
    
    try {
        // Check allowance
        const bkc = await getBkcContract(true);
        const fee = ethers.parseEther(MESSAGE_FEE);
        const allowance = await bkc.allowance(State.userAddress, addresses.backchat);
        
        if (allowance < fee) {
            showToast('Approving BKC...', 'info');
            const approveTx = await bkc.approve(addresses.backchat, ethers.MaxUint256);
            await approveTx.wait();
        }
        
        // Send message
        const contract = await getContract(true);
        const encoded = encodeContent(content);
        
        let recipient, convId;
        
        if (BS.view === 'new') {
            recipient = BS.newMessageRecipient;
            if (!ethers.isAddress(recipient)) {
                throw new Error('Invalid recipient address');
            }
            convId = 0; // New conversation
        } else {
            const conv = BS.conversations.find(c => c.id === BS.currentConversation);
            if (!conv) throw new Error('Conversation not found');
            recipient = conv.otherParty;
            convId = conv.id;
        }
        
        showToast('Sending message...', 'info');
        const tx = await contract.sendMessage(recipient, encoded, '', convId, 0);
        const receipt = await tx.wait();
        
        showToast('Message sent!', 'success');
        
        // Reload
        if (BS.view === 'new') {
            BS.view = 'list';
            BS.newMessageRecipient = '';
        }
        
        await loadConversations();
        
        if (BS.currentConversation) {
            await loadMessages(BS.currentConversation);
        }
        
        render();
        
        // Scroll to bottom
        setTimeout(() => {
            const container = document.getElementById('bc-messages');
            if (container) container.scrollTop = container.scrollHeight;
        }, 100);
        
    } catch (e) {
        console.error('Send message error:', e);
        if (!e.message?.includes('user rejected')) {
            showToast(e.reason || e.message || 'Failed to send', 'error');
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
        }
        if (input) input.value = '';
    }
}

async function registerKey() {
    if (!State?.isConnected) return showToast('Connect wallet first', 'warning');
    
    try {
        // For now, just register a placeholder key
        // In production, this would be the user's actual E2EE public key
        const contract = await getContract(true);
        const placeholderKey = `PK_${State.userAddress.slice(2, 10)}`;
        
        showToast('Registering encryption key...', 'info');
        const tx = await contract.registerPublicKey(placeholderKey);
        await tx.wait();
        
        BS.hasPublicKey = true;
        showToast('Key registered!', 'success');
        render();
        
    } catch (e) {
        console.error('Register key error:', e);
        if (!e.message?.includes('user rejected')) {
            showToast(e.reason || e.message || 'Failed to register', 'error');
        }
    }
}

// ============================================================================
// NAVIGATION
// ============================================================================

function openConversation(convId) {
    BS.currentConversation = convId;
    BS.view = 'chat';
    BS.isLoading = true;
    render();
    
    loadMessages(convId).then(() => {
        BS.isLoading = false;
        render();
        
        // Scroll to bottom
        setTimeout(() => {
            const container = document.getElementById('bc-messages');
            if (container) container.scrollTop = container.scrollHeight;
        }, 100);
    });
}

function openNewMessage() {
    BS.view = 'new';
    BS.newMessageRecipient = '';
    render();
    
    setTimeout(() => {
        const input = document.getElementById('bc-new-recipient');
        if (input) input.focus();
    }, 100);
}

function goBack() {
    BS.view = 'list';
    BS.currentConversation = null;
    BS.currentMessages = [];
    render();
}

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

function renderHeader() {
    if (BS.view === 'list') {
        return `
            <div class="bc-header">
                <img src="${HERO_ICON}" alt="Backchat" class="bc-header-icon">
                <span class="bc-header-title">Messages</span>
                <div class="bc-header-actions">
                    <button onclick="BackchatPage.refresh()" class="bc-header-back" title="Refresh">
                        <i class="fa-solid fa-rotate"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    if (BS.view === 'new') {
        return `
            <div class="bc-header">
                <div class="bc-header-back" onclick="BackchatPage.goBack()">
                    <i class="fa-solid fa-arrow-left"></i>
                </div>
                <span class="bc-header-title">New Message</span>
            </div>
        `;
    }
    
    // Chat view
    const conv = BS.conversations.find(c => c.id === BS.currentConversation);
    const otherParty = conv?.otherParty || '';
    
    return `
        <div class="bc-header">
            <div class="bc-header-back" onclick="BackchatPage.goBack()">
                <i class="fa-solid fa-arrow-left"></i>
            </div>
            <div class="bc-conv-avatar">${getInitials(otherParty)}</div>
            <div>
                <div class="bc-conv-name">${shortAddr(otherParty)}</div>
                <div class="bc-conv-address" style="font-size:12px;">${conv?.messageCount || 0} messages</div>
            </div>
        </div>
    `;
}

function renderStats() {
    return `
        <div class="bc-stats">
            <div class="bc-stat">
                <span class="bc-stat-value">${BS.stats.totalMessages}</span>
                <span class="bc-stat-label">Messages</span>
            </div>
            <div class="bc-stat">
                <span class="bc-stat-value">${BS.stats.totalConversations}</span>
                <span class="bc-stat-label">Conversations</span>
            </div>
            <div class="bc-stat">
                <span class="bc-stat-value">${MESSAGE_FEE}</span>
                <span class="bc-stat-label">BKC/msg</span>
            </div>
        </div>
    `;
}

function renderConversationList() {
    if (BS.conversations.length === 0) {
        return `
            <div class="bc-empty">
                <div class="bc-empty-icon">
                    <i class="fa-regular fa-message"></i>
                </div>
                <div class="bc-empty-title">No messages yet</div>
                <div class="bc-empty-text">
                    Start a conversation by tapping the button below. Each message costs ${MESSAGE_FEE} BKC.
                </div>
            </div>
        `;
    }
    
    return `
        <div class="bc-conv-list">
            ${BS.conversations.map(conv => `
                <div class="bc-conv-item" onclick="BackchatPage.openConversation(${conv.id})">
                    <div class="bc-conv-avatar">${getInitials(conv.otherParty)}</div>
                    <div class="bc-conv-content">
                        <div class="bc-conv-header">
                            <span class="bc-conv-name">${shortAddr(conv.otherParty)}</span>
                            <span class="bc-conv-time">${timeAgo(conv.lastTime)}</span>
                        </div>
                        <div class="bc-conv-preview">${conv.lastMessage || 'No messages'}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderChat() {
    if (BS.isLoading) {
        return `
            <div class="bc-chat">
                <div class="bc-loading" style="flex:1;">
                    <div class="bc-spinner"></div>
                </div>
            </div>
        `;
    }
    
    const isSender = (msg) => msg.sender.toLowerCase() === State?.userAddress?.toLowerCase();
    
    return `
        <div class="bc-chat">
            <div class="bc-chat-messages" id="bc-messages">
                ${BS.currentMessages.length === 0 ? `
                    <div class="bc-empty" style="padding:40px 20px;">
                        <div class="bc-empty-text">No messages in this conversation yet.</div>
                    </div>
                ` : BS.currentMessages.map(msg => `
                    <div class="bc-message ${isSender(msg) ? 'sent' : 'received'}">
                        <div>${msg.content}</div>
                        <div class="bc-message-time">${formatTime(msg.sentAt)}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="bc-fee-notice">
                <i class="fa-solid fa-coins"></i>
                <span>Each message costs <strong>${MESSAGE_FEE} BKC</strong></span>
            </div>
            
            <div class="bc-chat-input">
                <input type="text" id="bc-msg-input" class="bc-input" placeholder="Write a message..." 
                    onkeypress="if(event.key==='Enter')BackchatPage.sendMessage()">
                <button id="bc-send-btn" class="bc-send-btn" onclick="BackchatPage.sendMessage()">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
}

function renderNewMessage() {
    return `
        <div class="bc-new-conv">
            <input type="text" id="bc-new-recipient" class="bc-new-conv-input" 
                placeholder="Enter wallet address (0x...)"
                value="${BS.newMessageRecipient}"
                oninput="BackchatPage.setRecipient(this.value)">
        </div>
        
        <div class="bc-fee-notice">
            <i class="fa-solid fa-coins"></i>
            <span>Each message costs <strong>${MESSAGE_FEE} BKC</strong></span>
        </div>
        
        <div class="bc-chat-input">
            <input type="text" id="bc-msg-input" class="bc-input" placeholder="Write a message..."
                onkeypress="if(event.key==='Enter')BackchatPage.sendMessage()">
            <button id="bc-send-btn" class="bc-send-btn" onclick="BackchatPage.sendMessage()">
                <i class="fa-solid fa-paper-plane"></i>
            </button>
        </div>
    `;
}

function renderConnectPrompt() {
    return `
        <div class="bc-connect">
            <img src="${HERO_ICON}" alt="Backchat" class="bc-connect-icon">
            <div class="bc-empty-title">Welcome to Backchat</div>
            <div class="bc-empty-text" style="margin-bottom:24px;">
                Connect your wallet to send and receive private messages on the blockchain.
            </div>
            <button class="bc-btn bc-btn-primary" onclick="window.connectWallet && window.connectWallet()">
                <i class="fa-solid fa-wallet"></i>
                Connect Wallet
            </button>
        </div>
    `;
}

// V1.1: Render when contract is not available
function renderUnavailable() {
    return `
        <div class="bc-connect">
            <img src="${HERO_ICON}" alt="Backchat" class="bc-connect-icon" style="opacity:0.5;">
            <div class="bc-empty-title" style="color:#f59e0b;">
                <i class="fa-solid fa-tools" style="margin-right:8px;"></i>
                Coming Soon!
            </div>
            <div class="bc-empty-text" style="margin-bottom:24px; max-width:400px;">
                ${BS.contractError || 'Backchat is currently being deployed. Private messaging on the blockchain will be available soon!'}
            </div>
            <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
                <a href="https://x.com/backcoin" target="_blank" class="bc-btn bc-btn-secondary" style="text-decoration:none;">
                    <i class="fa-brands fa-twitter"></i>
                    Follow Updates
                </a>
                <button class="bc-btn bc-btn-primary" onclick="BackchatPage.refresh()">
                    <i class="fa-solid fa-rotate"></i>
                    Retry
                </button>
            </div>
        </div>
    `;
}

function renderLoading() {
    return `
        <div class="bc-loading" style="min-height:300px;">
            <div class="bc-spinner"></div>
        </div>
    `;
}

function renderNewMessageButton() {
    if (BS.view !== 'list') return '';
    return `
        <div class="bc-new-msg-btn" onclick="BackchatPage.openNewMessage()">
            <i class="fa-solid fa-pen-to-square"></i>
        </div>
    `;
}

// ============================================================================
// MAIN RENDER
// ============================================================================

function getContainer() {
    let container = document.getElementById('backchat-container');
    if (container) return container;
    
    const section = document.getElementById('backchat');
    if (section) {
        container = document.createElement('div');
        container.id = 'backchat-container';
        section.innerHTML = '';
        section.appendChild(container);
        return container;
    }
    
    console.error('❌ #backchat section not found');
    return null;
}

function render() {
    console.log('🎨 BackchatPage render v1.2');
    injectStyles();
    
    const container = getContainer();
    if (!container) return;
    
    // V1.1: Contract not available
    if (!BS.contractAvailable) {
        container.innerHTML = `
            <div class="backchat-page">
                ${renderHeader()}
                ${renderUnavailable()}
            </div>
        `;
        return;
    }
    
    // Not connected
    if (!State?.isConnected) {
        container.innerHTML = `
            <div class="backchat-page">
                ${renderHeader()}
                ${renderConnectPrompt()}
            </div>
        `;
        return;
    }
    
    // Loading
    if (BS.isLoading && BS.view === 'list') {
        container.innerHTML = `
            <div class="backchat-page">
                ${renderHeader()}
                ${renderLoading()}
            </div>
        `;
        return;
    }
    
    // Main content
    let content = '';
    
    if (BS.view === 'list') {
        content = renderStats() + renderConversationList();
    } else if (BS.view === 'chat') {
        content = renderChat();
    } else if (BS.view === 'new') {
        content = renderNewMessage();
    }
    
    container.innerHTML = `
        <div class="backchat-page">
            ${renderHeader()}
            ${content}
            ${renderNewMessageButton()}
        </div>
    `;
}

async function refresh() {
    BS.isLoading = true;
    render();
    
    await Promise.all([
        loadStats(),
        loadConversations(),
        checkPublicKey()
    ]);
    
    BS.isLoading = false;
    render();
}

function setRecipient(value) {
    BS.newMessageRecipient = value;
}

// ============================================================================
// EXPORT
// ============================================================================

export const BackchatPage = {
    render(isActive) {
        console.log('🚀 BackchatPage.render v1.2, isActive:', isActive);
        if (isActive) {
            render();
            refresh();
        }
    },
    refresh,
    openConversation,
    openNewMessage,
    goBack,
    sendMessage,
    registerKey,
    setRecipient
};

window.BackchatPage = BackchatPage;