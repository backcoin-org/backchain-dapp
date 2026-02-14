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
    const MODULES = [
        { key: '1', id: 'staking',  name: 'Staking & Mining',        desc: 'Delegate BKC, earn rewards' },
        { key: '2', id: 'nft',      name: 'NFT Store',               desc: 'Buy/sell NFT Boosters (bonding curves)' },
        { key: '3', id: 'fortune',  name: 'Fortune Pool',            desc: 'Commit-reveal prediction game' },
        { key: '4', id: 'notary',   name: 'Notary (Cartório)',       desc: 'On-chain document certification' },
        { key: '5', id: 'agora',    name: 'Agora (Social)',          desc: 'Posts, likes, follows — decentralized' },
        { key: '6', id: 'charity',  name: 'Charity',                 desc: 'Transparent fundraising campaigns' },
        { key: '7', id: 'rental',   name: 'NFT Rental (AirBNFT)',   desc: 'List & rent NFT Boosters' },
        { key: '8', id: 'swap',     name: 'Swap (AMM)',              desc: 'Trade ETH ↔ BKC' },
        { key: '9', id: 'faucet',   name: 'Faucet',                  desc: 'Testnet token distribution' },
    ];

    console.log(`\n${CYAN}?${RESET} Select modules to include:\n`);
    for (const m of MODULES) {
        console.log(`  ${BOLD}${m.key}${RESET}  ${m.name.padEnd(26)} ${DIM}${m.desc}${RESET}`);
    }
    console.log(`  ${BOLD}a${RESET}  All modules`);
    console.log();

    const input = await ask(`  ${DIM}Enter numbers separated by spaces (e.g., "1 2 4") or "a" for all:${RESET} `);

    if (input.toLowerCase() === 'a' || input.toLowerCase() === 'all') {
        return MODULES.map(m => m.id);
    }

    const keys = input.split(/[\s,]+/).filter(Boolean);
    const selected = keys.map(k => MODULES.find(m => m.key === k)).filter(Boolean).map(m => m.id);

    if (selected.length === 0) {
        console.log(`  ${YELLOW}No modules selected, defaulting to all.${RESET}`);
        return MODULES.map(m => m.id);
    }

    return [...new Set(selected)]; // dedupe
}

export async function promptNetwork() {
    console.log(`\n${CYAN}?${RESET} Network:`);
    console.log(`  ${BOLD}1${RESET}  Arbitrum Sepolia ${DIM}(testnet — recommended for development)${RESET}`);
    console.log(`  ${BOLD}2${RESET}  Arbitrum One ${DIM}(mainnet)${RESET}`);
    const choice = await ask(`  ${DIM}(1 or 2, default 1):${RESET} `);
    return choice === '2' ? 'arbitrum-one' : 'arbitrum-sepolia';
}

export function printSummary(config) {
    console.log(`\n${GREEN}${BOLD}  Project Configuration${RESET}`);
    console.log(`  ${'─'.repeat(40)}`);
    console.log(`  Name:     ${BOLD}${config.name}${RESET}`);
    console.log(`  Operator: ${CYAN}${config.operator.slice(0, 6)}...${config.operator.slice(-4)}${RESET}`);
    console.log(`  Network:  ${config.network}`);
    console.log(`  Modules:  ${config.modules.join(', ')}`);
    console.log(`  ${'─'.repeat(40)}\n`);
}

export async function promptConfirm() {
    const answer = await ask(`${CYAN}?${RESET} Create project? ${DIM}(Y/n)${RESET} `);
    return answer.toLowerCase() !== 'n';
}
