// modules/i18n/en.js — Backchain i18n English Dictionary
export default {

    // ═══════════════════════════════════════════════════════════════════════
    // COMMON — Shared strings used across multiple pages
    // ═══════════════════════════════════════════════════════════════════════
    common: {
        buyOnRamp: 'Buy Crypto',
        connectWallet: 'Connect Wallet',
        connect: 'Connect',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success!',
        cancel: 'Cancel',
        confirm: 'Confirm',
        back: 'Back',
        close: 'Close',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        copy: 'Copy',
        copied: 'Copied!',
        share: 'Share',
        unknownError: 'Unknown error',
        connectWalletFirst: 'Connect wallet first',
        insufficientBalance: 'Insufficient balance',
        transactionFailed: 'Transaction failed',
        processing: 'Processing...',
        max: 'MAX',
        viewOnExplorer: 'View on Explorer',
        noData: 'No data',
        retry: 'Try again',
        refresh: 'Refresh',
        send: 'Send',
        receive: 'Receive',
        approve: 'Approve',
        reject: 'Reject',
        yes: 'Yes',
        no: 'No',
        all: 'All',
        none: 'None',
        active: 'Active',
        inactive: 'Inactive',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        expired: 'Expired',
        ready: 'Ready',
        balance: 'Balance',
        available: 'Available',
        amount: 'Amount',
        fee: 'Fee',
        total: 'Total',
        reward: 'Reward',
        rewards: 'Rewards',
        status: 'Status',
        details: 'Details',
        history: 'History',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        prev: 'Prev',
        next: 'Next',
        justNow: 'Just now',
        recent: 'Recent',
        today: 'Today',
        day: 'day',
        days: 'days',
        hours: 'hours',
        minutes: 'minutes',
        seconds: 'seconds',
        agoSuffix: 'ago',
        mAgo: '{m}m ago',
        hAgo: '{h}h ago',
        dAgo: '{d}d ago',
        connectWalletToView: 'Connect wallet to view',
        withdraw: 'Withdraw',
        deposit: 'Deposit',
        failed: 'Failed',
        linkCopied: 'Link copied to clipboard!',
        copyFailed: 'Could not copy link',
        connected: 'Connected',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NAV — Navigation labels
    // ═══════════════════════════════════════════════════════════════════════
    nav: {
        main: 'Main',
        dashboard: 'Dashboard',
        airdrop: 'Airdrop',
        earn: 'Earn',
        stakeEarn: 'Stake &amp; Earn',
        nftMarket: 'NFT Market',
        boostMarket: 'Boost Market',
        fortunePool: 'Fortune Pool',
        tradeBkc: 'Trade BKC',
        community: 'Community',
        charityPool: 'Charity Pool',
        services: 'Services',
        notary: 'Notary',
        grow: 'Grow',
        tutorSystem: 'Tutor System',
        becomeOperator: 'Become Operator',
        adminPanel: 'Admin Panel',
        about: 'About the Project',
        inviteEarn: 'Invite &amp; Earn',
        tutorials: 'Video Tutorials',
        home: 'Home',
        social: 'Social',
        more: 'More',
        tokenomics: 'Tokenomics',
        tutor: 'Tutor',
        operator: 'Operator',
        trade: 'Trade',
        fortune: 'Fortune',
        charity: 'Charity',
        boost: 'Boost',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SPLASH — Welcome screen
    // ═══════════════════════════════════════════════════════════════════════
    splash: {
        optimized: 'Optimized for opBNB',
        mainnetLaunch: 'Mainnet Launch',
        days: 'days',
        hours: 'hours',
        minutes: 'min',
        seconds: 'sec',
        unstoppable: 'Unstoppable DeFi',
        enterApp: 'Enter App',
        testnetBadge: 'TESTNET',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DASHBOARD — DashboardPage.js
    // ═══════════════════════════════════════════════════════════════════════
    dashboard: {
        // Hero
        youWillReceive: 'You Will Receive',
        claimRewards: 'Claim Rewards',
        noRewardsYet: 'No Rewards Yet',
        yourPStake: 'Your pStake',
        stakeMore: 'Stake More',
        earnMoreWithNft: 'Earn +{amount} BKC more with NFT!',

        // Faucet
        faucet: {
            title: 'Get Free Test Tokens',
            titleReceived: 'Test Tokens Received',
            desc: 'Get tBNB for gas — once per day',
            descReceived: 'Already received {amount} tBNB today — come back in 24h',
            descConnect: 'Connect your wallet to receive tBNB for gas',
            claimFreeTokens: 'Claim Free Tokens',
            claimedToday: 'Claimed Today',
            dailyClaimUsed: 'Daily claim used',
            connectWallet: 'Connect Wallet',
            sending: 'Sending...',
            successMsg: 'Faucet: {amount} tBNB sent to your wallet!',
            cooldownMsg: 'Faucet on cooldown. Try again in 24h.',
            unavailable: 'Faucet temporarily unavailable. Try again later.',
        },

        // Tutor/Referral Widget
        tutor: {
            becomeTutor: 'Become Someone\'s Tutor',
            shareLink: 'Share your link. Earn 10% of all fees + 5% BKC from your students — forever.',
            studentsEarning: '{count} Student(s) Earning for You',
            keepSharing: 'You earn 10% BNB on all fees + 5% BKC on staking rewards. Keep sharing!',
            connectForLink: 'Connect your wallet to get your tutor link',
            tutorLinkCopied: 'Tutor link copied!',
            failedToCopy: 'Failed to copy',
            shareTextCopied: 'Share text copied!',
            noTutorYet: 'No tutor yet',
            setATutor: 'Set a Tutor',
            change: 'Change',
            earnings: 'Tutor earnings: {amount} BNB available',
        },

        // Buyback Widget
        buyback: {
            ready: 'Buyback Ready',
            title: 'Buyback Ready — {amount} BNB',
            desc: 'Execute the buyback to earn 5% of pending BNB as reward',
            descWithFee: 'Pay {fee} BNB fee, earn {reward} BNB (5%). Fee amplifies the buyback.',
            pending: 'pending',
            earnAmount: 'Earn {amount} BNB',
            execute: 'Execute',
            executing: 'Executing...',
            successMsg: 'Buyback executed! You earned 5% BNB reward',
            failedMsg: 'Buyback failed: {error}',
        },

        // Quick Actions
        actions: {
            agoraTitle: 'Agora',
            agoraDesc: 'Post and discuss on-chain',
            stakeBkcTitle: 'Stake BKC',
            stakeBkcDesc: 'Earn while you sleep',
            fortunePoolTitle: 'Fortune Pool',
            fortunePoolDesc: 'Win up to 100x',
            notarizeTitle: 'Notarize',
            notarizeDesc: 'Certify on the blockchain',
            charityPoolTitle: 'Charity Pool',
            charityPoolDesc: 'Donate and burn tokens',
            nftMarketTitle: 'NFT Market',
            nftMarketDesc: '2x your rewards',
            tradeBkcTitle: 'Trade BKC',
            tradeBkcDesc: 'Swap on Uniswap V3',
        },

        // Metrics
        metrics: {
            supply: 'Supply',
            pstake: 'pStake',
            burned: 'Burned',
            fees: 'Fees',
            locked: 'Locked',
            bkcPrice: 'BKC Price',
            balance: 'Balance',
        },

        // Activity Feed
        activity: {
            title: 'Activity',
            yourActivity: 'Your Activity',
            networkActivity: 'Network Activity',
            loadingActivity: 'Loading activity...',
            loadingYourActivity: 'Loading your activity...',
            loadingNetworkActivity: 'Loading network activity...',
            noNetworkActivity: 'No network activity yet',
            beFirst: 'Be the first to stake, swap, or play!',
            filterAll: 'All',
            filterStaking: 'Staking',
            filterClaims: 'Claims',
            filterNft: 'NFT',
            filterFortune: 'Fortune',
            filterCharity: 'Charity',
            filterNotary: 'Notary',
            filterAgora: 'Agora',
            filterFaucet: 'Faucet',
            noMatch: 'No matching activity',
            noActivity: 'No activity yet',
            tryFilter: 'Try a different filter',
            startMsg: 'Start staking, trading or playing!',
            you: 'You',
        },

        // Fortune quick-action
        fortune: {
            prize: 'Prize: {amount} BKC',
            playToWin: 'Play to win',
            bet: 'Bet',
        },

        // Notary quick-action
        notary: {
            docsCertified: '{count} docs certified',
            certifyDocs: 'Certify documents',
        },

        // Claim toast messages
        claim: {
            success: 'Rewards claimed!',
            failed: 'Claim failed',
        },

        // Booster/NFT Display
        booster: {
            noBoosterNft: 'No Booster NFT',
            youKeep: 'you keep',
            upgradeToMax: 'Upgrade to Diamond for 100%',
            buyNft: 'Buy NFT',
            rentNft: 'Rent NFT',
            howItWorks: 'How it works',
            getUpToMore: 'Get up to +{amount} BKC with NFT',
            recycledToStakers: '50% recycled to stakers.',
            diamondKeep100: 'Diamond: keep 100%',
            owned: 'OWNED',
            rented: 'RENTED',
            inYourWallet: 'In your wallet',
            activeRental: 'Active rental',
            netReward: 'Net Reward',
            nftBonus: 'NFT Bonus',
        },

        // Modals
        modals: {
            boostEfficiency: 'Boost Efficiency',
            nftHoldersEarnMore: 'NFT holders earn up to 2x more',
            noGas: 'No Gas',
            needGasTokens: 'You need tBNB for gas',
            getFreeGas: 'Get Free Gas + BKC',
        },

        // Activity labels (used in ACTIVITY_ICONS)
        activityLabels: {
            staked: 'Staked',
            unstaked: 'Unstaked',
            forceUnstaked: 'Force Unstaked',
            rewardsClaimed: 'Rewards Claimed',
            boughtNft: 'NFT Bought',
            soldNft: 'NFT Sold',
            mintedBooster: 'Booster Minted',
            transfer: 'Transfer',
            listedNft: 'NFT Listed',
            rentedNft: 'NFT Rented',
            withdrawn: 'Withdrawn',
            promotedNft: 'NFT Promoted',
            gameCommitted: 'Game Committed',
            gameRevealed: 'Game Revealed',
            fortuneBet: 'Fortune Bet',
            comboMode: 'Combo Mode',
            jackpotMode: 'Jackpot Mode',
            winner: 'Winner!',
            noLuck: 'No Luck',
            notarized: 'Notarized',
            posted: 'Posted',
            liked: 'Liked',
            replied: 'Replied',
            superLiked: 'Super Liked',
            reposted: 'Reposted',
            followed: 'Followed',
            profileCreated: 'Profile Created',
            profileBoosted: 'Profile Boosted',
            badgeActivated: 'Badge Activated',
            tippedBkc: 'Tipped BKC',
            bnbWithdrawn: 'BNB Withdrawn',
            donated: 'Donated',
            campaignCreated: 'Campaign Created',
            campaignCancelled: 'Campaign Cancelled',
            fundsWithdrawn: 'Funds Withdrawn',
            goalReached: 'Goal Reached!',
            faucetClaim: 'Faucet Claim',
            feeCollected: 'Fee Collected',
            tutorSet: 'Tutor Set',
            tutorChanged: 'Tutor Changed',
            tutorEarned: 'Tutor Earned',
            rewardsRecycled: 'Rewards Recycled',
            nftFused: 'NFT Fused',
            nftSplit: 'NFT Split',
            voted: 'Voted',
            proposalCreated: 'Proposal Created',
            buyback: 'Buyback',
            swap: 'Swap',
            liquidityAdded: 'Liquidity Added',
            liquidityRemoved: 'Liquidity Removed',
            earningsWithdrawn: 'Earnings Withdrawn',
            gameExpired: 'Game Expired',
            campaignBoosted: 'Campaign Boosted',
            campaignClosed: 'Campaign Closed',
            downvoted: 'Downvoted',
            unfollowed: 'Unfollowed',
            batchActions: 'Batch Actions',
            postEdited: 'Post Edited',
            postReported: 'Post Reported',
            postBoosted: 'Post Boosted',
            userBlocked: 'User Blocked',
            userUnblocked: 'User Unblocked',
            profileUpdated: 'Profile Updated',
            bulkFused: 'Bulk Fused',
            rewardsCompounded: 'Rewards Compounded',
            buybackPaused: 'Buyback Paused',
            buybackResumed: 'Buyback Resumed',
            activity: 'Activity',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STAKING — StakingPage.js
    // ═══════════════════════════════════════════════════════════════════════
    staking: {
        title: 'Stake & Earn',
        subtitle: 'Delegate BKC, earn rewards. NFT + Tutor = keep more',
        youWillReceive: 'You Will Receive',
        claimRewards: 'Claim Rewards',
        noRewardsYet: 'No Rewards Yet',
        compound: 'Compound',
        loadingBoost: 'Loading boost...',

        // Breakdown
        breakdown: {
            staking: 'Staking',
            mining: 'Mining',
            recycled: 'Recycled',
            tutor: 'Tutor',
            burned: 'Burned',
            none: 'None',
        },

        // Claim fee
        claimFee: 'Claim fee: {fee} BNB',

        // Buyback
        buybackAvailable: 'Buyback Available',
        buybackReward: '5% Reward',
        pendingBnb: 'Pending BNB',
        yourReward: 'Your Reward (5%)',
        bkcToStakers: 'BKC to Stakers',
        miningRate: 'Mining Rate',
        executeBuyback: 'Execute Buyback',
        buybackInfo: 'Execute the buyback to earn 5% of pending BNB. The rest is converted into BKC rewards for stakers.',
        buybackFeeInfo: 'Fee: {fee} BNB (added to buyback). Earn 5% of total.',
        buybackLast: 'Last: {time}',
        buybackTotal: 'Total: {count} buybacks',

        // Stats
        networkPStake: 'Network pStake',
        yourPower: 'Your Power',
        pendingRewards: 'Pending',
        activeLocks: 'Active Locks',

        // Stake Form
        delegateBkc: 'Delegate BKC',
        enterAmount: 'Enter an amount',
        available: 'Available',
        pstakePower: 'pStake Power',
        netAmount: 'Net Amount',
        feePercent: 'Fee',
        durationMonths: '{n} Month(s)',
        durationDays: '{n} Day(s)',
        durationYears: '{n} Year(s)',

        // Delegations
        activeDelegations: 'Active Delegations',
        noActiveDelegations: 'No active delegations',
        connectWalletToView: 'Connect wallet to view',
        unstake: 'Unstake',
        forceUnstakeTitle: 'Force Unstake',
        forceUnstakeWarning: 'Force unstake has a penalty based on your NFT tier.',

        // History
        historyTitle: 'History',
        historyAll: 'All',
        historyStakes: 'Stakes',
        historyUnstakes: 'Unstakes',
        historyClaims: 'Claims',
        loadingHistory: 'Loading history...',
        noHistoryYet: 'No history yet',

        // History labels
        delegated: 'Delegated',
        unstaked: 'Unstaked',
        claimed: 'Claimed',
        forceUnstaked: 'Force Unstaked',

        // Boost panel
        boost: {
            keep: 'Keep {rate}%',
            recycle: 'Recycle {rate}%',
            nftTierBenefits: 'NFT Tier Benefits',
            getAnNft: 'Get an NFT',
            upgradeToDiamond: 'Upgrade to Diamond to keep 100%',
            upgrade: 'Upgrade',
            noTutorWarning: 'No tutor — +10% extra recycled',
            setTutorHint: 'Set a tutor to reduce recycling by 10%',
            setATutor: 'Set a Tutor',
            tutorReduces: '-10% recycling',
        },

        // Toast messages
        toast: {
            delegationSuccess: 'Delegation successful!',
            delegationFailed: 'Delegation failed: {error}',
            unstakeSuccess: 'Unstake successful!',
            forceUnstakeSuccess: 'Force unstake completed (penalty applied)',
            unstakeFailed: 'Unstake failed: {error}',
            claimSuccess: 'Rewards claimed!',
            claimFailed: 'Claim failed: {error}',
            compoundSuccess: 'Rewards compounded into new delegation!',
            compoundFailed: 'Compound failed: {error}',
            buybackSuccess: 'Buyback executed! You earned 5% BNB reward',
            buybackFailed: 'Buyback failed: {error}',
            invalidAmount: 'Invalid amount',
            insufficientBkc: 'Insufficient BKC balance',
            insufficientGas: 'Insufficient BNB for gas',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STORE — StorePage.js (NFT Marketplace)
    // ═══════════════════════════════════════════════════════════════════════
    store: {
        title: 'NFT Market',
        subtitle: 'Buy, sell, and fuse Booster NFTs',

        // Tier Card
        buyPrice: 'Buy',
        sellPrice: 'Sell',
        netSell: 'Net Sell',
        poolSize: 'Pool',
        volume: 'Volume',
        buy: 'Buy',
        sell: 'Sell',
        keepRate: 'Keep {rate}%',

        // Impact Card
        rewardImpact: 'Reward Impact',
        currentKeep: 'Current Keep',
        withNft: 'With NFT',
        potentialGain: 'Potential Gain',
        annualExtra: 'Annual Extra',
        stakeToSeeImpact: 'Stake BKC to see the impact',

        // Tutor banner
        tutorBanner: {
            hasTutor: 'Active tutor: {address} — you keep more on rewards',
            noTutor: 'No tutor — you lose 10% extra on recycling.',
            setTutor: 'Set Tutor',
        },

        // Inventory
        inventory: 'Inventory',
        noNftsYet: 'No NFTs yet',
        buyFirstNft: 'Buy your first NFT to start earning more!',
        listForRent: 'Rent',
        addToWallet: 'Add to Wallet',

        // Fusion/Split
        fusion: {
            title: 'Fusion & Split',
            fuseTab: 'Fuse',
            splitTab: 'Split',
            bulkTab: 'Bulk Fuse',
            fuseHint: 'Select 2 NFTs of the same tier to fuse into a higher tier',
            splitHint: 'Select 1 NFT to split into 2 NFTs of a lower tier',
            bulkHint: 'Select multiple NFTs to fuse at once up to the desired tier',
            selectNfts: 'Select NFTs',
            noEligibleNfts: 'No eligible NFTs for this action',
            fuseButton: 'FUSE',
            splitButton: 'SPLIT',
            bulkFuseButton: 'BULK FUSE',
            fuseFee: 'Fee: {fee} BNB',
            splitFee: 'Fee: {fee} BNB',
            result: 'Result',
            splitInto: 'Split into',
            targetTier: 'Target Tier',
        },

        // Trade History
        tradeHistory: 'Trade History',
        noTradeHistory: 'No trade history',
        bought: 'Bought',
        sold: 'Sold',
        fused: 'Fused',
        split: 'Split',

        // Toast messages
        toast: {
            buySuccess: '{tier} NFT bought successfully!',
            buyFailed: 'Purchase failed: {error}',
            sellSuccess: '{tier} NFT sold successfully!',
            sellFailed: 'Sale failed: {error}',
            fuseSuccess: 'Fusion complete! New {tier} NFT created',
            fuseFailed: 'Fusion failed: {error}',
            splitSuccess: 'Split complete! 2 {tier} NFTs created',
            splitFailed: 'Split failed: {error}',
            bulkFuseSuccess: 'Bulk fuse complete!',
            bulkFuseFailed: 'Bulk fuse failed: {error}',
            nftAddedToWallet: '{tier} NFT #{id} added to wallet!',
            nftNotAdded: 'NFT not added to wallet',
            failedToAddNft: 'Failed to add NFT to wallet',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FORTUNE — FortunePool.js
    // ═══════════════════════════════════════════════════════════════════════
    fortune: {
        title: 'Fortune Pool',
        subtitle: 'Test your luck — win up to 100x',
        prizePool: 'Prize Pool',
        playToWin: 'Play to win',
        prize: 'Prize: {amount} BKC',

        // Tiers
        tiers: {
            standard: 'Standard',
            combo: 'Combo',
            jackpot: 'Jackpot',
        },

        // Game flow
        selectBet: 'Select Bet',
        placeBet: 'Place Bet',
        confirmInMetamask: 'Confirm in MetaMask...',
        waitingReveal: 'Waiting for Reveal...',
        revealResult: 'Reveal & See Result!',
        revealing: 'Revealing...',
        confirmed: 'Confirmed',
        retryingIn: 'Retrying in {seconds}s...',

        // Results
        youWon: 'You Won!',
        youLost: 'No Luck',
        wonAmount: 'You won {amount} BKC!',

        // Odds
        odds: {
            win2x: '1 in 5 — Win 2x',
            win5x: '1 in 10 — Win 5x',
            win100x: '1 in 150 — Win 100x',
        },

        // Stats
        totalGames: 'Total Games',
        totalWins: 'Wins',
        totalPrizesPaid: 'Prizes Paid',
        winsCount: '{wins}/{total} wins',
        yourHistory: 'Your History',

        // Share
        shareWin: 'Share Win',
        shareText: 'I just won {amount} BKC on Backcoin\'s Fortune Pool!',

        // Toast
        toast: {
            betPlaced: 'Bet placed! Waiting for result...',
            betFailed: 'Bet failed: {error}',
            revealSuccess: 'Result revealed!',
            revealFailed: 'Reveal failed: {error}',
            insufficientBkc: 'Insufficient BKC balance',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TRADE — TradePage.js
    // ═══════════════════════════════════════════════════════════════════════
    trade: {
        title: 'Trade',
        swap: 'Swap',
        connectWallet: 'Connect Wallet',
        enterAmount: 'Enter amount',
        insufficientBnb: 'Insufficient BNB',
        insufficientBkc: 'Insufficient BKC',
        swapWithImpact: 'Swap ({impact}% impact)',

        // Direction
        youPay: 'You Pay',
        youReceive: 'You Receive',
        balance: 'Balance: {amount} {symbol}',

        // Info
        priceImpact: 'Price Impact',
        slippage: 'Slippage Tolerance',
        minimumReceived: 'Minimum Received',
        swapFee: 'Swap Fee',
        route: 'Route',

        // Settings
        settings: 'Settings',
        slippageTolerance: 'Slippage Tolerance',
        custom: 'Custom',

        // Pool info
        poolInfo: 'Pool Info',
        ethReserve: 'BNB Reserve',
        bkcReserve: 'BKC Reserve',
        totalSwaps: 'Total Swaps',
        totalVolume: 'Total Volume',
        contractAddress: 'Contract Address',
        viewContract: 'View Contract',
        backcoinPool: 'Backchain Pool',

        // Chart
        chart: {
            bkcPrice: 'BKC Price',
            noDataYet: 'No price data yet. The chart will populate over time.',
        },

        // Toast
        toast: {
            swapSuccess: 'Swap complete!',
            swapFailed: 'Swap failed: {error}',
            approving: 'Approving BKC...',
            approvalComplete: 'Approval complete!',
            approvalFailed: 'Approval failed',
            swapping: 'Swapping...',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CHARITY — CharityPage.js
    // ═══════════════════════════════════════════════════════════════════════
    charity: {
        title: 'Charity Pool',
        subtitle: 'Support causes with BNB',

        // Stats
        totalDonated: 'Total Donated',
        totalCampaigns: 'Total Campaigns',
        activeCampaigns: 'Active Campaigns',
        totalDonors: 'Total Donors',

        // Status
        statusActive: 'Active',
        statusClosed: 'Closed',
        statusWithdrawn: 'Withdrawn',

        // Categories
        categories: {
            animal: 'Animal Welfare',
            humanitarian: 'Humanitarian Aid',
            environment: 'Environment',
            medical: 'Health & Medicine',
            education: 'Education & Youth',
            disaster: 'Disaster Relief',
            community: 'Community & Social',
        },

        // Campaign Card
        raised: 'Raised',
        goal: 'Goal',
        donors: 'donors',
        daysLeft: '{days} days left',
        goalReached: 'Goal Reached!',
        boosted: 'Boosted',
        boostDaysLeft: '{days}d boost remaining',

        // Actions
        donate: 'Donate',
        createCampaign: 'Create Campaign',
        shareCampaign: 'Share Campaign',
        boostCampaign: 'Boost Campaign',
        closeCampaign: 'Close Campaign',
        withdrawFunds: 'Withdraw Funds',

        // Create Wizard
        create: {
            step1: 'Choose Category',
            step2: 'Campaign Details',
            step3: 'Review & Create',
            campaignTitle: 'Campaign Title',
            description: 'Description',
            goalAmount: 'Goal (BNB)',
            duration: 'Duration (days)',
            addMedia: 'Add Media',
            review: 'Review',
            create: 'Create Campaign',
        },

        // Donate Modal
        donateModal: {
            title: 'Donate to Campaign',
            amount: 'Amount (BNB)',
            presets: 'Quick Amounts',
            donateNow: 'Donate Now',
        },

        // Boost Modal
        boostModal: {
            title: 'Boost Campaign',
            boostDays: 'Boost Days',
            costPerDay: '{cost} BNB/day',
            totalCost: 'Total Cost',
            boostNow: 'Boost Now',
        },

        // Toast
        toast: {
            donationSuccess: 'Donation successful!',
            donationFailed: 'Donation failed: {error}',
            createSuccess: 'Campaign created successfully!',
            createFailed: 'Campaign creation failed: {error}',
            boostSuccess: 'Campaign boosted successfully!',
            boostFailed: 'Boost failed: {error}',
            closeSuccess: 'Campaign closed',
            closeFailed: 'Failed to close campaign: {error}',
            withdrawSuccess: 'Funds withdrawn successfully!',
            withdrawFailed: 'Withdrawal failed: {error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // AIRDROP — AirdropPage.js
    // ═══════════════════════════════════════════════════════════════════════
    airdrop: {
        title: 'Airdrop',
        subtitle: 'Earn points, climb the rankings, receive rewards',

        // Tabs
        tabs: {
            earn: 'Earn',
            ranking: 'Ranking',
            history: 'History',
            nftRewards: 'NFT Rewards',
        },

        // Earn Tab
        totalPoints: 'Total Points',
        currentRank: 'Current Rank',
        multiplier: 'Multiplier',
        postsApproved: 'Posts Approved',

        // Sharing
        shareOnX: 'Share on X',
        shareOnInstagram: 'Share on Instagram',
        shareOnOther: 'Share on Other',
        shared: 'Shared',
        shareToEarn: 'Share to earn points',
        postFirst: 'Post on Agora first',

        // Platform usage
        platformUsage: 'Platform Usage',
        claimFaucet: 'Use Faucet',
        delegateBkc: 'Delegate BKC',
        playFortune: 'Play Fortune',
        buyNft: 'Buy NFT',
        sellNft: 'Sell NFT',
        listForRent: 'List for Rent',
        rentNft: 'Rent NFT',
        notarizeDoc: 'Notarize Document',
        claimRewards: 'Claim Rewards',

        // Inline composer
        writePost: 'Write something to post...',
        createPost: 'Create Post',
        postCreated: 'Post created! Now share on X, Instagram, and more.',

        // Ranking
        ranking: {
            byPosts: 'By Posts',
            byPoints: 'By Points',
            rank: 'Rank',
            user: 'User',
            posts: 'Posts',
            points: 'Points',
        },

        // NFT rewards section
        nftRewards: {
            title: 'NFT Prizes',
            description: 'Top-ranked users win NFT Boosters!',
            totalNfts: '{count} total NFTs',
        },

        // Audit
        audit: {
            underReview: 'Your post is under security audit...',
            verifying: 'Verifying post authenticity...',
            checking: 'Checking compliance with guidelines...',
            reviewInProgress: 'Security review in progress...',
            analyzing: 'Audit team analyzing your submission...',
        },

        // Toast
        toast: {
            postTooLong: 'Post too long (maximum 2,000 characters).',
            writeFirst: 'Write something to post.',
            uploadFailed: 'Upload failed: {error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // REFERRAL — ReferralPage.js
    // ═══════════════════════════════════════════════════════════════════════
    referral: {
        title: 'Tutor System',
        heroTitle: 'Invite Friends,',
        heroHighlight: 'Earn Forever',
        heroDesc: 'Every user has a tutor. When your friend uses the protocol, you automatically earn a share of the fees — forever, guaranteed by smart contracts.',

        // Share Card
        yourTutorLink: 'Your Tutor Link',
        connectForLink: 'Connect your wallet to get your tutor link',

        // Stats
        tutters: 'Students',
        yourTutor: 'Your Tutor',
        noneYet: 'None yet',

        // Earnings
        yourEarnings: 'Your Earnings',
        accumulated: 'Accumulated from student activity',
        shareToStart: 'Share your tutor link to start earning. You will receive a share of all fees your students pay.',
        noFeesYet: 'Your students haven\'t generated fees yet. Earnings appear here automatically as they use the protocol.',

        // How it works
        howItWorks: {
            title: 'How It Works',
            step1Title: 'Share Your Link',
            step1Desc: 'Send your tutor link to friends. When they connect and perform their first action, you become their tutor — forever.',
            step2Title: 'They Use the Protocol',
            step2Desc: 'Every time they stake, play Fortune, buy NFTs, or any action — a share of the fee goes directly to you.',
            step3Title: 'You Earn Automatically',
            step3Desc: '10% of all BNB fees + 5% of BKC staking rewards. Fully automatic, on-chain, forever.',
        },

        // Change tutor
        changeTutor: {
            title: 'Change Tutor',
            desc: 'Enter the new tutor address',
            placeholder: '0x...',
            confirm: 'Change Tutor',
            warning: 'This will replace your current tutor. Your new tutor will earn from your future activity.',
        },

        // Toast
        toast: {
            linkCopied: 'Tutor link copied!',
            withdrawSuccess: 'Earnings withdrawn successfully!',
            withdrawFailed: 'Withdrawal failed: {error}',
            changeTutorSuccess: 'Tutor changed successfully!',
            changeTutorFailed: 'Tutor change failed: {error}',
            invalidAddress: 'Invalid address',
            cannotBeSelf: 'You cannot be your own tutor',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // RENTAL — RentalPage.js (Boost Market)
    // ═══════════════════════════════════════════════════════════════════════
    rental: {
        title: 'Boost Market',
        subtitle: 'Rent Booster NFTs to amplify your rewards',

        // Tabs
        marketplace: 'Marketplace',
        myRentals: 'My Rentals',
        myListings: 'My Listings',

        // Filters
        allTiers: 'All Tiers',
        sortByBoosted: 'Boosted',
        sortByPrice: 'Lowest Price',
        sortByExpiry: 'Expiring Soon',

        // Listing Card
        perDay: '/day',
        listed: 'Listed',
        rented: 'Rented',
        available: 'Available',
        timeLeft: '{time} remaining',
        expired: 'Expired',
        booster: 'Booster',
        yours: 'YOURS',

        // Keep Rate Descriptions
        keepAllRewards: 'Keep 100% of your staking rewards!',
        saveBurns: 'Save {rate}% on claim burns',
        keepRewards100: 'Keep 100% of rewards!',
        keepRewardsRate: 'Keep {rate}% of rewards on claims',
        keepRewardsOf: 'Keep {rate}% of rewards',

        // Connected status
        connected: 'Connected',

        // Rent Modal
        rentNft: 'Rent NFT',
        rentBooster: 'Rent Booster',
        rentalDays: 'Rental Days',
        rentalCost: 'Rental Cost',
        ecosystemFee: 'Ecosystem Fee',
        ecosystemFeePercent: 'Ecosystem Fee (20%)',
        totalCost: 'Total Cost',
        rentNow: 'Rent Now',
        rent1Day: 'Rent 1 Day',
        oneDayDuration: '1 Day (24 hours)',
        duration: 'Duration',
        needBnb: 'Need {amount} BNB',
        balanceWarning: 'Your balance: {balance} BNB — need {deficit} more BNB',

        // List Modal
        listForRent: 'List for Rent',
        listNftForRent: 'List NFT for Rent',
        selectNft: 'Select NFT',
        selectNftPlaceholder: '-- Select an NFT --',
        pricePerDay: 'Price per Day (BNB)',
        listNow: 'List Now',
        listNft: 'List NFT',
        listBtn: 'List',
        fixedDayNote: 'Fixed 1-day rental. NFT auto re-lists after each rental.',
        enterPrice: 'Enter valid price',

        // Earnings
        totalLifetimeEarnings: 'Total Lifetime Earnings',
        pendingBnb: 'Pending BNB',
        pendingEarnings: 'Pending Earnings',
        withdrawEarnings: 'Withdraw Earnings',
        noEarnings: 'No pending earnings',

        // My Listings / My Rentals empty states
        viewListings: 'View your listings',
        viewRentals: 'View your active rentals',
        noListingsTitle: 'No Listings Yet',
        noListingsMsg: 'List your first NFT to start earning BNB!',
        noRentalsTitle: 'No Active Rentals',
        noRentalsMsg: 'Rent an NFT booster to keep more staking rewards!',

        // Boost Tiers
        boostTiers: 'Boost Tiers',
        boostTiersDesc: 'Diamond = Keep 100% | Gold = 90% | Silver = 80% | Bronze = 70% — Without NFT: 50% recycled.',

        // Boost Modal
        boostListing: 'Boost Listing',
        boostDuration: 'Boost Duration (days)',
        boostExplanation: 'Boosted listings appear first in the marketplace. Choose how many days to boost.',
        boostExtendNote: 'New days will extend from current expiry.',
        boostedDaysRemaining: 'Boosted — {days} days remaining',
        notBoosted: 'Not boosted',
        costPerDay: 'Cost per day',
        calculating: 'Calculating...',

        // Boost buttons
        boost: {
            extend: 'Extend',
            boost: 'Boost',
            now: 'Boost Now',
            extendBoost: 'Extend Boost',
        },

        // Withdraw NFT
        confirmWithdrawNft: 'Withdraw this NFT from the marketplace?',

        // Share
        shareText: 'Rent NFT Boosters on Backchain Boost Market!\n\nKeep up to 100% of your staking rewards by renting an NFT booster.\n\n{url}\n\n#Backchain #DeFi #BNBChain #opBNB #Web3',

        // How It Works
        howItWorks: {
            title: 'How the Boost Market Works',
            step1: 'NFT owners list their Boosters for rent',
            step2: 'Renters pay BNB to use the boost temporarily',
            step3: 'The boost applies automatically to staking rewards',
            step4: 'When it expires, the NFT returns to the owner',
        },

        // Toast
        toast: {
            rentSuccess: 'NFT rented successfully!',
            rentFailed: 'Rental failed: {error}',
            listSuccess: 'NFT listed for rent!',
            listFailed: 'Listing failed: {error}',
            withdrawSuccess: 'Earnings withdrawn!',
            withdrawFailed: 'Earnings withdrawal failed: {error}',
            withdrawNftSuccess: 'NFT withdrawn successfully!',
            delistSuccess: 'NFT delisted',
            delistFailed: 'Delist failed: {error}',
            promoteSuccess: 'Listing promoted!',
            promoteFailed: 'Promotion failed: {error}',
            boostSuccess: 'Listing boosted for {days} days!',
            boostFailed: 'Boost failed: {error}',
            linkCopied: 'Link copied to clipboard!',
            copyFailed: 'Could not copy link',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // OPERATOR — OperatorPage.js
    // ═══════════════════════════════════════════════════════════════════════
    operator: {
        title: 'Become Operator',
        badge: 'Build on Backchain',
        heroTitle: 'Build on Backchain, Earn Perpetual Commissions',
        heroDesc: 'Anyone can build a frontend for Backchain (website, app, bot) and earn automatic commissions on every transaction from your users. No approval. No permission.',

        // How it works
        howItWorks: {
            title: 'How It Works',
            step1Title: 'Build Your Frontend',
            step1Desc: 'Create a website, app, or bot that interacts with Backchain contracts.',
            step2Title: 'Register Your Address',
            step2Desc: 'Set your address as operator in your frontend.',
            step3Title: 'Earn Automatically',
            step3Desc: 'Every transaction from your users generates commission for you — forever.',
        },

        // Modules
        modulesTitle: 'Ecosystem Modules',
        moduleName: 'Module',
        operatorFee: 'Operator Fee',
        status: 'Status',
        enabled: 'Active',
        disabled: 'Disabled',

        // Earnings
        yourEarnings: 'Your Earnings',
        pendingBnb: 'Pending BNB',
        withdraw: 'Withdraw',
        noEarnings: 'Connect wallet to view your earnings',

        // Code Example
        codeExample: 'Code Example',
        codeDesc: 'Register your address as operator:',

        // Toast
        toast: {
            withdrawSuccess: 'Earnings withdrawn successfully!',
            withdrawFailed: 'Withdrawal failed: {error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TOKENOMICS — TokenomicsPage.js
    // ═══════════════════════════════════════════════════════════════════════
    tokenomics: {
        title: 'Tokenomics',
        subtitle: 'Modular smart contract ecosystem. Real yield from protocol fees. Deflationary by design. No admin keys. Unstoppable.',

        // Supply
        tokenSupply: 'Token Supply',
        erc20OnOpbnb: 'BKC — ERC-20 on opBNB',
        maxSupply: 'Max Supply',
        circulating: 'Circulating',
        unminted: 'Unminted',
        mintedSoFar: '{pct}% minted so far',

        // TGE
        tgeAllocation: 'TGE Allocation',
        tokensAtLaunch: 'Tokens at Launch',
        liquidityPool: 'Liquidity Pool',
        airdropReserve: 'Airdrop Reserve',
        phase: 'Phase',

        // Fee Flow
        feeFlow: 'Fee Flow',
        feeFlowDesc: 'Every transaction generates BNB fees that flow through the ecosystem.',
        operatorCut: 'Operator Cut',
        tutorCut: 'Tutor Cut',
        protocol: 'Protocol',

        // BKC Distribution
        bkcDistribution: 'BKC Distribution',
        stakers: 'Stakers',
        burn: 'Burn',
        treasury: 'Treasury',

        // Modules
        ecosystemModules: 'Ecosystem Modules',

        // Deflationary
        deflationaryDesign: 'Deflationary Design',
        burnMechanisms: 'Burn Mechanisms',

        // CTAs
        startStaking: 'Start Staking',
        becomeOperator: 'Become Operator',
        inviteFriends: 'Invite Friends',
        footer: 'Ready to join?',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ABOUT — AboutPage.js
    // ═══════════════════════════════════════════════════════════════════════
    about: {
        heroTitle: 'What is Backchain?',
        heroSubtitle: 'Modular DeFi ecosystem on opBNB. No admin keys. Unstoppable.',

        // Hero badges
        badgeCommunity: 'Community-Owned',
        badgeSustaining: 'Self-Sustaining',
        badgeUnstoppable: 'Unstoppable',
        badgeOpenSource: 'Open Source',

        // Philosophy
        philosophy: 'The Philosophy',
        philosophySub: 'Why Backchain exists',
        philosophyText: 'Most DeFi protocols are controlled by teams that can pause contracts, blacklist wallets, or change the rules. Backchain was built with a different philosophy: <strong class="text-white">once deployed, the code runs forever</strong> — no admin can stop it, no company can shut it down, and no government can censor it.',
        noBlacklists: 'No Blacklists',
        noBlacklistsDesc: 'Every wallet has equal access. No addresses can be blocked or restricted.',
        immutableCore: 'Immutable Core',
        immutableCoreDesc: 'Core contracts are immutable. Modules can be added or removed without changing existing code.',

        // Architecture
        architecture: {
            title: 'Ecosystem Architecture',
            subtitle: 'Modular contracts connected to a central hub',
            hub: 'Ecosystem',
            hubDesc: 'Central Hub',
        },
        hubSpokeText: 'Backchain uses a <strong class="text-white">modular architecture</strong>. The <span class="text-amber-400 font-medium">Hub</span> (BackchainEcosystem) is the immutable core — it manages all fees, reward distribution, operator commissions, and tutor referrals. The <span class="text-emerald-400 font-medium">Spokes</span> are independent services that plug into the Hub. New spokes can be added anytime without changing existing contracts.',
        hubTitle: 'The Hub (BackchainEcosystem)',
        hubFeature1: 'Fee collection & per-module distribution',
        hubFeature2: 'Operator commissions (10-20% to builders)',
        hubFeature3: 'Tutor referral system (10% BNB + 5% BKC)',
        hubFeature4: 'Buyback & Burn engine (deflationary)',
        spokesTitle: 'The Spokes (Service Modules)',
        spokeFeature1: 'Each spoke generates fees for the ecosystem',
        spokeFeature2: 'Independent deployment & upgradability',
        spokeFeature3: 'More spokes = more revenue = higher rewards',

        // Module categories
        defiCore: 'DeFi Core',
        nftEcosystem: 'NFT Ecosystem',
        communityServices: 'Community & Services',
        infraGovernance: 'Infrastructure & Governance',

        // Modules
        modules: {
            staking: 'Staking Pool',
            stakingDesc: 'Delegate BKC with time-locks. Earn BNB + BKC rewards.',
            nftMarket: 'NFT Pool',
            nftMarketDesc: 'Bonding curve marketplace. Buy low, sell high.',
            fortune: 'Fortune Pool',
            fortuneDesc: 'On-chain game with 2x, 5x, and 100x odds',
            agora: 'Agora',
            agoraDesc: 'Decentralized social protocol. Posts, likes, follows on-chain.',
            notary: 'Notary',
            notaryDesc: 'Certify documents on-chain. Immutable proof of existence.',
            charity: 'Charity Pool',
            charityDesc: 'Transparent fundraising. On-chain donation tracking.',
            rental: 'Rental Manager',
            rentalDesc: 'Rent NFT boosts from other users. AirBNFT marketplace.',
            liquidity: 'Liquidity Pool',
            liquidityDesc: 'Constant-product AMM for BNB/BKC trading.',
        },

        // Extended module descriptions (mod.*)
        mod: {
            bkcToken: 'BKC Token',
            bkcTokenDesc: 'ERC-20 with activity-based minting. 200M cap.',
            buybackMiner: 'Buyback Miner',
            buybackMinerDesc: 'Converts BNB fees into BKC via scarcity curve mining.',
            rewardBooster: 'RewardBooster NFTs',
            rewardBoosterDesc: '4-tier NFTs (Diamond/Gold/Silver/Bronze) that reduce staking burn rate.',
            nftFusion: 'NFT Fusion',
            nftFusionDesc: 'Fuse 2 same-tier NFTs into 1 higher tier, or split down.',
            ecosystem: 'BackchainEcosystem',
            ecosystemDesc: 'Master hub — fees, operators, tutors, reward splits.',
            governance: 'Governance',
            governanceDesc: 'Progressive decentralization: Admin → Multisig → Timelock → DAO.',
            faucet: 'Testnet Faucet',
            faucetDesc: 'Free BKC for testing on opBNB testnet.',
            ibackchain: 'IBackchain',
            ibackchainDesc: 'Shared interfaces for all contract interactions.',
        },

        // Fee System
        feeSystemText: 'Every protocol action generates a small BNB fee. The smart contract automatically splits this fee among multiple beneficiaries — creating aligned incentives for users, builders, referrers, and the protocol.',
        whereFeesGo: 'Where Your Fees Go',
        userPaysFee: 'User pays fee (BNB)',
        ecosystemSplits: 'BackchainEcosystem splits automatically',
        feeTutor: 'Tutor',
        feeTutorDesc: 'Who referred you',
        feeOperator: 'Operator',
        feeOperatorDesc: 'App builder',
        feeBuyback: 'Buyback',
        feeBuybackDesc: 'Buy + burn BKC',
        feeTreasury: 'Treasury',
        feeTreasuryDesc: 'Protocol growth',
        feeDisclaimer: 'Exact split varies by module. All percentages are immutable on-chain.',
        everyoneWins: 'Everyone Wins',
        everyoneWinsDesc: 'No tutor? → 10% is burned instead. No operator? → Operator share is burned. Every scenario either rewards a participant or makes BKC more scarce. The system has no leaks.',

        // Mining
        miningTitle: 'Mining by Purchase',
        miningSub: 'Proof-of-Purchase: Using = Mining',
        miningText: 'In Backchain, <strong class="text-white">using the platform IS mining</strong>. When you buy an NFT Booster, the BuybackMiner converts the BNB spent into newly minted BKC tokens via a scarcity curve — the more that\'s been mined, the harder it gets, just like Bitcoin.',
        howMiningWorks: 'How Mining Works',
        miningStep1: 'You Buy an NFT Booster',
        miningStep1Desc: 'From the bonding curve pool (Diamond, Gold, Silver, Bronze)',
        miningStep2: 'BuybackMiner Converts BNB → BKC',
        miningStep2Desc: 'Scarcity curve: earlier miners get more BKC per BNB',
        miningStep3: 'Rewards Distributed',
        miningStep3Desc: '70% to stakers (proportional to pStake), 30% to treasury',
        stakerRewards: 'Staker Rewards',
        stakerRewardsDesc: 'Distributed based on pStake weight',
        treasuryDesc: 'Funds ecosystem development',

        // Growth Programs
        growthTitle: 'Growth Programs',
        growthSub: 'Two systems to grow the ecosystem',
        tutorSystem: 'Tutor System',
        tutorSystemSub: 'Tutor new users, earn forever',
        tutorDesc: 'Share your tutor link. When someone joins through it, they become your Tutter and you earn <strong class="text-white">10% of their BNB fees</strong> + <strong class="text-white">5% of their BKC claims</strong> — forever.',
        operatorSystem: 'Operator System',
        operatorSystemSub: 'Build an app, earn commissions',
        operatorDesc: 'Build your own frontend, bot, or integration. Set your wallet as the <strong class="text-white">operator</strong> and earn <strong class="text-white">10-20% of every fee</strong> generated through your app. No registration needed.',
        learnMore: 'Learn More',

        // Why Backchain features
        noVCs: 'No VCs, No Pre-mine, No Insiders',
        noVCsDesc: '35% of TGE (14M BKC) goes directly to the community via airdrop. 65% goes to the liquidity pool. No investors dumping tokens on you. The team earns the same way you do — by using the protocol.',
        realUtilityDesc: 'Notarize legal documents. Play verifiably fair games. Trade NFTs on bonding curves. Rent boost power. Post on a censorship-resistant social network. Donate to transparent charities. These aren\'t promises — they\'re live contracts on opBNB.',
        sustainableYield: 'Sustainable Yield, Not Inflation',
        sustainableYieldDesc: 'Staking rewards come from real protocol fees (BNB) and mining activity — not from printing tokens. The more the ecosystem is used, the higher the real yield. No ponzinomics.',
        alignedIncentives: 'Aligned Incentives at Every Level',
        alignedIncentivesDesc: 'Users earn by staking. Tutors earn by inviting. Operators earn by building. The protocol earns by growing. No participant is extracting value from another — everyone benefits from usage growth.',

        // Tech Stack
        techStack: 'Technology Stack',
        techStackSub: 'Built on battle-tested infrastructure',

        // CTA
        ctaDesc: 'Start earning airdrop points today. Stake, trade, play, or build — every action counts.',
        whitepaper: 'Whitepaper',

        // Whitepaper Modal
        tokenomicsPaper: 'Tokenomics Paper V3',
        tokenomicsPaperDesc: 'Distribution, Mining & Scarcity Engines',
        technicalPaper: 'Technical Whitepaper V2',
        technicalPaperDesc: 'Architecture, Contracts & Fee System',

        // Footer
        footer: 'Built by the community, for the community.',

        // Key Features
        keyFeatures: {
            title: 'Key Features',
            noAdmin: 'No Admin Keys',
            noAdminDesc: 'Immutable contracts. No one can pause, modify, or withdraw funds.',
            realYield: 'Real Yield',
            realYieldDesc: 'Rewards from real protocol fees, not inflationary emission.',
            modular: 'Modular',
            modularDesc: 'Modules can be added/removed without affecting the ecosystem.',
            deflationary: 'Deflationary',
            deflationaryDesc: '5% of all BKC fees are permanently burned.',
        },

        // Links
        links: {
            title: 'Project Links',
            website: 'Website',
            docs: 'Documentation',
            github: 'GitHub',
            telegram: 'Telegram',
            twitter: 'X (Twitter)',
        },

        // Contract addresses
        contracts: {
            title: 'Contract Addresses',
            viewOnExplorer: 'View on Explorer',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TUTORIALS — TutorialsPage.js
    // ═══════════════════════════════════════════════════════════════════════
    tutorials: {
        title: 'Video Tutorials',
        subtitle: 'Learn everything about the Backchain ecosystem',
        watchOnYoutube: 'Watch on YouTube',
        subscribe: 'Subscribe on YouTube',
        subscribeDesc: 'Stay updated with new tutorials and updates',
        subscribeBtn: 'Subscribe',
        comingSoon: 'Coming Soon',

        // Hero
        heroTitle: 'Master the Backcoin Ecosystem',
        heroSubtitle: 'Complete video tutorials covering every feature — from your first BKC to building your own operator business',
        videoCount: 'Videos',
        languages: '2 Languages',
        categoriesLabel: 'Categories',
        everyFeature: 'Every ecosystem feature',

        // Filters
        filterAll: 'All',

        // Categories
        categories: {
            overview: 'What is Backcoin',
            gettingStarted: 'Getting Started',
            stakingMining: 'Staking & Mining',
            nftBoosters: 'NFT Boosters',
            fortunePool: 'Fortune Pool',
            community: 'Community & Social',
            services: 'Services',
            advanced: 'Advanced',
        },

        // Tags
        tags: {
            beginner: 'Beginner',
            intermediate: 'Intermediate',
            advanced: 'Advanced',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN — AdminPage.js
    // ═══════════════════════════════════════════════════════════════════════
    admin: {
        title: 'Admin Panel',
        accessDenied: 'Access Denied',
        restrictedMsg: 'This page is restricted to administrators.',
        enterPassword: 'Enter the admin key to continue',
        login: 'Login',
        quickActions: 'Quick Actions',

        // Tabs
        tabs: {
            overview: 'Overview',
            submissions: 'Submissions',
            users: 'Users',
            tasks: 'Tasks',
            settings: 'Settings',
        },

        // Overview
        overview: {
            totalUsers: 'Total Users',
            totalSubmissions: 'Total Submissions',
            pendingReview: 'Pending Review',
            totalPoints: 'Total Points',
        },

        // Status labels
        status: {
            pending: 'Pending Review',
            auditing: 'Auditing',
            approved: 'Approved',
            rejected: 'Rejected',
            flagged: 'Flagged',
        },

        // Actions
        approveAll: 'Approve All',
        rejectAll: 'Reject All',
        exportCsv: 'Export CSV',
        reloadData: 'Reload Data',
        ban: 'Ban',
        unban: 'Unban',

        // Faucet
        faucet: {
            status: 'Faucet Status',
            paused: 'PAUSED',
            active: 'ACTIVE',
            pause: 'Pause',
            unpause: 'Unpause',
        },

        // Toast
        toast: {
            loadFailed: 'Failed to load admin data.',
            txSent: 'Transaction sent...',
            faucetPaused: 'Faucet PAUSED successfully!',
            faucetUnpaused: 'Faucet UNPAUSED successfully!',
            reloading: 'Reloading data...',
            noUsersExport: 'No users to export.',
            exportedUsers: 'Exported {count} users.',
            noSubmissionsExport: 'No submissions to export.',
            exportedSubmissions: 'Exported {count} submissions.',
            submissionApproved: 'Submission APPROVED!',
            submissionRejected: 'Submission REJECTED!',
            userBanned: 'User BANNED.',
            userUnbanned: 'User UNBANNED.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOCIAL — SocialMedia.js
    // ═══════════════════════════════════════════════════════════════════════
    social: {
        title: 'Join the Backcoin Community',
        subtitle: 'Connect with thousands of holders, stay up to date with the Mainnet launch, and participate in exclusive airdrops.',

        // Telegram
        telegramTitle: 'Official Telegram Group',
        telegramDesc: 'Chat with the team and community \u2022 24/7 Support',
        joinNow: 'JOIN NOW',

        // Social Cards
        twitter: 'X (Twitter)',
        twitterDesc: 'Latest news and announcements',
        youtube: 'YouTube',
        youtubeDesc: 'Video tutorials and AMAs',
        instagram: 'Instagram',
        instagramDesc: 'Visual updates and stories',
        tiktok: 'TikTok',
        tiktokDesc: 'Short clips and viral content',
        facebook: 'Facebook',
        facebookDesc: 'Community discussions',

        // Warning
        verifyLinks: 'Always verify links. Official admins never DM asking for funds.',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FEEDBACK — ui-feedback.js
    // ═══════════════════════════════════════════════════════════════════════
    feedback: {
        // RPC Errors
        metamaskPending: 'MetaMask has a pending request. Open your MetaMask extension and complete or reject any pending action.',
        txCancelled: 'Transaction cancelled by user.',
        insufficientFunds: 'Insufficient balance in your wallet.',
        metamaskNotDetected: 'MetaMask not detected',

        // NFT Wallet
        nftAddedToWallet: '{tier} NFT #{id} added to wallet!',
        nftNotAdded: 'NFT not added to wallet',
        failedToAddNft: 'Failed to add NFT to wallet',

        // Timer
        unlocked: 'Unlocked',

        // Wallet
        walletDisconnected: 'Wallet disconnected.',

        // Share Modal
        inviteEarn: 'Invite & Earn',
        shareBackchain: 'Share Backchain',
        shareTutorDesc: 'Share your tutor link — earn <strong class="text-amber-400">10% BNB</strong> + <strong class="text-amber-400">5% BKC</strong> from every friend',
        connectForTutorLink: 'Connect your wallet to generate a personal invite link with your tutor referral built in!',
        shareConnectedText: "Join Backchain — I'll be your tutor! Stake BKC, earn rewards, and I'll earn too. Use my invite link:",
        shareDisconnectedText: 'Check out Backchain — Unstoppable DeFi on opBNB. Stake, trade NFTs, play Fortune Pool & more!',
        badge10BNB: '10% BNB Fees',
        badge5BKC: '5% BKC Claims',
        badgeForever: 'Forever',
        tutorEmbedded: 'Your tutor address <span class="font-mono text-zinc-400">{addr}</span> is embedded in this link',
        footerConnected: 'Friends who join via your link automatically set you as their tutor',
        footerDisconnected: 'Share now — every new user strengthens the ecosystem',
        shareOn: {
            twitter: 'Twitter',
            telegram: 'Telegram',
            whatsapp: 'WhatsApp',
            copyLink: 'Copy Link',
        },
        linkCopied: 'Tutor link copied!',
        inviteLinkCopied: 'Invite link copied!',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // AGORA — pages/agora/*.js
    // ═══════════════════════════════════════════════════════════════════════
    agora: {
        // Header / Nav
        brandName: 'Agora',
        feed: 'Feed',
        discover: 'Discover',
        profile: 'Profile',
        post: 'Post',
        createProfile: 'Create Profile',

        // Compose
        compose: {
            placeholder: 'What\'s happening on-chain?',
            post: 'Post',
            reply: 'Reply',
            addImage: 'Add Image',
            addVideo: 'Add Video',
            addMedia: 'Add media',
            charCount: '{current}/{max}',
            posting: 'Posting...',
            uploadingMedia: 'Uploading media...',
            video: 'Video',
            goLive: 'Go Live',
            live: 'LIVE',
            free: 'FREE',
            newPost: 'New Post',
            createProfileBanner: 'Create your profile to get a username and start posting',
        },

        // Feed
        newPost: 'new post',
        newPosts: 'new posts',
        feedEmpty: 'No posts yet. Be the first!',
        feedEmptySubtext: 'Be the first to post on the unstoppable social network!',
        discoverEmpty: 'No trending posts yet',
        discoverSubtext: 'Be the first to post! Posts are ranked by engagement — likes, replies, and Super Likes boost visibility.',
        discoverRankedBy: 'Ranked by engagement — likes, replies, reposts & Super Likes',
        search: {
            placeholder: 'Search posts and users...',
            noResults: 'No results found',
            tryAnother: 'Try a different search term',
            resultsFor: 'Results for "{query}"',
            result: 'result',
            results: 'results',
        },
        loadingPosts: 'Loading posts...',
        noMorePosts: 'No more posts',
        loadMore: 'Load More',
        comingSoon: 'Coming Soon!',
        comingSoonDesc: 'Agora is being deployed. The unstoppable social network will be live soon!',
        noTagPosts: 'No {tag} posts',
        noTagPostsSubtext: 'Try a different tag or be the first to post!',
        welcomeTitle: 'Welcome to Agora',
        welcomeStep1: 'Create your profile',
        welcomeStep2: 'Post your first thought',
        welcomeStep3: 'Earn Super Likes',
        readMore: 'Read more',
        more: 'more',
        less: 'less',
        endStream: 'End Stream',
        joinLiveStream: 'Join Live Stream',
        leave: 'Leave',
        originalPostNotFound: 'Original post not found',

        // Post Card
        postCard: {
            like: 'Like',
            liked: 'Liked',
            reply: 'Reply',
            repost: 'Repost',
            reposted: '{name} reposted',
            superLike: 'Super Like',
            downvote: 'Downvote',
            share: 'Share',
            tip: 'Tip',
            tipAuthor: 'Tip Author',
            boost: 'Boost',
            boostPost: 'Boost Post',
            report: 'Report',
            edit: 'Edit',
            editPost: 'Edit Post',
            delete: 'Delete',
            pin: 'Pin',
            pinToProfile: 'Pin to profile',
            unpin: 'Unpin',
            block: 'Block',
            blockUser: 'Block User',
            unblock: 'Unblock',
            unblockUser: 'Unblock User',
            changeTag: 'Change Tag',
            replies: '{count} reply(ies)',
            viewThread: 'View Thread',
            viewOnExplorer: 'View on Explorer',
            edited: 'edited',
            replyingTo: 'Replying to {name}',
            options: 'Options',
        },

        // Profile
        profileSetup: {
            title: 'Create Your Profile',
            subtitle: 'Set up your on-chain identity on Agora',
            username: 'Choose a Username',
            usernamePlaceholder: 'e.g. satoshi',
            usernameHint: '1-15 chars: lowercase letters, numbers, underscores. Shorter usernames cost more BNB.',
            usernameChecking: 'Checking...',
            usernameAvailable: 'Available',
            usernameTaken: 'Taken',
            usernameFree: 'FREE',
            create: 'Create Profile',
            creating: 'Creating...',
            displayName: 'Display Name',
            displayNamePlaceholder: 'Your public name',
            bio: 'Bio',
            bioPlaceholder: 'Tell the world about yourself...',
            language: 'Language',
            languageHint: 'Your posts will be tagged with this language for filtering.',
            step2Hint: 'Display name, bio, and language are stored as metadata and can be updated anytime for free.',
            usernameFee: 'Username Fee',
            connectWalletToCreate: 'Connect your wallet to create your profile.',
            connectWalletToView: 'Connect your wallet to view your profile.',
        },

        myProfile: {
            posts: 'Posts',
            followers: 'Followers',
            following: 'Following',
            editProfile: 'Edit Profile',
            noPosts: 'No posts yet',
            noPostsSubtext: 'No posts yet — share your first thought!',
            yourPosts: 'Your Posts',
            total: '{count} total',
            viewOnExplorer: 'View on Explorer',
            badge: 'Badge',
            boost: 'Boost',
            boosted: 'Boosted',
        },

        userProfile: {
            follow: 'Follow',
            unfollow: 'Unfollow',
            following: 'Following',
            blocked: 'Blocked',
            block: 'Block',
            unblock: 'Unblock',
            notFound: 'User not found',
            noPosts: 'No posts yet',
        },

        // Tags
        tags: {
            all: 'All',
            general: 'General',
            defi: 'DeFi',
            nft: 'NFT',
            memes: 'Memes',
            alpha: 'Alpha',
            dev: 'Dev',
        },

        // Sort
        sort: {
            forYou: 'For You',
            following: 'Following',
            new: 'New',
            top: 'Top',
        },

        // Modals
        modals: {
            superLike: {
                title: 'Super Like',
                desc: 'Send any amount of BNB to boost this post to trending. More BNB = higher rank. All BNB goes to the ecosystem.',
                amountLabel: 'Amount (BNB)',
                anyAmount: 'Any amount',
                minAmount: '> 0 BNB',
                confirm: 'Super Like',
            },
            downvote: {
                title: 'Downvote',
                desc: 'Downvote this post. You can only downvote each post once.',
                confirm: 'Downvote',
            },
            tip: {
                title: 'Tip Author',
                desc: 'Send BNB directly to the post author as a tip. Any amount > 0.',
                amountLabel: 'Amount (BNB)',
                confirm: 'Send Tip',
            },
            boost: {
                title: 'Boost Post',
                desc: 'Boost this post for more visibility. Pricing set by ecosystem governance.',
                daysLabel: 'Days',
                standard: 'Standard',
                featured: 'Featured',
                confirm: 'Boost Post',
            },
            boostProfile: {
                title: 'Profile Boost',
                desc: 'Boost your profile for more visibility. Pricing set by ecosystem governance.',
                daysLabel: 'Days',
                confirm: 'Boost Profile',
            },
            badge: {
                title: 'Trust Badge',
                desc: 'Get a verified badge for 1 year. Higher tiers unlock longer posts and more prestige.',
                verified: 'Verified',
                premium: 'Premium',
                elite: 'Elite',
                charsPerPost: 'Up to {limit} chars per post',
                current: 'current',
                withoutBadge: 'Without badge: 2,000 chars per post',
            },
            report: {
                title: 'Report Post',
                desc: 'Report this post and block the author from your feed. Cost: 0.0001 BNB',
                reasons: {
                    spam: 'Spam',
                    harassment: 'Harassment',
                    illegal: 'Illegal Content',
                    scam: 'Scam',
                    other: 'Other',
                },
                confirm: 'Submit Report',
            },
            editPost: {
                title: 'Edit Post',
                desc: 'Edit within 15 minutes of posting. Free (gas only). Can only edit once.',
                confirm: 'Save Edit',
            },
            editProfile: {
                title: 'Edit Profile',
                coverImage: 'Cover Image',
                noCover: 'No cover',
                profilePicture: 'Profile Picture',
                changePhoto: 'Change Photo',
                displayName: 'Display Name',
                displayNamePlaceholder: 'Your display name',
                bio: 'Bio',
                bioPlaceholder: 'About you...',
                location: 'Location',
                locationPlaceholder: 'e.g. São Paulo, Brazil',
                language: 'Language',
                socialLinks: 'Social Links',
                addLink: 'Add Link',
                platform: 'Platform',
                usernameNote: 'Username cannot be changed. Only gas fee applies.',
                confirm: 'Save Changes',
                maxLinks: 'Maximum 9 links',
                uploadingAvatar: 'Uploading avatar...',
                uploadingCover: 'Uploading cover...',
                imageTooLarge: 'Image too large. Maximum 5MB.',
                avatar: 'Avatar',
                banner: 'Banner',
            },
            repost: {
                title: 'Repost',
                desc: 'Repost this to your followers? FREE (gas only)',
                confirm: 'Repost',
            },
            changeTag: {
                title: 'Change Tag',
                desc: 'Select a new category for your post. Only gas fee applies.',
                confirm: 'Change Tag',
            },
            deletePost: {
                title: 'Delete Post',
                desc: 'Are you sure? This action cannot be undone.',
                confirm: 'Delete',
            },
        },

        // Cart (batch actions)
        cart: {
            title: 'Action Cart',
            empty: 'Cart is empty',
            total: 'Total',
            submit: 'Submit All',
            clear: 'Clear',
            notOnChainYet: 'Not registered on blockchain yet',
            actionsNotOnChain: '<strong>{count} action(s)</strong> not on blockchain yet',
            action: 'action',
            actions: 'actions',
            totalFee: 'Fee: {fee} ETH',
            savings: 'Saving ~{pct}% on gas with batching',
        },

        // Post Detail
        postDetail: {
            postNotFound: 'Post not found',
            replies: 'Replies',
            repliesCount: 'Replies ({count})',
            noReplies: 'No replies yet. Be the first!',
            replyingTo: 'Replying to {name}',
            replyPlaceholder: 'Write a reply...',
            reply: 'Reply',
            replyFree: 'Text replies: FREE (gas only)',
            like: 'Like',
            likes: 'Likes',
            replyCount: 'Reply',
            beFirst: 'Be the first to reply!',
        },

        // Upgrade hint
        upgrade: {
            charsWithTier: 'Up to {limit} chars with',
        },

        // Toast
        toast: {
            postCreated: 'Post created!',
            postFailed: 'Failed to create post: {error}',
            replyCreated: 'Reply published!',
            replyFailed: 'Failed to create reply: {error}',
            likeSuccess: 'Post liked!',
            likeFailed: 'Like failed: {error}',
            followSuccess: 'Now following!',
            followFailed: 'Follow failed: {error}',
            unfollowSuccess: 'Unfollowed',
            unfollowFailed: 'Unfollow failed: {error}',
            repostSuccess: 'Post reposted!',
            repostFailed: 'Repost failed: {error}',
            superLikeSuccess: 'Super Like sent!',
            superLikeFailed: 'Super Like failed: {error}',
            downvoteSuccess: 'Downvote recorded',
            downvoteFailed: 'Downvote failed: {error}',
            tipSuccess: 'Tip sent!',
            tipFailed: 'Tip failed: {error}',
            boostSuccess: 'Post boosted!',
            boostFailed: 'Boost failed: {error}',
            boostProfileSuccess: 'Profile boosted!',
            boostProfileFailed: 'Profile boost failed: {error}',
            badgeSuccess: 'Badge activated!',
            badgeFailed: 'Badge activation failed: {error}',
            reportSuccess: 'Report submitted',
            reportFailed: 'Report failed: {error}',
            editSuccess: 'Post edited!',
            editFailed: 'Edit failed: {error}',
            deleteSuccess: 'Post deleted',
            deleteFailed: 'Delete failed: {error}',
            pinSuccess: 'Post pinned!',
            pinFailed: 'Pin failed: {error}',
            blockSuccess: 'User blocked',
            blockFailed: 'Block failed: {error}',
            unblockSuccess: 'User unblocked',
            unblockFailed: 'Unblock failed: {error}',
            profileCreated: 'Profile created successfully!',
            profileFailed: 'Profile creation failed: {error}',
            profileUpdated: 'Profile updated!',
            profileUpdateFailed: 'Profile update failed: {error}',
            batchSuccess: '{count} actions registered on blockchain!',
            batchFailed: 'Batch transaction failed',
            postShared: 'Post shared!',
            linkCopied: 'Link copied!',
            connectFirst: 'Connect wallet first',
            createProfileFirst: 'Create a profile first',
            alreadyInCart: 'Already in cart',
            likeAddedToCart: 'Like added to cart',
            downvoteAddedToCart: 'Downvote added to cart',
            followAddedToCart: 'Follow added to cart',
            cartCleared: 'Cart cleared',
            cartEmpty: 'Cart is empty',
            pleaseWrite: 'Please write something',
            postTooLong: 'Post too long (max {max} chars)',
            pleaseWriteReply: 'Please write a reply',
            replyPosted: 'Reply posted!',
            reposted: 'Reposted!',
            superLiked: 'Super Liked!',
            userBlocked: 'User blocked',
            userUnblocked: 'User unblocked',
            postPinned: 'Post pinned!',
            unfollowed: 'Unfollowed',
            profileCreated: 'Profile created!',
            profileUpdated: 'Profile updated!',
            badgeObtained: '{name} badge obtained!',
            postReported: 'Post reported. Author blocked from your feed.',
            postBoosted: 'Post boosted ({tier}) for {days} day(s)!',
            tipped: 'Tipped {amount} BNB!',
            profileBoosted: 'Profile boosted for {days} day(s)!',
            tagChanged: 'Tag changed!',
            contentRequired: 'Content is required',
            tooLong: 'Too long (max {max})',
            postEdited: 'Post edited!',
            uploadFailed: 'Upload failed: {error}',
            avatarUploadError: 'Avatar upload error: {error}',
            coverUploadError: 'Cover upload error: {error}',
            unsupportedFileType: 'Unsupported file type. Use images or videos.',
            invalidFormat: 'Invalid {type} format.',
            fileTooLarge: 'File too large. Maximum {limit}.',
            maxMediaItems: 'Max {max} media items',
            streamEnded: 'Stream ended',
            youAreLive: 'You are now LIVE!',
            streamEndedSaving: 'Stream ended. Saving recording...',
            requestingCamera: 'Requesting camera access...',
            creatingLivePost: 'Creating live post on-chain...',
            alreadyLive: 'You are already live!',
            connectToGoLive: 'Connect your wallet to go live',
            browserNoSupport: 'Your browser does not support live streaming (HTTPS required)',
            cameraPermDenied: 'Camera/mic permission denied. Please allow access and try again.',
            noCameraFound: 'No camera or microphone found on this device',
            cameraInUse: 'Camera is in use by another application',
            failedToGoLive: 'Failed to go live: {error}',
            failedToStartStream: 'Failed to start stream: {error}',
            failedToCreateLive: 'Failed to create live post: {error}',
            streamError: 'Stream error: {error}',
            recordingTooLarge: 'Recording too large ({size}MB). Max 100MB.',
            savingRecording: 'Saving recording to Arweave ({size}MB)...',
            recordingSaved: 'Live recording saved permanently!',
            failedToSaveRecording: 'Failed to save recording: {error}',
        },

        // Viewers
        viewers: '{count} viewer(s)',

        // Wallet button
        wallet: {
            connect: 'Connect',
            connected: 'Connected',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NOTARY — pages/notary/*.js
    // ═══════════════════════════════════════════════════════════════════════
    notary: {
        // Header
        brandName: 'Digital Notary',
        brandSub: 'Blockchain registration and certification',

        // Tabs
        documents: 'Documents',
        assets: 'Assets',
        verify: 'Verify',
        stats: 'Statistics',
        notarize: 'Notarize',

        // Header detail views
        certDetail: {
            title: 'Certificate #{id}',
            subtitle: 'Document details',
        },
        assetDetail: {
            title: 'Asset #{id}',
            subtitle: 'Property details',
        },
        registerAsset: {
            title: 'Register Asset',
            subtitle: 'On-chain property registration',
        },

        // Documents tab
        documentsTab: {
            title: 'My Documents',
            noDocuments: 'No certified documents yet',
            certifyFirst: 'Notarize your first document to get started!',
            notarizeNew: 'Notarize New',
            filterAll: 'All',
            filterDocument: 'Documents',
            filterImage: 'Images',
            filterCode: 'Code',
            filterOther: 'Other',
            connectToView: 'Connect to view your certificates',
            certCount: '{count} certificate(s)',
            notarizedDocument: 'Notarized Document',
            received: 'Received',
        },

        // Assets tab
        assetsTab: {
            title: 'My Assets',
            noAssets: 'No registered assets yet',
            registerFirst: 'Register your first asset on the blockchain!',
            registerNew: 'Register New',
            filterAll: 'All',
            connectToView: 'Connect to view your assets',
            assetCount: '{count} asset(s)',
        },

        // Notarize wizard
        wizard: {
            step1Title: 'Select File',
            step1Desc: 'Choose the file to notarize',
            step2Title: 'Details',
            step2Desc: 'Add information about the document',
            step3Title: 'Confirm',
            step3Desc: 'Review and confirm the notarization',

            dropzone: 'Drag or click to select a file',
            maxSize: 'Maximum size: 10MB',
            docType: 'Document Type',
            docTitle: 'Title',
            docDescription: 'Description (optional)',
            hash: 'File Hash',
            fee: 'Notarization Fee',
            confirm: 'Notarize Document',
            processing: 'Processing...',

            docTypes: {
                general: 'General',
                contract: 'Contract',
                identity: 'Identity',
                diploma: 'Diploma',
                property: 'Property',
                financial: 'Financial',
                legal: 'Legal',
                medical: 'Medical',
                ip: 'IP',
                other: 'Other',
            },

            fileSelected: 'File Selected',
            hashComputed: 'SHA-256 hash computed in your browser',
            remove: 'Remove',
            checkingDuplicates: 'Checking for duplicates...',
            duplicateFound: 'Document already notarized!',
            duplicateExistsMsg: 'This hash already exists on the blockchain.',
            uniqueHash: 'Unique hash — ready to certify',
            changeFile: 'Change File',
            continue: 'Continue',
            computingHash: 'Computing SHA-256...',
            hashLocal: 'Hash being computed locally in your browser',
            localHash: 'Local hash',
            arweave: 'Arweave',
            permanent: 'Permanent',
            descPlaceholder: 'E.g., Property deed signed Jan 2025...',
            fees: 'Fees',
            arweaveStorage: 'Arweave Storage',
            certificationFee: 'Certification Fee',
            arweaveDesc: 'Arweave = permanent, decentralized storage',
            insufficientBnb: 'Insufficient BNB for fees + gas',
            review: 'Review',
            noDescription: 'No description',
            signAndMint: 'Sign & Mint',
        },

        // Asset wizard
        assetWizard: {
            step1Title: 'Asset Type',
            step2Title: 'Details',
            step3Title: 'Documentation',
            step4Title: 'Review',

            assetTypes: {
                property: 'Real Estate',
                vehicle: 'Vehicle',
                equipment: 'Equipment',
                artwork: 'Artwork',
                intellectual: 'Intellectual Property',
                other: 'Other',
            },

            name: 'Asset Name',
            description: 'Description',
            location: 'Location',
            serialNumber: 'Serial Number / Registration',
            estimatedValue: 'Estimated Value',
            addDocumentation: 'Add Documentation',
            skipDoc: 'Skip (add later)',
            register: 'Register Asset',
        },

        // Cert Detail
        certDetailView: {
            documentType: 'Document Type',
            certifiedBy: 'Certified By',
            certifiedOn: 'Certified On',
            fileHash: 'File Hash',
            txHash: 'Transaction Hash',
            arweaveId: 'Arweave ID',
            viewDocument: 'View Document',
            transferOwnership: 'Transfer Ownership',
            transferTo: 'Transfer To',
            transferPlaceholder: 'Wallet address (0x...)',
            confirmTransfer: 'Confirm Transfer',
            shareProof: 'Share Proof',
            downloadCert: 'Download Certificate',
            description: 'Description',
            tapToViewNft: 'Tap to view NFT card',
            transferCertificate: 'Transfer Certificate',
            transferDesc: 'Transfer ownership of this certificate to another wallet. This action is permanent and requires a small fee.',
        },

        // Asset Detail
        assetDetailView: {
            owner: 'Owner',
            registeredOn: 'Registered On',
            assetType: 'Asset Type',
            description: 'Description',
            location: 'Location',
            serialNumber: 'Serial Number',
            annotations: 'Annotations',
            noAnnotations: 'No annotations yet',
            addAnnotation: 'Add Annotation',
            annotationPlaceholder: 'Write an annotation...',
            transferOwnership: 'Transfer Ownership',
            documents: 'Linked Documents',
            noDocuments: 'No linked documents',
            tapToOpen: 'Tap to open',
            tapToView: 'Tap to view',
            transfers: 'Transfers',
            youOwnThis: 'You own this asset',
            documentHash: 'Document Hash',
            additionalInfo: 'Additional Info',
            annotate: 'Annotate',
            transferAsset: 'Transfer Asset',
            transferDesc: 'Transfer ownership. This creates a permanent on-chain record.',
            newOwnerPlaceholder: 'New owner address (0x...)',
            declaredValuePlaceholder: 'Declared value in BNB (optional)',
            transferNotePlaceholder: 'Transfer note (optional)',
        },

        // Verify tab
        verifyTab: {
            title: 'Verify Document',
            subtitle: 'Check if a document has been certified on the blockchain',
            dropzone: 'Drag or click to select a file to verify',
            orEnterHash: 'Or enter the document hash',
            hashPlaceholder: 'File hash (SHA-256)',
            verifyButton: 'Verify',
            verifying: 'Verifying...',
            verified: 'Document Verified!',
            notFound: 'Document Not Found',
            verifiedDesc: 'This document has been certified on the blockchain.',
            notFoundDesc: 'This document was not found in the registry.',
            hashComputedLocally: 'The SHA-256 hash will be computed locally',
            verificationError: 'Verification error: {error}',
            tokenId: 'Token ID',
            date: 'Date',
            sha256Hash: 'SHA-256 Hash',
            file: 'File',
        },

        // Stats tab
        statsTab: {
            title: 'Statistics',
            totalCertificates: 'Total Certificates',
            totalAssets: 'Total Assets',
            totalTransfers: 'Total Transfers',
            recentActivity: 'Recent Activity',
            notarizations: 'Notarizations',
            annotations: 'Annotations',
            noRecentNotarizations: 'No recent notarizations found',
            viewContract: 'View Contract on Explorer',
        },

        // NFT Certificate Card
        nftCard: {
            title: 'NFT Certificate',
            viewOnChain: 'View on Blockchain',
            addToWallet: 'Add to Wallet',
        },

        // Toast
        toast: {
            notarizeSuccess: 'Document notarized successfully!',
            notarizeFailed: 'Notarization failed: {error}',
            transferSuccess: 'Ownership transferred successfully!',
            transferFailed: 'Transfer failed: {error}',
            registerAssetSuccess: 'Asset registered successfully!',
            registerAssetFailed: 'Asset registration failed: {error}',
            annotationSuccess: 'Annotation added!',
            annotationFailed: 'Annotation failed: {error}',
            hashCopied: 'Hash copied!',
            linkCopied: 'Link copied!',
            connectFirst: 'Connect wallet first',
            invalidFile: 'Invalid file',
            fileTooLarge: 'File too large (max 10MB)',
            hashError: 'Error computing file hash',
            pleaseWait: 'Please wait...',
            contractNotFound: 'Contract address not found',
            walletDisconnected: 'Wallet disconnected. Please reconnect.',
            tokenAdded: 'Token #{id} added to wallet!',
            rateLimited: 'MetaMask is rate-limited. Wait a moment and try again.',
            networkMismatch: 'Check your wallet network and try again.',
            addManually: 'Open MetaMask > NFTs > Import NFT to add manually',
            copyFailed: 'Failed to copy',
            invalidAddress: 'Enter a valid wallet address',
            assetNotFound: 'Asset not found',
            certNotFound: 'Certificate not found',
        },

        // Action button states
        actions: {
            uploading: 'Uploading...',
            registering: 'Registering...',
            uploadingDoc: 'Uploading document...',
            transferring: 'Transferring...',
            adding: 'Adding...',
        },
    },
};
