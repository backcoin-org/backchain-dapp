// create-backchain-app — Interactive Prompts (zero dependencies)
// ============================================================================

import { createInterface } from 'readline';

const rl = () => createInterface({ input: process.stdin, output: process.stdout });

const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function ask(question) {
    return new Promise((resolve) => {
        const r = rl();
        r.question(question, (answer) => {
            r.close();
            resolve(answer.trim());
        });
    });
}

export async function promptProjectName(defaultName) {
    if (defaultName) return defaultName;
    const name = await ask(`${CYAN}?${RESET} Project name: ${DIM}(my-backchain-app)${RESET} `);
    return name || 'my-backchain-app';
}

export async function promptOperator() {
    while (true) {
        const addr = await ask(`${CYAN}?${RESET} Your operator wallet address ${DIM}(0x...)${RESET}: `);
        if (/^0x[a-fA-F0-9]{40}$/.test(addr)) return addr;
        console.log(`  ${YELLOW}Invalid address. Must be 0x + 40 hex chars.${RESET}`);
    }
}

export async function promptModules() {
    const CORE = [
        { id: 'dashboard',  name: 'Dashboard',     desc: 'Overview of your ecosystem' },
        { id: 'staking',    name: 'Stake & Earn',   desc: 'Delegate BKC, earn rewards' },
        { id: 'tutor',      name: 'Tutor System',   desc: 'Referral earnings & tutor info' },
        { id: 'tokenomics', name: 'Tokenomics',     desc: 'Token supply, fees, ecosystem info' },
        { id: 'invite',     name: 'Invite & Earn',  desc: 'Share referral link, track invites' },
    ];

    const FEATURES = [
        { key: '1', id: 'nft',      name: 'NFT Store',               desc: 'Buy/sell NFT Boosters (bonding curves)' },
        { key: '2', id: 'fortune',  name: 'Fortune Pool',            desc: 'Commit-reveal prediction game' },
        { key: '3', id: 'notary',   name: 'Notary (Cartório)',       desc: 'On-chain document certification' },
        { key: '4', id: 'agora',    name: 'Agora (Social)',          desc: 'Posts, likes, follows — decentralized' },
        { key: '5', id: 'charity',  name: 'Charity',                 desc: 'Transparent fundraising campaigns' },
        { key: '6', id: 'rental',   name: 'NFT Rental (AirBNFT)',   desc: 'List & rent NFT Boosters' },
        { key: '7', id: 'swap',     name: 'Swap (AMM)',              desc: 'Trade ETH ↔ BKC' },
        { key: '8', id: 'fusion',   name: 'NFT Fusion',             desc: 'Fuse & split NFT Boosters' },
        { key: '9', id: 'buyback',  name: 'Buyback Mining',         desc: 'Convert ETH fees → BKC rewards' },
    ];

    console.log(`\n${CYAN}?${RESET} Module selection:\n`);

    console.log(`  ${GREEN}CORE${RESET} ${DIM}(always included)${RESET}`);
    for (const m of CORE) {
        console.log(`  ${GREEN}✓${RESET}  ${m.name.padEnd(22)} ${DIM}${m.desc}${RESET}`);
    }

    console.log(`\n  ${CYAN}FEATURES${RESET} ${DIM}(select additional modules)${RESET}`);
    for (const m of FEATURES) {
        console.log(`  ${BOLD}${m.key}${RESET}  ${m.name.padEnd(22)} ${DIM}${m.desc}${RESET}`);
    }
    console.log(`  ${BOLD}a${RESET}  All features`);
    console.log();

    const input = await ask(`  ${DIM}Enter numbers separated by spaces (e.g., "1 3 5") or "a" for all:${RESET} `);

    if (input.toLowerCase() === 'a' || input.toLowerCase() === 'all') {
        return FEATURES.map(m => m.id);
    }

    const keys = input.split(/[\s,]+/).filter(Boolean);
    const selected = keys.map(k => FEATURES.find(m => m.key === k)).filter(Boolean).map(m => m.id);

    // No features selected is valid — core pages are always included
    return [...new Set(selected)];
}

export async function promptNetwork() {
    console.log(`\n${CYAN}?${RESET} Network:`);
    console.log(`  ${BOLD}1${RESET}  Ethereum Sepolia ${DIM}(testnet — recommended for development)${RESET}`);
    console.log(`  ${BOLD}2${RESET}  opBNB Testnet ${DIM}(BNB Chain L2)${RESET}`);
    console.log(`  ${BOLD}3${RESET}  opBNB Mainnet ${DIM}(production)${RESET}`);
    const choice = await ask(`  ${DIM}(1, 2 or 3, default 1):${RESET} `);
    if (choice === '2') return 'opbnb-testnet';
    if (choice === '3') return 'opbnb-mainnet';
    return 'sepolia';
}

export function printSummary(config) {
    const coreModules = ['dashboard', 'staking', 'tutor', 'tokenomics', 'invite'];
    const allModules = [...coreModules, ...config.modules];

    console.log(`\n${GREEN}${BOLD}  Project Configuration${RESET}`);
    console.log(`  ${'─'.repeat(40)}`);
    console.log(`  Name:     ${BOLD}${config.name}${RESET}`);
    console.log(`  Operator: ${CYAN}${config.operator.slice(0, 6)}...${config.operator.slice(-4)}${RESET}`);
    console.log(`  Network:  ${config.network}`);
    console.log(`  Core:     ${coreModules.join(', ')}`);
    console.log(`  Features: ${config.modules.length ? config.modules.join(', ') : '(none)'}`);
    console.log(`  Total:    ${allModules.length} pages`);
    console.log(`  ${'─'.repeat(40)}\n`);
}

export async function promptConfirm() {
    const answer = await ask(`${CYAN}?${RESET} Create project? ${DIM}(Y/n)${RESET} `);
    return answer.toLowerCase() !== 'n';
}
