// pages/notary/state.js
// Notary V5 — Cartório Digital — State & constants
// ============================================================================

// ============================================================================
// CONSTANTS
// ============================================================================
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const EXPLORER_BASE = 'https://sepolia.etherscan.io';
export const EXPLORER_TX = `${EXPLORER_BASE}/tx/`;
export const EXPLORER_ADDR = `${EXPLORER_BASE}/address/`;
export const EXPLORER_TOKEN = `${EXPLORER_BASE}/token/`;

export const NOTARY_ABI_EVENTS = [
    'event Certified(uint256 indexed certId, address indexed owner, bytes32 documentHash, uint8 docType, address operator)',
    'event CertificateTransferred(bytes32 indexed documentHash, address indexed from, address indexed to)',
    'event AssetRegistered(uint256 indexed tokenId, address indexed owner, uint8 assetType, bytes32 documentHash, address operator)',
    'event AssetTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 declaredValue, uint48 timestamp)',
    'event AnnotationAdded(uint256 indexed tokenId, uint256 indexed annotationId, address indexed author, uint8 annotationType)'
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

// Asset types (0-3)
export const ASSET_TYPES = [
    { id: 0, name: 'Property',     desc: 'Real estate, land, buildings',     icon: 'fa-solid fa-house',        color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { id: 1, name: 'Vehicle',      desc: 'Cars, motorcycles, boats',         icon: 'fa-solid fa-car',          color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    { id: 2, name: 'Intellectual Property', desc: 'Patents, copyrights, trademarks', icon: 'fa-solid fa-lightbulb', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    { id: 3, name: 'Other',        desc: 'Any other valuable asset',         icon: 'fa-solid fa-box',          color: '#6b7280', bg: 'rgba(107,114,128,0.12)' }
];

// Context-sensitive hints per asset type
export const TYPE_HINTS = {
    0: { descPlaceholder: 'e.g. 2BR Apartment at 123 Main St',   metaLabel: 'Address, registration number, area (sqft)',   docHint: 'Upload deed, title, or property photos' },
    1: { descPlaceholder: 'e.g. 2024 Toyota Camry, Blue',        metaLabel: 'VIN, license plate, mileage, year',           docHint: 'Upload registration, title, or vehicle photos' },
    2: { descPlaceholder: 'e.g. Patent for Solar Panel Design',   metaLabel: 'Patent/copyright number, filing date',        docHint: 'Upload patent certificate or trademark filing' },
    3: { descPlaceholder: 'e.g. Gold Watch, Rolex Submariner',    metaLabel: 'Serial number, brand, model',                 docHint: 'Upload certificate, receipt, or photos' }
};

// Annotation types (0-6)
export const ANNOTATION_TYPES = [
    { id: 0, name: 'Mortgage',        icon: 'fa-solid fa-building-columns', color: '#ef4444' },
    { id: 1, name: 'Lien',            icon: 'fa-solid fa-gavel',            color: '#f97316' },
    { id: 2, name: 'Court Order',     icon: 'fa-solid fa-scale-balanced',   color: '#dc2626' },
    { id: 3, name: 'Insurance',       icon: 'fa-solid fa-shield-halved',    color: '#22c55e' },
    { id: 4, name: 'Renovation',      icon: 'fa-solid fa-hammer',           color: '#eab308' },
    { id: 5, name: 'Note',            icon: 'fa-solid fa-note-sticky',      color: '#64748b' },
    { id: 6, name: 'Cancellation',    icon: 'fa-solid fa-ban',              color: '#991b1b' }
];

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

    // Asset wizard
    assetWizStep: 1,
    assetWizType: 0,
    assetWizDescription: '',
    assetWizMeta: '',
    assetWizFile: null,
    assetWizFileHash: null,

    // Fees
    bkcFee: 0n,
    ethFee: 0n,
    assetRegisterFee: 0n,
    assetTransferFee: 0n,
    annotateFee: 0n,
    feesLoaded: false,

    // Certificates (My Documents)
    certificates: [],
    certsLoading: false,

    // Assets
    assets: [],
    assetsLoading: false,

    // Certificate detail
    selectedCert: null,

    // Asset detail
    selectedAsset: null,
    selectedAssetAnnotations: [],

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
