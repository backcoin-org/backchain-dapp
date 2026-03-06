// modules/i18n/ko.js — Backchain i18n Korean Dictionary
export default {

    // ═══════════════════════════════════════════════════════════════════════
    // COMMON — Shared strings used across multiple pages
    // ═══════════════════════════════════════════════════════════════════════
    common: {
        buyOnRamp: '암호화폐 구매',
        connectWallet: '지갑 연결',
        connect: '연결',
        loading: '로딩 중...',
        error: '오류',
        success: '성공!',
        cancel: '취소',
        confirm: '확인',
        back: '뒤로',
        close: '닫기',
        save: '저장',
        delete: '삭제',
        edit: '편집',
        copy: '복사',
        copied: '복사됨!',
        share: '공유',
        unknownError: '알 수 없는 오류',
        connectWalletFirst: '먼저 지갑을 연결하세요',
        insufficientBalance: '잔액 부족',
        transactionFailed: '트랜잭션 실패',
        processing: '처리 중...',
        max: '최대',
        viewOnExplorer: '탐색기에서 보기',
        noData: '데이터 없음',
        retry: '다시 시도',
        refresh: '새로고침',
        send: '보내기',
        receive: '받기',
        approve: '승인',
        reject: '거절',
        yes: '예',
        no: '아니오',
        all: '전체',
        none: '없음',
        active: '활성',
        inactive: '비활성',
        pending: '대기 중',
        approved: '승인됨',
        rejected: '거절됨',
        expired: '만료됨',
        ready: '준비됨',
        balance: '잔액',
        available: '사용 가능',
        amount: '금액',
        fee: '수수료',
        total: '합계',
        reward: '보상',
        rewards: '보상',
        status: '상태',
        details: '상세',
        history: '내역',
        search: '검색',
        filter: '필터',
        sort: '정렬',
        prev: '이전',
        next: '다음',
        justNow: '방금',
        recent: '최근',
        today: '오늘',
        day: '일',
        days: '일',
        hours: '시간',
        minutes: '분',
        seconds: '초',
        agoSuffix: '전',
        mAgo: '{m}분 전',
        hAgo: '{h}시간 전',
        dAgo: '{d}일 전',
        connectWalletToView: '지갑을 연결하여 보기',
        withdraw: '출금',
        deposit: '입금',
        failed: '실패',
        linkCopied: '링크가 클립보드에 복사되었습니다!',
        copyFailed: '링크를 복사할 수 없습니다',
        connected: '연결됨',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NAV — Navigation labels
    // ═══════════════════════════════════════════════════════════════════════
    nav: {
        main: '메인',
        dashboard: '대시보드',
        airdrop: '에어드롭',
        earn: '수익',
        stakeEarn: '스테이킹 &amp; 수익',
        nftMarket: 'NFT 마켓',
        boostMarket: '부스트 마켓',
        fortunePool: '포춘 풀',
        tradeBkc: 'BKC 거래',
        community: '커뮤니티',
        charityPool: '자선 풀',
        services: '서비스',
        notary: '공증',
        grow: '성장',
        tutorSystem: '튜터 시스템',
        becomeOperator: '오퍼레이터 되기',
        adminPanel: '관리자 패널',
        about: '프로젝트 소개',
        inviteEarn: '초대 &amp; 수익',
        tutorials: '비디오 튜토리얼',
        home: '홈',
        social: '소셜',
        more: '더보기',
        tokenomics: '토크노믹스',
        tutor: '튜터',
        operator: '오퍼레이터',
        trade: '거래',
        fortune: '포춘',
        charity: '자선',
        boost: '부스트',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SPLASH — Welcome screen
    // ═══════════════════════════════════════════════════════════════════════
    splash: {
        optimized: 'opBNB에 최적화',
        mainnetLaunch: '메인넷 출시',
        days: '일',
        hours: '시간',
        minutes: '분',
        seconds: '초',
        unstoppable: '멈출 수 없는 DeFi',
        enterApp: '앱 입장',
        testnetBadge: '테스트넷',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DASHBOARD — DashboardPage.js
    // ═══════════════════════════════════════════════════════════════════════
    dashboard: {
        // Hero
        youWillReceive: '받을 금액',
        claimRewards: '보상 수령',
        noRewardsYet: '아직 보상 없음',
        yourPStake: '나의 pStake',
        stakeMore: '더 스테이킹',
        earnMoreWithNft: 'NFT로 +{amount} BKC 더 받으세요!',

        // Faucet
        faucet: {
            title: '무료 테스트 토큰 받기',
            titleReceived: '테스트 토큰 수령 완료',
            desc: '가스용 tBNB 받기 — 하루 1회',
            descReceived: '오늘 이미 {amount} tBNB를 받았습니다 — 24시간 후에 다시 오세요',
            descConnect: '가스용 tBNB를 받으려면 지갑을 연결하세요',
            claimFreeTokens: '무료 토큰 받기',
            claimedToday: '오늘 수령 완료',
            dailyClaimUsed: '일일 수령 사용됨',
            connectWallet: '지갑 연결',
            sending: '전송 중...',
            successMsg: '파우셋: {amount} tBNB가 지갑으로 전송되었습니다!',
            cooldownMsg: '파우셋 대기 중. 24시간 후에 다시 시도하세요.',
            unavailable: '파우셋이 일시적으로 사용 불가합니다. 나중에 다시 시도하세요.',
        },

        // Tutor/Referral Widget
        tutor: {
            becomeTutor: '누군가의 튜터가 되세요',
            shareLink: '링크를 공유하세요. 학생들의 모든 수수료 10% + BKC 5%를 영구적으로 받으세요.',
            studentsEarning: '{count}명의 학생이 수익을 창출하고 있습니다',
            keepSharing: '모든 수수료의 10% BNB + 스테이킹 보상의 5% BKC를 받습니다. 계속 공유하세요!',
            connectForLink: '튜터 링크를 받으려면 지갑을 연결하세요',
            tutorLinkCopied: '튜터 링크가 복사되었습니다!',
            failedToCopy: '복사 실패',
            shareTextCopied: '공유 텍스트가 복사되었습니다!',
            noTutorYet: '아직 튜터 없음',
            setATutor: '튜터 설정',
            change: '변경',
            earnings: '튜터 수익: {amount} BNB 사용 가능',
        },

        // Buyback Widget
        buyback: {
            ready: '바이백 준비됨',
            title: '바이백 준비 — {amount} BNB',
            desc: '바이백을 실행하여 대기 중인 BNB의 5%를 보상으로 받으세요',
            descWithFee: '{fee} BNB 수수료를 지불하고, {reward} BNB (5%)를 받으세요. 수수료가 바이백을 증폭시킵니다.',
            pending: '대기 중',
            earnAmount: '{amount} BNB 받기',
            execute: '실행',
            executing: '실행 중...',
            successMsg: '바이백 실행 완료! 5% BNB 보상을 받았습니다',
            failedMsg: '바이백 실패: {error}',
        },

        // Quick Actions
        actions: {
            agoraTitle: 'Agora',
            agoraDesc: '온체인에서 게시하고 토론하기',
            stakeBkcTitle: 'BKC 스테이킹',
            stakeBkcDesc: '자는 동안에도 수익',
            fortunePoolTitle: '포춘 풀',
            fortunePoolDesc: '최대 100배 당첨',
            notarizeTitle: '공증하기',
            notarizeDesc: '블록체인에 인증',
            charityPoolTitle: '자선 풀',
            charityPoolDesc: '기부하고 토큰 소각',
            nftMarketTitle: 'NFT 마켓',
            nftMarketDesc: '보상 2배',
            tradeBkcTitle: 'BKC 거래',
            tradeBkcDesc: 'Uniswap V3에서 스왑',
        },

        // Metrics
        metrics: {
            supply: '공급량',
            pstake: 'pStake',
            burned: '소각됨',
            fees: '수수료',
            locked: '잠김',
            bkcPrice: 'BKC 가격',
            balance: '잔액',
        },

        // Activity Feed
        activity: {
            title: '활동',
            yourActivity: '내 활동',
            networkActivity: '네트워크 활동',
            loadingActivity: '활동 로딩 중...',
            loadingYourActivity: '내 활동 로딩 중...',
            loadingNetworkActivity: '네트워크 활동 로딩 중...',
            noNetworkActivity: '아직 네트워크 활동 없음',
            beFirst: '최초로 스테이킹, 스왑, 또는 플레이하세요!',
            filterAll: '전체',
            filterStaking: '스테이킹',
            filterClaims: '수령',
            filterNft: 'NFT',
            filterFortune: '포춘',
            filterCharity: '자선',
            filterNotary: '공증',
            filterAgora: 'Agora',
            filterFaucet: '파우셋',
            noMatch: '일치하는 활동 없음',
            noActivity: '아직 활동 없음',
            tryFilter: '다른 필터를 시도해 보세요',
            startMsg: '스테이킹, 거래 또는 플레이를 시작하세요!',
            you: '나',
        },

        // Fortune quick-action
        fortune: {
            prize: '상금: {amount} BKC',
            playToWin: '플레이하여 당첨',
            bet: '베팅',
        },

        // Notary quick-action
        notary: {
            docsCertified: '{count}건 문서 인증됨',
            certifyDocs: '문서 인증',
        },

        // Claim toast messages
        claim: {
            success: '보상이 수령되었습니다!',
            failed: '수령 실패',
        },

        // Booster/NFT Display
        booster: {
            noBoosterNft: '부스터 NFT 없음',
            youKeep: '보유분',
            upgradeToMax: '다이아몬드로 업그레이드하여 100% 받기',
            buyNft: 'NFT 구매',
            rentNft: 'NFT 대여',
            howItWorks: '작동 방식',
            getUpToMore: 'NFT로 최대 +{amount} BKC 추가',
            recycledToStakers: '50%가 스테이커에게 재분배됩니다.',
            diamondKeep100: '다이아몬드: 100% 보유',
            owned: '소유',
            rented: '대여 중',
            inYourWallet: '지갑에 보유 중',
            activeRental: '활성 대여',
            netReward: '순 보상',
            nftBonus: 'NFT 보너스',
        },

        // Modals
        modals: {
            boostEfficiency: '효율 부스트',
            nftHoldersEarnMore: 'NFT 보유자는 최대 2배 더 받습니다',
            noGas: '가스 없음',
            needGasTokens: '가스용 tBNB가 필요합니다',
            getFreeGas: '무료 가스 + BKC 받기',
        },

        // Activity labels (used in ACTIVITY_ICONS)
        activityLabels: {
            staked: '스테이킹됨',
            unstaked: '스테이킹 해제됨',
            forceUnstaked: '강제 스테이킹 해제됨',
            rewardsClaimed: '보상 수령됨',
            boughtNft: 'NFT 구매됨',
            soldNft: 'NFT 판매됨',
            mintedBooster: '부스터 민팅됨',
            transfer: '전송',
            listedNft: 'NFT 등록됨',
            rentedNft: 'NFT 대여됨',
            withdrawn: '출금됨',
            promotedNft: 'NFT 프로모션됨',
            gameCommitted: '게임 커밋됨',
            gameRevealed: '게임 공개됨',
            fortuneBet: '포춘 베팅',
            comboMode: '콤보 모드',
            jackpotMode: '잭팟 모드',
            winner: '당첨!',
            noLuck: '아쉽네요',
            notarized: '공증됨',
            posted: '게시됨',
            liked: '좋아요',
            replied: '답글',
            superLiked: '슈퍼 좋아요',
            reposted: '리포스트됨',
            followed: '팔로우됨',
            profileCreated: '프로필 생성됨',
            profileBoosted: '프로필 부스트됨',
            badgeActivated: '배지 활성화됨',
            tippedBkc: 'BKC 팁 보냄',
            bnbWithdrawn: 'BNB 출금됨',
            donated: '기부됨',
            campaignCreated: '캠페인 생성됨',
            campaignCancelled: '캠페인 취소됨',
            fundsWithdrawn: '자금 출금됨',
            goalReached: '목표 달성!',
            faucetClaim: '파우셋 수령',
            feeCollected: '수수료 수집됨',
            tutorSet: '튜터 설정됨',
            tutorChanged: '튜터 변경됨',
            tutorEarned: '튜터 수익',
            rewardsRecycled: '보상 재분배됨',
            nftFused: 'NFT 합성됨',
            nftSplit: 'NFT 분할됨',
            voted: '투표됨',
            proposalCreated: '제안 생성됨',
            buyback: '바이백',
            swap: '스왑',
            liquidityAdded: '유동성 추가됨',
            liquidityRemoved: '유동성 제거됨',
            earningsWithdrawn: '수익 출금됨',
            gameExpired: '게임 만료됨',
            campaignBoosted: '캠페인 부스트됨',
            campaignClosed: '캠페인 종료됨',
            downvoted: '비추천됨',
            unfollowed: '팔로우 해제됨',
            batchActions: '일괄 작업',
            postEdited: '게시글 수정됨',
            postReported: '게시글 신고됨',
            postBoosted: '게시글 부스트됨',
            userBlocked: '사용자 차단됨',
            userUnblocked: '사용자 차단 해제됨',
            profileUpdated: '프로필 업데이트됨',
            bulkFused: '대량 합성됨',
            rewardsCompounded: '보상 복리됨',
            buybackPaused: '바이백 일시정지됨',
            buybackResumed: '바이백 재개됨',
            activity: '활동',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STAKING — StakingPage.js
    // ═══════════════════════════════════════════════════════════════════════
    staking: {
        title: '스테이킹 & 수익',
        subtitle: 'BKC를 위임하고 보상을 받으세요. NFT + 튜터 = 더 많이 보유',
        youWillReceive: '받을 금액',
        claimRewards: '보상 수령',
        noRewardsYet: '아직 보상 없음',
        compound: '복리',
        loadingBoost: '부스트 로딩 중...',

        // Breakdown
        breakdown: {
            staking: '스테이킹',
            mining: '마이닝',
            recycled: '재분배됨',
            tutor: '튜터',
            burned: '소각됨',
            none: '없음',
        },

        // Claim fee
        claimFee: '수령 수수료: {fee} BNB',

        // Buyback
        buybackAvailable: '바이백 가능',
        buybackReward: '5% 보상',
        pendingBnb: '대기 중 BNB',
        yourReward: '나의 보상 (5%)',
        bkcToStakers: '스테이커에게 BKC',
        miningRate: '마이닝 비율',
        executeBuyback: '바이백 실행',
        buybackInfo: '바이백을 실행하여 대기 중인 BNB의 5%를 받으세요. 나머지는 스테이커를 위한 BKC 보상으로 변환됩니다.',
        buybackFeeInfo: '수수료: {fee} BNB (바이백에 추가). 총액의 5%를 받으세요.',
        buybackLast: '최근: {time}',
        buybackTotal: '총: {count}회 바이백',

        // Stats
        networkPStake: '네트워크 pStake',
        yourPower: '나의 파워',
        pendingRewards: '대기 중',
        activeLocks: '활성 잠금',

        // Stake Form
        delegateBkc: 'BKC 위임',
        enterAmount: '금액을 입력하세요',
        available: '사용 가능',
        pstakePower: 'pStake 파워',
        netAmount: '순 금액',
        feePercent: '수수료',
        durationMonths: '{n}개월',
        durationDays: '{n}일',
        durationYears: '{n}년',

        // Delegations
        activeDelegations: '활성 위임',
        noActiveDelegations: '활성 위임 없음',
        connectWalletToView: '지갑을 연결하여 보기',
        unstake: '스테이킹 해제',
        forceUnstakeTitle: '강제 스테이킹 해제',
        forceUnstakeWarning: '강제 스테이킹 해제는 NFT 등급에 따른 패널티가 있습니다.',

        // History
        historyTitle: '내역',
        historyAll: '전체',
        historyStakes: '스테이킹',
        historyUnstakes: '해제',
        historyClaims: '수령',
        loadingHistory: '내역 로딩 중...',
        noHistoryYet: '아직 내역 없음',

        // History labels
        delegated: '위임됨',
        unstaked: '스테이킹 해제됨',
        claimed: '수령됨',
        forceUnstaked: '강제 스테이킹 해제됨',

        // Boost panel
        boost: {
            keep: '{rate}% 보유',
            recycle: '{rate}% 재분배',
            nftTierBenefits: 'NFT 등급 혜택',
            getAnNft: 'NFT 받기',
            upgradeToDiamond: '다이아몬드로 업그레이드하여 100% 보유',
            upgrade: '업그레이드',
            noTutorWarning: '튜터 없음 — +10% 추가 재분배',
            setTutorHint: '튜터를 설정하여 재분배 10% 감소',
            setATutor: '튜터 설정',
            tutorReduces: '-10% 재분배',
        },

        // Toast messages
        toast: {
            delegationSuccess: '위임 성공!',
            delegationFailed: '위임 실패: {error}',
            unstakeSuccess: '스테이킹 해제 성공!',
            forceUnstakeSuccess: '강제 스테이킹 해제 완료 (패널티 적용됨)',
            unstakeFailed: '스테이킹 해제 실패: {error}',
            claimSuccess: '보상이 수령되었습니다!',
            claimFailed: '수령 실패: {error}',
            compoundSuccess: '보상이 새로운 위임으로 복리되었습니다!',
            compoundFailed: '복리 실패: {error}',
            buybackSuccess: '바이백 실행 완료! 5% BNB 보상을 받았습니다',
            buybackFailed: '바이백 실패: {error}',
            invalidAmount: '잘못된 금액',
            insufficientBkc: 'BKC 잔액 부족',
            insufficientGas: '가스용 BNB 부족',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STORE — StorePage.js (NFT Marketplace)
    // ═══════════════════════════════════════════════════════════════════════
    store: {
        title: 'NFT 마켓',
        subtitle: '부스터 NFT 구매, 판매 및 합성',

        // Tier Card
        buyPrice: '구매',
        sellPrice: '판매',
        netSell: '순 판매가',
        poolSize: '풀',
        volume: '거래량',
        buy: '구매',
        sell: '판매',
        keepRate: '{rate}% 보유',

        // Impact Card
        rewardImpact: '보상 영향',
        currentKeep: '현재 보유율',
        withNft: 'NFT 적용 시',
        potentialGain: '잠재 수익',
        annualExtra: '연간 추가',
        stakeToSeeImpact: 'BKC를 스테이킹하여 영향을 확인하세요',

        // Tutor banner
        tutorBanner: {
            hasTutor: '활성 튜터: {address} — 보상을 더 많이 보유합니다',
            noTutor: '튜터 없음 — 재분배에서 10% 추가 손실.',
            setTutor: '튜터 설정',
        },

        // Inventory
        inventory: '인벤토리',
        noNftsYet: '아직 NFT 없음',
        buyFirstNft: '첫 NFT를 구매하여 더 많이 받으세요!',
        listForRent: '대여',
        addToWallet: '지갑에 추가',

        // Fusion/Split
        fusion: {
            title: '합성 & 분할',
            fuseTab: '합성',
            splitTab: '분할',
            bulkTab: '대량 합성',
            fuseHint: '같은 등급의 NFT 2개를 선택하여 상위 등급으로 합성',
            splitHint: 'NFT 1개를 선택하여 하위 등급 NFT 2개로 분할',
            bulkHint: '여러 NFT를 선택하여 원하는 등급까지 한 번에 합성',
            selectNfts: 'NFT 선택',
            noEligibleNfts: '이 작업에 적합한 NFT가 없습니다',
            fuseButton: '합성',
            splitButton: '분할',
            bulkFuseButton: '대량 합성',
            fuseFee: '수수료: {fee} BNB',
            splitFee: '수수료: {fee} BNB',
            result: '결과',
            splitInto: '분할 결과',
            targetTier: '목표 등급',
        },

        // Trade History
        tradeHistory: '거래 내역',
        noTradeHistory: '거래 내역 없음',
        bought: '구매됨',
        sold: '판매됨',
        fused: '합성됨',
        split: '분할',

        // Toast messages
        toast: {
            buySuccess: '{tier} NFT 구매 성공!',
            buyFailed: '구매 실패: {error}',
            sellSuccess: '{tier} NFT 판매 성공!',
            sellFailed: '판매 실패: {error}',
            fuseSuccess: '합성 완료! 새로운 {tier} NFT가 생성되었습니다',
            fuseFailed: '합성 실패: {error}',
            splitSuccess: '분할 완료! {tier} NFT 2개가 생성되었습니다',
            splitFailed: '분할 실패: {error}',
            bulkFuseSuccess: '대량 합성 완료!',
            bulkFuseFailed: '대량 합성 실패: {error}',
            nftAddedToWallet: '{tier} NFT #{id}이(가) 지갑에 추가되었습니다!',
            nftNotAdded: 'NFT가 지갑에 추가되지 않았습니다',
            failedToAddNft: 'NFT를 지갑에 추가하지 못했습니다',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FORTUNE — FortunePool.js
    // ═══════════════════════════════════════════════════════════════════════
    fortune: {
        title: '포춘 풀',
        subtitle: '운을 시험하세요 — 최대 100배 당첨',
        prizePool: '상금 풀',
        playToWin: '플레이하여 당첨',
        prize: '상금: {amount} BKC',

        // Tiers
        tiers: {
            standard: '스탠다드',
            combo: '콤보',
            jackpot: '잭팟',
        },

        // Game flow
        selectBet: '베팅 선택',
        placeBet: '베팅하기',
        confirmInMetamask: 'MetaMask에서 확인 중...',
        waitingReveal: '결과 대기 중...',
        revealResult: '결과 확인!',
        revealing: '공개 중...',
        confirmed: '확인됨',
        retryingIn: '{seconds}초 후 재시도...',

        // Results
        youWon: '당첨!',
        youLost: '아쉽네요',
        wonAmount: '{amount} BKC에 당첨되었습니다!',

        // Odds
        odds: {
            win2x: '5분의 1 — 2배 당첨',
            win5x: '10분의 1 — 5배 당첨',
            win100x: '150분의 1 — 100배 당첨',
        },

        // Stats
        totalGames: '총 게임',
        totalWins: '당첨',
        totalPrizesPaid: '지급된 상금',
        winsCount: '{wins}/{total} 당첨',
        yourHistory: '내 기록',

        // Share
        shareWin: '당첨 공유',
        shareText: '방금 Backcoin 포춘 풀에서 {amount} BKC에 당첨되었습니다!',

        // Toast
        toast: {
            betPlaced: '베팅 완료! 결과 대기 중...',
            betFailed: '베팅 실패: {error}',
            revealSuccess: '결과가 공개되었습니다!',
            revealFailed: '공개 실패: {error}',
            insufficientBkc: 'BKC 잔액 부족',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TRADE — TradePage.js
    // ═══════════════════════════════════════════════════════════════════════
    trade: {
        title: '거래',
        swap: '스왑',
        connectWallet: '지갑 연결',
        enterAmount: '금액 입력',
        insufficientBnb: 'BNB 부족',
        insufficientBkc: 'BKC 부족',
        swapWithImpact: '스왑 ({impact}% 영향)',

        // Direction
        youPay: '지불 금액',
        youReceive: '수령 금액',
        balance: '잔액: {amount} {symbol}',

        // Info
        priceImpact: '가격 영향',
        slippage: '슬리피지 허용 범위',
        minimumReceived: '최소 수령량',
        swapFee: '스왑 수수료',
        route: '경로',

        // Settings
        settings: '설정',
        slippageTolerance: '슬리피지 허용 범위',
        custom: '사용자 지정',

        // Pool info
        poolInfo: '풀 정보',
        ethReserve: 'BNB 보유량',
        bkcReserve: 'BKC 보유량',
        totalSwaps: '총 스왑',
        totalVolume: '총 거래량',
        contractAddress: '컨트랙트 주소',
        viewContract: '컨트랙트 보기',
        backcoinPool: 'Backchain 풀',

        // Chart
        chart: {
            bkcPrice: 'BKC 가격',
            noDataYet: '아직 가격 데이터가 없습니다. 시간이 지나면 차트가 채워집니다.',
        },

        // Toast
        toast: {
            swapSuccess: '스왑 완료!',
            swapFailed: '스왑 실패: {error}',
            approving: 'BKC 승인 중...',
            approvalComplete: '승인 완료!',
            approvalFailed: '승인 실패',
            swapping: '스왑 중...',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CHARITY — CharityPage.js
    // ═══════════════════════════════════════════════════════════════════════
    charity: {
        title: '자선 풀',
        subtitle: 'BNB로 대의를 지원하세요',

        // Stats
        totalDonated: '총 기부금',
        totalCampaigns: '총 캠페인',
        activeCampaigns: '활성 캠페인',
        totalDonors: '총 기부자',

        // Status
        statusActive: '활성',
        statusClosed: '종료됨',
        statusWithdrawn: '출금됨',

        // Categories
        categories: {
            animal: '동물 복지',
            humanitarian: '인도주의적 지원',
            environment: '환경',
            medical: '건강 & 의료',
            education: '교육 & 청소년',
            disaster: '재난 구호',
            community: '커뮤니티 & 소셜',
        },

        // Campaign Card
        raised: '모금됨',
        goal: '목표',
        donors: '명 기부',
        daysLeft: '{days}일 남음',
        goalReached: '목표 달성!',
        boosted: '부스트됨',
        boostDaysLeft: '{days}일 부스트 남음',

        // Actions
        donate: '기부',
        createCampaign: '캠페인 생성',
        shareCampaign: '캠페인 공유',
        boostCampaign: '캠페인 부스트',
        closeCampaign: '캠페인 종료',
        withdrawFunds: '자금 출금',

        // Create Wizard
        create: {
            step1: '카테고리 선택',
            step2: '캠페인 상세',
            step3: '검토 & 생성',
            campaignTitle: '캠페인 제목',
            description: '설명',
            goalAmount: '목표 (BNB)',
            duration: '기간 (일)',
            addMedia: '미디어 추가',
            review: '검토',
            create: '캠페인 생성',
        },

        // Donate Modal
        donateModal: {
            title: '캠페인에 기부',
            amount: '금액 (BNB)',
            presets: '빠른 금액',
            donateNow: '지금 기부',
        },

        // Boost Modal
        boostModal: {
            title: '캠페인 부스트',
            boostDays: '부스트 일수',
            costPerDay: '{cost} BNB/일',
            totalCost: '총 비용',
            boostNow: '지금 부스트',
        },

        // Toast
        toast: {
            donationSuccess: '기부 성공!',
            donationFailed: '기부 실패: {error}',
            createSuccess: '캠페인이 성공적으로 생성되었습니다!',
            createFailed: '캠페인 생성 실패: {error}',
            boostSuccess: '캠페인이 성공적으로 부스트되었습니다!',
            boostFailed: '부스트 실패: {error}',
            closeSuccess: '캠페인 종료됨',
            closeFailed: '캠페인 종료 실패: {error}',
            withdrawSuccess: '자금이 성공적으로 출금되었습니다!',
            withdrawFailed: '출금 실패: {error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // AIRDROP — AirdropPage.js
    // ═══════════════════════════════════════════════════════════════════════
    airdrop: {
        title: '에어드롭',
        subtitle: '포인트를 모으고, 순위를 올리고, 보상을 받으세요',

        // Tabs
        tabs: {
            earn: '수익',
            ranking: '랭킹',
            history: '내역',
            nftRewards: 'NFT 보상',
        },

        // Earn Tab
        totalPoints: '총 포인트',
        currentRank: '현재 순위',
        multiplier: '배율',
        postsApproved: '승인된 게시글',

        // Sharing
        shareOnX: 'X에서 공유',
        shareOnInstagram: 'Instagram에서 공유',
        shareOnOther: '기타 공유',
        shared: '공유됨',
        shareToEarn: '포인트를 받으려면 공유하세요',
        postFirst: '먼저 Agora에 게시하세요',

        // Platform usage
        platformUsage: '플랫폼 사용',
        claimFaucet: '파우셋 사용',
        delegateBkc: 'BKC 위임',
        playFortune: '포춘 플레이',
        buyNft: 'NFT 구매',
        sellNft: 'NFT 판매',
        listForRent: '대여 등록',
        rentNft: 'NFT 대여',
        notarizeDoc: '문서 공증',
        claimRewards: '보상 수령',

        // Inline composer
        writePost: '게시할 내용을 작성하세요...',
        createPost: '게시글 작성',
        postCreated: '게시글이 작성되었습니다! 이제 X, Instagram 등에서 공유하세요.',

        // Ranking
        ranking: {
            byPosts: '게시글 순',
            byPoints: '포인트 순',
            rank: '순위',
            user: '사용자',
            posts: '게시글',
            points: '포인트',
        },

        // NFT rewards section
        nftRewards: {
            title: 'NFT 상품',
            description: '상위 순위 사용자가 NFT 부스터를 받습니다!',
            totalNfts: '총 {count}개 NFT',
        },

        // Audit
        audit: {
            underReview: '게시글이 보안 감사 중입니다...',
            verifying: '게시글 진위 확인 중...',
            checking: '가이드라인 준수 여부 확인 중...',
            reviewInProgress: '보안 검토 진행 중...',
            analyzing: '감사 팀이 제출물을 분석 중입니다...',
        },

        // Toast
        toast: {
            postTooLong: '게시글이 너무 깁니다 (최대 2,000자).',
            writeFirst: '게시할 내용을 작성하세요.',
            uploadFailed: '업로드 실패: {error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // REFERRAL — ReferralPage.js
    // ═══════════════════════════════════════════════════════════════════════
    referral: {
        title: '튜터 시스템',
        heroTitle: '친구를 초대하고,',
        heroHighlight: '영원히 수익',
        heroDesc: '모든 사용자에게는 튜터가 있습니다. 친구가 프로토콜을 사용하면, 스마트 컨트랙트에 의해 보장된 수수료 일부를 영구적으로 자동 수령합니다.',

        // Share Card
        yourTutorLink: '나의 튜터 링크',
        connectForLink: '튜터 링크를 받으려면 지갑을 연결하세요',

        // Stats
        tutters: '학생',
        yourTutor: '나의 튜터',
        noneYet: '아직 없음',

        // Earnings
        yourEarnings: '나의 수익',
        accumulated: '학생 활동에서 누적됨',
        shareToStart: '수익을 시작하려면 튜터 링크를 공유하세요. 학생들이 지불하는 모든 수수료의 일부를 받게 됩니다.',
        noFeesYet: '학생들이 아직 수수료를 발생시키지 않았습니다. 프로토콜을 사용하면 수익이 여기에 자동으로 표시됩니다.',

        // How it works
        howItWorks: {
            title: '작동 방식',
            step1Title: '링크 공유',
            step1Desc: '친구에게 튜터 링크를 보내세요. 그들이 연결하고 첫 번째 작업을 수행하면, 당신은 영구적으로 그들의 튜터가 됩니다.',
            step2Title: '프로토콜 사용',
            step2Desc: '스테이킹, 포춘 플레이, NFT 구매 등 모든 작업마다 수수료 일부가 직접 당신에게 지급됩니다.',
            step3Title: '자동으로 수익',
            step3Desc: '모든 BNB 수수료의 10% + BKC 스테이킹 보상의 5%. 완전 자동, 온체인, 영구적.',
        },

        // Change tutor
        changeTutor: {
            title: '튜터 변경',
            desc: '새 튜터 주소를 입력하세요',
            placeholder: '0x...',
            confirm: '튜터 변경',
            warning: '현재 튜터가 교체됩니다. 새 튜터는 향후 활동에서 수익을 받게 됩니다.',
        },

        // Toast
        toast: {
            linkCopied: '튜터 링크가 복사되었습니다!',
            withdrawSuccess: '수익이 성공적으로 출금되었습니다!',
            withdrawFailed: '출금 실패: {error}',
            changeTutorSuccess: '튜터가 성공적으로 변경되었습니다!',
            changeTutorFailed: '튜터 변경 실패: {error}',
            invalidAddress: '잘못된 주소',
            cannotBeSelf: '자기 자신을 튜터로 설정할 수 없습니다',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // RENTAL — RentalPage.js (Boost Market)
    // ═══════════════════════════════════════════════════════════════════════
    rental: {
        title: '부스트 마켓',
        subtitle: '부스터 NFT를 대여하여 보상을 증폭하세요',

        // Tabs
        marketplace: '마켓플레이스',
        myRentals: '내 대여',
        myListings: '내 등록',

        // Filters
        allTiers: '모든 등급',
        sortByBoosted: '부스트됨',
        sortByPrice: '최저 가격',
        sortByExpiry: '곧 만료',

        // Listing Card
        perDay: '/일',
        listed: '등록됨',
        rented: '대여됨',
        available: '사용 가능',
        timeLeft: '{time} 남음',
        expired: '만료됨',
        booster: '부스터',
        yours: '내 것',

        // Keep Rate Descriptions
        keepAllRewards: '스테이킹 보상의 100%를 보유하세요!',
        saveBurns: '수령 소각에서 {rate}% 절약',
        keepRewards100: '보상의 100%를 보유!',
        keepRewardsRate: '수령 시 보상의 {rate}%를 보유',
        keepRewardsOf: '보상의 {rate}%를 보유',

        // Connected status
        connected: '연결됨',

        // Rent Modal
        rentNft: 'NFT 대여',
        rentBooster: '부스터 대여',
        rentalDays: '대여 일수',
        rentalCost: '대여 비용',
        ecosystemFee: '생태계 수수료',
        ecosystemFeePercent: '생태계 수수료 (20%)',
        totalCost: '총 비용',
        rentNow: '지금 대여',
        rent1Day: '1일 대여',
        oneDayDuration: '1일 (24시간)',
        duration: '기간',
        needBnb: '{amount} BNB 필요',
        balanceWarning: '잔액: {balance} BNB — {deficit} BNB 더 필요',

        // List Modal
        listForRent: '대여 등록',
        listNftForRent: 'NFT 대여 등록',
        selectNft: 'NFT 선택',
        selectNftPlaceholder: '-- NFT를 선택하세요 --',
        pricePerDay: '일일 가격 (BNB)',
        listNow: '지금 등록',
        listNft: 'NFT 등록',
        listBtn: '등록',
        fixedDayNote: '고정 1일 대여. NFT는 매 대여 후 자동 재등록됩니다.',
        enterPrice: '유효한 가격을 입력하세요',

        // Earnings
        totalLifetimeEarnings: '총 누적 수익',
        pendingBnb: '대기 중 BNB',
        pendingEarnings: '대기 중 수익',
        withdrawEarnings: '수익 출금',
        noEarnings: '대기 중인 수익 없음',

        // My Listings / My Rentals empty states
        viewListings: '등록 목록 보기',
        viewRentals: '활성 대여 보기',
        noListingsTitle: '아직 등록 없음',
        noListingsMsg: '첫 NFT를 등록하여 BNB 수익을 시작하세요!',
        noRentalsTitle: '활성 대여 없음',
        noRentalsMsg: 'NFT 부스터를 대여하여 스테이킹 보상을 더 많이 보유하세요!',

        // Boost Tiers
        boostTiers: '부스트 등급',
        boostTiersDesc: '다이아몬드 = 100% 보유 | 골드 = 90% | 실버 = 80% | 브론즈 = 70% — NFT 없음: 50% 재분배.',

        // Boost Modal
        boostListing: '등록 부스트',
        boostDuration: '부스트 기간 (일)',
        boostExplanation: '부스트된 등록이 마켓플레이스에서 먼저 표시됩니다. 부스트할 일수를 선택하세요.',
        boostExtendNote: '새로운 일수는 현재 만료일부터 연장됩니다.',
        boostedDaysRemaining: '부스트됨 — {days}일 남음',
        notBoosted: '부스트 안 됨',
        costPerDay: '일일 비용',
        calculating: '계산 중...',

        // Boost buttons
        boost: {
            extend: '연장',
            boost: '부스트',
            now: '지금 부스트',
            extendBoost: '부스트 연장',
        },

        // Withdraw NFT
        confirmWithdrawNft: '마켓플레이스에서 이 NFT를 출금하시겠습니까?',

        // Share
        shareText: 'Backchain 부스트 마켓에서 NFT 부스터를 대여하세요!\n\nNFT 부스터를 대여하여 스테이킹 보상의 최대 100%를 보유하세요.\n\n{url}\n\n#Backchain #DeFi #BNBChain #opBNB #Web3',

        // How It Works
        howItWorks: {
            title: '부스트 마켓 작동 방식',
            step1: 'NFT 소유자가 부스터를 대여 등록합니다',
            step2: '대여자가 BNB를 지불하여 일시적으로 부스트를 사용합니다',
            step3: '부스트가 스테이킹 보상에 자동 적용됩니다',
            step4: '만료되면 NFT가 소유자에게 반환됩니다',
        },

        // Toast
        toast: {
            rentSuccess: 'NFT 대여 성공!',
            rentFailed: '대여 실패: {error}',
            listSuccess: 'NFT가 대여 등록되었습니다!',
            listFailed: '등록 실패: {error}',
            withdrawSuccess: '수익 출금 완료!',
            withdrawFailed: '수익 출금 실패: {error}',
            withdrawNftSuccess: 'NFT 출금 성공!',
            delistSuccess: 'NFT 등록 해제됨',
            delistFailed: '등록 해제 실패: {error}',
            promoteSuccess: '등록이 프로모션되었습니다!',
            promoteFailed: '프로모션 실패: {error}',
            boostSuccess: '등록이 {days}일간 부스트되었습니다!',
            boostFailed: '부스트 실패: {error}',
            linkCopied: '링크가 클립보드에 복사되었습니다!',
            copyFailed: '링크를 복사할 수 없습니다',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // OPERATOR — OperatorPage.js
    // ═══════════════════════════════════════════════════════════════════════
    operator: {
        title: '오퍼레이터 되기',
        badge: 'Backchain에서 빌드',
        heroTitle: 'Backchain에서 빌드하고, 영구적인 수수료를 받으세요',
        heroDesc: '누구나 Backchain 프론트엔드(웹사이트, 앱, 봇)를 만들고 사용자의 모든 트랜잭션에서 자동 수수료를 받을 수 있습니다. 승인 불필요. 허가 불필요.',

        // How it works
        howItWorks: {
            title: '작동 방식',
            step1Title: '프론트엔드 빌드',
            step1Desc: 'Backchain 컨트랙트와 상호작용하는 웹사이트, 앱 또는 봇을 만드세요.',
            step2Title: '주소 등록',
            step2Desc: '프론트엔드에서 주소를 오퍼레이터로 설정하세요.',
            step3Title: '자동으로 수익',
            step3Desc: '사용자의 모든 트랜잭션이 영구적으로 수수료를 생성합니다.',
        },

        // Modules
        modulesTitle: '생태계 모듈',
        moduleName: '모듈',
        operatorFee: '오퍼레이터 수수료',
        status: '상태',
        enabled: '활성',
        disabled: '비활성',

        // Earnings
        yourEarnings: '나의 수익',
        pendingBnb: '대기 중 BNB',
        withdraw: '출금',
        noEarnings: '수익을 보려면 지갑을 연결하세요',

        // Code Example
        codeExample: '코드 예제',
        codeDesc: '주소를 오퍼레이터로 등록:',

        // Toast
        toast: {
            withdrawSuccess: '수익이 성공적으로 출금되었습니다!',
            withdrawFailed: '출금 실패: {error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TOKENOMICS — TokenomicsPage.js
    // ═══════════════════════════════════════════════════════════════════════
    tokenomics: {
        title: '토크노믹스',
        subtitle: '모듈형 스마트 컨트랙트 생태계. 프로토콜 수수료에서 실질 수익. 디자인에 의한 디플레이션. 관리자 키 없음. 멈출 수 없음.',

        // Supply
        tokenSupply: '토큰 공급',
        erc20OnOpbnb: 'BKC — opBNB의 ERC-20',
        maxSupply: '최대 공급량',
        circulating: '유통량',
        unminted: '미발행',
        mintedSoFar: '현재까지 {pct}% 발행됨',

        // TGE
        tgeAllocation: 'TGE 배분',
        tokensAtLaunch: '출시 시 토큰',
        liquidityPool: '유동성 풀',
        airdropReserve: '에어드롭 리저브',
        phase: '단계',

        // Fee Flow
        feeFlow: '수수료 흐름',
        feeFlowDesc: '모든 트랜잭션이 생태계를 통해 흐르는 BNB 수수료를 생성합니다.',
        operatorCut: '오퍼레이터 몫',
        tutorCut: '튜터 몫',
        protocol: '프로토콜',

        // BKC Distribution
        bkcDistribution: 'BKC 배분',
        stakers: '스테이커',
        burn: '소각',
        treasury: '재무',

        // Modules
        ecosystemModules: '생태계 모듈',

        // Deflationary
        deflationaryDesign: '디플레이션 설계',
        burnMechanisms: '소각 메커니즘',

        // CTAs
        startStaking: '스테이킹 시작',
        becomeOperator: '오퍼레이터 되기',
        inviteFriends: '친구 초대',
        footer: '참여할 준비가 되셨나요?',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ABOUT — AboutPage.js
    // ═══════════════════════════════════════════════════════════════════════
    about: {
        heroTitle: 'Backchain이란?',
        heroSubtitle: 'opBNB의 모듈형 DeFi 생태계. 관리자 키 없음. 멈출 수 없음.',

        // Hero badges
        badgeCommunity: '커뮤니티 소유',
        badgeSustaining: '자립형',
        badgeUnstoppable: '멈출 수 없음',
        badgeOpenSource: '오픈 소스',

        // Philosophy
        philosophy: '철학',
        philosophySub: 'Backchain이 존재하는 이유',
        philosophyText: '대부분의 DeFi 프로토콜은 컨트랙트를 중지하거나 지갑을 블랙리스트하거나 규칙을 변경할 수 있는 팀에 의해 제어됩니다. Backchain은 다른 철학으로 구축되었습니다: <strong class="text-white">한 번 배포되면 코드는 영원히 실행됩니다</strong> — 관리자가 중지할 수 없고, 회사가 폐쇄할 수 없으며, 정부가 검열할 수 없습니다.',
        noBlacklists: '블랙리스트 없음',
        noBlacklistsDesc: '모든 지갑이 동등한 접근권을 가집니다. 어떤 주소도 차단하거나 제한할 수 없습니다.',
        immutableCore: '불변 코어',
        immutableCoreDesc: '코어 컨트랙트는 불변입니다. 모듈은 기존 코드를 변경하지 않고 추가하거나 제거할 수 있습니다.',

        // Architecture
        architecture: {
            title: '생태계 아키텍처',
            subtitle: '중앙 허브에 연결된 모듈형 컨트랙트',
            hub: '생태계',
            hubDesc: '중앙 허브',
        },
        hubSpokeText: 'Backchain은 <strong class="text-white">모듈형 아키텍처</strong>를 사용합니다. <span class="text-amber-400 font-medium">허브</span>(BackchainEcosystem)는 불변 코어로 — 모든 수수료, 보상 배분, 오퍼레이터 수수료, 튜터 추천을 관리합니다. <span class="text-emerald-400 font-medium">스포크</span>는 허브에 연결되는 독립적인 서비스입니다. 기존 컨트랙트를 변경하지 않고 언제든지 새로운 스포크를 추가할 수 있습니다.',
        hubTitle: '허브 (BackchainEcosystem)',
        hubFeature1: '수수료 수집 & 모듈별 배분',
        hubFeature2: '오퍼레이터 수수료 (빌더에게 10-20%)',
        hubFeature3: '튜터 추천 시스템 (10% BNB + 5% BKC)',
        hubFeature4: '바이백 & 소각 엔진 (디플레이션)',
        spokesTitle: '스포크 (서비스 모듈)',
        spokeFeature1: '각 스포크가 생태계를 위한 수수료를 생성합니다',
        spokeFeature2: '독립적 배포 & 업그레이드 가능성',
        spokeFeature3: '더 많은 스포크 = 더 많은 수익 = 더 높은 보상',

        // Module categories
        defiCore: 'DeFi 코어',
        nftEcosystem: 'NFT 생태계',
        communityServices: '커뮤니티 & 서비스',
        infraGovernance: '인프라 & 거버넌스',

        // Modules
        modules: {
            staking: '스테이킹 풀',
            stakingDesc: 'BKC를 시간 잠금으로 위임하세요. BNB + BKC 보상을 받으세요.',
            nftMarket: 'NFT 풀',
            nftMarketDesc: '본딩 커브 마켓플레이스. 싸게 사고 비싸게 파세요.',
            fortune: '포춘 풀',
            fortuneDesc: '2배, 5배, 100배 확률의 온체인 게임',
            agora: 'Agora',
            agoraDesc: '탈중앙 소셜 프로토콜. 게시글, 좋아요, 팔로우 온체인.',
            notary: '공증',
            notaryDesc: '온체인 문서 인증. 불변의 존재 증명.',
            charity: '자선 풀',
            charityDesc: '투명한 모금. 온체인 기부 추적.',
            rental: '대여 관리자',
            rentalDesc: '다른 사용자로부터 NFT 부스트를 대여하세요. AirBNFT 마켓플레이스.',
            liquidity: '유동성 풀',
            liquidityDesc: 'BNB/BKC 거래를 위한 상수곱 AMM.',
        },

        // Extended module descriptions (mod.*)
        mod: {
            bkcToken: 'BKC 토큰',
            bkcTokenDesc: '활동 기반 민팅이 있는 ERC-20. 2억 캡.',
            buybackMiner: '바이백 마이너',
            buybackMinerDesc: '희소성 커브 마이닝을 통해 BNB 수수료를 BKC로 변환합니다.',
            rewardBooster: 'RewardBooster NFT',
            rewardBoosterDesc: '스테이킹 소각률을 줄이는 4등급 NFT (다이아몬드/골드/실버/브론즈).',
            nftFusion: 'NFT 합성',
            nftFusionDesc: '같은 등급 NFT 2개를 상위 등급 1개로 합성하거나 하위로 분할.',
            ecosystem: 'BackchainEcosystem',
            ecosystemDesc: '마스터 허브 — 수수료, 오퍼레이터, 튜터, 보상 분배.',
            governance: '거버넌스',
            governanceDesc: '점진적 탈중앙화: 관리자 → 멀티시그 → 타임락 → DAO.',
            faucet: '테스트넷 파우셋',
            faucetDesc: 'opBNB 테스트넷에서 테스트용 무료 BKC.',
            ibackchain: 'IBackchain',
            ibackchainDesc: '모든 컨트랙트 상호작용을 위한 공유 인터페이스.',
        },

        // Fee System
        feeSystemText: '모든 프로토콜 작업은 소량의 BNB 수수료를 생성합니다. 스마트 컨트랙트가 이 수수료를 여러 수혜자에게 자동으로 분배합니다 — 사용자, 빌더, 추천인, 프로토콜 간의 정렬된 인센티브를 만듭니다.',
        whereFeesGo: '수수료의 행방',
        userPaysFee: '사용자가 수수료 지불 (BNB)',
        ecosystemSplits: 'BackchainEcosystem이 자동으로 분배',
        feeTutor: '튜터',
        feeTutorDesc: '추천인',
        feeOperator: '오퍼레이터',
        feeOperatorDesc: '앱 빌더',
        feeBuyback: '바이백',
        feeBuybackDesc: 'BKC 구매 + 소각',
        feeTreasury: '재무',
        feeTreasuryDesc: '프로토콜 성장',
        feeDisclaimer: '정확한 분배는 모듈별로 다릅니다. 모든 비율은 온체인에서 불변입니다.',
        everyoneWins: '모두 승리',
        everyoneWinsDesc: '튜터 없음? → 10%가 대신 소각됩니다. 오퍼레이터 없음? → 오퍼레이터 몫이 소각됩니다. 모든 시나리오에서 참여자에게 보상을 주거나 BKC를 더 희소하게 만듭니다. 시스템에 누수가 없습니다.',

        // Mining
        miningTitle: '구매를 통한 마이닝',
        miningSub: '구매 증명: 사용 = 마이닝',
        miningText: 'Backchain에서 <strong class="text-white">플랫폼 사용이 곧 마이닝</strong>입니다. NFT 부스터를 구매하면, BuybackMiner가 지출된 BNB를 희소성 커브를 통해 새로 민팅된 BKC 토큰으로 변환합니다 — 많이 채굴될수록 더 어려워지며, 비트코인과 같습니다.',
        howMiningWorks: '마이닝 작동 방식',
        miningStep1: 'NFT 부스터 구매',
        miningStep1Desc: '본딩 커브 풀에서 (다이아몬드, 골드, 실버, 브론즈)',
        miningStep2: 'BuybackMiner가 BNB → BKC 변환',
        miningStep2Desc: '희소성 커브: 초기 마이너가 BNB당 더 많은 BKC를 받습니다',
        miningStep3: '보상 배분',
        miningStep3Desc: '70%는 스테이커에게 (pStake 비례), 30%는 재무에',
        stakerRewards: '스테이커 보상',
        stakerRewardsDesc: 'pStake 가중치에 따라 배분',
        treasuryDesc: '생태계 개발에 자금 지원',

        // Growth Programs
        growthTitle: '성장 프로그램',
        growthSub: '생태계를 성장시키는 두 가지 시스템',
        tutorSystem: '튜터 시스템',
        tutorSystemSub: '새 사용자를 튜터링하고 영원히 수익',
        tutorDesc: '튜터 링크를 공유하세요. 누군가가 이를 통해 참여하면, 그들은 당신의 학생이 되어 <strong class="text-white">그들의 BNB 수수료의 10%</strong> + <strong class="text-white">그들의 BKC 수령의 5%</strong>를 영구적으로 받습니다.',
        operatorSystem: '오퍼레이터 시스템',
        operatorSystemSub: '앱을 빌드하고 수수료를 받으세요',
        operatorDesc: '자체 프론트엔드, 봇 또는 통합을 빌드하세요. 지갑을 <strong class="text-white">오퍼레이터</strong>로 설정하고 앱을 통해 생성된 <strong class="text-white">모든 수수료의 10-20%</strong>를 받으세요. 등록 불필요.',
        learnMore: '자세히 보기',

        // Why Backchain features
        noVCs: 'VC 없음, 프리마인 없음, 내부자 없음',
        noVCsDesc: 'TGE의 35% (14M BKC)가 에어드롭을 통해 커뮤니티에 직접 지급됩니다. 65%는 유동성 풀로 갑니다. 투자자가 토큰을 덤핑하지 않습니다. 팀도 당신과 같은 방식으로 — 프로토콜을 사용하여 수익을 얻습니다.',
        realUtilityDesc: '법적 문서를 공증하세요. 검증 가능한 공정한 게임을 플레이하세요. 본딩 커브에서 NFT를 거래하세요. 부스트 파워를 대여하세요. 검열 저항 소셜 네트워크에 게시하세요. 투명한 자선단체에 기부하세요. 이것들은 약속이 아닙니다 — opBNB의 라이브 컨트랙트입니다.',
        sustainableYield: '지속 가능한 수익, 인플레이션 아님',
        sustainableYieldDesc: '스테이킹 보상은 실제 프로토콜 수수료(BNB)와 마이닝 활동에서 나옵니다 — 토큰 발행이 아닙니다. 생태계가 더 많이 사용될수록 실질 수익이 높아집니다. 폰지노믹스 없음.',
        alignedIncentives: '모든 수준에서 정렬된 인센티브',
        alignedIncentivesDesc: '사용자는 스테이킹으로 수익. 튜터는 초대로 수익. 오퍼레이터는 빌드로 수익. 프로토콜은 성장으로 수익. 참여자 누구도 다른 사람의 가치를 추출하지 않습니다 — 모두가 사용 성장으로 혜택을 받습니다.',

        // Tech Stack
        techStack: '기술 스택',
        techStackSub: '검증된 인프라 위에 구축',

        // CTA
        ctaDesc: '오늘부터 에어드롭 포인트를 받으세요. 스테이킹, 거래, 플레이 또는 빌드 — 모든 작업이 중요합니다.',
        whitepaper: '백서',

        // Whitepaper Modal
        tokenomicsPaper: '토크노믹스 페이퍼 V3',
        tokenomicsPaperDesc: '배분, 마이닝 & 희소성 엔진',
        technicalPaper: '기술 백서 V2',
        technicalPaperDesc: '아키텍처, 컨트랙트 & 수수료 시스템',

        // Footer
        footer: '커뮤니티에 의해, 커뮤니티를 위해 구축.',

        // Key Features
        keyFeatures: {
            title: '주요 기능',
            noAdmin: '관리자 키 없음',
            noAdminDesc: '불변 컨트랙트. 아무도 일시정지, 수정 또는 자금 인출을 할 수 없습니다.',
            realYield: '실질 수익',
            realYieldDesc: '인플레이션 배출이 아닌 실제 프로토콜 수수료에서의 보상.',
            modular: '모듈형',
            modularDesc: '생태계에 영향 없이 모듈을 추가/제거할 수 있습니다.',
            deflationary: '디플레이션',
            deflationaryDesc: '모든 BKC 수수료의 5%가 영구적으로 소각됩니다.',
        },

        // Links
        links: {
            title: '프로젝트 링크',
            website: '웹사이트',
            docs: '문서화',
            github: 'GitHub',
            telegram: 'Telegram',
            twitter: 'X (Twitter)',
        },

        // Contract addresses
        contracts: {
            title: '컨트랙트 주소',
            viewOnExplorer: '탐색기에서 보기',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TUTORIALS — TutorialsPage.js
    // ═══════════════════════════════════════════════════════════════════════
    tutorials: {
        title: '비디오 튜토리얼',
        subtitle: 'Backchain 생태계에 대해 모든 것을 배우세요',
        watchOnYoutube: 'YouTube에서 보기',
        subscribe: 'YouTube 구독',
        subscribeDesc: '새로운 튜토리얼과 업데이트를 받아보세요',
        subscribeBtn: '구독',
        comingSoon: '곧 출시',

        // Hero
        heroTitle: 'Backcoin 생태계 마스터하기',
        heroSubtitle: '첫 BKC부터 오퍼레이터 비즈니스 구축까지 모든 기능을 다루는 완전한 비디오 튜토리얼',
        videoCount: '영상',
        languages: '2개 언어',
        categoriesLabel: '카테고리',
        everyFeature: '모든 생태계 기능',

        // Filters
        filterAll: '전체',

        // Categories
        categories: {
            overview: 'Backcoin이란',
            gettingStarted: '시작하기',
            stakingMining: '스테이킹 & 마이닝',
            nftBoosters: 'NFT 부스터',
            fortunePool: '포춘 풀',
            community: '커뮤니티 & 소셜',
            services: '서비스',
            advanced: '고급',
        },

        // Tags
        tags: {
            beginner: '초급',
            intermediate: '중급',
            advanced: '고급',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN — AdminPage.js
    // ═══════════════════════════════════════════════════════════════════════
    admin: {
        title: '관리자 패널',
        accessDenied: '접근 거부',
        restrictedMsg: '이 페이지는 관리자 전용입니다.',
        enterPassword: '계속하려면 관리자 키를 입력하세요',
        login: '로그인',
        quickActions: '빠른 작업',

        // Tabs
        tabs: {
            overview: '개요',
            submissions: '제출물',
            users: '사용자',
            tasks: '작업',
            settings: '설정',
        },

        // Overview
        overview: {
            totalUsers: '총 사용자',
            totalSubmissions: '총 제출물',
            pendingReview: '검토 대기',
            totalPoints: '총 포인트',
        },

        // Status labels
        status: {
            pending: '검토 대기',
            auditing: '감사 중',
            approved: '승인됨',
            rejected: '거절됨',
            flagged: '신고됨',
        },

        // Actions
        approveAll: '전체 승인',
        rejectAll: '전체 거절',
        exportCsv: 'CSV 내보내기',
        reloadData: '데이터 새로고침',
        ban: '차단',
        unban: '차단 해제',

        // Faucet
        faucet: {
            status: '파우셋 상태',
            paused: '일시정지',
            active: '활성',
            pause: '일시정지',
            unpause: '재개',
        },

        // Toast
        toast: {
            loadFailed: '관리자 데이터 로드 실패.',
            txSent: '트랜잭션 전송됨...',
            faucetPaused: '파우셋이 성공적으로 일시정지되었습니다!',
            faucetUnpaused: '파우셋이 성공적으로 재개되었습니다!',
            reloading: '데이터 새로고침 중...',
            noUsersExport: '내보낼 사용자가 없습니다.',
            exportedUsers: '{count}명의 사용자를 내보냈습니다.',
            noSubmissionsExport: '내보낼 제출물이 없습니다.',
            exportedSubmissions: '{count}건의 제출물을 내보냈습니다.',
            submissionApproved: '제출물 승인됨!',
            submissionRejected: '제출물 거절됨!',
            userBanned: '사용자 차단됨.',
            userUnbanned: '사용자 차단 해제됨.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOCIAL — SocialMedia.js
    // ═══════════════════════════════════════════════════════════════════════
    social: {
        title: 'Backcoin 커뮤니티 참여',
        subtitle: '수천 명의 홀더와 소통하고, 메인넷 출시 소식을 받고, 독점 에어드롭에 참여하세요.',

        // Telegram
        telegramTitle: '공식 Telegram 그룹',
        telegramDesc: '\ud300\uacfc \ucee4\ubba4\ub2c8\ud2f0\uc640 \ucc44\ud305 \u2022 24\uc2dc\uac04 \uc9c0\uc6d0',
        joinNow: '지금 참여',

        // Social Cards
        twitter: 'X (Twitter)',
        twitterDesc: '최신 뉴스와 공지',
        youtube: 'YouTube',
        youtubeDesc: '비디오 튜토리얼과 AMA',
        instagram: 'Instagram',
        instagramDesc: '비주얼 업데이트와 스토리',
        tiktok: 'TikTok',
        tiktokDesc: '짧은 클립과 바이럴 콘텐츠',
        facebook: 'Facebook',
        facebookDesc: '커뮤니티 토론',

        // Warning
        verifyLinks: '항상 링크를 확인하세요. 공식 관리자는 자금을 요청하는 DM을 보내지 않습니다.',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FEEDBACK — ui-feedback.js
    // ═══════════════════════════════════════════════════════════════════════
    feedback: {
        // RPC Errors
        metamaskPending: 'MetaMask에 대기 중인 요청이 있습니다. MetaMask 확장을 열어 대기 중인 작업을 완료하거나 거절하세요.',
        txCancelled: '사용자가 트랜잭션을 취소했습니다.',
        insufficientFunds: '지갑 잔액이 부족합니다.',
        metamaskNotDetected: 'MetaMask가 감지되지 않았습니다',

        // NFT Wallet
        nftAddedToWallet: '{tier} NFT #{id}이(가) 지갑에 추가되었습니다!',
        nftNotAdded: 'NFT가 지갑에 추가되지 않았습니다',
        failedToAddNft: 'NFT를 지갑에 추가하지 못했습니다',

        // Timer
        unlocked: '잠금 해제됨',

        // Wallet
        walletDisconnected: '지갑이 연결 해제되었습니다.',

        // Share Modal
        inviteEarn: '초대 & 수익',
        shareBackchain: 'Backchain 공유',
        shareTutorDesc: '튜터 링크를 공유하세요 — 모든 친구로부터 <strong class="text-amber-400">10% BNB</strong> + <strong class="text-amber-400">5% BKC</strong> 수익',
        connectForTutorLink: '지갑을 연결하여 튜터 추천이 내장된 개인 초대 링크를 생성하세요!',
        shareConnectedText: "Join Backchain — I'll be your tutor! Stake BKC, earn rewards, and I'll earn too. Use my invite link:",
        shareDisconnectedText: 'Backchain을 확인하세요 — opBNB의 멈출 수 없는 DeFi. 스테이킹, NFT 거래, 포춘 풀 플레이 등!',
        badge10BNB: '10% BNB 수수료',
        badge5BKC: '5% BKC 수령',
        badgeForever: '영원히',
        tutorEmbedded: '당신의 튜터 주소 <span class="font-mono text-zinc-400">{addr}</span>가 이 링크에 포함되어 있습니다',
        footerConnected: '링크를 통해 참여하는 친구들이 자동으로 당신을 튜터로 설정합니다',
        footerDisconnected: '지금 공유하세요 — 모든 새 사용자가 생태계를 강화합니다',
        shareOn: {
            twitter: 'Twitter',
            telegram: 'Telegram',
            whatsapp: 'WhatsApp',
            copyLink: '링크 복사',
        },
        linkCopied: '튜터 링크가 복사되었습니다!',
        inviteLinkCopied: '초대 링크가 복사되었습니다!',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // AGORA — pages/agora/*.js
    // ═══════════════════════════════════════════════════════════════════════
    agora: {
        // Header / Nav
        brandName: 'Agora',
        feed: '피드',
        discover: '탐색',
        profile: '프로필',
        post: '게시',
        createProfile: '프로필 생성',

        // Compose
        compose: {
            placeholder: '온체인에서 무슨 일이?',
            post: '게시',
            reply: '답글',
            addImage: '이미지 추가',
            addVideo: '비디오 추가',
            addMedia: '미디어 추가',
            charCount: '{current}/{max}',
            posting: '게시 중...',
            uploadingMedia: '미디어 업로드 중...',
            video: '비디오',
            goLive: '라이브 시작',
            live: '라이브',
            free: '무료',
            newPost: '새 게시글',
            createProfileBanner: '사용자명을 얻고 게시를 시작하려면 프로필을 생성하세요',
        },

        // Feed
        newPost: '새 게시물',
        newPosts: '새 게시물',
        feedEmpty: '아직 게시글이 없습니다. 첫 게시글을 작성하세요!',
        feedEmptySubtext: '멈출 수 없는 소셜 네트워크에서 첫 게시글을 작성하세요!',
        discoverEmpty: '아직 트렌딩 게시글 없음',
        discoverSubtext: '첫 게시글을 작성하세요! 게시글은 참여도로 순위가 매겨집니다 — 좋아요, 답글, 슈퍼 좋아요가 노출도를 높입니다.',
        discoverRankedBy: '참여도 순 — 좋아요, 답글, 리포스트 & 슈퍼 좋아요',
        search: {
            placeholder: '게시글과 사용자 검색...',
            noResults: '결과 없음',
            tryAnother: '다른 검색어를 시도하세요',
            resultsFor: '"{query}" 검색 결과',
            result: '개 결과',
            results: '개 결과',
        },
        loadingPosts: '게시글 로딩 중...',
        noMorePosts: '더 이상 게시글 없음',
        loadMore: '더 보기',
        comingSoon: '곧 출시!',
        comingSoonDesc: 'Agora가 배포 중입니다. 멈출 수 없는 소셜 네트워크가 곧 시작됩니다!',
        noTagPosts: '{tag} 게시글 없음',
        noTagPostsSubtext: '다른 태그를 시도하거나 첫 게시글을 작성하세요!',
        welcomeTitle: 'Agora에 오신 것을 환영합니다',
        welcomeStep1: '프로필 생성',
        welcomeStep2: '첫 번째 생각을 게시하세요',
        welcomeStep3: '슈퍼 좋아요 받기',
        readMore: '더 읽기',
        more: '더 보기',
        less: '접기',
        endStream: '스트림 종료',
        joinLiveStream: '라이브 스트림 참여',
        leave: '나가기',
        originalPostNotFound: '원본 게시글을 찾을 수 없습니다',

        // Post Card
        postCard: {
            like: '좋아요',
            liked: '좋아요',
            reply: '답글',
            repost: '리포스트',
            reposted: '{name}님이 리포스트',
            superLike: '슈퍼 좋아요',
            downvote: '비추천',
            share: '공유',
            tip: '팁',
            tipAuthor: '작성자에게 팁',
            boost: '부스트',
            boostPost: '게시글 부스트',
            report: '신고',
            edit: '편집',
            editPost: '게시글 수정',
            delete: '삭제',
            pin: '고정',
            pinToProfile: '프로필에 고정',
            unpin: '고정 해제',
            block: '차단',
            blockUser: '사용자 차단',
            unblock: '차단 해제',
            unblockUser: '사용자 차단 해제',
            changeTag: '태그 변경',
            replies: '{count}개의 답글',
            viewThread: '스레드 보기',
            viewOnExplorer: '탐색기에서 보기',
            edited: '수정됨',
            replyingTo: '{name}에게 답글',
            options: '옵션',
        },

        // Profile
        profileSetup: {
            title: '프로필 생성',
            subtitle: 'Agora에서 온체인 아이덴티티를 설정하세요',
            username: '사용자명 선택',
            usernamePlaceholder: '예: satoshi',
            usernameHint: '1-15자: 소문자, 숫자, 밑줄. 짧은 사용자명은 더 많은 BNB가 필요합니다.',
            usernameChecking: '확인 중...',
            usernameAvailable: '사용 가능',
            usernameTaken: '사용 중',
            usernameFree: '무료',
            create: '프로필 생성',
            creating: '생성 중...',
            displayName: '표시 이름',
            displayNamePlaceholder: '공개 이름',
            bio: '소개',
            bioPlaceholder: '자신에 대해 알려주세요...',
            language: '언어',
            languageHint: '게시글이 이 언어로 태그되어 필터링됩니다.',
            step2Hint: '표시 이름, 소개, 언어는 메타데이터로 저장되며 언제든지 무료로 업데이트할 수 있습니다.',
            usernameFee: '사용자명 수수료',
            connectWalletToCreate: '프로필을 생성하려면 지갑을 연결하세요.',
            connectWalletToView: '프로필을 보려면 지갑을 연결하세요.',
        },

        myProfile: {
            posts: '게시글',
            followers: '팔로워',
            following: '팔로잉',
            editProfile: '프로필 편집',
            noPosts: '아직 게시글 없음',
            noPostsSubtext: '아직 게시글이 없습니다 — 첫 번째 생각을 공유하세요!',
            yourPosts: '내 게시글',
            total: '총 {count}개',
            viewOnExplorer: '탐색기에서 보기',
            badge: '배지',
            boost: '부스트',
            boosted: '부스트됨',
        },

        userProfile: {
            follow: '팔로우',
            unfollow: '팔로우 해제',
            following: '팔로잉',
            blocked: '차단됨',
            block: '차단',
            unblock: '차단 해제',
            notFound: '사용자를 찾을 수 없습니다',
            noPosts: '아직 게시글 없음',
        },

        // Tags
        tags: {
            all: '전체',
            general: '일반',
            defi: 'DeFi',
            nft: 'NFT',
            memes: '밈',
            alpha: '알파',
            dev: '개발',
        },
        sort: {
            forYou: '추천',
            following: '팔로잉',
            new: '최신',
            top: '인기',
        },

        // Modals
        modals: {
            superLike: {
                title: '슈퍼 좋아요',
                desc: '이 게시글을 트렌딩으로 올리기 위해 원하는 금액의 BNB를 보내세요. 더 많은 BNB = 더 높은 순위. 모든 BNB는 생태계로 갑니다.',
                amountLabel: '금액 (BNB)',
                anyAmount: '자유 금액',
                minAmount: '> 0 BNB',
                confirm: '슈퍼 좋아요',
            },
            downvote: {
                title: '비추천',
                desc: '이 게시글을 비추천합니다. 각 게시글에 한 번만 비추천할 수 있습니다.',
                confirm: '비추천',
            },
            tip: {
                title: '작성자에게 팁',
                desc: '게시글 작성자에게 팁으로 BNB를 직접 보내세요. 0보다 큰 금액.',
                amountLabel: '금액 (BNB)',
                confirm: '팁 보내기',
            },
            boost: {
                title: '게시글 부스트',
                desc: '더 많은 노출을 위해 이 게시글을 부스트하세요. 가격은 생태계 거버넌스에 의해 설정됩니다.',
                daysLabel: '일',
                standard: '스탠다드',
                featured: '프리미엄',
                confirm: '게시글 부스트',
            },
            boostProfile: {
                title: '프로필 부스트',
                desc: '더 많은 노출을 위해 프로필을 부스트하세요. 가격은 생태계 거버넌스에 의해 설정됩니다.',
                daysLabel: '일',
                confirm: '프로필 부스트',
            },
            badge: {
                title: '신뢰 배지',
                desc: '1년간 인증 배지를 받으세요. 상위 등급은 더 긴 게시글과 더 많은 명성을 해제합니다.',
                verified: '인증됨',
                premium: '프리미엄',
                elite: '엘리트',
                charsPerPost: '게시글당 최대 {limit}자',
                current: '현재',
                withoutBadge: '배지 없음: 게시글당 2,000자',
            },
            report: {
                title: '게시글 신고',
                desc: '이 게시글을 신고하고 작성자를 피드에서 차단합니다. 비용: 0.0001 BNB',
                reasons: {
                    spam: '스팸',
                    harassment: '괴롭힘',
                    illegal: '불법 콘텐츠',
                    scam: '사기',
                    other: '기타',
                },
                confirm: '신고 제출',
            },
            editPost: {
                title: '게시글 수정',
                desc: '게시 후 15분 이내에 수정 가능. 무료 (가스만). 한 번만 수정 가능.',
                confirm: '수정 저장',
            },
            editProfile: {
                title: '프로필 편집',
                coverImage: '커버 이미지',
                noCover: '커버 없음',
                profilePicture: '프로필 사진',
                changePhoto: '사진 변경',
                displayName: '표시 이름',
                displayNamePlaceholder: '표시 이름',
                bio: '소개',
                bioPlaceholder: '자기 소개...',
                location: '위치',
                locationPlaceholder: '예: 서울, 대한민국',
                language: '언어',
                socialLinks: '소셜 링크',
                addLink: '링크 추가',
                platform: '플랫폼',
                usernameNote: '사용자명은 변경할 수 없습니다. 가스 수수료만 적용됩니다.',
                confirm: '변경 저장',
                maxLinks: '최대 9개 링크',
                uploadingAvatar: '아바타 업로드 중...',
                uploadingCover: '커버 업로드 중...',
                imageTooLarge: '이미지가 너무 큽니다. 최대 5MB.',
                avatar: '아바타',
                banner: '배너',
            },
            repost: {
                title: '리포스트',
                desc: '팔로워에게 리포스트하시겠습니까? 무료 (가스만)',
                confirm: '리포스트',
            },
            changeTag: {
                title: '태그 변경',
                desc: '게시글의 새 카테고리를 선택하세요. 가스 수수료만 적용됩니다.',
                confirm: '태그 변경',
            },
            deletePost: {
                title: '게시글 삭제',
                desc: '정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
                confirm: '삭제',
            },
        },

        // Cart (batch actions)
        cart: {
            title: '액션 카트',
            empty: '카트가 비어 있습니다',
            total: '합계',
            submit: '블록체인에 등록',
            clear: '비우기',
            notOnChainYet: '아직 블록체인에 등록되지 않음',
            actionsNotOnChain: '<strong>{count}개 작업</strong>이 아직 블록체인에 없음',
            action: '개 작업',
            actions: '개 작업',
            totalFee: '수수료: {fee} ETH',
            savings: '배치로 ~{pct}% 가스 절약',
        },

        // Post Detail
        postDetail: {
            postNotFound: '게시글을 찾을 수 없습니다',
            replies: '답글',
            repliesCount: '답글 ({count})',
            noReplies: '아직 답글이 없습니다. 첫 답글을 작성하세요!',
            replyingTo: '{name}에게 답글',
            replyPlaceholder: '답글을 작성하세요...',
            reply: '답글',
            replyFree: '텍스트 답글: 무료 (가스만)',
            like: '좋아요',
            likes: '좋아요',
            replyCount: '답글',
            beFirst: '첫 답글을 작성하세요!',
        },

        // Upgrade hint
        upgrade: {
            charsWithTier: '최대 {limit}자 사용 가능',
        },

        // Toast
        toast: {
            postCreated: '게시글 작성됨!',
            postFailed: '게시글 작성 실패: {error}',
            replyCreated: '답글 게시됨!',
            replyFailed: '답글 작성 실패: {error}',
            likeSuccess: '게시글 좋아요!',
            likeFailed: '좋아요 실패: {error}',
            followSuccess: '팔로우 중!',
            followFailed: '팔로우 실패: {error}',
            unfollowSuccess: '팔로우 해제됨',
            unfollowFailed: '팔로우 해제 실패: {error}',
            repostSuccess: '게시글 리포스트됨!',
            repostFailed: '리포스트 실패: {error}',
            superLikeSuccess: '슈퍼 좋아요 전송됨!',
            superLikeFailed: '슈퍼 좋아요 실패: {error}',
            downvoteSuccess: '비추천 기록됨',
            downvoteFailed: '비추천 실패: {error}',
            tipSuccess: '팁 전송됨!',
            tipFailed: '팁 실패: {error}',
            boostSuccess: '게시글 부스트됨!',
            boostFailed: '부스트 실패: {error}',
            boostProfileSuccess: '프로필 부스트됨!',
            boostProfileFailed: '프로필 부스트 실패: {error}',
            badgeSuccess: '배지 활성화됨!',
            badgeFailed: '배지 활성화 실패: {error}',
            reportSuccess: '신고 제출됨',
            reportFailed: '신고 실패: {error}',
            editSuccess: '게시글 수정됨!',
            editFailed: '수정 실패: {error}',
            deleteSuccess: '게시글 삭제됨',
            deleteFailed: '삭제 실패: {error}',
            pinSuccess: '게시글 고정됨!',
            pinFailed: '고정 실패: {error}',
            blockSuccess: '사용자 차단됨',
            blockFailed: '차단 실패: {error}',
            unblockSuccess: '사용자 차단 해제됨',
            unblockFailed: '차단 해제 실패: {error}',
            profileCreated: '프로필이 성공적으로 생성되었습니다!',
            profileFailed: '프로필 생성 실패: {error}',
            profileUpdated: '프로필 업데이트됨!',
            profileUpdateFailed: '프로필 업데이트 실패: {error}',
            batchSuccess: '{count}개 작업이 블록체인에 등록되었습니다!',
            batchFailed: '일괄 트랜잭션 실패',
            postShared: '게시글 공유됨!',
            linkCopied: '링크 복사됨!',
            connectFirst: '먼저 지갑을 연결하세요',
            createProfileFirst: '먼저 프로필을 생성하세요',
            alreadyInCart: '이미 카트에 있음',
            likeAddedToCart: '좋아요가 카트에 추가됨',
            downvoteAddedToCart: '비추천이 카트에 추가됨',
            followAddedToCart: '팔로우가 카트에 추가됨',
            cartCleared: '카트 비움',
            cartEmpty: '카트가 비어 있습니다',
            pleaseWrite: '내용을 작성해 주세요',
            postTooLong: '게시글이 너무 깁니다 (최대 {max}자)',
            pleaseWriteReply: '답글을 작성해 주세요',
            replyPosted: '답글 게시됨!',
            reposted: '리포스트됨!',
            superLiked: '슈퍼 좋아요!',
            userBlocked: '사용자 차단됨',
            userUnblocked: '사용자 차단 해제됨',
            postPinned: '게시글 고정됨!',
            unfollowed: '팔로우 해제됨',
            profileCreated: '프로필 생성됨!',
            profileUpdated: '프로필 업데이트됨!',
            badgeObtained: '{name} 배지 획득!',
            postReported: '게시글이 신고되었습니다. 작성자가 피드에서 차단되었습니다.',
            postBoosted: '게시글이 {days}일간 부스트됨 ({tier})!',
            tipped: '{amount} BNB 팁 보냄!',
            profileBoosted: '프로필이 {days}일간 부스트됨!',
            tagChanged: '태그 변경됨!',
            contentRequired: '내용이 필요합니다',
            tooLong: '너무 깁니다 (최대 {max})',
            postEdited: '게시글 수정됨!',
            uploadFailed: '업로드 실패: {error}',
            avatarUploadError: '아바타 업로드 오류: {error}',
            coverUploadError: '커버 업로드 오류: {error}',
            unsupportedFileType: '지원되지 않는 파일 형식입니다. 이미지 또는 비디오를 사용하세요.',
            invalidFormat: '잘못된 {type} 형식입니다.',
            fileTooLarge: '파일이 너무 큽니다. 최대 {limit}.',
            maxMediaItems: '최대 {max}개 미디어 항목',
            streamEnded: '스트림 종료됨',
            youAreLive: '지금 라이브 중입니다!',
            streamEndedSaving: '스트림 종료됨. 녹화 저장 중...',
            requestingCamera: '카메라 접근 요청 중...',
            creatingLivePost: '온체인에서 라이브 게시글 생성 중...',
            alreadyLive: '이미 라이브 중입니다!',
            connectToGoLive: '라이브를 시작하려면 지갑을 연결하세요',
            browserNoSupport: '브라우저가 라이브 스트리밍을 지원하지 않습니다 (HTTPS 필요)',
            cameraPermDenied: '카메라/마이크 권한이 거부되었습니다. 접근을 허용하고 다시 시도하세요.',
            noCameraFound: '이 기기에서 카메라 또는 마이크를 찾을 수 없습니다',
            cameraInUse: '카메라가 다른 애플리케이션에서 사용 중입니다',
            failedToGoLive: '라이브 시작 실패: {error}',
            failedToStartStream: '스트림 시작 실패: {error}',
            failedToCreateLive: '라이브 게시글 생성 실패: {error}',
            streamError: '스트림 오류: {error}',
            recordingTooLarge: '녹화가 너무 큽니다 ({size}MB). 최대 100MB.',
            savingRecording: 'Arweave에 녹화 저장 중 ({size}MB)...',
            recordingSaved: '라이브 녹화가 영구적으로 저장되었습니다!',
            failedToSaveRecording: '녹화 저장 실패: {error}',
        },

        // Viewers
        viewers: '{count}명 시청 중',

        // Wallet button
        wallet: {
            connect: '연결',
            connected: '연결됨',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NOTARY — pages/notary/*.js
    // ═══════════════════════════════════════════════════════════════════════
    notary: {
        // Header
        brandName: '디지털 공증',
        brandSub: '블록체인 등록 및 인증',

        // Tabs
        documents: '문서',
        assets: '자산',
        verify: '검증',
        stats: '통계',
        notarize: '공증하기',

        // Header detail views
        certDetail: {
            title: '인증서 #{id}',
            subtitle: '문서 상세',
        },
        assetDetail: {
            title: '자산 #{id}',
            subtitle: '자산 상세',
        },
        registerAsset: {
            title: '자산 등록',
            subtitle: '온체인 자산 등록',
        },

        // Documents tab
        documentsTab: {
            title: '내 문서',
            noDocuments: '아직 인증된 문서 없음',
            certifyFirst: '시작하려면 첫 문서를 공증하세요!',
            notarizeNew: '새로 공증',
            filterAll: '전체',
            filterDocument: '문서',
            filterImage: '이미지',
            filterCode: '코드',
            filterOther: '기타',
            connectToView: '인증서를 보려면 연결하세요',
            certCount: '{count}건의 인증서',
            notarizedDocument: '공증된 문서',
            received: '수신됨',
        },

        // Assets tab
        assetsTab: {
            title: '내 자산',
            noAssets: '아직 등록된 자산 없음',
            registerFirst: '블록체인에 첫 자산을 등록하세요!',
            registerNew: '새로 등록',
            filterAll: '전체',
            connectToView: '자산을 보려면 연결하세요',
            assetCount: '{count}건의 자산',
        },

        // Notarize wizard
        wizard: {
            step1Title: '파일 선택',
            step1Desc: '공증할 파일을 선택하세요',
            step2Title: '상세',
            step2Desc: '문서에 대한 정보를 추가하세요',
            step3Title: '확인',
            step3Desc: '공증을 검토하고 확인하세요',

            dropzone: '드래그하거나 클릭하여 파일을 선택하세요',
            maxSize: '최대 크기: 10MB',
            docType: '문서 유형',
            docTitle: '제목',
            docDescription: '설명 (선택사항)',
            hash: '파일 해시',
            fee: '공증 수수료',
            confirm: '문서 공증',
            processing: '처리 중...',

            docTypes: {
                general: '일반',
                contract: '계약서',
                identity: '신분증',
                diploma: '졸업장',
                property: '부동산',
                financial: '금융',
                legal: '법률',
                medical: '의료',
                ip: '지적재산',
                other: '기타',
            },

            fileSelected: '파일 선택됨',
            hashComputed: 'SHA-256 해시가 브라우저에서 계산됨',
            remove: '제거',
            checkingDuplicates: '중복 확인 중...',
            duplicateFound: '문서가 이미 공증되었습니다!',
            duplicateExistsMsg: '이 해시가 이미 블록체인에 존재합니다.',
            uniqueHash: '고유 해시 — 인증 준비 완료',
            changeFile: '파일 변경',
            continue: '계속',
            computingHash: 'SHA-256 계산 중...',
            hashLocal: '해시가 브라우저에서 로컬로 계산 중',
            localHash: '로컬 해시',
            arweave: 'Arweave',
            permanent: '영구',
            descPlaceholder: '예: 2025년 1월 서명된 부동산 증서...',
            fees: '수수료',
            arweaveStorage: 'Arweave 스토리지',
            certificationFee: '인증 수수료',
            arweaveDesc: 'Arweave = 영구적, 탈중앙 스토리지',
            insufficientBnb: '수수료 + 가스용 BNB 부족',
            review: '검토',
            noDescription: '설명 없음',
            signAndMint: '서명 & 민팅',
        },

        // Asset wizard
        assetWizard: {
            step1Title: '자산 유형',
            step2Title: '상세',
            step3Title: '문서화',
            step4Title: '검토',

            assetTypes: {
                property: '부동산',
                vehicle: '차량',
                equipment: '장비',
                artwork: '예술품',
                intellectual: '지적 재산',
                other: '기타',
            },

            name: '자산 이름',
            description: '설명',
            location: '위치',
            serialNumber: '일련번호 / 등록번호',
            estimatedValue: '추정 가치',
            addDocumentation: '문서 추가',
            skipDoc: '건너뛰기 (나중에 추가)',
            register: '자산 등록',
        },

        // Cert Detail
        certDetailView: {
            documentType: '문서 유형',
            certifiedBy: '인증자',
            certifiedOn: '인증 날짜',
            fileHash: '파일 해시',
            txHash: '트랜잭션 해시',
            arweaveId: 'Arweave ID',
            viewDocument: '문서 보기',
            transferOwnership: '소유권 이전',
            transferTo: '이전 대상',
            transferPlaceholder: '지갑 주소 (0x...)',
            confirmTransfer: '이전 확인',
            shareProof: '증명 공유',
            downloadCert: '인증서 다운로드',
            description: '설명',
            tapToViewNft: '탭하여 NFT 카드 보기',
            transferCertificate: '인증서 이전',
            transferDesc: '이 인증서의 소유권을 다른 지갑으로 이전합니다. 이 작업은 영구적이며 소액의 수수료가 필요합니다.',
        },

        // Asset Detail
        assetDetailView: {
            owner: '소유자',
            registeredOn: '등록 날짜',
            assetType: '자산 유형',
            description: '설명',
            location: '위치',
            serialNumber: '일련번호',
            annotations: '주석',
            noAnnotations: '아직 주석 없음',
            addAnnotation: '주석 추가',
            annotationPlaceholder: '주석을 작성하세요...',
            transferOwnership: '소유권 이전',
            documents: '연결된 문서',
            noDocuments: '연결된 문서 없음',
            tapToOpen: '탭하여 열기',
            tapToView: '탭하여 보기',
            transfers: '이전',
            youOwnThis: '이 자산의 소유자입니다',
            documentHash: '문서 해시',
            additionalInfo: '추가 정보',
            annotate: '주석 달기',
            transferAsset: '자산 이전',
            transferDesc: '소유권 이전. 영구적인 온체인 기록이 생성됩니다.',
            newOwnerPlaceholder: '새 소유자 주소 (0x...)',
            declaredValuePlaceholder: '신고 가치 (BNB, 선택사항)',
            transferNotePlaceholder: '이전 메모 (선택사항)',
        },

        // Verify tab
        verifyTab: {
            title: '문서 검증',
            subtitle: '문서가 블록체인에 인증되었는지 확인하세요',
            dropzone: '드래그하거나 클릭하여 검증할 파일을 선택하세요',
            orEnterHash: '또는 문서 해시를 입력하세요',
            hashPlaceholder: '파일 해시 (SHA-256)',
            verifyButton: '검증',
            verifying: '검증 중...',
            verified: '문서 검증됨!',
            notFound: '문서를 찾을 수 없음',
            verifiedDesc: '이 문서는 블록체인에 인증되었습니다.',
            notFoundDesc: '이 문서는 레지스트리에서 찾을 수 없습니다.',
            hashComputedLocally: 'SHA-256 해시가 로컬에서 계산됩니다',
            verificationError: '검증 오류: {error}',
            tokenId: '토큰 ID',
            date: '날짜',
            sha256Hash: 'SHA-256 해시',
            file: '파일',
        },

        // Stats tab
        statsTab: {
            title: '통계',
            totalCertificates: '총 인증서',
            totalAssets: '총 자산',
            totalTransfers: '총 이전',
            recentActivity: '최근 활동',
            notarizations: '공증',
            annotations: '주석',
            noRecentNotarizations: '최근 공증을 찾을 수 없음',
            viewContract: '탐색기에서 컨트랙트 보기',
        },

        // NFT Certificate Card
        nftCard: {
            title: 'NFT 인증서',
            viewOnChain: '블록체인에서 보기',
            addToWallet: '지갑에 추가',
        },

        // Toast
        toast: {
            notarizeSuccess: '문서가 성공적으로 공증되었습니다!',
            notarizeFailed: '공증 실패: {error}',
            transferSuccess: '소유권이 성공적으로 이전되었습니다!',
            transferFailed: '이전 실패: {error}',
            registerAssetSuccess: '자산이 성공적으로 등록되었습니다!',
            registerAssetFailed: '자산 등록 실패: {error}',
            annotationSuccess: '주석 추가됨!',
            annotationFailed: '주석 실패: {error}',
            hashCopied: '해시 복사됨!',
            linkCopied: '링크 복사됨!',
            connectFirst: '먼저 지갑을 연결하세요',
            invalidFile: '잘못된 파일',
            fileTooLarge: '파일이 너무 큽니다 (최대 10MB)',
            hashError: '파일 해시 계산 오류',
            pleaseWait: '잠시 기다려 주세요...',
            contractNotFound: '컨트랙트 주소를 찾을 수 없음',
            walletDisconnected: '지갑이 연결 해제되었습니다. 다시 연결하세요.',
            tokenAdded: '토큰 #{id}이(가) 지갑에 추가되었습니다!',
            rateLimited: 'MetaMask가 속도 제한되었습니다. 잠시 후 다시 시도하세요.',
            networkMismatch: '지갑 네트워크를 확인하고 다시 시도하세요.',
            addManually: 'MetaMask > NFT > NFT 가져오기를 열어 수동으로 추가하세요',
            copyFailed: '복사 실패',
            invalidAddress: '유효한 지갑 주소를 입력하세요',
            assetNotFound: '자산을 찾을 수 없음',
            certNotFound: '인증서를 찾을 수 없음',
        },

        // Action button states
        actions: {
            uploading: '업로드 중...',
            registering: '등록 중...',
            uploadingDoc: '문서 업로드 중...',
            transferring: '이전 중...',
            adding: '추가 중...',
        },
    },
};
