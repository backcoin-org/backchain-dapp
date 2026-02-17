// pages/notary/state.js
// Notary V10 — State & constants
// ============================================================================

// ============================================================================
// CONSTANTS
// ============================================================================
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const EXPLORER_BASE = 'https://sepolia.arbiscan.io';
export const EXPLORER_TX = `${EXPLORER_BASE}/tx/`;
export const EXPLORER_ADDR = `${EXPLORER_BASE}/address/`;
export const EXPLORER_TOKEN = `${EXPLORER_BASE}/token/`;

// V9: Certified event replaces DocumentNotarized
export const NOTARY_ABI_EVENTS = [
    'event Certified(uint256 indexed certId, address indexed owner, bytes32 documentHash, uint8 docType, address operator)'
];

export const FILE_TYPES = {
    image:       { icon: 'fa-regular fa-image',       color: '#34d399', bg: 'rgba(52,211,153,0.12)', label: 'Image' },
    pdf:         { icon: 'fa-regular fa-file-pdf',     color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'PDF' },
    audio:       { icon: 'fa-solid fa-music',          color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Audio' },
    video:       { icon: 'fa-regular fa-file-video',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'Video' },
    document:    { icon: 'fa-regular fa-file-word',    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'Document' },
    spreadsheet: { icon: 'fa-regular fa-file-excel',   color: '#4ade80', bg: 'rgba(74,222,128,0.12)', label: 'Spreadsheet' },
    code:        { icon: 'fa-solid fa-code',           color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', label: 'Code' },
    archive:     { icon: 'fa-regular fa-file-zipper',  color: '#facc15', bg: 'rgba(250,204,21,0.12)', label: 'Archive' },
    default:     { icon: 'fa-regular fa-file',         color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'File' }
};

// ============================================================================
// STATE
// ============================================================================
export const NT = {
    // View routing
    view: 'documents',
    activeTab: 'documents',
    viewHistory: [],

    // Wizard (notarize flow)
    wizStep: 1,
    wizFile: null,
    wizFileHash: null,
    wizDescription: '',
    wizDuplicateCheck: null,
    wizIsHashing: false,
    wizDocType: 0,
    wizUploadCost: null,

    // Fees
    bkcFee: 0n,
    ethFee: 0n,
    feesLoaded: false,

    // Certificates (My Documents)
    certificates: [],
    certsLoading: false,

    // Certificate detail
    selectedCert: null,

    // Verify tab
    verifyFile: null,
    verifyHash: null,
    verifyResult: null,
    verifyIsChecking: false,

    // Stats tab
    stats: null,
    totalSupply: 0,
    recentNotarizations: [],
    statsLoading: false,

    // Processing
    isProcessing: false,
    processStep: '',

    // General
    isLoading: false,
    contractAvailable: true,

    // Render callbacks (set by orchestrator)
    _render: () => {},
    _renderHeader: () => {}
};
