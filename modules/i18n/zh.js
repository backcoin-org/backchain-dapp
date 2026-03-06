// modules/i18n/zh.js — Backchain i18n Simplified Chinese Dictionary (简体中文)
export default {

    // ═══════════════════════════════════════════════════════════════════════
    // COMMON — Shared strings used across multiple pages
    // ═══════════════════════════════════════════════════════════════════════
    common: {
        buyOnRamp: '购买加密货币',
        connectWallet: '连接钱包',
        connect: '连接',
        loading: '加载中...',
        error: '错误',
        success: '成功！',
        cancel: '取消',
        confirm: '确认',
        back: '返回',
        close: '关闭',
        save: '保存',
        delete: '删除',
        edit: '编辑',
        copy: '复制',
        copied: '已复制！',
        share: '分享',
        unknownError: '未知错误',
        connectWalletFirst: '请先连接钱包',
        insufficientBalance: '余额不足',
        transactionFailed: '交易失败',
        processing: '处理中...',
        max: '最大',
        viewOnExplorer: '在浏览器中查看',
        noData: '暂无数据',
        retry: '重试',
        refresh: '刷新',
        send: '发送',
        receive: '接收',
        approve: '批准',
        reject: '拒绝',
        yes: '是',
        no: '否',
        all: '全部',
        none: '无',
        active: '活跃',
        inactive: '未激活',
        pending: '待处理',
        approved: '已批准',
        rejected: '已拒绝',
        expired: '已过期',
        ready: '就绪',
        balance: '余额',
        available: '可用',
        amount: '数量',
        fee: '费用',
        total: '合计',
        reward: '奖励',
        rewards: '奖励',
        status: '状态',
        details: '详情',
        history: '历史',
        search: '搜索',
        filter: '筛选',
        sort: '排序',
        prev: '上一页',
        next: '下一页',
        justNow: '刚刚',
        recent: '最近',
        today: '今天',
        day: '天',
        days: '天',
        hours: '小时',
        minutes: '分钟',
        seconds: '秒',
        agoSuffix: '前',
        mAgo: '{m}分钟前',
        hAgo: '{h}小时前',
        dAgo: '{d}天前',
        connectWalletToView: '连接钱包以查看',
        withdraw: '提取',
        deposit: '存入',
        failed: '失败',
        linkCopied: '链接已复制到剪贴板！',
        copyFailed: '无法复制链接',
        connected: '已连接',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NAV — Navigation labels
    // ═══════════════════════════════════════════════════════════════════════
    nav: {
        main: '主页',
        dashboard: '仪表盘',
        airdrop: '空投',
        earn: '赚取',
        stakeEarn: '质押 &amp; 赚取',
        nftMarket: 'NFT 市场',
        boostMarket: '加速市场',
        fortunePool: '幸运池',
        tradeBkc: '交易 BKC',
        community: '社区',
        charityPool: '慈善池',
        services: '服务',
        notary: '公证',
        grow: '增长',
        tutorSystem: '导师系统',
        becomeOperator: '成为运营商',
        adminPanel: '管理面板',
        about: '关于项目',
        inviteEarn: '邀请 &amp; 赚取',
        tutorials: '视频教程',
        home: '首页',
        social: '社交',
        more: '更多',
        tokenomics: '代币经济学',
        tutor: '导师',
        operator: '运营商',
        trade: '交易',
        fortune: '幸运',
        charity: '慈善',
        boost: '加速',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SPLASH — Welcome screen
    // ═══════════════════════════════════════════════════════════════════════
    splash: {
        optimized: '针对 opBNB 优化',
        mainnetLaunch: '主网上线',
        days: '天',
        hours: '小时',
        minutes: '分',
        seconds: '秒',
        unstoppable: '不可阻挡的 DeFi',
        enterApp: '进入应用',
        testnetBadge: '测试网',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DASHBOARD — DashboardPage.js
    // ═══════════════════════════════════════════════════════════════════════
    dashboard: {
        // Hero
        youWillReceive: '您将收到',
        claimRewards: '领取奖励',
        noRewardsYet: '暂无奖励',
        yourPStake: '您的 pStake',
        stakeMore: '质押更多',
        earnMoreWithNft: '使用 NFT 多赚 +{amount} BKC！',

        // Faucet
        faucet: {
            title: '获取免费测试代币',
            titleReceived: '已收到测试代币',
            desc: '获取 tBNB 作为gas费 — 每天一次',
            descReceived: '今天已领取 {amount} tBNB — 24小时后再来',
            descConnect: '连接钱包以获取 tBNB 作为gas费',
            claimFreeTokens: '领取免费代币',
            claimedToday: '今日已领取',
            dailyClaimUsed: '每日领取已使用',
            connectWallet: '连接钱包',
            sending: '发送中...',
            successMsg: '水龙头：{amount} tBNB 已发送到您的钱包！',
            cooldownMsg: '水龙头冷却中。请24小时后重试。',
            unavailable: '水龙头暂时不可用。请稍后重试。',
        },

        // Tutor/Referral Widget
        tutor: {
            becomeTutor: '成为他人的导师',
            shareLink: '分享您的链接。永久赚取学员所有费用的10% + 5% BKC。',
            studentsEarning: '{count} 名学员正在为您赚取收益',
            keepSharing: '您赚取所有费用的10% BNB + 质押奖励的5% BKC。继续分享！',
            connectForLink: '连接钱包以获取导师链接',
            tutorLinkCopied: '导师链接已复制！',
            failedToCopy: '复制失败',
            shareTextCopied: '分享文本已复制！',
            noTutorYet: '还没有导师',
            setATutor: '设置导师',
            change: '更换',
            earnings: '导师收益：{amount} BNB 可用',
        },

        // Buyback Widget
        buyback: {
            ready: '回购就绪',
            title: '回购就绪 — {amount} BNB',
            desc: '执行回购以赚取待处理 BNB 的5%作为奖励',
            descWithFee: '支付 {fee} BNB 费用，赚取 {reward} BNB（5%）。费用会放大回购额。',
            pending: '待处理',
            earnAmount: '赚取 {amount} BNB',
            execute: '执行',
            executing: '执行中...',
            successMsg: '回购已执行！您赚取了5% BNB 奖励',
            failedMsg: '回购失败：{error}',
        },

        // Quick Actions
        actions: {
            agoraTitle: 'Agora',
            agoraDesc: '在链上发布和讨论',
            stakeBkcTitle: '质押 BKC',
            stakeBkcDesc: '睡觉也能赚',
            fortunePoolTitle: '幸运池',
            fortunePoolDesc: '最高赢取100倍',
            notarizeTitle: '公证',
            notarizeDesc: '在区块链上认证',
            charityPoolTitle: '慈善池',
            charityPoolDesc: '捐赠并销毁代币',
            nftMarketTitle: 'NFT 市场',
            nftMarketDesc: '奖励翻倍',
            tradeBkcTitle: '交易 BKC',
            tradeBkcDesc: '在 Uniswap V3 上兑换',
        },

        // Metrics
        metrics: {
            supply: '供应量',
            pstake: 'pStake',
            burned: '已销毁',
            fees: '费用',
            locked: '已锁定',
            bkcPrice: 'BKC 价格',
            balance: '余额',
        },

        // Activity Feed
        activity: {
            title: '动态',
            yourActivity: '您的动态',
            networkActivity: '网络动态',
            loadingActivity: '加载动态中...',
            loadingYourActivity: '加载您的动态中...',
            loadingNetworkActivity: '加载网络动态中...',
            noNetworkActivity: '暂无网络动态',
            beFirst: '成为第一个质押、兑换或游玩的人！',
            filterAll: '全部',
            filterStaking: '质押',
            filterClaims: '领取',
            filterNft: 'NFT',
            filterFortune: '幸运',
            filterCharity: '慈善',
            filterNotary: '公证',
            filterAgora: 'Agora',
            filterFaucet: '水龙头',
            noMatch: '没有匹配的动态',
            noActivity: '暂无动态',
            tryFilter: '尝试其他筛选条件',
            startMsg: '开始质押、交易或游玩吧！',
            you: '您',
        },

        // Fortune quick-action
        fortune: {
            prize: '奖金：{amount} BKC',
            playToWin: '参与赢取',
            bet: '投注',
        },

        // Notary quick-action
        notary: {
            docsCertified: '{count} 份文档已认证',
            certifyDocs: '认证文档',
        },

        // Claim toast messages
        claim: {
            success: '奖励已领取！',
            failed: '领取失败',
        },

        // Booster/NFT Display
        booster: {
            noBoosterNft: '没有加速 NFT',
            youKeep: '您保留',
            upgradeToMax: '升级到钻石级保留100%',
            buyNft: '购买 NFT',
            rentNft: '租用 NFT',
            howItWorks: '运作方式',
            getUpToMore: '使用 NFT 最多获得 +{amount} BKC',
            recycledToStakers: '50%回收给质押者。',
            diamondKeep100: '钻石级：保留100%',
            owned: '已拥有',
            rented: '已租用',
            inYourWallet: '在您的钱包中',
            activeRental: '活跃租用',
            netReward: '净奖励',
            nftBonus: 'NFT 加成',
        },

        // Modals
        modals: {
            boostEfficiency: '提升效率',
            nftHoldersEarnMore: 'NFT 持有者最多多赚2倍',
            noGas: '无Gas费',
            needGasTokens: '您需要 tBNB 作为gas费',
            getFreeGas: '获取免费Gas + BKC',
        },

        // Activity labels (used in ACTIVITY_ICONS)
        activityLabels: {
            staked: '已质押',
            unstaked: '已解除质押',
            forceUnstaked: '已强制解除质押',
            rewardsClaimed: '奖励已领取',
            boughtNft: '已购买 NFT',
            soldNft: '已出售 NFT',
            mintedBooster: '加速器已铸造',
            transfer: '转账',
            listedNft: 'NFT 已挂单',
            rentedNft: 'NFT 已出租',
            withdrawn: '已提取',
            promotedNft: 'NFT 已推广',
            gameCommitted: '游戏已提交',
            gameRevealed: '游戏已揭晓',
            fortuneBet: '幸运投注',
            comboMode: '连击模式',
            jackpotMode: '头奖模式',
            winner: '赢家！',
            noLuck: '运气不佳',
            notarized: '已公证',
            posted: '已发布',
            liked: '已点赞',
            replied: '已回复',
            superLiked: '已超级点赞',
            reposted: '已转发',
            followed: '已关注',
            profileCreated: '资料已创建',
            profileBoosted: '资料已加速',
            badgeActivated: '徽章已激活',
            tippedBkc: '已打赏 BKC',
            bnbWithdrawn: '已提取 BNB',
            donated: '已捐赠',
            campaignCreated: '活动已创建',
            campaignCancelled: '活动已取消',
            fundsWithdrawn: '资金已提取',
            goalReached: '目标达成！',
            faucetClaim: '水龙头领取',
            feeCollected: '费用已收取',
            tutorSet: '导师已设置',
            tutorChanged: '导师已更换',
            tutorEarned: '导师已赚取',
            rewardsRecycled: '奖励已回收',
            nftFused: 'NFT 已融合',
            nftSplit: 'NFT 已拆分',
            voted: '已投票',
            proposalCreated: '提案已创建',
            buyback: '回购',
            swap: '兑换',
            liquidityAdded: '已添加流动性',
            liquidityRemoved: '已移除流动性',
            earningsWithdrawn: '收益已提取',
            gameExpired: '游戏已过期',
            campaignBoosted: '活动已加速',
            campaignClosed: '活动已关闭',
            downvoted: '已踩',
            unfollowed: '已取消关注',
            batchActions: '批量操作',
            postEdited: '帖子已编辑',
            postReported: '帖子已举报',
            postBoosted: '帖子已加速',
            userBlocked: '用户已屏蔽',
            userUnblocked: '用户已解除屏蔽',
            profileUpdated: '资料已更新',
            bulkFused: '批量融合',
            rewardsCompounded: '奖励已复投',
            buybackPaused: '回购已暂停',
            buybackResumed: '回购已恢复',
            activity: '动态',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STAKING — StakingPage.js
    // ═══════════════════════════════════════════════════════════════════════
    staking: {
        title: '质押 & 赚取',
        subtitle: '委托 BKC，赚取奖励。NFT + 导师 = 保留更多',
        youWillReceive: '您将收到',
        claimRewards: '领取奖励',
        noRewardsYet: '暂无奖励',
        compound: '复投',
        loadingBoost: '加载加速中...',

        // Breakdown
        breakdown: {
            staking: '质押',
            mining: '挖矿',
            recycled: '已回收',
            tutor: '导师',
            burned: '已销毁',
            none: '无',
        },

        // Claim fee
        claimFee: '领取费用：{fee} BNB',

        // Buyback
        buybackAvailable: '回购可用',
        buybackReward: '5% 奖励',
        pendingBnb: '待处理 BNB',
        yourReward: '您的奖励（5%）',
        bkcToStakers: 'BKC 给质押者',
        miningRate: '挖矿速率',
        executeBuyback: '执行回购',
        buybackInfo: '执行回购以赚取待处理 BNB 的5%。其余转换为 BKC 奖励分配给质押者。',
        buybackFeeInfo: '费用：{fee} BNB（加入回购）。赚取总额的5%。',
        buybackLast: '上次：{time}',
        buybackTotal: '总计：{count} 次回购',

        // Stats
        networkPStake: '网络 pStake',
        yourPower: '您的算力',
        pendingRewards: '待处理',
        activeLocks: '活跃锁定',

        // Stake Form
        delegateBkc: '委托 BKC',
        enterAmount: '输入金额',
        available: '可用',
        pstakePower: 'pStake 算力',
        netAmount: '净金额',
        feePercent: '费用',
        durationMonths: '{n} 个月',
        durationDays: '{n} 天',
        durationYears: '{n} 年',

        // Delegations
        activeDelegations: '活跃委托',
        noActiveDelegations: '暂无活跃委托',
        connectWalletToView: '连接钱包以查看',
        unstake: '解除质押',
        forceUnstakeTitle: '强制解除质押',
        forceUnstakeWarning: '强制解除质押会根据您的 NFT 等级产生罚金。',

        // History
        historyTitle: '历史',
        historyAll: '全部',
        historyStakes: '质押',
        historyUnstakes: '解除质押',
        historyClaims: '领取',
        loadingHistory: '加载历史中...',
        noHistoryYet: '暂无历史',

        // History labels
        delegated: '已委托',
        unstaked: '已解除质押',
        claimed: '已领取',
        forceUnstaked: '已强制解除质押',

        // Boost panel
        boost: {
            keep: '保留 {rate}%',
            recycle: '回收 {rate}%',
            nftTierBenefits: 'NFT 等级福利',
            getAnNft: '获取 NFT',
            upgradeToDiamond: '升级到钻石级保留100%',
            upgrade: '升级',
            noTutorWarning: '无导师 — 额外多回收10%',
            setTutorHint: '设置导师以减少10%回收',
            setATutor: '设置导师',
            tutorReduces: '-10%回收',
        },

        // Toast messages
        toast: {
            delegationSuccess: '委托成功！',
            delegationFailed: '委托失败：{error}',
            unstakeSuccess: '解除质押成功！',
            forceUnstakeSuccess: '强制解除质押完成（已扣罚金）',
            unstakeFailed: '解除质押失败：{error}',
            claimSuccess: '奖励已领取！',
            claimFailed: '领取失败：{error}',
            compoundSuccess: '奖励已复投到新的委托中！',
            compoundFailed: '复投失败：{error}',
            buybackSuccess: '回购已执行！您赚取了5% BNB 奖励',
            buybackFailed: '回购失败：{error}',
            invalidAmount: '无效金额',
            insufficientBkc: 'BKC 余额不足',
            insufficientGas: 'BNB 不足以支付gas费',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STORE — StorePage.js (NFT Marketplace)
    // ═══════════════════════════════════════════════════════════════════════
    store: {
        title: 'NFT 市场',
        subtitle: '购买、出售和融合加速 NFT',

        // Tier Card
        buyPrice: '购买',
        sellPrice: '出售',
        netSell: '净出售',
        poolSize: '池',
        volume: '交易量',
        buy: '购买',
        sell: '出售',
        keepRate: '保留 {rate}%',

        // Impact Card
        rewardImpact: '奖励影响',
        currentKeep: '当前保留',
        withNft: '使用 NFT',
        potentialGain: '潜在收益',
        annualExtra: '年度额外收益',
        stakeToSeeImpact: '质押 BKC 以查看影响',

        // Tutor banner
        tutorBanner: {
            hasTutor: '活跃导师：{address} — 您保留更多奖励',
            noTutor: '无导师 — 额外多损失10%回收。',
            setTutor: '设置导师',
        },

        // Inventory
        inventory: '库存',
        noNftsYet: '暂无 NFT',
        buyFirstNft: '购买您的第一个 NFT 开始赚取更多！',
        listForRent: '租用',
        addToWallet: '添加到钱包',

        // Fusion/Split
        fusion: {
            title: '融合 & 拆分',
            fuseTab: '融合',
            splitTab: '拆分',
            bulkTab: '批量融合',
            fuseHint: '选择2个相同等级的 NFT 融合为更高等级',
            splitHint: '选择1个 NFT 拆分为2个较低等级的 NFT',
            bulkHint: '选择多个 NFT 一次性融合到目标等级',
            selectNfts: '选择 NFT',
            noEligibleNfts: '没有符合此操作的 NFT',
            fuseButton: '融合',
            splitButton: '拆分',
            bulkFuseButton: '批量融合',
            fuseFee: '费用：{fee} BNB',
            splitFee: '费用：{fee} BNB',
            result: '结果',
            splitInto: '拆分为',
            targetTier: '目标等级',
        },

        // Trade History
        tradeHistory: '交易历史',
        noTradeHistory: '暂无交易历史',
        bought: '已购买',
        sold: '已出售',
        fused: '已融合',
        split: '拆分',

        // Toast messages
        toast: {
            buySuccess: '{tier} NFT 购买成功！',
            buyFailed: '购买失败：{error}',
            sellSuccess: '{tier} NFT 出售成功！',
            sellFailed: '出售失败：{error}',
            fuseSuccess: '融合完成！新的 {tier} NFT 已创建',
            fuseFailed: '融合失败：{error}',
            splitSuccess: '拆分完成！2个 {tier} NFT 已创建',
            splitFailed: '拆分失败：{error}',
            bulkFuseSuccess: '批量融合完成！',
            bulkFuseFailed: '批量融合失败：{error}',
            nftAddedToWallet: '{tier} NFT #{id} 已添加到钱包！',
            nftNotAdded: 'NFT 未添加到钱包',
            failedToAddNft: '添加 NFT 到钱包失败',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FORTUNE — FortunePool.js
    // ═══════════════════════════════════════════════════════════════════════
    fortune: {
        title: '幸运池',
        subtitle: '试试运气 — 最高赢取100倍',
        prizePool: '奖池',
        playToWin: '参与赢取',
        prize: '奖金：{amount} BKC',

        // Tiers
        tiers: {
            standard: '标准',
            combo: '连击',
            jackpot: '头奖',
        },

        // Game flow
        selectBet: '选择投注',
        placeBet: '下注',
        confirmInMetamask: '在 MetaMask 中确认...',
        waitingReveal: '等待揭晓...',
        revealResult: '揭晓结果！',
        revealing: '揭晓中...',
        confirmed: '已确认',
        retryingIn: '{seconds}秒后重试...',

        // Results
        youWon: '您赢了！',
        youLost: '运气不佳',
        wonAmount: '您赢得了 {amount} BKC！',

        // Odds
        odds: {
            win2x: '五分之一 — 赢2倍',
            win5x: '十分之一 — 赢5倍',
            win100x: '百五十分之一 — 赢100倍',
        },

        // Stats
        totalGames: '总游戏次数',
        totalWins: '胜场',
        totalPrizesPaid: '已发放奖金',
        winsCount: '{wins}/{total} 胜',
        yourHistory: '您的历史',

        // Share
        shareWin: '分享胜利',
        shareText: '我刚刚在 Backcoin 幸运池赢得了 {amount} BKC！',

        // Toast
        toast: {
            betPlaced: '投注已提交！等待结果...',
            betFailed: '投注失败：{error}',
            revealSuccess: '结果已揭晓！',
            revealFailed: '揭晓失败：{error}',
            insufficientBkc: 'BKC 余额不足',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TRADE — TradePage.js
    // ═══════════════════════════════════════════════════════════════════════
    trade: {
        title: '交易',
        swap: '兑换',
        connectWallet: '连接钱包',
        enterAmount: '输入金额',
        insufficientBnb: 'BNB 不足',
        insufficientBkc: 'BKC 不足',
        swapWithImpact: '兑换（{impact}% 滑点影响）',

        // Direction
        youPay: '您支付',
        youReceive: '您收到',
        balance: '余额：{amount} {symbol}',

        // Info
        priceImpact: '价格影响',
        slippage: '滑点容差',
        minimumReceived: '最少收到',
        swapFee: '兑换费用',
        route: '路径',

        // Settings
        settings: '设置',
        slippageTolerance: '滑点容差',
        custom: '自定义',

        // Pool info
        poolInfo: '池信息',
        ethReserve: 'BNB 储备',
        bkcReserve: 'BKC 储备',
        totalSwaps: '总兑换次数',
        totalVolume: '总交易量',
        contractAddress: '合约地址',
        viewContract: '查看合约',
        backcoinPool: 'Backchain 池',

        // Chart
        chart: {
            bkcPrice: 'BKC 价格',
            noDataYet: '暂无价格数据。图表会随时间填充。',
        },

        // Toast
        toast: {
            swapSuccess: '兑换完成！',
            swapFailed: '兑换失败：{error}',
            approving: '批准 BKC 中...',
            approvalComplete: '批准完成！',
            approvalFailed: '批准失败',
            swapping: '兑换中...',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CHARITY — CharityPage.js
    // ═══════════════════════════════════════════════════════════════════════
    charity: {
        title: '慈善池',
        subtitle: '用 BNB 支持公益事业',

        // Stats
        totalDonated: '总捐赠额',
        totalCampaigns: '总活动数',
        activeCampaigns: '活跃活动',
        totalDonors: '总捐赠者',

        // Status
        statusActive: '活跃',
        statusClosed: '已关闭',
        statusWithdrawn: '已提取',

        // Categories
        categories: {
            animal: '动物保护',
            humanitarian: '人道主义援助',
            environment: '环保',
            medical: '医疗健康',
            education: '教育青年',
            disaster: '灾难救助',
            community: '社区 & 社交',
        },

        // Campaign Card
        raised: '已筹',
        goal: '目标',
        donors: '捐赠者',
        daysLeft: '剩余 {days} 天',
        goalReached: '目标达成！',
        boosted: '已加速',
        boostDaysLeft: '加速剩余 {days} 天',

        // Actions
        donate: '捐赠',
        createCampaign: '创建活动',
        shareCampaign: '分享活动',
        boostCampaign: '加速活动',
        closeCampaign: '关闭活动',
        withdrawFunds: '提取资金',

        // Create Wizard
        create: {
            step1: '选择分类',
            step2: '活动详情',
            step3: '审核 & 创建',
            campaignTitle: '活动标题',
            description: '描述',
            goalAmount: '目标（BNB）',
            duration: '持续时间（天）',
            addMedia: '添加媒体',
            review: '审核',
            create: '创建活动',
        },

        // Donate Modal
        donateModal: {
            title: '捐赠给活动',
            amount: '金额（BNB）',
            presets: '快速选额',
            donateNow: '立即捐赠',
        },

        // Boost Modal
        boostModal: {
            title: '加速活动',
            boostDays: '加速天数',
            costPerDay: '{cost} BNB/天',
            totalCost: '总费用',
            boostNow: '立即加速',
        },

        // Toast
        toast: {
            donationSuccess: '捐赠成功！',
            donationFailed: '捐赠失败：{error}',
            createSuccess: '活动创建成功！',
            createFailed: '活动创建失败：{error}',
            boostSuccess: '活动加速成功！',
            boostFailed: '加速失败：{error}',
            closeSuccess: '活动已关闭',
            closeFailed: '关闭活动失败：{error}',
            withdrawSuccess: '资金提取成功！',
            withdrawFailed: '提取失败：{error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // AIRDROP — AirdropPage.js
    // ═══════════════════════════════════════════════════════════════════════
    airdrop: {
        title: '空投',
        subtitle: '赚取积分，攀登排名，获得奖励',

        // Tabs
        tabs: {
            earn: '赚取',
            ranking: '排名',
            history: '历史',
            nftRewards: 'NFT 奖励',
        },

        // Earn Tab
        totalPoints: '总积分',
        currentRank: '当前排名',
        multiplier: '倍率',
        postsApproved: '已批准帖子',

        // Sharing
        shareOnX: '分享到 X',
        shareOnInstagram: '分享到 Instagram',
        shareOnOther: '分享到其他平台',
        shared: '已分享',
        shareToEarn: '分享赚积分',
        postFirst: '先在 Agora 上发布',

        // Platform usage
        platformUsage: '平台使用',
        claimFaucet: '使用水龙头',
        delegateBkc: '委托 BKC',
        playFortune: '玩幸运池',
        buyNft: '购买 NFT',
        sellNft: '出售 NFT',
        listForRent: '挂出租',
        rentNft: '租用 NFT',
        notarizeDoc: '公证文档',
        claimRewards: '领取奖励',

        // Inline composer
        writePost: '写点什么来发布...',
        createPost: '创建帖子',
        postCreated: '帖子已创建！现在分享到 X、Instagram 等平台。',

        // Ranking
        ranking: {
            byPosts: '按帖子',
            byPoints: '按积分',
            rank: '排名',
            user: '用户',
            posts: '帖子',
            points: '积分',
        },

        // NFT rewards section
        nftRewards: {
            title: 'NFT 奖品',
            description: '排名靠前的用户赢得 NFT 加速器！',
            totalNfts: '共 {count} 个 NFT',
        },

        // Audit
        audit: {
            underReview: '您的帖子正在安全审核中...',
            verifying: '验证帖子真实性...',
            checking: '检查是否符合指南...',
            reviewInProgress: '安全审核进行中...',
            analyzing: '审核团队正在分析您的提交...',
        },

        // Toast
        toast: {
            postTooLong: '帖子过长（最多2,000个字符）。',
            writeFirst: '请写点什么来发布。',
            uploadFailed: '上传失败：{error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // REFERRAL — ReferralPage.js
    // ═══════════════════════════════════════════════════════════════════════
    referral: {
        title: '导师系统',
        heroTitle: '邀请好友，',
        heroHighlight: '永久赚取',
        heroDesc: '每个用户都有一位导师。当您的朋友使用协议时，您将自动赚取费用分成 — 永久有效，由智能合约保障。',

        // Share Card
        yourTutorLink: '您的导师链接',
        connectForLink: '连接钱包以获取导师链接',

        // Stats
        tutters: '学员',
        yourTutor: '您的导师',
        noneYet: '暂无',

        // Earnings
        yourEarnings: '您的收益',
        accumulated: '从学员活动中积累',
        shareToStart: '分享您的导师链接开始赚取。您将获得学员支付的所有费用的分成。',
        noFeesYet: '您的学员尚未产生费用。当他们使用协议时，收益将自动显示在此。',

        // How it works
        howItWorks: {
            title: '运作方式',
            step1Title: '分享您的链接',
            step1Desc: '将导师链接发送给朋友。当他们连接并执行第一个操作时，您将永久成为他们的导师。',
            step2Title: '他们使用协议',
            step2Desc: '每次他们质押、玩幸运池、购买 NFT 或任何操作 — 费用的一部分直接归您。',
            step3Title: '自动赚取收益',
            step3Desc: '所有 BNB 费用的10% + BKC 质押奖励的5%。全自动，链上执行，永久有效。',
        },

        // Change tutor
        changeTutor: {
            title: '更换导师',
            desc: '输入新的导师地址',
            placeholder: '0x...',
            confirm: '更换导师',
            warning: '这将替换您当前的导师。新导师将从您未来的活动中赚取收益。',
        },

        // Toast
        toast: {
            linkCopied: '导师链接已复制！',
            withdrawSuccess: '收益提取成功！',
            withdrawFailed: '提取失败：{error}',
            changeTutorSuccess: '导师更换成功！',
            changeTutorFailed: '导师更换失败：{error}',
            invalidAddress: '无效地址',
            cannotBeSelf: '您不能设置自己为导师',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // RENTAL — RentalPage.js (Boost Market)
    // ═══════════════════════════════════════════════════════════════════════
    rental: {
        title: '加速市场',
        subtitle: '租用加速 NFT 以增强您的奖励',

        // Tabs
        marketplace: '市场',
        myRentals: '我的租用',
        myListings: '我的挂单',

        // Filters
        allTiers: '所有等级',
        sortByBoosted: '已加速',
        sortByPrice: '最低价格',
        sortByExpiry: '即将到期',

        // Listing Card
        perDay: '/天',
        listed: '已挂单',
        rented: '已出租',
        available: '可用',
        timeLeft: '剩余 {time}',
        expired: '已过期',
        booster: '加速器',
        yours: '您的',

        // Keep Rate Descriptions
        keepAllRewards: '保留100%质押奖励！',
        saveBurns: '领取销毁节省 {rate}%',
        keepRewards100: '保留100%奖励！',
        keepRewardsRate: '领取时保留 {rate}% 奖励',
        keepRewardsOf: '保留 {rate}% 奖励',

        // Connected status
        connected: '已连接',

        // Rent Modal
        rentNft: '租用 NFT',
        rentBooster: '租用加速器',
        rentalDays: '租用天数',
        rentalCost: '租用费用',
        ecosystemFee: '生态费用',
        ecosystemFeePercent: '生态费用（20%）',
        totalCost: '总费用',
        rentNow: '立即租用',
        rent1Day: '租用1天',
        oneDayDuration: '1天（24小时）',
        duration: '时长',
        needBnb: '需要 {amount} BNB',
        balanceWarning: '您的余额：{balance} BNB — 还需 {deficit} BNB',

        // List Modal
        listForRent: '挂出租',
        listNftForRent: '将 NFT 挂出租',
        selectNft: '选择 NFT',
        selectNftPlaceholder: '-- 选择一个 NFT --',
        pricePerDay: '每日价格（BNB）',
        listNow: '立即挂出',
        listNft: '挂出 NFT',
        listBtn: '挂出',
        fixedDayNote: '固定1天租期。每次租用后 NFT 自动重新挂出。',
        enterPrice: '请输入有效价格',

        // Earnings
        totalLifetimeEarnings: '累计总收益',
        pendingBnb: '待处理 BNB',
        pendingEarnings: '待领收益',
        withdrawEarnings: '提取收益',
        noEarnings: '暂无待领收益',

        // My Listings / My Rentals empty states
        viewListings: '查看您的挂单',
        viewRentals: '查看您的活跃租用',
        noListingsTitle: '暂无挂单',
        noListingsMsg: '挂出您的第一个 NFT 开始赚取 BNB！',
        noRentalsTitle: '暂无活跃租用',
        noRentalsMsg: '租用 NFT 加速器以保留更多质押奖励！',

        // Boost Tiers
        boostTiers: '加速等级',
        boostTiersDesc: '钻石 = 保留100% | 黄金 = 90% | 白银 = 80% | 青铜 = 70% — 无 NFT：50%被回收。',

        // Boost Modal
        boostListing: '加速挂单',
        boostDuration: '加速时长（天）',
        boostExplanation: '加速挂单在市场中优先显示。选择加速天数。',
        boostExtendNote: '新增天数将从当前到期时间开始延长。',
        boostedDaysRemaining: '已加速 — 剩余 {days} 天',
        notBoosted: '未加速',
        costPerDay: '每日费用',
        calculating: '计算中...',

        // Boost buttons
        boost: {
            extend: '延长',
            boost: '加速',
            now: '立即加速',
            extendBoost: '延长加速',
        },

        // Withdraw NFT
        confirmWithdrawNft: '从市场中撤回此 NFT？',

        // Share
        shareText: '在 Backchain 加速市场租用 NFT 加速器！\n\n通过租用 NFT 加速器保留高达100%的质押奖励。\n\n{url}\n\n#Backchain #DeFi #BNBChain #opBNB #Web3',

        // How It Works
        howItWorks: {
            title: '加速市场运作方式',
            step1: 'NFT 所有者将加速器挂出租',
            step2: '租用者支付 BNB 临时使用加速',
            step3: '加速自动应用到质押奖励',
            step4: '到期后，NFT 返回给所有者',
        },

        // Toast
        toast: {
            rentSuccess: 'NFT 租用成功！',
            rentFailed: '租用失败：{error}',
            listSuccess: 'NFT 已挂出租！',
            listFailed: '挂单失败：{error}',
            withdrawSuccess: '收益已提取！',
            withdrawFailed: '收益提取失败：{error}',
            withdrawNftSuccess: 'NFT 撤回成功！',
            delistSuccess: 'NFT 已下架',
            delistFailed: '下架失败：{error}',
            promoteSuccess: '挂单已推广！',
            promoteFailed: '推广失败：{error}',
            boostSuccess: '挂单已加速 {days} 天！',
            boostFailed: '加速失败：{error}',
            linkCopied: '链接已复制到剪贴板！',
            copyFailed: '无法复制链接',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // OPERATOR — OperatorPage.js
    // ═══════════════════════════════════════════════════════════════════════
    operator: {
        title: '成为运营商',
        badge: '在 Backchain 上构建',
        heroTitle: '在 Backchain 上构建，赚取永久佣金',
        heroDesc: '任何人都可以为 Backchain 构建前端（网站、应用、机器人），并从用户的每笔交易中自动赚取佣金。无需审批。无需许可。',

        // How it works
        howItWorks: {
            title: '运作方式',
            step1Title: '构建您的前端',
            step1Desc: '创建与 Backchain 合约交互的网站、应用或机器人。',
            step2Title: '注册您的地址',
            step2Desc: '在前端中设置您的地址为运营商。',
            step3Title: '自动赚取',
            step3Desc: '用户的每笔交易都会为您产生佣金 — 永久有效。',
        },

        // Modules
        modulesTitle: '生态系统模块',
        moduleName: '模块',
        operatorFee: '运营商费用',
        status: '状态',
        enabled: '活跃',
        disabled: '已禁用',

        // Earnings
        yourEarnings: '您的收益',
        pendingBnb: '待处理 BNB',
        withdraw: '提取',
        noEarnings: '连接钱包查看您的收益',

        // Code Example
        codeExample: '代码示例',
        codeDesc: '注册您的地址为运营商：',

        // Toast
        toast: {
            withdrawSuccess: '收益提取成功！',
            withdrawFailed: '提取失败：{error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TOKENOMICS — TokenomicsPage.js
    // ═══════════════════════════════════════════════════════════════════════
    tokenomics: {
        title: '代币经济学',
        subtitle: '模块化智能合约生态系统。来自协议费用的真实收益。通缩设计。无管理员密钥。不可阻挡。',

        // Supply
        tokenSupply: '代币供应',
        erc20OnOpbnb: 'BKC — opBNB 上的 ERC-20',
        maxSupply: '最大供应量',
        circulating: '流通量',
        unminted: '未铸造',
        mintedSoFar: '已铸造 {pct}%',

        // TGE
        tgeAllocation: 'TGE 分配',
        tokensAtLaunch: '上线代币',
        liquidityPool: '流动性池',
        airdropReserve: '空投储备',
        phase: '阶段',

        // Fee Flow
        feeFlow: '费用流向',
        feeFlowDesc: '每笔交易产生的 BNB 费用流经生态系统。',
        operatorCut: '运营商分成',
        tutorCut: '导师分成',
        protocol: '协议',

        // BKC Distribution
        bkcDistribution: 'BKC 分配',
        stakers: '质押者',
        burn: '销毁',
        treasury: '国库',

        // Modules
        ecosystemModules: '生态系统模块',

        // Deflationary
        deflationaryDesign: '通缩设计',
        burnMechanisms: '销毁机制',

        // CTAs
        startStaking: '开始质押',
        becomeOperator: '成为运营商',
        inviteFriends: '邀请好友',
        footer: '准备加入？',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ABOUT — AboutPage.js
    // ═══════════════════════════════════════════════════════════════════════
    about: {
        heroTitle: '什么是 Backchain？',
        heroSubtitle: 'opBNB 上的模块化 DeFi 生态系统。无管理员密钥。不可阻挡。',

        // Hero badges
        badgeCommunity: '社区拥有',
        badgeSustaining: '自我维持',
        badgeUnstoppable: '不可阻挡',
        badgeOpenSource: '开源',

        // Philosophy
        philosophy: '理念',
        philosophySub: '为什么 Backchain 存在',
        philosophyText: '大多数 DeFi 协议由可以暂停合约、将钱包列入黑名单或更改规则的团队控制。Backchain 秉持不同理念：<strong class="text-white">一旦部署，代码永远运行</strong> — 没有管理员可以阻止它，没有公司可以关闭它，没有政府可以审查它。',
        noBlacklists: '无黑名单',
        noBlacklistsDesc: '每个钱包享有平等访问权。没有地址可以被封锁或限制。',
        immutableCore: '不可变核心',
        immutableCoreDesc: '核心合约不可变。模块可以添加或移除而不改变现有代码。',

        // Architecture
        architecture: {
            title: '生态系统架构',
            subtitle: '连接到中央枢纽的模块化合约',
            hub: '生态系统',
            hubDesc: '中央枢纽',
        },
        hubSpokeText: 'Backchain 使用<strong class="text-white">模块化架构</strong>。<span class="text-amber-400 font-medium">枢纽</span>（BackchainEcosystem）是不可变核心 — 管理所有费用、奖励分配、运营商佣金和导师推荐。<span class="text-emerald-400 font-medium">节点</span>是插入枢纽的独立服务。可以随时添加新节点而不改变现有合约。',
        hubTitle: '枢纽（BackchainEcosystem）',
        hubFeature1: '费用收取 & 按模块分配',
        hubFeature2: '运营商佣金（10-20%给构建者）',
        hubFeature3: '导师推荐系统（10% BNB + 5% BKC）',
        hubFeature4: '回购 & 销毁引擎（通缩）',
        spokesTitle: '节点（服务模块）',
        spokeFeature1: '每个节点为生态系统产生费用',
        spokeFeature2: '独立部署和可升级性',
        spokeFeature3: '更多节点 = 更多收入 = 更高奖励',

        // Module categories
        defiCore: 'DeFi 核心',
        nftEcosystem: 'NFT 生态系统',
        communityServices: '社区 & 服务',
        infraGovernance: '基础设施 & 治理',

        // Modules
        modules: {
            staking: '质押池',
            stakingDesc: '使用时间锁委托 BKC。赚取 BNB + BKC 奖励。',
            nftMarket: 'NFT 池',
            nftMarketDesc: '绑定曲线市场。低买高卖。',
            fortune: '幸运池',
            fortuneDesc: '链上游戏，2倍、5倍和100倍赔率',
            agora: 'Agora',
            agoraDesc: '去中心化社交协议。帖子、点赞、关注均在链上。',
            notary: '公证',
            notaryDesc: '在链上认证文档。不可变的存在证明。',
            charity: '慈善池',
            charityDesc: '透明募资。链上捐赠追踪。',
            rental: '租赁管理器',
            rentalDesc: '从其他用户租用 NFT 加速。AirBNFT 市场。',
            liquidity: '流动性池',
            liquidityDesc: '恒定乘积 AMM，用于 BNB/BKC 交易。',
        },

        // Extended module descriptions (mod.*)
        mod: {
            bkcToken: 'BKC 代币',
            bkcTokenDesc: 'ERC-20，基于活动铸造。2亿上限。',
            buybackMiner: '回购矿机',
            buybackMinerDesc: '通过稀缺性曲线挖矿将 BNB 费用转换为 BKC。',
            rewardBooster: 'RewardBooster NFT',
            rewardBoosterDesc: '4级 NFT（钻石/黄金/白银/青铜），降低质押销毁率。',
            nftFusion: 'NFT Fusion',
            nftFusionDesc: '将2个相同等级的 NFT 融合为1个更高等级，或拆分降级。',
            ecosystem: 'BackchainEcosystem',
            ecosystemDesc: '主枢纽 — 费用、运营商、导师、奖励分配。',
            governance: '治理',
            governanceDesc: '渐进式去中心化：管理员 → 多签 → 时间锁 → DAO。',
            faucet: '测试网水龙头',
            faucetDesc: 'opBNB 测试网上免费的 BKC。',
            ibackchain: 'IBackchain',
            ibackchainDesc: '所有合约交互的共享接口。',
        },

        // Fee System
        feeSystemText: '每个协议操作都会产生少量 BNB 费用。智能合约自动将此费用分配给多个受益者 — 为用户、构建者、推荐人和协议创造一致的激励。',
        whereFeesGo: '您的费用去向',
        userPaysFee: '用户支付费用（BNB）',
        ecosystemSplits: 'BackchainEcosystem 自动分配',
        feeTutor: '导师',
        feeTutorDesc: '推荐您的人',
        feeOperator: '运营商',
        feeOperatorDesc: '应用构建者',
        feeBuyback: '回购',
        feeBuybackDesc: '购买 + 销毁 BKC',
        feeTreasury: '国库',
        feeTreasuryDesc: '协议增长',
        feeDisclaimer: '确切的分配比例因模块而异。所有百分比在链上不可变。',
        everyoneWins: '人人受益',
        everyoneWinsDesc: '没有导师？→ 10%被销毁。没有运营商？→ 运营商份额被销毁。每种情况要么奖励参与者，要么使 BKC 更加稀缺。系统没有泄漏。',

        // Mining
        miningTitle: '购买即挖矿',
        miningSub: '购买证明：使用 = 挖矿',
        miningText: '在 Backchain 中，<strong class="text-white">使用平台就是挖矿</strong>。当您购买 NFT 加速器时，BuybackMiner 通过稀缺性曲线将花费的 BNB 转换为新铸造的 BKC 代币 — 挖得越多，难度越大，就像比特币一样。',
        howMiningWorks: '挖矿运作方式',
        miningStep1: '您购买 NFT 加速器',
        miningStep1Desc: '从绑定曲线池（钻石、黄金、白银、青铜）',
        miningStep2: 'BuybackMiner 转换 BNB → BKC',
        miningStep2Desc: '稀缺性曲线：早期矿工每 BNB 获得更多 BKC',
        miningStep3: '奖励分配',
        miningStep3Desc: '70%给质押者（按 pStake 比例），30%给国库',
        stakerRewards: '质押者奖励',
        stakerRewardsDesc: '根据 pStake 权重分配',
        treasuryDesc: '资助生态系统开发',

        // Growth Programs
        growthTitle: '增长计划',
        growthSub: '两个系统发展生态系统',
        tutorSystem: '导师系统',
        tutorSystemSub: '辅导新用户，永久赚取',
        tutorDesc: '分享您的导师链接。当有人通过它加入时，他们成为您的学员，您赚取<strong class="text-white">他们 BNB 费用的10%</strong> + <strong class="text-white">BKC 领取的5%</strong> — 永久有效。',
        operatorSystem: '运营商系统',
        operatorSystemSub: '构建应用，赚取佣金',
        operatorDesc: '构建您自己的前端、机器人或集成。将您的钱包设为<strong class="text-white">运营商</strong>，赚取通过您的应用产生的<strong class="text-white">每笔费用的10-20%</strong>。无需注册。',
        learnMore: '了解更多',

        // Why Backchain features
        noVCs: '无风投、无预挖、无内部人士',
        noVCsDesc: 'TGE 的35%（1400万 BKC）通过空投直接分配给社区。65%进入流动性池。没有投资者向您抛售代币。团队与您一样通过使用协议赚取收益。',
        realUtilityDesc: '公证法律文件。玩可验证公平的游戏。在绑定曲线上交易 NFT。租用加速能力。在抗审查的社交网络上发布。向透明慈善机构捐赠。这些不是承诺 — 它们是 opBNB 上运行的合约。',
        sustainableYield: '可持续收益，非通胀',
        sustainableYieldDesc: '质押奖励来自真实的协议费用（BNB）和挖矿活动 — 而非印发代币。生态系统使用越多，真实收益越高。没有庞氏经济学。',
        alignedIncentives: '各层级利益一致',
        alignedIncentivesDesc: '用户通过质押赚取。导师通过邀请赚取。运营商通过构建赚取。协议通过增长赚取。没有参与者从他人身上提取价值 — 每个人都从使用增长中受益。',

        // Tech Stack
        techStack: '技术栈',
        techStackSub: '基于经过实战检验的基础设施构建',

        // CTA
        ctaDesc: '今天开始赚取空投积分。质押、交易、游玩或构建 — 每个操作都有价值。',
        whitepaper: '白皮书',

        // Whitepaper Modal
        tokenomicsPaper: '代币经济学白皮书 V3',
        tokenomicsPaperDesc: '分配、挖矿 & 稀缺性引擎',
        technicalPaper: '技术白皮书 V2',
        technicalPaperDesc: '架构、合约 & 费用系统',

        // Footer
        footer: '由社区构建，为社区服务。',

        // Key Features
        keyFeatures: {
            title: '核心特性',
            noAdmin: '无管理员密钥',
            noAdminDesc: '不可变合约。没有人可以暂停、修改或提取资金。',
            realYield: '真实收益',
            realYieldDesc: '来自真实协议费用的奖励，非通胀发行。',
            modular: '模块化',
            modularDesc: '模块可以添加/移除而不影响生态系统。',
            deflationary: '通缩',
            deflationaryDesc: '所有 BKC 费用的5%被永久销毁。',
        },

        // Links
        links: {
            title: '项目链接',
            website: '网站',
            docs: '文档资料',
            github: 'GitHub',
            telegram: 'Telegram',
            twitter: 'X (Twitter)',
        },

        // Contract addresses
        contracts: {
            title: '合约地址',
            viewOnExplorer: '在浏览器中查看',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TUTORIALS — TutorialsPage.js
    // ═══════════════════════════════════════════════════════════════════════
    tutorials: {
        title: '视频教程',
        subtitle: '全面了解 Backchain 生态系统',
        watchOnYoutube: '在 YouTube 上观看',
        subscribe: '在 YouTube 上订阅',
        subscribeDesc: '获取最新教程和更新',
        subscribeBtn: '订阅',
        comingSoon: '即将推出',

        // Hero
        heroTitle: '掌握 Backcoin 生态系统',
        heroSubtitle: '完整视频教程涵盖所有功能 — 从您的第一个 BKC 到构建自己的运营商业务',
        videoCount: '视频',
        languages: '2种语言',
        categoriesLabel: '分类',
        everyFeature: '所有生态系统功能',

        // Filters
        filterAll: '全部',

        // Categories
        categories: {
            overview: '什么是 Backcoin',
            gettingStarted: '入门指南',
            stakingMining: '质押 & 挖矿',
            nftBoosters: 'NFT 加速器',
            fortunePool: '幸运池',
            community: '社区 & 社交',
            services: '服务',
            advanced: '高级',
        },

        // Tags
        tags: {
            beginner: '初学者',
            intermediate: '中级',
            advanced: '高级',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN — AdminPage.js
    // ═══════════════════════════════════════════════════════════════════════
    admin: {
        title: '管理面板',
        accessDenied: '拒绝访问',
        restrictedMsg: '此页面仅限管理员访问。',
        enterPassword: '输入管理员密钥以继续',
        login: '登录',
        quickActions: '快捷操作',

        // Tabs
        tabs: {
            overview: '概览',
            submissions: '提交',
            users: '用户',
            tasks: '任务',
            settings: '设置',
        },

        // Overview
        overview: {
            totalUsers: '总用户数',
            totalSubmissions: '总提交数',
            pendingReview: '待审核',
            totalPoints: '总积分',
        },

        // Status labels
        status: {
            pending: '待审核',
            auditing: '审核中',
            approved: '已批准',
            rejected: '已拒绝',
            flagged: '已标记',
        },

        // Actions
        approveAll: '全部批准',
        rejectAll: '全部拒绝',
        exportCsv: '导出 CSV',
        reloadData: '重新加载数据',
        ban: '封禁',
        unban: '解封',

        // Faucet
        faucet: {
            status: '水龙头状态',
            paused: '已暂停',
            active: '活跃',
            pause: '暂停',
            unpause: '恢复',
        },

        // Toast
        toast: {
            loadFailed: '加载管理数据失败。',
            txSent: '交易已发送...',
            faucetPaused: '水龙头已成功暂停！',
            faucetUnpaused: '水龙头已成功恢复！',
            reloading: '正在重新加载数据...',
            noUsersExport: '没有可导出的用户。',
            exportedUsers: '已导出 {count} 个用户。',
            noSubmissionsExport: '没有可导出的提交。',
            exportedSubmissions: '已导出 {count} 条提交。',
            submissionApproved: '提交已批准！',
            submissionRejected: '提交已拒绝！',
            userBanned: '用户已封禁。',
            userUnbanned: '用户已解封。',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOCIAL — SocialMedia.js
    // ═══════════════════════════════════════════════════════════════════════
    social: {
        title: '加入 Backcoin 社区',
        subtitle: '与数千名持有者连接，了解主网上线最新动态，参与独家空投。',

        // Telegram
        telegramTitle: '官方 Telegram 群组',
        telegramDesc: '与团队和社区交流 \\u2022 全天候支持',
        joinNow: '立即加入',

        // Social Cards
        twitter: 'X (Twitter)',
        twitterDesc: '最新消息和公告',
        youtube: 'YouTube',
        youtubeDesc: '视频教程和 AMA',
        instagram: 'Instagram',
        instagramDesc: '视觉更新和故事',
        tiktok: 'TikTok',
        tiktokDesc: '短视频和热门内容',
        facebook: 'Facebook',
        facebookDesc: '社区讨论',

        // Warning
        verifyLinks: '请始终验证链接。官方管理员绝不会私信索要资金。',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FEEDBACK — ui-feedback.js
    // ═══════════════════════════════════════════════════════════════════════
    feedback: {
        // RPC Errors
        metamaskPending: 'MetaMask 有一个待处理请求。打开 MetaMask 扩展并完成或拒绝待处理操作。',
        txCancelled: '用户已取消交易。',
        insufficientFunds: '钱包余额不足。',
        metamaskNotDetected: '未检测到 MetaMask',

        // NFT Wallet
        nftAddedToWallet: '{tier} NFT #{id} 已添加到钱包！',
        nftNotAdded: 'NFT 未添加到钱包',
        failedToAddNft: '添加 NFT 到钱包失败',

        // Timer
        unlocked: '已解锁',

        // Wallet
        walletDisconnected: '钱包已断开连接。',

        // Share Modal
        inviteEarn: '邀请 & 赚取',
        shareBackchain: '分享 Backchain',
        shareTutorDesc: '分享您的导师链接 — 从每位朋友处赚取 <strong class="text-amber-400">10% BNB</strong> + <strong class="text-amber-400">5% BKC</strong>',
        connectForTutorLink: '连接钱包以生成包含导师推荐的个人邀请链接！',
        shareConnectedText: '加入 Backchain — 我来做你的导师！质押 BKC，赚取奖励，我也能赚取。使用我的邀请链接：',
        shareDisconnectedText: '了解 Backchain — opBNB 上不可阻挡的 DeFi。质押、交易 NFT、玩幸运池等等！',
        badge10BNB: '10% BNB 费用',
        badge5BKC: '5% BKC 领取',
        badgeForever: '永久',
        tutorEmbedded: '您的导师地址 <span class="font-mono text-zinc-400">{addr}</span> 已嵌入此链接',
        footerConnected: '通过您的链接加入的朋友会自动将您设为导师',
        footerDisconnected: '立即分享 — 每位新用户都在增强生态系统',
        shareOn: {
            twitter: 'Twitter',
            telegram: 'Telegram',
            whatsapp: 'WhatsApp',
            copyLink: '复制链接',
        },
        linkCopied: '导师链接已复制！',
        inviteLinkCopied: '邀请链接已复制！',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // AGORA — pages/agora/*.js
    // ═══════════════════════════════════════════════════════════════════════
    agora: {
        // Header / Nav
        brandName: 'Agora',
        feed: '动态',
        discover: '发现',
        profile: '资料',
        post: '发布',
        createProfile: '创建资料',

        // Compose
        compose: {
            placeholder: '链上发生了什么？',
            post: '发布',
            reply: '回复',
            addImage: '添加图片',
            addVideo: '添加视频',
            addMedia: '添加媒体',
            charCount: '{current}/{max}',
            posting: '发布中...',
            uploadingMedia: '上传媒体中...',
            video: '视频',
            goLive: '开始直播',
            live: '直播',
            free: '免费',
            newPost: '新帖子',
            createProfileBanner: '创建资料以获取用户名并开始发布',
        },

        // Feed
        feedEmpty: '暂无帖子。成为第一个发布者！',
        feedEmptySubtext: '成为不可阻挡的社交网络上的第一个发布者！',
        discoverEmpty: '暂无热门帖子',
        discoverSubtext: '成为第一个发布者！帖子按互动排名 — 点赞、回复和超级点赞提升曝光度。',
        discoverRankedBy: '按互动排名 — 点赞、回复、转发 & 超级点赞',
        loadingPosts: '加载帖子中...',
        noMorePosts: '没有更多帖子',
        loadMore: '加载更多',
        comingSoon: '即将推出！',
        comingSoonDesc: 'Agora 正在部署中。不可阻挡的社交网络即将上线！',
        noTagPosts: '没有 {tag} 帖子',
        noTagPostsSubtext: '尝试其他标签或成为第一个发布者！',
        welcomeTitle: '欢迎来到 Agora',
        welcomeStep1: '创建您的资料',
        welcomeStep2: '发布您的第一条想法',
        welcomeStep3: '赚取超级点赞',
        readMore: '阅读更多',
        more: '更多',
        less: '收起',
        endStream: '结束直播',
        joinLiveStream: '加入直播',
        leave: '离开',
        originalPostNotFound: '找不到原帖',

        // Post Card
        postCard: {
            like: '点赞',
            liked: '已点赞',
            reply: '回复',
            repost: '转发',
            reposted: '{name} 已转发',
            superLike: '超级点赞',
            downvote: '踩',
            share: '分享',
            tip: '打赏',
            tipAuthor: '打赏作者',
            boost: '加速',
            boostPost: '加速帖子',
            report: '举报',
            edit: '编辑',
            editPost: '编辑帖子',
            delete: '删除',
            pin: '置顶',
            pinToProfile: '置顶到资料',
            unpin: '取消置顶',
            block: '屏蔽',
            blockUser: '屏蔽用户',
            unblock: '解除屏蔽',
            unblockUser: '解除屏蔽用户',
            changeTag: '更换标签',
            replies: '{count} 条回复',
            viewThread: '查看主题',
            viewOnExplorer: '在浏览器中查看',
            edited: '已编辑',
            replyingTo: '回复 {name}',
            options: '选项',
        },

        // Profile
        profileSetup: {
            title: '创建您的资料',
            subtitle: '在 Agora 上设置您的链上身份',
            username: '选择用户名',
            usernamePlaceholder: '例如 satoshi',
            usernameHint: '1-15个字符：小写字母、数字、下划线。用户名越短费用越高。',
            usernameChecking: '检查中...',
            usernameAvailable: '可用',
            usernameTaken: '已被占用',
            usernameFree: '免费',
            create: '创建资料',
            creating: '创建中...',
            displayName: '显示名称',
            displayNamePlaceholder: '您的公开名称',
            bio: '简介',
            bioPlaceholder: '向世界介绍您自己...',
            language: '语言',
            languageHint: '您的帖子将以此语言标记以便筛选。',
            step2Hint: '显示名称、简介和语言作为元数据存储，可随时免费更新。',
            usernameFee: '用户名费用',
            connectWalletToCreate: '连接钱包以创建您的资料。',
            connectWalletToView: '连接钱包以查看您的资料。',
        },

        myProfile: {
            posts: '帖子',
            followers: '粉丝',
            following: '关注中',
            editProfile: '编辑资料',
            noPosts: '暂无帖子',
            noPostsSubtext: '暂无帖子 — 分享您的第一条想法！',
            yourPosts: '您的帖子',
            total: '共 {count} 条',
            viewOnExplorer: '在浏览器中查看',
            badge: '徽章',
            boost: '加速',
            boosted: '已加速',
        },

        userProfile: {
            follow: '关注',
            unfollow: '取消关注',
            following: '关注中',
            blocked: '已屏蔽',
            block: '屏蔽',
            unblock: '解除屏蔽',
            notFound: '未找到用户',
            noPosts: '暂无帖子',
        },

        // Tags
        tags: {
            all: '全部',
            general: '综合',
            defi: 'DeFi',
            nft: 'NFT',
            memes: '表情包',
            alpha: '阿尔法',
            dev: '开发',
        },
        sort: {
            forYou: '推荐',
            new: '最新',
            top: '热门',
        },

        // Modals
        modals: {
            superLike: {
                title: '超级点赞',
                desc: '发送任意金额 BNB 将帖子推送到热门。BNB 越多 = 排名越高。所有 BNB 归入生态系统。',
                amountLabel: '金额（BNB）',
                anyAmount: '任意金额',
                minAmount: '> 0 BNB',
                confirm: '超级点赞',
            },
            downvote: {
                title: '踩',
                desc: '踩这条帖子。每条帖子只能踩一次。',
                confirm: '踩',
            },
            tip: {
                title: '打赏作者',
                desc: '直接向帖子作者发送 BNB 作为打赏。任意金额 > 0。',
                amountLabel: '金额（BNB）',
                confirm: '发送打赏',
            },
            boost: {
                title: '加速帖子',
                desc: '加速此帖子以提高曝光度。定价由生态治理设定。',
                daysLabel: '天数',
                standard: '标准',
                featured: '精选',
                confirm: '加速帖子',
            },
            boostProfile: {
                title: '资料加速',
                desc: '加速您的资料以提高曝光度。定价由生态治理设定。',
                daysLabel: '天数',
                confirm: '加速资料',
            },
            badge: {
                title: '信任徽章',
                desc: '获得1年的认证徽章。更高等级解锁更长帖子和更多声望。',
                verified: '已认证',
                premium: '高级',
                elite: '精英',
                charsPerPost: '每条帖子最多 {limit} 个字符',
                current: '当前',
                withoutBadge: '无徽章：每条帖子2,000个字符',
            },
            report: {
                title: '举报帖子',
                desc: '举报此帖子并在动态中屏蔽作者。费用：0.0001 BNB',
                reasons: {
                    spam: '垃圾信息',
                    harassment: '骚扰',
                    illegal: '违法内容',
                    scam: '诈骗',
                    other: '其他',
                },
                confirm: '提交举报',
            },
            editPost: {
                title: '编辑帖子',
                desc: '发布后15分钟内编辑。免费（仅gas费）。只能编辑一次。',
                confirm: '保存编辑',
            },
            editProfile: {
                title: '编辑资料',
                coverImage: '封面图片',
                noCover: '无封面',
                profilePicture: '头像',
                changePhoto: '更换照片',
                displayName: '显示名称',
                displayNamePlaceholder: '您的显示名称',
                bio: '简介',
                bioPlaceholder: '关于您...',
                location: '位置',
                locationPlaceholder: '例如 中国上海',
                language: '语言',
                socialLinks: '社交链接',
                addLink: '添加链接',
                platform: '平台',
                usernameNote: '用户名无法更改。仅需gas费。',
                confirm: '保存更改',
                maxLinks: '最多9个链接',
                uploadingAvatar: '上传头像中...',
                uploadingCover: '上传封面中...',
                imageTooLarge: '图片过大。最大5MB。',
                avatar: '头像',
                banner: '横幅',
            },
            repost: {
                title: '转发',
                desc: '转发给您的粉丝？免费（仅gas费）',
                confirm: '转发',
            },
            changeTag: {
                title: '更换标签',
                desc: '为您的帖子选择新分类。仅需gas费。',
                confirm: '更换标签',
            },
            deletePost: {
                title: '删除帖子',
                desc: '您确定吗？此操作无法撤销。',
                confirm: '删除',
            },
        },

        // Cart (batch actions)
        cart: {
            title: '操作购物车',
            empty: '购物车为空',
            total: '合计',
            submit: '全部提交',
            clear: '清空',
            notOnChainYet: '尚未注册到区块链',
            actionsNotOnChain: '<strong>{count} 个操作</strong>尚未上链',
        },

        // Post Detail
        postDetail: {
            postNotFound: '帖子未找到',
            replies: '回复',
            repliesCount: '回复（{count}）',
            noReplies: '暂无回复。成为第一个！',
            replyingTo: '回复 {name}',
            replyPlaceholder: '写一条回复...',
            reply: '回复',
            replyFree: '文字回复：免费（仅gas费）',
        },

        // Upgrade hint
        upgrade: {
            charsWithTier: '最多 {limit} 个字符，使用',
        },

        // Toast
        toast: {
            postCreated: '帖子已创建！',
            postFailed: '创建帖子失败：{error}',
            replyCreated: '回复已发布！',
            replyFailed: '创建回复失败：{error}',
            likeSuccess: '帖子已点赞！',
            likeFailed: '点赞失败：{error}',
            followSuccess: '已关注！',
            followFailed: '关注失败：{error}',
            unfollowSuccess: '已取消关注',
            unfollowFailed: '取消关注失败：{error}',
            repostSuccess: '帖子已转发！',
            repostFailed: '转发失败：{error}',
            superLikeSuccess: '超级点赞已发送！',
            superLikeFailed: '超级点赞失败：{error}',
            downvoteSuccess: '踩已记录',
            downvoteFailed: '踩失败：{error}',
            tipSuccess: '打赏已发送！',
            tipFailed: '打赏失败：{error}',
            boostSuccess: '帖子已加速！',
            boostFailed: '加速失败：{error}',
            boostProfileSuccess: '资料已加速！',
            boostProfileFailed: '资料加速失败：{error}',
            badgeSuccess: '徽章已激活！',
            badgeFailed: '徽章激活失败：{error}',
            reportSuccess: '举报已提交',
            reportFailed: '举报失败：{error}',
            editSuccess: '帖子已编辑！',
            editFailed: '编辑失败：{error}',
            deleteSuccess: '帖子已删除',
            deleteFailed: '删除失败：{error}',
            pinSuccess: '帖子已置顶！',
            pinFailed: '置顶失败：{error}',
            blockSuccess: '用户已屏蔽',
            blockFailed: '屏蔽失败：{error}',
            unblockSuccess: '用户已解除屏蔽',
            unblockFailed: '解除屏蔽失败：{error}',
            profileCreated: '资料创建成功！',
            profileFailed: '资料创建失败：{error}',
            profileUpdated: '资料已更新！',
            profileUpdateFailed: '资料更新失败：{error}',
            batchSuccess: '{count} 个操作已注册到区块链！',
            batchFailed: '批量交易失败',
            postShared: '帖子已分享！',
            linkCopied: '链接已复制！',
            connectFirst: '请先连接钱包',
            createProfileFirst: '请先创建资料',
            alreadyInCart: '已在购物车中',
            likeAddedToCart: '点赞已加入购物车',
            downvoteAddedToCart: '踩已加入购物车',
            followAddedToCart: '关注已加入购物车',
            cartCleared: '购物车已清空',
            cartEmpty: '购物车为空',
            pleaseWrite: '请写点什么',
            postTooLong: '帖子过长（最多 {max} 个字符）',
            pleaseWriteReply: '请写一条回复',
            replyPosted: '回复已发布！',
            reposted: '已转发！',
            superLiked: '已超级点赞！',
            userBlocked: '用户已屏蔽',
            userUnblocked: '用户已解除屏蔽',
            postPinned: '帖子已置顶！',
            unfollowed: '已取消关注',
            profileCreated: '资料已创建！',
            profileUpdated: '资料已更新！',
            badgeObtained: '{name} 徽章已获得！',
            postReported: '帖子已举报。作者已从您的动态中屏蔽。',
            postBoosted: '帖子已加速（{tier}）{days} 天！',
            tipped: '已打赏 {amount} BNB！',
            profileBoosted: '资料已加速 {days} 天！',
            tagChanged: '标签已更改！',
            contentRequired: '内容为必填',
            tooLong: '过长（最多 {max}）',
            postEdited: '帖子已编辑！',
            uploadFailed: '上传失败：{error}',
            avatarUploadError: '头像上传错误：{error}',
            coverUploadError: '封面上传错误：{error}',
            unsupportedFileType: '不支持的文件类型。请使用图片或视频。',
            invalidFormat: '无效的 {type} 格式。',
            fileTooLarge: '文件过大。最大 {limit}。',
            maxMediaItems: '最多 {max} 个媒体文件',
            streamEnded: '直播已结束',
            youAreLive: '您正在直播！',
            streamEndedSaving: '直播已结束。正在保存录像...',
            requestingCamera: '正在请求摄像头权限...',
            creatingLivePost: '正在链上创建直播帖子...',
            alreadyLive: '您已经在直播中！',
            connectToGoLive: '连接钱包以开始直播',
            browserNoSupport: '您的浏览器不支持直播（需要 HTTPS）',
            cameraPermDenied: '摄像头/麦克风权限被拒绝。请允许访问并重试。',
            noCameraFound: '此设备未找到摄像头或麦克风',
            cameraInUse: '摄像头正被其他应用使用',
            failedToGoLive: '开始直播失败：{error}',
            failedToStartStream: '启动直播流失败：{error}',
            failedToCreateLive: '创建直播帖子失败：{error}',
            streamError: '直播错误：{error}',
            recordingTooLarge: '录像过大（{size}MB）。最大100MB。',
            savingRecording: '正在将录像保存到 Arweave（{size}MB）...',
            recordingSaved: '直播录像已永久保存！',
            failedToSaveRecording: '保存录像失败：{error}',
        },

        // Viewers
        viewers: '{count} 位观众',

        // Wallet button
        wallet: {
            connect: '连接',
            connected: '已连接',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NOTARY — pages/notary/*.js
    // ═══════════════════════════════════════════════════════════════════════
    notary: {
        // Header
        brandName: '数字公证',
        brandSub: '区块链登记和认证',

        // Tabs
        documents: '文档',
        assets: '资产',
        verify: '验证',
        stats: '统计',
        notarize: '公证',

        // Header detail views
        certDetail: {
            title: '证书 #{id}',
            subtitle: '文档详情',
        },
        assetDetail: {
            title: '资产 #{id}',
            subtitle: '资产详情',
        },
        registerAsset: {
            title: '注册资产',
            subtitle: '链上资产登记',
        },

        // Documents tab
        documentsTab: {
            title: '我的文档',
            noDocuments: '暂无已认证文档',
            certifyFirst: '公证您的第一份文档开始使用！',
            notarizeNew: '新建公证',
            filterAll: '全部',
            filterDocument: '文档',
            filterImage: '图片',
            filterCode: '代码',
            filterOther: '其他',
            connectToView: '连接以查看您的证书',
            certCount: '{count} 份证书',
            notarizedDocument: '已公证文档',
            received: '已收到',
        },

        // Assets tab
        assetsTab: {
            title: '我的资产',
            noAssets: '暂无已注册资产',
            registerFirst: '在区块链上注册您的第一个资产！',
            registerNew: '新建注册',
            filterAll: '全部',
            connectToView: '连接以查看您的资产',
            assetCount: '{count} 个资产',
        },

        // Notarize wizard
        wizard: {
            step1Title: '选择文件',
            step1Desc: '选择要公证的文件',
            step2Title: '详情',
            step2Desc: '添加文档信息',
            step3Title: '确认',
            step3Desc: '审核并确认公证',

            dropzone: '拖拽或点击选择文件',
            maxSize: '最大大小：10MB',
            docType: '文档类型',
            docTitle: '标题',
            docDescription: '描述（可选）',
            hash: '文件哈希',
            fee: '公证费用',
            confirm: '公证文档',
            processing: '处理中...',

            docTypes: {
                general: '综合',
                contract: '合同',
                identity: '身份',
                diploma: '证书',
                property: '财产',
                financial: '金融',
                legal: '法律',
                medical: '医疗',
                ip: '知识产权',
                other: '其他',
            },

            fileSelected: '已选择文件',
            hashComputed: 'SHA-256 哈希已在浏览器中计算',
            remove: '移除',
            checkingDuplicates: '检查重复中...',
            duplicateFound: '文档已经公证过了！',
            duplicateExistsMsg: '此哈希已存在于区块链上。',
            uniqueHash: '唯一哈希 — 可以认证',
            changeFile: '更换文件',
            continue: '继续',
            computingHash: '计算 SHA-256 中...',
            hashLocal: '哈希正在浏览器中本地计算',
            localHash: '本地哈希',
            arweave: 'Arweave',
            permanent: '永久',
            descPlaceholder: '例如，2025年1月签署的财产契约...',
            fees: '费用',
            arweaveStorage: 'Arweave 存储',
            certificationFee: '认证费用',
            arweaveDesc: 'Arweave = 永久、去中心化存储',
            insufficientBnb: 'BNB 不足以支付费用 + gas',
            review: '审核',
            noDescription: '无描述',
            signAndMint: '签名 & 铸造',
        },

        // Asset wizard
        assetWizard: {
            step1Title: '资产类型',
            step2Title: '详情',
            step3Title: '文档资料',
            step4Title: '审核',

            assetTypes: {
                property: '房地产',
                vehicle: '车辆',
                equipment: '设备',
                artwork: '艺术品',
                intellectual: '知识产权',
                other: '其他',
            },

            name: '资产名称',
            description: '描述',
            location: '位置',
            serialNumber: '序列号 / 注册号',
            estimatedValue: '估计价值',
            addDocumentation: '添加文档资料',
            skipDoc: '跳过（稍后添加）',
            register: '注册资产',
        },

        // Cert Detail
        certDetailView: {
            documentType: '文档类型',
            certifiedBy: '认证者',
            certifiedOn: '认证日期',
            fileHash: '文件哈希',
            txHash: '交易哈希',
            arweaveId: 'Arweave ID',
            viewDocument: '查看文档',
            transferOwnership: '转移所有权',
            transferTo: '转移至',
            transferPlaceholder: '钱包地址（0x...）',
            confirmTransfer: '确认转移',
            shareProof: '分享证明',
            downloadCert: '下载证书',
            description: '描述',
            tapToViewNft: '点击查看 NFT 卡片',
            transferCertificate: '转移证书',
            transferDesc: '将此证书的所有权转移给另一个钱包。此操作不可逆，需要少量费用。',
        },

        // Asset Detail
        assetDetailView: {
            owner: '所有者',
            registeredOn: '注册日期',
            assetType: '资产类型',
            description: '描述',
            location: '位置',
            serialNumber: '序列号',
            annotations: '注释',
            noAnnotations: '暂无注释',
            addAnnotation: '添加注释',
            annotationPlaceholder: '写一条注释...',
            transferOwnership: '转移所有权',
            documents: '关联文档',
            noDocuments: '暂无关联文档',
            tapToOpen: '点击打开',
            tapToView: '点击查看',
            transfers: '转让记录',
            youOwnThis: '您拥有此资产',
            documentHash: '文档哈希',
            additionalInfo: '附加信息',
            annotate: '注释',
            transferAsset: '转移资产',
            transferDesc: '转移所有权。这将创建一条永久链上记录。',
            newOwnerPlaceholder: '新所有者地址（0x...）',
            declaredValuePlaceholder: '申报价值（BNB，可选）',
            transferNotePlaceholder: '转移备注（可选）',
        },

        // Verify tab
        verifyTab: {
            title: '验证文档',
            subtitle: '检查文档是否已在区块链上认证',
            dropzone: '拖拽或点击选择要验证的文件',
            orEnterHash: '或输入文档哈希',
            hashPlaceholder: '文件哈希（SHA-256）',
            verifyButton: '验证',
            verifying: '验证中...',
            verified: '文档已验证！',
            notFound: '文档未找到',
            verifiedDesc: '此文档已在区块链上认证。',
            notFoundDesc: '此文档未在注册表中找到。',
            hashComputedLocally: 'SHA-256 哈希将在本地计算',
            verificationError: '验证错误：{error}',
            tokenId: '代币 ID',
            date: '日期',
            sha256Hash: 'SHA-256 哈希',
            file: '文件',
        },

        // Stats tab
        statsTab: {
            title: '统计',
            totalCertificates: '总证书数',
            totalAssets: '总资产数',
            totalTransfers: '总转让数',
            recentActivity: '最近活动',
            notarizations: '公证',
            annotations: '注释',
            noRecentNotarizations: '未找到最近的公证',
            viewContract: '在浏览器中查看合约',
        },

        // NFT Certificate Card
        nftCard: {
            title: 'NFT 证书',
            viewOnChain: '在区块链上查看',
            addToWallet: '添加到钱包',
        },

        // Toast
        toast: {
            notarizeSuccess: '文档公证成功！',
            notarizeFailed: '公证失败：{error}',
            transferSuccess: '所有权转移成功！',
            transferFailed: '转移失败：{error}',
            registerAssetSuccess: '资产注册成功！',
            registerAssetFailed: '资产注册失败：{error}',
            annotationSuccess: '注释已添加！',
            annotationFailed: '注释失败：{error}',
            hashCopied: '哈希已复制！',
            linkCopied: '链接已复制！',
            connectFirst: '请先连接钱包',
            invalidFile: '无效文件',
            fileTooLarge: '文件过大（最大10MB）',
            hashError: '计算文件哈希错误',
            pleaseWait: '请稍候...',
            contractNotFound: '未找到合约地址',
            walletDisconnected: '钱包已断开连接。请重新连接。',
            tokenAdded: '代币 #{id} 已添加到钱包！',
            rateLimited: 'MetaMask 被频率限制。请稍等后重试。',
            networkMismatch: '检查您的钱包网络并重试。',
            addManually: '打开 MetaMask > NFTs > 导入 NFT 手动添加',
            copyFailed: '复制失败',
            invalidAddress: '请输入有效的钱包地址',
            assetNotFound: '未找到资产',
            certNotFound: '未找到证书',
        },

        // Action button states
        actions: {
            uploading: '上传中...',
            registering: '注册中...',
            uploadingDoc: '上传文档中...',
            transferring: '转移中...',
            adding: '添加中...',
        },
    },
};
