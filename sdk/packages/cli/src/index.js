// create-backchain-app — Main CLI Entry
// ============================================================================

import { resolve } from 'path';
import { existsSync } from 'fs';
import {
    promptProjectName,
    promptOperator,
    promptModules,
    promptNetwork,
    printSummary,
    promptConfirm,
} from './prompts.js';
import { generateProject } from './generator.js';

const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

function printBanner() {
    console.log(`
${CYAN}${BOLD}  ╔══════════════════════════════════════╗
  ║     create-backchain-app  v0.1.0     ║
  ║  Build DeFi apps. Earn commissions.  ║
  ╚══════════════════════════════════════╝${RESET}
`);
}

export async function run(args) {
    printBanner();

    // 1. Gather configuration
    const name = await promptProjectName(args[0]);
    const operator = await promptOperator();
    const modules = await promptModules();
    const network = await promptNetwork();

    const config = { name, operator, network, modules };

    // 2. Show summary and confirm
    printSummary(config);
    const confirmed = await promptConfirm();

    if (!confirmed) {
        console.log(`\n  ${DIM}Cancelled.${RESET}\n`);
        return;
    }

    // 3. Resolve target directory
    const dir = resolve(process.cwd(), name);

    if (existsSync(dir)) {
        throw new Error(`Directory "${name}" already exists. Pick a different name or remove it first.`);
    }

    // 4. Generate project
    console.log(`\n  ${DIM}Scaffolding project...${RESET}\n`);
    generateProject(dir, config);

    // 5. Success message
    console.log(`${GREEN}${BOLD}  ✔ Project created!${RESET}\n`);
    console.log(`  Next steps:\n`);
    console.log(`    ${CYAN}cd ${name}${RESET}`);
    console.log(`    ${CYAN}npm install${RESET}`);
    console.log(`    ${CYAN}npm run dev${RESET}\n`);
    console.log(`  ${DIM}Your operator address is embedded in the config.`);
    console.log(`  Every transaction your users make earns you 10-20% commission.${RESET}\n`);
    console.log(`  ${DIM}Deploy to production:${RESET}`);
    console.log(`    ${CYAN}npm run build${RESET}`);
    console.log(`    ${CYAN}npx vercel --prod${RESET}\n`);
}
