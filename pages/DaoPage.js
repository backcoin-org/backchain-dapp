// pages/DaoPage.js

import { showToast, openModal, closeModal } from '../ui-feedback.js';
import { renderLoading, renderError, formatBigNumber, formatPStake } from '../utils.js'; 
import { State } from '../state.js';

// --- CONSTANTS ---
const MIN_PSTAKE_TO_PROPOSE = 1000n; // Minimum pStake required to create a proposal

// --- MOCK DATA ---
const mockProposals = [
    { id: 1, title: "BIP-01: Allocate Treasury Funds for Marketing Campaign", status: "active", description: "This proposal suggests allocating 500,000 $BKC from the DAO treasury to fund a 3-month global marketing campaign to increase brand awareness and attract new users to the ecosystem.", votesFor: 7200000n, votesAgainst: 1300000n, endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), userVoted: 'for' },
    { id: 2, title: "BIP-02: Integrate with Decentralized Exchange 'GravitySwap'", status: "active", description: "Proposal to prioritize and fund the development for integrating Backchain's liquidity pools with the GravitySwap DEX, aiming to increase token utility and accessibility.", votesFor: 4800000n, votesAgainst: 500000n, endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), userVoted: null },
    { id: 3, title: "BIP-03: Update Staking Reward Distribution Formula", status: "passed", description: "Successfully passed proposal to adjust the staking reward formula, increasing rewards for long-term stakers to better incentivize network security and stability.", votesFor: 12500000n, votesAgainst: 800000n, endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), userVoted: 'for' },
    { id: 4, title: "BIP-04: Research Grant for a Cross-Chain Bridge", status: "failed", description: "A proposal to fund a research grant for exploring the feasibility of a trustless cross-chain bridge. It did not reach the required quorum for approval.", votesFor: 2100000n, votesAgainst: 3400000n, endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), userVoted: null },
    { id: 5, title: "BIP-05: Expand the Validator Set from 50 to 75", status: "passed", description: "This proposal increased the maximum number of active network validators to enhance decentralization and network security.", votesFor: 9800000n, votesAgainst: 2200000n, endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), userVoted: 'against' },
];

let currentFilter = 'active';

// --- Rendering Functions ---

function renderProposalItem(proposal) {
    const { id, title, status, description, votesFor, votesAgainst, endDate, userVoted } = proposal;
    
    const statusClasses = { active: 'bg-blue-500/20 text-blue-400', passed: 'bg-green-500/20 text-green-400', failed: 'bg-red-500/20 text-red-400' };
    const totalVotes = votesFor + votesAgainst;
    const forPercentage = totalVotes > 0n ? Number((votesFor * 10000n) / totalVotes) / 100 : 0;
    const againstPercentage = totalVotes > 0n ? 100 - forPercentage : 0;

    const timeRemainingText = status === 'active' && endDate.getTime() > Date.now() 
        ? `Ends in ≈ ${Math.floor((endDate.getTime() - Date.now()) / (1000 * 3600 * 24))}d ${Math.floor(((endDate.getTime() - Date.now()) % (1000 * 3600 * 24)) / (1000 * 3600))}h`
        : `Ended on ${endDate.toLocaleDateString()}`;

    return `
        <div class="bg-sidebar border border-border-color rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:border-zinc-600">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 class="text-lg font-bold text-white flex-1 pr-4">${title}</h3>
                <span class="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${statusClasses[status]}">${status}</span>
            </div>
            <p class="text-sm text-zinc-400 mb-5 line-clamp-2">${description}</p>
            
            <div class="mb-4">
                <div class="flex justify-between items-center text-xs text-zinc-400 mb-1">
                    <span class="font-bold text-green-400">FOR: ${formatPStake(votesFor)}</span>
                    <span class="font-bold text-red-400">AGAINST: ${formatPStake(votesAgainst)}</span>
                </div>
                <div class="w-full bg-main rounded-full h-2.5 flex overflow-hidden">
                    <div class="bg-green-500 h-2.5" style="width: ${forPercentage}%"></div>
                    <div class="bg-red-500 h-2.5" style="width: ${againstPercentage}%"></div>
                </div>
            </div>

            <div class="flex justify-between items-center mt-5 pt-4 border-t border-border-color/50">
                <span class="text-xs text-zinc-500 font-mono">${timeRemainingText}</span>
                ${userVoted ? `
                    <div class="flex items-center gap-2 text-sm font-semibold ${userVoted === 'for' ? 'text-green-400' : 'text-red-400'}">
                        <i class="fa-solid fa-check-circle"></i> You Voted ${userVoted.charAt(0).toUpperCase() + userVoted.slice(1)}
                    </div>
                ` : `
                    <button class="view-proposal-btn bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2 px-4 rounded-md text-sm transition-colors" data-proposal-id="${id}">
                        View & Vote
                    </button>
                `}
            </div>
        </div>
    `;
}

function openVoteModal(proposalId) {
    const proposal = mockProposals.find(p => p.id === parseInt(proposalId));
    if (!proposal) return;

    const { title, description, status, votesFor, votesAgainst } = proposal;
    const userPStake = State.userTotalPStake || 0n;

    const modalContent = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-white">${title}</h3>
            <button class="closeModalBtn text-zinc-400 hover:text-white text-2xl">&times;</button>
        </div>
        <p class="text-sm text-zinc-400 mb-6">${description}</p>

        <div class="bg-main border border-border-color rounded-lg p-4 mb-6 space-y-3">
            <div class="flex justify-between text-sm"><span class="text-zinc-400">Status:</span><span class="font-bold uppercase text-blue-400">${status}</span></div>
            <div class="flex justify-between text-sm"><span class="text-zinc-400">Votes For:</span><strong class="text-green-400">${formatPStake(votesFor)} pStake</strong></div>
            <div class="flex justify-between text-sm"><span class="text-zinc-400">Votes Against:</span><strong class="text-red-400">${formatPStake(votesAgainst)} pStake</strong></div>
        </div>
        
        <div class="text-center bg-sidebar border-2 border-purple-500/50 rounded-xl p-4 mb-6">
            <p class="text-sm text-zinc-400">Your Voting Power</p>
            <p class="text-2xl font-bold text-purple-400">${formatPStake(userPStake)}</p>
        </div>

        <div class="flex gap-4">
            <button class="vote-btn flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg" data-vote="for" ${userPStake === 0n ? 'disabled' : ''}>Vote For</button>
            <button class="vote-btn flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg" data-vote="against" ${userPStake === 0n ? 'disabled' : ''}>Vote Against</button>
        </div>
        ${userPStake === 0n ? '<p class="text-xs text-center text-red-400 mt-3">You need pStake to vote.</p>' : ''}
    `;
    
    openModal(modalContent, 'max-w-lg');

    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const voteChoice = e.currentTarget.dataset.vote;
            // Here you would normally submit the vote to the blockchain
            console.log(`Simulating vote '${voteChoice}' for proposal ${proposalId} with ${userPStake} pStake.`);
            closeModal();
            showToast(`Your vote '${voteChoice}' has been cast successfully!`, 'success');
            // Mock update UI after voting
            const votedProposal = mockProposals.find(p => p.id === proposalId);
            if(votedProposal) {
                votedProposal.userVoted = voteChoice;
                renderProposals(); // Re-render the list to show the change
            }
        });
    });
}

function renderProposals() {
    const listEl = document.getElementById('dao-proposals-list');
    if (!listEl) return;
    const filtered = mockProposals.filter(p => p.status === currentFilter);
    listEl.innerHTML = filtered.length > 0 
        ? filtered.map(renderProposalItem).join('') 
        : `<div class="text-center p-8 bg-main border border-border-color rounded-lg"><p class="text-zinc-400">No proposals found with status: <span class="font-bold">${currentFilter}</span>.</p></div>`;
}

function renderDaoContent() {
    const daoContainer = document.getElementById('dao');
    if (!daoContainer) return;

    if (!State.isConnected) {
        daoContainer.innerHTML = `
            <div class="text-center p-8 bg-sidebar border border-border-color rounded-xl max-w-lg mx-auto">
                <i class="fa-solid fa-wallet text-5xl text-amber-400 mb-4"></i>
                <h1 class="text-2xl font-bold mb-2">Connect Your Wallet</h1>
                <p class="text-zinc-400">Please connect your wallet to view DAO proposals and participate in governance.</p>
            </div>`;
        return;
    }

    const canPropose = (State.userTotalPStake || 0n) >= MIN_PSTAKE_TO_PROPOSE;

    daoContainer.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
                <h1 class="text-4xl font-black text-white">DAO Governance</h1>
                <p class="text-zinc-400 mt-1">Shape the future of the Backchain ecosystem.</p>
            </div>
            <div class="relative w-full md:w-auto">
                 <button id="create-proposal-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-lg transition-colors text-base w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed" ${!canPropose ? 'disabled' : ''}>
                    <i class="fa-solid fa-plus mr-2"></i> Create Proposal
                </button>
                ${!canPropose ? `<p class="text-xs text-zinc-500 text-center md:text-right mt-1.5">Requires ${formatPStake(MIN_PSTAKE_TO_PROPOSE)} pStake to propose</p>` : ''}
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div class="bg-sidebar border border-border-color rounded-xl p-6 transition-transform hover:-translate-y-1"><p class="text-sm font-medium text-zinc-400 mb-1">Your Voting Power</p><div id="dao-voting-power" class="text-3xl font-bold text-purple-400">--</div><p class="text-xs text-zinc-500 mt-1">Based on your total pStake</p></div>
            <div class="bg-sidebar border border-border-color rounded-xl p-6 transition-transform hover:-translate-y-1"><p class="text-sm font-medium text-zinc-400 mb-1">DAO Treasury</p><div class="text-3xl font-bold text-amber-400">12,450,830 <span class="text-2xl">$BKC</span></div><p class="text-xs text-zinc-500 mt-1">Funds managed by the community</p></div>
            <div class="bg-sidebar border border-border-color rounded-xl p-6 transition-transform hover:-translate-y-1"><p class="text-sm font-medium text-zinc-400 mb-1">Total Proposals</p><div class="text-3xl font-bold text-white">${mockProposals.length}</div><p class="text-xs text-zinc-500 mt-1"><span class="text-green-400">${mockProposals.filter(p=>p.status === 'passed').length} Passed</span> / <span class="text-red-400">${mockProposals.filter(p=>p.status === 'failed').length} Failed</span></p></div>
        </div>

        <div>
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <h2 class="text-2xl font-bold text-white">Proposals</h2>
                 <div id="proposal-filter-tabs" class="flex gap-1 p-1 bg-main rounded-lg border border-border-color">
                    <button class="filter-btn text-sm font-semibold py-1.5 px-4 rounded-md transition-colors" data-filter="active">Active</button>
                    <button class="filter-btn text-sm font-semibold py-1.5 px-4 rounded-md transition-colors" data-filter="passed">Passed</button>
                    <button class="filter-btn text-sm font-semibold py-1.5 px-4 rounded-md transition-colors" data-filter="failed">Failed</button>
                 </div>
            </div>
            <div id="dao-proposals-list" class="space-y-4"></div>
        </div>
    `;
    
    updateDaoData();
    updateActiveFilterButton();
    renderProposals();
}

function updateDaoData() {
    const vpElement = document.getElementById('dao-voting-power');
    const createBtn = document.getElementById('create-proposal-btn');
    if (vpElement) {
        const pStake = State.userTotalPStake || 0n;
        vpElement.textContent = formatPStake(pStake);
    }
    if (createBtn) {
         const canPropose = (State.userTotalPStake || 0n) >= MIN_PSTAKE_TO_PROPOSE;
         createBtn.disabled = !canPropose;
    }
}

function updateActiveFilterButton() {
    const filterTabs = document.getElementById('proposal-filter-tabs');
    if (!filterTabs) return;
    filterTabs.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('bg-amber-500', btn.dataset.filter === currentFilter);
        btn.classList.toggle('text-zinc-900', btn.dataset.filter === currentFilter);
        btn.classList.toggle('text-zinc-400', btn.dataset.filter !== currentFilter);
        btn.classList.toggle('hover:bg-zinc-700', btn.dataset.filter !== currentFilter);
    });
}

export const DaoPage = {
    render() {
        renderDaoContent();
    },
    update() {
         const daoElement = document.getElementById('dao');
         if (daoElement && !daoElement.classList.contains('hidden')) {
             renderDaoContent();
         }
    },
    init() {
        const daoContainer = document.getElementById('dao');
        if (daoContainer && !daoContainer._listenersAttached) {
            daoContainer.addEventListener('click', (e) => {
                const createBtn = e.target.closest('#create-proposal-btn');
                const filterBtn = e.target.closest('.filter-btn');
                const viewBtn = e.target.closest('.view-proposal-btn');

                if (createBtn) showToast("Creating proposals will be enabled in a future update.", "info");
                if (filterBtn) {
                    currentFilter = filterBtn.dataset.filter;
                    updateActiveFilterButton();
                    renderProposals();
                }
                if (viewBtn) openVoteModal(viewBtn.dataset.proposalId);
            });
            daoContainer._listenersAttached = true;
        }
    }
};

