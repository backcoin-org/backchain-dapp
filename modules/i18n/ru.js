// modules/i18n/ru.js — Backchain i18n Russian Dictionary
export default {

    // ═══════════════════════════════════════════════════════════════════════
    // COMMON — Shared strings used across multiple pages
    // ═══════════════════════════════════════════════════════════════════════
    common: {
        buyOnRamp: 'Купить крипту',
        connectWallet: 'Подключить кошелёк',
        connect: 'Подключить',
        loading: 'Загрузка...',
        error: 'Ошибка',
        success: 'Успешно!',
        cancel: 'Отмена',
        confirm: 'Подтвердить',
        back: 'Назад',
        close: 'Закрыть',
        save: 'Сохранить',
        delete: 'Удалить',
        edit: 'Редактировать',
        copy: 'Копировать',
        copied: 'Скопировано!',
        share: 'Поделиться',
        unknownError: 'Неизвестная ошибка',
        connectWalletFirst: 'Сначала подключите кошелёк',
        insufficientBalance: 'Недостаточный баланс',
        transactionFailed: 'Транзакция не удалась',
        processing: 'Обработка...',
        max: 'МАКС',
        viewOnExplorer: 'Смотреть в обозревателе',
        noData: 'Нет данных',
        retry: 'Попробовать снова',
        refresh: 'Обновить',
        send: 'Отправить',
        receive: 'Получить',
        approve: 'Одобрить',
        reject: 'Отклонить',
        yes: 'Да',
        no: 'Нет',
        all: 'Все',
        none: 'Нет',
        active: 'Активно',
        inactive: 'Неактивно',
        pending: 'Ожидание',
        approved: 'Одобрено',
        rejected: 'Отклонено',
        expired: 'Истекло',
        ready: 'Готово',
        balance: 'Баланс',
        available: 'Доступно',
        amount: 'Сумма',
        fee: 'Комиссия',
        total: 'Итого',
        reward: 'Награда',
        rewards: 'Награды',
        status: 'Статус',
        details: 'Подробности',
        history: 'История',
        search: 'Поиск',
        filter: 'Фильтр',
        sort: 'Сортировка',
        prev: 'Назад',
        next: 'Далее',
        justNow: 'Только что',
        recent: 'Недавние',
        today: 'Сегодня',
        day: 'день',
        days: 'дней',
        hours: 'часов',
        minutes: 'минут',
        seconds: 'секунд',
        agoSuffix: 'назад',
        mAgo: '{m} мин. назад',
        hAgo: '{h} ч. назад',
        dAgo: '{d} дн. назад',
        connectWalletToView: 'Подключите кошелёк для просмотра',
        withdraw: 'Вывести',
        deposit: 'Внести',
        failed: 'Не удалось',
        linkCopied: 'Ссылка скопирована!',
        copyFailed: 'Не удалось скопировать ссылку',
        connected: 'Подключено',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NAV — Navigation labels
    // ═══════════════════════════════════════════════════════════════════════
    nav: {
        main: 'Главная',
        dashboard: 'Панель',
        airdrop: 'Аирдроп',
        earn: 'Заработок',
        stakeEarn: 'Стейкинг',
        nftMarket: 'NFT Маркет',
        boostMarket: 'Маркет бустов',
        fortunePool: 'Пул удачи',
        tradeBkc: 'Торговля BKC',
        community: 'Сообщество',
        charityPool: 'Благотворительный пул',
        services: 'Сервисы',
        notary: 'Нотариат',
        grow: 'Рост',
        tutorSystem: 'Система тьюторов',
        becomeOperator: 'Стать оператором',
        adminPanel: 'Панель администратора',
        about: 'О проекте',
        inviteEarn: 'Пригласить и заработать',
        tutorials: 'Видеоуроки',
        home: 'Главная',
        social: 'Социальные сети',
        more: 'Ещё',
        tokenomics: 'Токеномика',
        tutor: 'Тьютор',
        operator: 'Оператор',
        trade: 'Торговля',
        fortune: 'Удача',
        charity: 'Благотворительность',
        boost: 'Буст',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SPLASH — Welcome screen
    // ═══════════════════════════════════════════════════════════════════════
    splash: {
        optimized: 'Оптимизировано для opBNB',
        mainnetLaunch: 'Запуск основной сети',
        days: 'дней',
        hours: 'часов',
        minutes: 'мин',
        seconds: 'сек',
        unstoppable: 'Неостановимый DeFi',
        enterApp: 'Войти в приложение',
        testnetBadge: 'ТЕСТНЕТ',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DASHBOARD — DashboardPage.js
    // ═══════════════════════════════════════════════════════════════════════
    dashboard: {
        // Hero
        youWillReceive: 'Вы получите',
        claimRewards: 'Получить награды',
        noRewardsYet: 'Пока нет наград',
        yourPStake: 'Ваш pStake',
        stakeMore: 'Застейкать ещё',
        earnMoreWithNft: 'Заработайте ещё +{amount} BKC с NFT!',

        // Faucet
        faucet: {
            title: 'Получить бесплатные тестовые токены',
            titleReceived: 'Тестовые токены получены',
            desc: 'Получите tBNB для газа — раз в день',
            descReceived: 'Уже получено {amount} tBNB сегодня — возвращайтесь через 24ч',
            descConnect: 'Подключите кошелёк для получения tBNB на газ',
            claimFreeTokens: 'Получить бесплатные токены',
            claimedToday: 'Получено сегодня',
            dailyClaimUsed: 'Дневной лимит использован',
            connectWallet: 'Подключить кошелёк',
            sending: 'Отправка...',
            successMsg: 'Кран: {amount} tBNB отправлено на ваш кошелёк!',
            cooldownMsg: 'Кран на перезарядке. Попробуйте через 24ч.',
            unavailable: 'Кран временно недоступен. Попробуйте позже.',
        },

        // Tutor/Referral Widget
        tutor: {
            becomeTutor: 'Станьте чьим-то тьютором',
            shareLink: 'Поделитесь ссылкой. Зарабатывайте 10% от всех комиссий + 5% BKC от ваших учеников — навсегда.',
            studentsEarning: '{count} ученик(ов) приносят вам доход',
            keepSharing: 'Вы получаете 10% BNB со всех комиссий + 5% BKC с наград стейкинга. Продолжайте делиться!',
            connectForLink: 'Подключите кошелёк, чтобы получить ссылку тьютора',
            tutorLinkCopied: 'Ссылка тьютора скопирована!',
            failedToCopy: 'Не удалось скопировать',
            shareTextCopied: 'Текст для публикации скопирован!',
            noTutorYet: 'Тьютора пока нет',
            setATutor: 'Назначить тьютора',
            change: 'Изменить',
            earnings: 'Доход тьютора: {amount} BNB доступно',
        },

        // Buyback Widget
        buyback: {
            ready: 'Выкуп готов',
            title: 'Выкуп готов — {amount} BNB',
            desc: 'Выполните выкуп, чтобы заработать 5% от накопленных BNB',
            descWithFee: 'Заплатите {fee} BNB комиссию, заработайте {reward} BNB (5%). Комиссия усиливает выкуп.',
            pending: 'ожидание',
            earnAmount: 'Заработать {amount} BNB',
            execute: 'Выполнить',
            executing: 'Выполнение...',
            successMsg: 'Выкуп выполнен! Вы заработали 5% награду в BNB',
            failedMsg: 'Выкуп не удался: {error}',
        },

        // Quick Actions
        actions: {
            agoraTitle: 'Agora',
            agoraDesc: 'Публикуйте и обсуждайте в блокчейне',
            stakeBkcTitle: 'Стейкинг BKC',
            stakeBkcDesc: 'Зарабатывайте пока спите',
            fortunePoolTitle: 'Пул удачи',
            fortunePoolDesc: 'Выигрывайте до 100x',
            notarizeTitle: 'Заверить',
            notarizeDesc: 'Сертифицируйте в блокчейне',
            charityPoolTitle: 'Благотворительный пул',
            charityPoolDesc: 'Жертвуйте и сжигайте токены',
            nftMarketTitle: 'NFT Маркет',
            nftMarketDesc: 'Удвойте свои награды',
            tradeBkcTitle: 'Торговля BKC',
            tradeBkcDesc: 'Обмен на Uniswap V3',
        },

        // Metrics
        metrics: {
            supply: 'Эмиссия',
            pstake: 'pStake',
            burned: 'Сожжено',
            fees: 'Комиссии',
            locked: 'Заблокировано',
            bkcPrice: 'Цена BKC',
            balance: 'Баланс',
        },

        // Activity Feed
        activity: {
            title: 'Активность',
            yourActivity: 'Ваша активность',
            networkActivity: 'Активность сети',
            loadingActivity: 'Загрузка активности...',
            loadingYourActivity: 'Загрузка вашей активности...',
            loadingNetworkActivity: 'Загрузка активности сети...',
            noNetworkActivity: 'Активности в сети пока нет',
            beFirst: 'Будьте первыми — стейкайте, обменивайте или играйте!',
            filterAll: 'Все',
            filterStaking: 'Стейкинг',
            filterClaims: 'Выплаты',
            filterNft: 'NFT',
            filterFortune: 'Удача',
            filterCharity: 'Благотворительность',
            filterNotary: 'Нотариат',
            filterAgora: 'Agora',
            filterFaucet: 'Кран',
            noMatch: 'Нет совпадающей активности',
            noActivity: 'Активности пока нет',
            tryFilter: 'Попробуйте другой фильтр',
            startMsg: 'Начните стейкинг, торговлю или игру!',
            you: 'Вы',
        },

        // Fortune quick-action
        fortune: {
            prize: 'Приз: {amount} BKC',
            playToWin: 'Играйте, чтобы выиграть',
            bet: 'Ставка',
        },

        // Notary quick-action
        notary: {
            docsCertified: '{count} документов заверено',
            certifyDocs: 'Заверить документы',
        },

        // Claim toast messages
        claim: {
            success: 'Награды получены!',
            failed: 'Получение не удалось',
        },

        // Booster/NFT Display
        booster: {
            noBoosterNft: 'Нет бустер-NFT',
            youKeep: 'вы оставляете',
            upgradeToMax: 'Обновите до Diamond для 100%',
            buyNft: 'Купить NFT',
            rentNft: 'Арендовать NFT',
            howItWorks: 'Как это работает',
            getUpToMore: 'Получите до +{amount} BKC с NFT',
            recycledToStakers: '50% возвращается стейкерам.',
            diamondKeep100: 'Diamond: сохраните 100%',
            owned: 'СВОЙ',
            rented: 'АРЕНДОВАН',
            inYourWallet: 'В вашем кошельке',
            activeRental: 'Активная аренда',
            netReward: 'Чистая награда',
            nftBonus: 'NFT Бонус',
        },

        // Modals
        modals: {
            boostEfficiency: 'Увеличить эффективность',
            nftHoldersEarnMore: 'Владельцы NFT зарабатывают до 2x больше',
            noGas: 'Нет газа',
            needGasTokens: 'Вам нужен tBNB для газа',
            getFreeGas: 'Получить бесплатный газ + BKC',
        },

        // Activity labels (used in ACTIVITY_ICONS)
        activityLabels: {
            staked: 'Застейкано',
            unstaked: 'Выведено из стейкинга',
            forceUnstaked: 'Принудительно выведено',
            rewardsClaimed: 'Награды получены',
            boughtNft: 'NFT куплен',
            soldNft: 'NFT продан',
            mintedBooster: 'Бустер создан',
            transfer: 'Перевод',
            listedNft: 'NFT выставлен',
            rentedNft: 'NFT арендован',
            withdrawn: 'Выведено',
            promotedNft: 'NFT продвинут',
            gameCommitted: 'Ставка сделана',
            gameRevealed: 'Результат раскрыт',
            fortuneBet: 'Ставка Удачи',
            comboMode: 'Режим Комбо',
            jackpotMode: 'Режим Джекпот',
            winner: 'Победа!',
            noLuck: 'Не повезло',
            notarized: 'Заверено',
            posted: 'Опубликовано',
            liked: 'Понравилось',
            replied: 'Ответил',
            superLiked: 'Суперлайк',
            reposted: 'Репост',
            followed: 'Подписка',
            profileCreated: 'Профиль создан',
            profileBoosted: 'Профиль продвинут',
            badgeActivated: 'Значок активирован',
            tippedBkc: 'Чаевые BKC',
            bnbWithdrawn: 'BNB выведены',
            donated: 'Пожертвовано',
            campaignCreated: 'Кампания создана',
            campaignCancelled: 'Кампания отменена',
            fundsWithdrawn: 'Средства выведены',
            goalReached: 'Цель достигнута!',
            faucetClaim: 'Получение из крана',
            feeCollected: 'Комиссия собрана',
            tutorSet: 'Тьютор назначен',
            tutorChanged: 'Тьютор изменён',
            tutorEarned: 'Тьютор заработал',
            rewardsRecycled: 'Награды переработаны',
            nftFused: 'NFT объединён',
            nftSplit: 'NFT разделён',
            voted: 'Проголосовано',
            proposalCreated: 'Предложение создано',
            buyback: 'Выкуп',
            swap: 'Обмен',
            liquidityAdded: 'Ликвидность добавлена',
            liquidityRemoved: 'Ликвидность удалена',
            earningsWithdrawn: 'Доход выведен',
            gameExpired: 'Игра истекла',
            campaignBoosted: 'Кампания продвинута',
            campaignClosed: 'Кампания закрыта',
            downvoted: 'Отрицательный голос',
            unfollowed: 'Отписка',
            batchActions: 'Пакетные действия',
            postEdited: 'Пост отредактирован',
            postReported: 'Пост обжалован',
            postBoosted: 'Пост продвинут',
            userBlocked: 'Пользователь заблокирован',
            userUnblocked: 'Пользователь разблокирован',
            profileUpdated: 'Профиль обновлён',
            bulkFused: 'Массовое объединение',
            rewardsCompounded: 'Награды капитализированы',
            buybackPaused: 'Выкуп приостановлен',
            buybackResumed: 'Выкуп возобновлён',
            activity: 'Активность',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STAKING — StakingPage.js
    // ═══════════════════════════════════════════════════════════════════════
    staking: {
        title: 'Стейкинг и заработок',
        subtitle: 'Делегируйте BKC, получайте награды. NFT + Тьютор = сохраняйте больше',
        youWillReceive: 'Вы получите',
        claimRewards: 'Получить награды',
        noRewardsYet: 'Пока нет наград',
        compound: 'Капитализировать',
        loadingBoost: 'Загрузка буста...',

        // Breakdown
        breakdown: {
            staking: 'Стейкинг',
            mining: 'Майнинг',
            recycled: 'Переработано',
            tutor: 'Тьютор',
            burned: 'Сожжено',
            none: 'Нет',
        },

        // Claim fee
        claimFee: 'Комиссия за получение: {fee} BNB',

        // Buyback
        buybackAvailable: 'Выкуп доступен',
        buybackReward: 'Награда 5%',
        pendingBnb: 'Ожидающие BNB',
        yourReward: 'Ваша награда (5%)',
        bkcToStakers: 'BKC стейкерам',
        miningRate: 'Скорость майнинга',
        executeBuyback: 'Выполнить выкуп',
        buybackInfo: 'Выполните выкуп, чтобы заработать 5% от ожидающих BNB. Остальное конвертируется в BKC-награды для стейкеров.',
        buybackFeeInfo: 'Комиссия: {fee} BNB (добавляется к выкупу). Заработайте 5% от общей суммы.',
        buybackLast: 'Последний: {time}',
        buybackTotal: 'Всего: {count} выкупов',

        // Stats
        networkPStake: 'pStake сети',
        yourPower: 'Ваша мощность',
        pendingRewards: 'Ожидание',
        activeLocks: 'Активные блокировки',

        // Stake Form
        delegateBkc: 'Делегировать BKC',
        enterAmount: 'Введите сумму',
        available: 'Доступно',
        pstakePower: 'Мощность pStake',
        netAmount: 'Чистая сумма',
        feePercent: 'Комиссия',
        durationMonths: '{n} месяц(ев)',
        durationDays: '{n} день(дней)',
        durationYears: '{n} год(лет)',

        // Delegations
        activeDelegations: 'Активные делегации',
        noActiveDelegations: 'Нет активных делегаций',
        connectWalletToView: 'Подключите кошелёк для просмотра',
        unstake: 'Вывести из стейкинга',
        forceUnstakeTitle: 'Принудительный вывод',
        forceUnstakeWarning: 'Принудительный вывод имеет штраф в зависимости от уровня NFT.',

        // History
        historyTitle: 'История',
        historyAll: 'Все',
        historyStakes: 'Стейки',
        historyUnstakes: 'Выводы',
        historyClaims: 'Выплаты',
        loadingHistory: 'Загрузка истории...',
        noHistoryYet: 'Истории пока нет',

        // History labels
        delegated: 'Делегировано',
        unstaked: 'Выведено из стейкинга',
        claimed: 'Получено',
        forceUnstaked: 'Принудительно выведено',

        // Boost panel
        boost: {
            keep: 'Сохранить {rate}%',
            recycle: 'Переработка {rate}%',
            nftTierBenefits: 'Преимущества уровней NFT',
            getAnNft: 'Получить NFT',
            upgradeToDiamond: 'Обновите до Diamond, чтобы сохранить 100%',
            upgrade: 'Обновить',
            noTutorWarning: 'Нет тьютора — +10% дополнительной переработки',
            setTutorHint: 'Назначьте тьютора, чтобы уменьшить переработку на 10%',
            setATutor: 'Назначить тьютора',
            tutorReduces: '-10% переработки',
        },

        // Toast messages
        toast: {
            delegationSuccess: 'Делегирование выполнено!',
            delegationFailed: 'Делегирование не удалось: {error}',
            unstakeSuccess: 'Вывод из стейкинга выполнен!',
            forceUnstakeSuccess: 'Принудительный вывод выполнен (штраф применён)',
            unstakeFailed: 'Вывод из стейкинга не удался: {error}',
            claimSuccess: 'Награды получены!',
            claimFailed: 'Получение не удалось: {error}',
            compoundSuccess: 'Награды капитализированы в новую делегацию!',
            compoundFailed: 'Капитализация не удалась: {error}',
            buybackSuccess: 'Выкуп выполнен! Вы заработали 5% награду в BNB',
            buybackFailed: 'Выкуп не удался: {error}',
            invalidAmount: 'Неверная сумма',
            insufficientBkc: 'Недостаточный баланс BKC',
            insufficientGas: 'Недостаточно BNB для газа',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STORE — StorePage.js (NFT Marketplace)
    // ═══════════════════════════════════════════════════════════════════════
    store: {
        title: 'NFT Маркет',
        subtitle: 'Покупайте, продавайте и объединяйте NFT-бустеры',

        // Tier Card
        buyPrice: 'Купить',
        sellPrice: 'Продать',
        netSell: 'Чистая продажа',
        poolSize: 'Пул',
        volume: 'Объём',
        buy: 'Купить',
        sell: 'Продать',
        keepRate: 'Сохранить {rate}%',

        // Impact Card
        rewardImpact: 'Влияние на награды',
        currentKeep: 'Текущее сохранение',
        withNft: 'С NFT',
        potentialGain: 'Потенциальная прибыль',
        annualExtra: 'Годовой бонус',
        stakeToSeeImpact: 'Застейкайте BKC, чтобы увидеть эффект',

        // Tutor banner
        tutorBanner: {
            hasTutor: 'Активный тьютор: {address} — вы сохраняете больше наград',
            noTutor: 'Нет тьютора — вы теряете 10% дополнительно на переработке.',
            setTutor: 'Назначить тьютора',
        },

        // Inventory
        inventory: 'Инвентарь',
        noNftsYet: 'NFT пока нет',
        buyFirstNft: 'Купите свой первый NFT, чтобы зарабатывать больше!',
        listForRent: 'Аренда',
        addToWallet: 'Добавить в кошелёк',

        // Fusion/Split
        fusion: {
            title: 'Объединение и разделение',
            fuseTab: 'Объединить',
            splitTab: 'Разделить',
            bulkTab: 'Массовое объединение',
            fuseHint: 'Выберите 2 NFT одного уровня для объединения в более высокий',
            splitHint: 'Выберите 1 NFT для разделения на 2 NFT более низкого уровня',
            bulkHint: 'Выберите несколько NFT для одновременного объединения до нужного уровня',
            selectNfts: 'Выберите NFT',
            noEligibleNfts: 'Нет подходящих NFT для этого действия',
            fuseButton: 'ОБЪЕДИНИТЬ',
            splitButton: 'РАЗДЕЛИТЬ',
            bulkFuseButton: 'МАССОВОЕ ОБЪЕДИНЕНИЕ',
            fuseFee: 'Комиссия: {fee} BNB',
            splitFee: 'Комиссия: {fee} BNB',
            result: 'Результат',
            splitInto: 'Разделить на',
            targetTier: 'Целевой уровень',
        },

        // Trade History
        tradeHistory: 'История торговли',
        noTradeHistory: 'Нет истории торговли',
        bought: 'Куплено',
        sold: 'Продано',
        fused: 'Объединено',
        split: 'Разделить',

        // Toast messages
        toast: {
            buySuccess: '{tier} NFT успешно куплен!',
            buyFailed: 'Покупка не удалась: {error}',
            sellSuccess: '{tier} NFT успешно продан!',
            sellFailed: 'Продажа не удалась: {error}',
            fuseSuccess: 'Объединение завершено! Создан новый {tier} NFT',
            fuseFailed: 'Объединение не удалось: {error}',
            splitSuccess: 'Разделение завершено! Создано 2 {tier} NFT',
            splitFailed: 'Разделение не удалось: {error}',
            bulkFuseSuccess: 'Массовое объединение завершено!',
            bulkFuseFailed: 'Массовое объединение не удалось: {error}',
            nftAddedToWallet: '{tier} NFT #{id} добавлен в кошелёк!',
            nftNotAdded: 'NFT не добавлен в кошелёк',
            failedToAddNft: 'Не удалось добавить NFT в кошелёк',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FORTUNE — FortunePool.js
    // ═══════════════════════════════════════════════════════════════════════
    fortune: {
        title: 'Пул удачи',
        subtitle: 'Испытайте удачу — выигрывайте до 100x',
        prizePool: 'Призовой пул',
        playToWin: 'Играйте, чтобы выиграть',
        prize: 'Приз: {amount} BKC',

        // Tiers
        tiers: {
            standard: 'Стандарт',
            combo: 'Комбо',
            jackpot: 'Джекпот',
        },

        // Game flow
        selectBet: 'Выбрать ставку',
        placeBet: 'Сделать ставку',
        confirmInMetamask: 'Подтвердите в MetaMask...',
        waitingReveal: 'Ожидание результата...',
        revealResult: 'Раскрыть результат!',
        revealing: 'Раскрытие...',
        confirmed: 'Подтверждено',
        retryingIn: 'Повтор через {seconds} сек...',

        // Results
        youWon: 'Вы выиграли!',
        youLost: 'Не повезло',
        wonAmount: 'Вы выиграли {amount} BKC!',

        // Odds
        odds: {
            win2x: '1 из 5 — Выигрыш 2x',
            win5x: '1 из 10 — Выигрыш 5x',
            win100x: '1 из 150 — Выигрыш 100x',
        },

        // Stats
        totalGames: 'Всего игр',
        totalWins: 'Побед',
        totalPrizesPaid: 'Призов выплачено',
        winsCount: '{wins}/{total} побед',
        yourHistory: 'Ваша история',

        // Share
        shareWin: 'Поделиться победой',
        shareText: 'Я только что выиграл {amount} BKC в Пуле удачи Backcoin!',

        // Toast
        toast: {
            betPlaced: 'Ставка сделана! Ожидание результата...',
            betFailed: 'Ставка не удалась: {error}',
            revealSuccess: 'Результат раскрыт!',
            revealFailed: 'Раскрытие не удалось: {error}',
            insufficientBkc: 'Недостаточный баланс BKC',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TRADE — TradePage.js
    // ═══════════════════════════════════════════════════════════════════════
    trade: {
        title: 'Торговля',
        swap: 'Обмен',
        connectWallet: 'Подключить кошелёк',
        enterAmount: 'Введите сумму',
        insufficientBnb: 'Недостаточно BNB',
        insufficientBkc: 'Недостаточно BKC',
        swapWithImpact: 'Обмен ({impact}% влияние)',

        // Direction
        youPay: 'Вы платите',
        youReceive: 'Вы получаете',
        balance: 'Баланс: {amount} {symbol}',

        // Info
        priceImpact: 'Влияние на цену',
        slippage: 'Допуск проскальзывания',
        minimumReceived: 'Минимум к получению',
        swapFee: 'Комиссия обмена',
        route: 'Маршрут',

        // Settings
        settings: 'Настройки',
        slippageTolerance: 'Допуск проскальзывания',
        custom: 'Свой',

        // Pool info
        poolInfo: 'Информация о пуле',
        ethReserve: 'Резерв BNB',
        bkcReserve: 'Резерв BKC',
        totalSwaps: 'Всего обменов',
        totalVolume: 'Общий объём',
        contractAddress: 'Адрес контракта',
        viewContract: 'Посмотреть контракт',
        backcoinPool: 'Пул Backchain',

        // Chart
        chart: {
            bkcPrice: 'Цена BKC',
            noDataYet: 'Данных о цене пока нет. График заполнится со временем.',
        },

        // Toast
        toast: {
            swapSuccess: 'Обмен завершён!',
            swapFailed: 'Обмен не удался: {error}',
            approving: 'Одобрение BKC...',
            approvalComplete: 'Одобрение завершено!',
            approvalFailed: 'Одобрение не удалось',
            swapping: 'Обмен...',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CHARITY — CharityPage.js
    // ═══════════════════════════════════════════════════════════════════════
    charity: {
        title: 'Благотворительный пул',
        subtitle: 'Поддержите проекты с помощью BNB',

        // Stats
        totalDonated: 'Всего пожертвовано',
        totalCampaigns: 'Всего кампаний',
        activeCampaigns: 'Активные кампании',
        totalDonors: 'Всего доноров',

        // Status
        statusActive: 'Активно',
        statusClosed: 'Закрыта',
        statusWithdrawn: 'Выведено',

        // Categories
        categories: {
            animal: 'Защита животных',
            humanitarian: 'Гуманитарная помощь',
            environment: 'Окружающая среда',
            medical: 'Здоровье и медицина',
            education: 'Образование и молодёжь',
            disaster: 'Помощь при бедствиях',
            community: 'Сообщество и социальные сети',
        },

        // Campaign Card
        raised: 'Собрано',
        goal: 'Цель',
        donors: 'доноров',
        daysLeft: 'осталось {days} дней',
        goalReached: 'Цель достигнута!',
        boosted: 'Продвинуто',
        boostDaysLeft: 'осталось {days} дн. продвижения',

        // Actions
        donate: 'Пожертвовать',
        createCampaign: 'Создать кампанию',
        shareCampaign: 'Поделиться кампанией',
        boostCampaign: 'Продвинуть кампанию',
        closeCampaign: 'Закрыть кампанию',
        withdrawFunds: 'Вывести средства',

        // Create Wizard
        create: {
            step1: 'Выберите категорию',
            step2: 'Детали кампании',
            step3: 'Проверить и создать',
            campaignTitle: 'Название кампании',
            description: 'Описание',
            goalAmount: 'Цель (BNB)',
            duration: 'Продолжительность (дней)',
            addMedia: 'Добавить медиа',
            review: 'Проверить',
            create: 'Создать кампанию',
        },

        // Donate Modal
        donateModal: {
            title: 'Пожертвовать на кампанию',
            amount: 'Сумма (BNB)',
            presets: 'Быстрые суммы',
            donateNow: 'Пожертвовать сейчас',
        },

        // Boost Modal
        boostModal: {
            title: 'Продвинуть кампанию',
            boostDays: 'Дни продвижения',
            costPerDay: '{cost} BNB/день',
            totalCost: 'Общая стоимость',
            boostNow: 'Продвинуть сейчас',
        },

        // Toast
        toast: {
            donationSuccess: 'Пожертвование успешно!',
            donationFailed: 'Пожертвование не удалось: {error}',
            createSuccess: 'Кампания успешно создана!',
            createFailed: 'Создание кампании не удалось: {error}',
            boostSuccess: 'Кампания успешно продвинута!',
            boostFailed: 'Продвижение не удалось: {error}',
            closeSuccess: 'Кампания закрыта',
            closeFailed: 'Не удалось закрыть кампанию: {error}',
            withdrawSuccess: 'Средства успешно выведены!',
            withdrawFailed: 'Вывод не удался: {error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // AIRDROP — AirdropPage.js
    // ═══════════════════════════════════════════════════════════════════════
    airdrop: {
        title: 'Аирдроп',
        subtitle: 'Зарабатывайте очки, поднимайтесь в рейтинге, получайте награды',

        // Tabs
        tabs: {
            earn: 'Заработок',
            ranking: 'Рейтинг',
            history: 'История',
            nftRewards: 'Награды NFT',
        },

        // Earn Tab
        totalPoints: 'Всего очков',
        currentRank: 'Текущий ранг',
        multiplier: 'Множитель',
        postsApproved: 'Посты одобрены',

        // Sharing
        shareOnX: 'Поделиться в X',
        shareOnInstagram: 'Поделиться в Instagram',
        shareOnOther: 'Поделиться в другом',
        shared: 'Опубликовано',
        shareToEarn: 'Поделитесь, чтобы заработать очки',
        postFirst: 'Сначала опубликуйте в Agora',

        // Platform usage
        platformUsage: 'Использование платформы',
        claimFaucet: 'Использовать кран',
        delegateBkc: 'Делегировать BKC',
        playFortune: 'Играть в Удачу',
        buyNft: 'Купить NFT',
        sellNft: 'Продать NFT',
        listForRent: 'Выставить на аренду',
        rentNft: 'Арендовать NFT',
        notarizeDoc: 'Заверить документ',
        claimRewards: 'Получить награды',

        // Inline composer
        writePost: 'Напишите что-нибудь...',
        createPost: 'Создать пост',
        postCreated: 'Пост создан! Теперь поделитесь в X, Instagram и других сетях.',

        // Ranking
        ranking: {
            byPosts: 'По постам',
            byPoints: 'По очкам',
            rank: 'Ранг',
            user: 'Пользователь',
            posts: 'Посты',
            points: 'Очки',
        },

        // NFT rewards section
        nftRewards: {
            title: 'Призы NFT',
            description: 'Лучшие пользователи выигрывают NFT-бустеры!',
            totalNfts: '{count} NFT всего',
        },

        // Audit
        audit: {
            underReview: 'Ваш пост проходит проверку безопасности...',
            verifying: 'Проверка подлинности поста...',
            checking: 'Проверка соответствия правилам...',
            reviewInProgress: 'Проверка безопасности в процессе...',
            analyzing: 'Команда аудита анализирует вашу заявку...',
        },

        // Toast
        toast: {
            postTooLong: 'Пост слишком длинный (максимум 2 000 символов).',
            writeFirst: 'Напишите что-нибудь для публикации.',
            uploadFailed: 'Загрузка не удалась: {error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // REFERRAL — ReferralPage.js
    // ═══════════════════════════════════════════════════════════════════════
    referral: {
        title: 'Система тьюторов',
        heroTitle: 'Пригласите друзей,',
        heroHighlight: 'зарабатывайте вечно',
        heroDesc: 'У каждого пользователя есть тьютор. Когда ваш друг использует протокол, вы автоматически получаете часть комиссий — навсегда, гарантировано смарт-контрактами.',

        // Share Card
        yourTutorLink: 'Ваша ссылка тьютора',
        connectForLink: 'Подключите кошелёк, чтобы получить ссылку тьютора',

        // Stats
        tutters: 'Ученики',
        yourTutor: 'Ваш тьютор',
        noneYet: 'Пока нет',

        // Earnings
        yourEarnings: 'Ваш доход',
        accumulated: 'Накоплено от активности учеников',
        shareToStart: 'Поделитесь ссылкой тьютора, чтобы начать зарабатывать. Вы будете получать часть всех комиссий ваших учеников.',
        noFeesYet: 'Ваши ученики ещё не сгенерировали комиссий. Доход появится здесь автоматически, когда они начнут использовать протокол.',

        // How it works
        howItWorks: {
            title: 'Как это работает',
            step1Title: 'Поделитесь ссылкой',
            step1Desc: 'Отправьте ссылку тьютора друзьям. Когда они подключатся и выполнят первое действие, вы станете их тьютором — навсегда.',
            step2Title: 'Они используют протокол',
            step2Desc: 'Каждый раз, когда они стейкают, играют в Удачу, покупают NFT или выполняют любое действие — часть комиссии идёт прямо вам.',
            step3Title: 'Вы зарабатываете автоматически',
            step3Desc: '10% от всех комиссий BNB + 5% от наград стейкинга BKC. Полностью автоматически, в блокчейне, навсегда.',
        },

        // Change tutor
        changeTutor: {
            title: 'Изменить тьютора',
            desc: 'Введите адрес нового тьютора',
            placeholder: '0x...',
            confirm: 'Изменить тьютора',
            warning: 'Это заменит вашего текущего тьютора. Новый тьютор будет зарабатывать от вашей будущей активности.',
        },

        // Toast
        toast: {
            linkCopied: 'Ссылка тьютора скопирована!',
            withdrawSuccess: 'Доход успешно выведен!',
            withdrawFailed: 'Вывод не удался: {error}',
            changeTutorSuccess: 'Тьютор успешно изменён!',
            changeTutorFailed: 'Изменение тьютора не удалось: {error}',
            invalidAddress: 'Недопустимый адрес',
            cannotBeSelf: 'Вы не можете быть собственным тьютором',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // RENTAL — RentalPage.js (Boost Market)
    // ═══════════════════════════════════════════════════════════════════════
    rental: {
        title: 'Маркет бустов',
        subtitle: 'Арендуйте NFT-бустеры, чтобы увеличить свои награды',

        // Tabs
        marketplace: 'Маркетплейс',
        myRentals: 'Мои аренды',
        myListings: 'Мои объявления',

        // Filters
        allTiers: 'Все уровни',
        sortByBoosted: 'Продвинуто',
        sortByPrice: 'Самая низкая цена',
        sortByExpiry: 'Скоро истекает',

        // Listing Card
        perDay: '/день',
        listed: 'Выставлен',
        rented: 'Арендован',
        available: 'Доступно',
        timeLeft: 'осталось {time}',
        expired: 'Истекло',
        booster: 'Бустер',
        yours: 'ВАШ',

        // Keep Rate Descriptions
        keepAllRewards: 'Сохраняйте 100% наград стейкинга!',
        saveBurns: 'Сэкономьте {rate}% на сжигании при получении',
        keepRewards100: 'Сохраняйте 100% наград!',
        keepRewardsRate: 'Сохраняйте {rate}% наград при получении',
        keepRewardsOf: 'Сохраняйте {rate}% наград',

        // Connected status
        connected: 'Подключено',

        // Rent Modal
        rentNft: 'Арендовать NFT',
        rentBooster: 'Арендовать бустер',
        rentalDays: 'Дни аренды',
        rentalCost: 'Стоимость аренды',
        ecosystemFee: 'Комиссия экосистемы',
        ecosystemFeePercent: 'Комиссия экосистемы (20%)',
        totalCost: 'Общая стоимость',
        rentNow: 'Арендовать сейчас',
        rent1Day: 'Аренда на 1 день',
        oneDayDuration: '1 день (24 часа)',
        duration: 'Продолжительность',
        needBnb: 'Нужно {amount} BNB',
        balanceWarning: 'Ваш баланс: {balance} BNB — нужно ещё {deficit} BNB',

        // List Modal
        listForRent: 'Выставить на аренду',
        listNftForRent: 'Выставить NFT на аренду',
        selectNft: 'Выбрать NFT',
        selectNftPlaceholder: '-- Выберите NFT --',
        pricePerDay: 'Цена за день (BNB)',
        listNow: 'Разместить сейчас',
        listNft: 'Разместить NFT',
        listBtn: 'Разместить',
        fixedDayNote: 'Фиксированная аренда на 1 день. NFT автоматически переразмещается после каждой аренды.',
        enterPrice: 'Введите корректную цену',

        // Earnings
        totalLifetimeEarnings: 'Общий доход за всё время',
        pendingBnb: 'Ожидающие BNB',
        pendingEarnings: 'Ожидающий доход',
        withdrawEarnings: 'Вывести доход',
        noEarnings: 'Нет ожидающего дохода',

        // My Listings / My Rentals empty states
        viewListings: 'Просмотреть ваши объявления',
        viewRentals: 'Просмотреть ваши активные аренды',
        noListingsTitle: 'Объявлений пока нет',
        noListingsMsg: 'Разместите свой первый NFT, чтобы начать зарабатывать BNB!',
        noRentalsTitle: 'Нет активных аренд',
        noRentalsMsg: 'Арендуйте NFT-бустер, чтобы сохранять больше наград стейкинга!',

        // Boost Tiers
        boostTiers: 'Уровни бустов',
        boostTiersDesc: 'Diamond = 100% | Gold = 90% | Silver = 80% | Bronze = 70% — Без NFT: 50% переработка.',

        // Boost Modal
        boostListing: 'Продвинуть объявление',
        boostDuration: 'Длительность продвижения (дней)',
        boostExplanation: 'Продвинутые объявления отображаются первыми. Выберите количество дней.',
        boostExtendNote: 'Новые дни добавятся к текущему сроку.',
        boostedDaysRemaining: 'Продвинуто — осталось {days} дней',
        notBoosted: 'Не продвинуто',
        costPerDay: 'Стоимость за день',
        calculating: 'Подсчёт...',

        // Boost buttons
        boost: {
            extend: 'Продлить',
            boost: 'Буст',
            now: 'Продвинуть сейчас',
            extendBoost: 'Продлить продвижение',
        },

        // Withdraw NFT
        confirmWithdrawNft: 'Вывести этот NFT с маркетплейса?',

        // Share
        shareText: 'Арендуйте NFT-бустеры на Backchain Boost Market!\n\nСохраняйте до 100% наград стейкинга, арендуя NFT-бустер.\n\n{url}\n\n#Backchain #DeFi #BNBChain #opBNB #Web3',

        // How It Works
        howItWorks: {
            title: 'Как работает маркет бустов',
            step1: 'Владельцы NFT выставляют свои бустеры на аренду',
            step2: 'Арендаторы платят BNB за временное использование буста',
            step3: 'Буст применяется автоматически к наградам стейкинга',
            step4: 'По истечении срока NFT возвращается владельцу',
        },

        // Toast
        toast: {
            rentSuccess: 'NFT успешно арендован!',
            rentFailed: 'Аренда не удалась: {error}',
            listSuccess: 'NFT выставлен на аренду!',
            listFailed: 'Размещение не удалось: {error}',
            withdrawSuccess: 'Доход выведен!',
            withdrawFailed: 'Вывод дохода не удался: {error}',
            withdrawNftSuccess: 'NFT успешно выведен!',
            delistSuccess: 'NFT снят с размещения',
            delistFailed: 'Снятие не удалось: {error}',
            promoteSuccess: 'Объявление продвинуто!',
            promoteFailed: 'Продвижение не удалось: {error}',
            boostSuccess: 'Объявление продвинуто на {days} дней!',
            boostFailed: 'Продвижение не удалось: {error}',
            linkCopied: 'Ссылка скопирована!',
            copyFailed: 'Не удалось скопировать ссылку',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // OPERATOR — OperatorPage.js
    // ═══════════════════════════════════════════════════════════════════════
    operator: {
        title: 'Стать оператором',
        badge: 'Стройте на Backchain',
        heroTitle: 'Стройте на Backchain, зарабатывайте постоянные комиссии',
        heroDesc: 'Любой может создать фронтенд для Backchain (сайт, приложение, бот) и получать автоматические комиссии с каждой транзакции ваших пользователей. Без одобрения. Без разрешения.',

        // How it works
        howItWorks: {
            title: 'Как это работает',
            step1Title: 'Создайте свой фронтенд',
            step1Desc: 'Создайте сайт, приложение или бота, взаимодействующего с контрактами Backchain.',
            step2Title: 'Зарегистрируйте свой адрес',
            step2Desc: 'Установите ваш адрес как оператора в вашем фронтенде.',
            step3Title: 'Зарабатывайте автоматически',
            step3Desc: 'Каждая транзакция ваших пользователей генерирует комиссию для вас — навсегда.',
        },

        // Modules
        modulesTitle: 'Модули экосистемы',
        moduleName: 'Модуль',
        operatorFee: 'Комиссия оператора',
        status: 'Статус',
        enabled: 'Активно',
        disabled: 'Отключено',

        // Earnings
        yourEarnings: 'Ваш доход',
        pendingBnb: 'Ожидающие BNB',
        withdraw: 'Вывести',
        noEarnings: 'Подключите кошелёк для просмотра дохода',

        // Code Example
        codeExample: 'Пример кода',
        codeDesc: 'Зарегистрируйте свой адрес как оператор:',

        // Toast
        toast: {
            withdrawSuccess: 'Доход успешно выведен!',
            withdrawFailed: 'Вывод не удался: {error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TOKENOMICS — TokenomicsPage.js
    // ═══════════════════════════════════════════════════════════════════════
    tokenomics: {
        title: 'Токеномика',
        subtitle: 'Модульная экосистема смарт-контрактов. Реальная доходность от комиссий протокола. Дефляционная по дизайну. Без админ-ключей. Неостановимая.',

        // Supply
        tokenSupply: 'Эмиссия токенов',
        erc20OnOpbnb: 'BKC — ERC-20 на opBNB',
        maxSupply: 'Максимальная эмиссия',
        circulating: 'В обращении',
        unminted: 'Не выпущено',
        mintedSoFar: '{pct}% выпущено',

        // TGE
        tgeAllocation: 'Распределение TGE',
        tokensAtLaunch: 'Токены при запуске',
        liquidityPool: 'Пул ликвидности',
        airdropReserve: 'Резерв аирдропа',
        phase: 'Фаза',

        // Fee Flow
        feeFlow: 'Движение комиссий',
        feeFlowDesc: 'Каждая транзакция генерирует комиссии BNB, проходящие через экосистему.',
        operatorCut: 'Доля оператора',
        tutorCut: 'Доля тьютора',
        protocol: 'Протокол',

        // BKC Distribution
        bkcDistribution: 'Распределение BKC',
        stakers: 'Стейкеры',
        burn: 'Сжигание',
        treasury: 'Казначейство',

        // Modules
        ecosystemModules: 'Модули экосистемы',

        // Deflationary
        deflationaryDesign: 'Дефляционный дизайн',
        burnMechanisms: 'Механизмы сжигания',

        // CTAs
        startStaking: 'Начать стейкинг',
        becomeOperator: 'Стать оператором',
        inviteFriends: 'Пригласить друзей',
        footer: 'Готовы присоединиться?',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ABOUT — AboutPage.js
    // ═══════════════════════════════════════════════════════════════════════
    about: {
        heroTitle: 'Что такое Backchain?',
        heroSubtitle: 'Модульная DeFi экосистема на opBNB. Без админ-ключей. Неостановимая.',

        // Hero badges
        badgeCommunity: 'Принадлежит сообществу',
        badgeSustaining: 'Самоподдерживающийся',
        badgeUnstoppable: 'Неостановимый',
        badgeOpenSource: 'Открытый исходный код',

        // Philosophy
        philosophy: 'Философия',
        philosophySub: 'Почему существует Backchain',
        philosophyText: 'Большинство DeFi-протоколов контролируются командами, которые могут приостановить контракты, заблокировать кошельки или изменить правила. Backchain построен с другой философией: <strong class="text-white">после развертывания код работает вечно</strong> — ни один администратор не может его остановить, ни одна компания не может его закрыть, и ни одно правительство не может его цензурировать.',
        noBlacklists: 'Без чёрных списков',
        noBlacklistsDesc: 'Каждый кошелёк имеет равный доступ. Никакие адреса не могут быть заблокированы или ограничены.',
        immutableCore: 'Неизменяемое ядро',
        immutableCoreDesc: 'Основные контракты неизменяемы. Модули можно добавлять или удалять без изменения существующего кода.',

        // Architecture
        architecture: {
            title: 'Архитектура экосистемы',
            subtitle: 'Модульные контракты, подключённые к центральному узлу',
            hub: 'Экосистема',
            hubDesc: 'Центральный узел',
        },
        hubSpokeText: 'Backchain использует <strong class="text-white">модульную архитектуру</strong>. <span class="text-amber-400 font-medium">Узел</span> (BackchainEcosystem) — неизменяемое ядро, управляющее всеми комиссиями, распределением наград, комиссиями операторов и реферальной системой тьюторов. <span class="text-emerald-400 font-medium">Спицы</span> — независимые сервисы, подключаемые к Узлу. Новые спицы можно добавлять в любое время без изменения существующих контрактов.',
        hubTitle: 'Узел (BackchainEcosystem)',
        hubFeature1: 'Сбор комиссий и распределение по модулям',
        hubFeature2: 'Комиссии операторов (10-20% строителям)',
        hubFeature3: 'Реферальная система тьюторов (10% BNB + 5% BKC)',
        hubFeature4: 'Механизм выкупа и сжигания (дефляционный)',
        spokesTitle: 'Спицы (модули сервисов)',
        spokeFeature1: 'Каждая спица генерирует комиссии для экосистемы',
        spokeFeature2: 'Независимое развертывание и обновляемость',
        spokeFeature3: 'Больше спиц = больше дохода = выше награды',

        // Module categories
        defiCore: 'Ядро DeFi',
        nftEcosystem: 'NFT Экосистема',
        communityServices: 'Сообщество и сервисы',
        infraGovernance: 'Инфраструктура и управление',

        // Modules
        modules: {
            staking: 'Пул стейкинга',
            stakingDesc: 'Делегируйте BKC с блокировкой по времени. Зарабатывайте BNB + BKC награды.',
            nftMarket: 'NFT Пул',
            nftMarketDesc: 'Маркетплейс с кривой привязки. Покупайте дёшево, продавайте дорого.',
            fortune: 'Пул удачи',
            fortuneDesc: 'Игра в блокчейне с шансами 2x, 5x и 100x',
            agora: 'Agora',
            agoraDesc: 'Децентрализованный социальный протокол. Посты, лайки, подписки в блокчейне.',
            notary: 'Нотариат',
            notaryDesc: 'Сертификация документов в блокчейне. Неизменяемое доказательство существования.',
            charity: 'Благотворительный пул',
            charityDesc: 'Прозрачный сбор средств. Отслеживание пожертвований в блокчейне.',
            rental: 'Менеджер аренды',
            rentalDesc: 'Арендуйте NFT-бусты у других пользователей. Маркетплейс AirBNFT.',
            liquidity: 'Пул ликвидности',
            liquidityDesc: 'AMM с постоянным произведением для торговли BNB/BKC.',
        },

        // Extended module descriptions (mod.*)
        mod: {
            bkcToken: 'Токен BKC',
            bkcTokenDesc: 'ERC-20 с чеканкой на основе активности. Лимит 200M.',
            buybackMiner: 'Майнер выкупа',
            buybackMinerDesc: 'Конвертирует комиссии BNB в BKC через майнинг по кривой дефицита.',
            rewardBooster: 'NFT RewardBooster',
            rewardBoosterDesc: 'NFT 4 уровней (Diamond/Gold/Silver/Bronze), снижающие сжигание при стейкинге.',
            nftFusion: 'NFT Объединение',
            nftFusionDesc: 'Объединяйте 2 NFT одного уровня в 1 более высокого, или разделяйте.',
            ecosystem: 'BackchainEcosystem',
            ecosystemDesc: 'Главный узел — комиссии, операторы, тьюторы, распределение наград.',
            governance: 'Управление',
            governanceDesc: 'Прогрессивная децентрализация: Админ → Мультиподпись → Таймлок → DAO.',
            faucet: 'Тестовый кран',
            faucetDesc: 'Бесплатные BKC для тестирования в тестнете opBNB.',
            ibackchain: 'IBackchain',
            ibackchainDesc: 'Общие интерфейсы для всех взаимодействий с контрактами.',
        },

        // Fee System
        feeSystemText: 'Каждое действие протокола генерирует небольшую комиссию BNB. Смарт-контракт автоматически распределяет эту комиссию между несколькими получателями — создавая согласованные стимулы для пользователей, строителей, рефереров и протокола.',
        whereFeesGo: 'Куда идут ваши комиссии',
        userPaysFee: 'Пользователь платит комиссию (BNB)',
        ecosystemSplits: 'BackchainEcosystem распределяет автоматически',
        feeTutor: 'Тьютор',
        feeTutorDesc: 'Кто вас привёл',
        feeOperator: 'Оператор',
        feeOperatorDesc: 'Создатель приложения',
        feeBuyback: 'Выкуп',
        feeBuybackDesc: 'Выкуп + сжигание BKC',
        feeTreasury: 'Казначейство',
        feeTreasuryDesc: 'Рост протокола',
        feeDisclaimer: 'Точное распределение зависит от модуля. Все проценты неизменяемы в блокчейне.',
        everyoneWins: 'Выигрывают все',
        everyoneWinsDesc: 'Нет тьютора? → 10% сжигается. Нет оператора? → Доля оператора сжигается. В любом сценарии участник получает награду или BKC становится дефицитнее. В системе нет утечек.',

        // Mining
        miningTitle: 'Майнинг покупкой',
        miningSub: 'Proof-of-Purchase: Использование = Майнинг',
        miningText: 'В Backchain <strong class="text-white">использование платформы — это и есть майнинг</strong>. Когда вы покупаете NFT-бустер, BuybackMiner конвертирует потраченные BNB в новые токены BKC по кривой дефицита — чем больше добыто, тем сложнее, как в Bitcoin.',
        howMiningWorks: 'Как работает майнинг',
        miningStep1: 'Вы покупаете NFT-бустер',
        miningStep1Desc: 'Из пула с кривой привязки (Diamond, Gold, Silver, Bronze)',
        miningStep2: 'BuybackMiner конвертирует BNB → BKC',
        miningStep2Desc: 'Кривая дефицита: ранние майнеры получают больше BKC за BNB',
        miningStep3: 'Награды распределены',
        miningStep3Desc: '70% стейкерам (пропорционально pStake), 30% в казначейство',
        stakerRewards: 'Награды стейкеров',
        stakerRewardsDesc: 'Распределяются по весу pStake',
        treasuryDesc: 'Финансирует развитие экосистемы',

        // Growth Programs
        growthTitle: 'Программы роста',
        growthSub: 'Две системы для роста экосистемы',
        tutorSystem: 'Система тьюторов',
        tutorSystemSub: 'Обучайте новых пользователей, зарабатывайте вечно',
        tutorDesc: 'Поделитесь ссылкой тьютора. Когда кто-то присоединяется через неё, он становится вашим учеником, и вы получаете <strong class="text-white">10% от его комиссий BNB</strong> + <strong class="text-white">5% от его выплат BKC</strong> — навсегда.',
        operatorSystem: 'Система операторов',
        operatorSystemSub: 'Создайте приложение, зарабатывайте комиссии',
        operatorDesc: 'Создайте свой фронтенд, бот или интеграцию. Установите ваш кошелёк как <strong class="text-white">оператора</strong> и получайте <strong class="text-white">10-20% от каждой комиссии</strong>, сгенерированной через ваше приложение. Регистрация не нужна.',
        learnMore: 'Узнать больше',

        // Why Backchain features
        noVCs: 'Без венчурного капитала, без премайна, без инсайдеров',
        noVCsDesc: '35% TGE (14M BKC) идёт напрямую сообществу через аирдроп. 65% идёт в пул ликвидности. Никакие инвесторы не сбрасывают токены. Команда зарабатывает так же, как и вы — используя протокол.',
        realUtilityDesc: 'Заверяйте юридические документы. Играйте в проверяемо честные игры. Торгуйте NFT на кривых привязки. Арендуйте силу буста. Публикуйте в цензуроустойчивой соцсети. Жертвуйте прозрачным благотворительным организациям. Это не обещания — это работающие контракты на opBNB.',
        sustainableYield: 'Устойчивая доходность, а не инфляция',
        sustainableYieldDesc: 'Награды стейкинга поступают от реальных комиссий протокола (BNB) и майнинг-активности — не от печатания токенов. Чем больше используется экосистема, тем выше реальная доходность. Никакой понциномики.',
        alignedIncentives: 'Согласованные стимулы на каждом уровне',
        alignedIncentivesDesc: 'Пользователи зарабатывают стейкингом. Тьюторы зарабатывают приглашениями. Операторы зарабатывают строительством. Протокол зарабатывает ростом. Никто не извлекает ценность за счёт другого — все выигрывают от роста использования.',

        // Tech Stack
        techStack: 'Технологический стек',
        techStackSub: 'Построен на проверенной инфраструктуре',

        // CTA
        ctaDesc: 'Начните зарабатывать очки аирдропа сегодня. Стейкайте, торгуйте, играйте или стройте — каждое действие имеет значение.',
        whitepaper: 'Белая книга',

        // Whitepaper Modal
        tokenomicsPaper: 'Документ по токеномике V3',
        tokenomicsPaperDesc: 'Распределение, майнинг и механизмы дефицита',
        technicalPaper: 'Техническая белая книга V2',
        technicalPaperDesc: 'Архитектура, контракты и система комиссий',

        // Footer
        footer: 'Создано сообществом для сообщества.',

        // Key Features
        keyFeatures: {
            title: 'Ключевые особенности',
            noAdmin: 'Без админ-ключей',
            noAdminDesc: 'Неизменяемые контракты. Никто не может приостановить, изменить или вывести средства.',
            realYield: 'Реальная доходность',
            realYieldDesc: 'Награды от реальных комиссий протокола, а не инфляционной эмиссии.',
            modular: 'Модульный',
            modularDesc: 'Модули можно добавлять/удалять без влияния на экосистему.',
            deflationary: 'Дефляционный',
            deflationaryDesc: '5% всех комиссий BKC навсегда сжигаются.',
        },

        // Links
        links: {
            title: 'Ссылки проекта',
            website: 'Сайт',
            docs: 'Документация',
            github: 'GitHub',
            telegram: 'Telegram',
            twitter: 'X (Twitter)',
        },

        // Contract addresses
        contracts: {
            title: 'Адреса контрактов',
            viewOnExplorer: 'Смотреть в обозревателе',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TUTORIALS — TutorialsPage.js
    // ═══════════════════════════════════════════════════════════════════════
    tutorials: {
        title: 'Видеоуроки',
        subtitle: 'Узнайте всё об экосистеме Backchain',
        watchOnYoutube: 'Смотреть на YouTube',
        subscribe: 'Подписаться на YouTube',
        subscribeDesc: 'Будьте в курсе новых уроков и обновлений',
        subscribeBtn: 'Подписаться',
        comingSoon: 'Скоро',

        // Hero
        heroTitle: 'Освойте экосистему Backcoin',
        heroSubtitle: 'Полные видеоуроки, охватывающие каждую функцию — от вашего первого BKC до создания собственного бизнеса оператора',
        videoCount: 'Видео',
        languages: '2 языка',
        categoriesLabel: 'Категории',
        everyFeature: 'Каждая функция экосистемы',

        // Filters
        filterAll: 'Все',

        // Categories
        categories: {
            overview: 'Что такое Backcoin',
            gettingStarted: 'Начало работы',
            stakingMining: 'Стейкинг и майнинг',
            nftBoosters: 'NFT-бустеры',
            fortunePool: 'Пул удачи',
            community: 'Сообщество и социальные сети',
            services: 'Сервисы',
            advanced: 'Продвинутый',
        },

        // Tags
        tags: {
            beginner: 'Начинающий',
            intermediate: 'Средний',
            advanced: 'Продвинутый',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN — AdminPage.js
    // ═══════════════════════════════════════════════════════════════════════
    admin: {
        title: 'Панель администратора',
        accessDenied: 'Доступ запрещён',
        restrictedMsg: 'Эта страница доступна только администраторам.',
        enterPassword: 'Введите админ-ключ для продолжения',
        login: 'Войти',
        quickActions: 'Быстрые действия',

        // Tabs
        tabs: {
            overview: 'Обзор',
            submissions: 'Заявки',
            users: 'Пользователи',
            tasks: 'Задачи',
            settings: 'Настройки',
        },

        // Overview
        overview: {
            totalUsers: 'Всего пользователей',
            totalSubmissions: 'Всего заявок',
            pendingReview: 'Ожидает проверки',
            totalPoints: 'Всего очков',
        },

        // Status labels
        status: {
            pending: 'Ожидает проверки',
            auditing: 'Аудит',
            approved: 'Одобрено',
            rejected: 'Отклонено',
            flagged: 'Отмечено',
        },

        // Actions
        approveAll: 'Одобрить все',
        rejectAll: 'Отклонить все',
        exportCsv: 'Экспорт CSV',
        reloadData: 'Перезагрузить данные',
        ban: 'Заблокировать',
        unban: 'Разблокировать',

        // Faucet
        faucet: {
            status: 'Статус крана',
            paused: 'ПРИОСТАНОВЛЕН',
            active: 'АКТИВЕН',
            pause: 'Приостановить',
            unpause: 'Возобновить',
        },

        // Toast
        toast: {
            loadFailed: 'Не удалось загрузить данные администратора.',
            txSent: 'Транзакция отправлена...',
            faucetPaused: 'Кран успешно ПРИОСТАНОВЛЕН!',
            faucetUnpaused: 'Кран успешно ВОЗОБНОВЛЁН!',
            reloading: 'Перезагрузка данных...',
            noUsersExport: 'Нет пользователей для экспорта.',
            exportedUsers: 'Экспортировано {count} пользователей.',
            noSubmissionsExport: 'Нет заявок для экспорта.',
            exportedSubmissions: 'Экспортировано {count} заявок.',
            submissionApproved: 'Заявка ОДОБРЕНА!',
            submissionRejected: 'Заявка ОТКЛОНЕНА!',
            userBanned: 'Пользователь ЗАБЛОКИРОВАН.',
            userUnbanned: 'Пользователь РАЗБЛОКИРОВАН.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOCIAL — SocialMedia.js
    // ═══════════════════════════════════════════════════════════════════════
    social: {
        title: 'Присоединяйтесь к сообществу Backcoin',
        subtitle: 'Свяжитесь с тысячами держателей, будьте в курсе запуска Mainnet и участвуйте в эксклюзивных аирдропах.',

        // Telegram
        telegramTitle: 'Официальная группа Telegram',
        telegramDesc: '\u0427\u0430\u0442 \u0441 \u043a\u043e\u043c\u0430\u043d\u0434\u043e\u0439 \u0438 \u0441\u043e\u043e\u0431\u0449\u0435\u0441\u0442\u0432\u043e\u043c \u2022 \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 24/7',
        joinNow: 'ПРИСОЕДИНИТЬСЯ',

        // Social Cards
        twitter: 'X (Twitter)',
        twitterDesc: 'Последние новости и объявления',
        youtube: 'YouTube',
        youtubeDesc: 'Видеоуроки и AMA',
        instagram: 'Instagram',
        instagramDesc: 'Визуальные обновления и истории',
        tiktok: 'TikTok',
        tiktokDesc: 'Короткие ролики и вирусный контент',
        facebook: 'Facebook',
        facebookDesc: 'Обсуждения сообщества',

        // Warning
        verifyLinks: 'Всегда проверяйте ссылки. Официальные администраторы никогда не пишут в личные сообщения с просьбой о средствах.',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FEEDBACK — ui-feedback.js
    // ═══════════════════════════════════════════════════════════════════════
    feedback: {
        // RPC Errors
        metamaskPending: 'В MetaMask есть ожидающий запрос. Откройте расширение MetaMask и завершите или отклоните любое ожидающее действие.',
        txCancelled: 'Транзакция отменена пользователем.',
        insufficientFunds: 'Недостаточный баланс в вашем кошельке.',
        metamaskNotDetected: 'MetaMask не обнаружен',

        // NFT Wallet
        nftAddedToWallet: '{tier} NFT #{id} добавлен в кошелёк!',
        nftNotAdded: 'NFT не добавлен в кошелёк',
        failedToAddNft: 'Не удалось добавить NFT в кошелёк',

        // Timer
        unlocked: 'Разблокировано',

        // Wallet
        walletDisconnected: 'Кошелёк отключён.',

        // Share Modal
        inviteEarn: 'Пригласить и заработать',
        shareBackchain: 'Поделиться Backchain',
        shareTutorDesc: 'Поделитесь ссылкой тьютора — зарабатывайте <strong class="text-amber-400">10% BNB</strong> + <strong class="text-amber-400">5% BKC</strong> с каждого друга',
        connectForTutorLink: 'Подключите кошелёк, чтобы создать персональную пригласительную ссылку с вашей реферальной ссылкой тьютора!',
        shareConnectedText: "Join Backchain — I'll be your tutor! Stake BKC, earn rewards, and I'll earn too. Use my invite link:",
        shareDisconnectedText: 'Взгляните на Backchain — Неостановимый DeFi на opBNB. Стейкайте, торгуйте NFT, играйте в Пул удачи и многое другое!',
        badge10BNB: '10% комиссий BNB',
        badge5BKC: '5% выплат BKC',
        badgeForever: 'Навсегда',
        tutorEmbedded: 'Ваш адрес тьютора <span class="font-mono text-zinc-400">{addr}</span> встроен в эту ссылку',
        footerConnected: 'Друзья, присоединившиеся по вашей ссылке, автоматически назначают вас тьютором',
        footerDisconnected: 'Поделитесь сейчас — каждый новый пользователь укрепляет экосистему',
        shareOn: {
            twitter: 'Twitter',
            telegram: 'Telegram',
            whatsapp: 'WhatsApp',
            copyLink: 'Скопировать ссылку',
        },
        linkCopied: 'Ссылка тьютора скопирована!',
        inviteLinkCopied: 'Пригласительная ссылка скопирована!',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // AGORA — pages/agora/*.js
    // ═══════════════════════════════════════════════════════════════════════
    agora: {
        // Header / Nav
        brandName: 'Agora',
        feed: 'Лента',
        discover: 'Обзор',
        profile: 'Профиль',
        post: 'Пост',
        createProfile: 'Создать профиль',

        // Compose
        compose: {
            placeholder: 'Что происходит в блокчейне?',
            post: 'Пост',
            reply: 'Ответить',
            addImage: 'Добавить изображение',
            addVideo: 'Добавить видео',
            addMedia: 'Добавить медиа',
            charCount: '{current}/{max}',
            posting: 'Публикация...',
            uploadingMedia: 'Загрузка медиа...',
            video: 'Видео',
            goLive: 'Начать трансляцию',
            live: 'ПРЯМОЙ ЭФИР',
            free: 'БЕСПЛАТНО',
            newPost: 'Новый пост',
            createProfileBanner: 'Создайте профиль, чтобы получить имя пользователя и начать публиковать',
        },

        // Feed
        newPost: 'новый пост',
        newPosts: 'новых постов',
        feedEmpty: 'Постов пока нет. Будьте первым!',
        feedEmptySubtext: 'Будьте первым, кто опубликует в неостановимой соцсети!',
        discoverEmpty: 'Трендовых постов пока нет',
        discoverSubtext: 'Будьте первым! Посты ранжируются по вовлечённости — лайки, ответы и суперлайки повышают видимость.',
        discoverRankedBy: 'Ранжировано по вовлечённости — лайки, ответы, репосты и суперлайки',
        search: {
            placeholder: 'Поиск постов и пользователей...',
            noResults: 'Ничего не найдено',
            tryAnother: 'Попробуйте другой запрос',
            resultsFor: 'Результаты для "{query}"',
            result: 'результат',
            results: 'результатов',
        },
        loadingPosts: 'Загрузка постов...',
        noMorePosts: 'Больше постов нет',
        loadMore: 'Загрузить ещё',
        comingSoon: 'Скоро!',
        comingSoonDesc: 'Agora развертывается. Неостановимая соцсеть скоро заработает!',
        noTagPosts: 'Нет постов с тегом {tag}',
        noTagPostsSubtext: 'Попробуйте другой тег или будьте первым!',
        welcomeTitle: 'Добро пожаловать в Agora',
        welcomeStep1: 'Создайте свой профиль',
        welcomeStep2: 'Опубликуйте свою первую мысль',
        welcomeStep3: 'Зарабатывайте суперлайки',
        readMore: 'Читать далее',
        more: 'ещё',
        less: 'свернуть',
        endStream: 'Завершить трансляцию',
        joinLiveStream: 'Присоединиться к трансляции',
        leave: 'Покинуть',
        originalPostNotFound: 'Оригинальный пост не найден',

        // Post Card
        postCard: {
            like: 'Нравится',
            liked: 'Понравилось',
            reply: 'Ответить',
            repost: 'Репост',
            reposted: '{name} сделал репост',
            superLike: 'Суперлайк',
            downvote: 'Отрицательный голос',
            share: 'Поделиться',
            tip: 'Чаевые',
            tipAuthor: 'Отправить чаевые автору',
            boost: 'Буст',
            boostPost: 'Продвинуть пост',
            report: 'Пожаловаться',
            edit: 'Редактировать',
            editPost: 'Редактировать пост',
            delete: 'Удалить',
            pin: 'Закрепить',
            pinToProfile: 'Закрепить в профиле',
            unpin: 'Открепить',
            block: 'Заблокировать',
            blockUser: 'Заблокировать пользователя',
            unblock: 'Разблокировать',
            unblockUser: 'Разблокировать пользователя',
            changeTag: 'Изменить тег',
            replies: '{count} ответ(ов)',
            viewThread: 'Смотреть тред',
            viewOnExplorer: 'Смотреть в обозревателе',
            edited: 'отредактировано',
            replyingTo: 'Ответ для {name}',
            options: 'Настройки',
        },

        // Profile
        profileSetup: {
            title: 'Создайте ваш профиль',
            subtitle: 'Настройте свою идентичность в блокчейне на Agora',
            username: 'Выберите имя пользователя',
            usernamePlaceholder: 'напр. satoshi',
            usernameHint: '1-15 символов: строчные буквы, цифры, подчёркивания. Короткие имена стоят дороже BNB.',
            usernameChecking: 'Проверка...',
            usernameAvailable: 'Доступно',
            usernameTaken: 'Занято',
            usernameFree: 'БЕСПЛАТНО',
            create: 'Создать профиль',
            creating: 'Создание...',
            displayName: 'Отображаемое имя',
            displayNamePlaceholder: 'Ваше публичное имя',
            bio: 'О себе',
            bioPlaceholder: 'Расскажите миру о себе...',
            language: 'Язык',
            languageHint: 'Ваши посты будут помечены этим языком для фильтрации.',
            step2Hint: 'Имя, описание и язык хранятся как метаданные и могут быть обновлены бесплатно в любое время.',
            usernameFee: 'Плата за имя',
            connectWalletToCreate: 'Подключите кошелёк, чтобы создать профиль.',
            connectWalletToView: 'Подключите кошелёк, чтобы просмотреть профиль.',
        },

        myProfile: {
            posts: 'Посты',
            followers: 'Подписчики',
            following: 'Подписки',
            editProfile: 'Редактировать профиль',
            noPosts: 'Постов пока нет',
            noPostsSubtext: 'Постов пока нет — поделитесь своей первой мыслью!',
            yourPosts: 'Ваши посты',
            total: '{count} всего',
            viewOnExplorer: 'Смотреть в обозревателе',
            badge: 'Значок',
            boost: 'Буст',
            boosted: 'Продвинуто',
        },

        userProfile: {
            follow: 'Подписаться',
            unfollow: 'Отписаться',
            following: 'Подписки',
            blocked: 'Заблокирован',
            block: 'Заблокировать',
            unblock: 'Разблокировать',
            notFound: 'Пользователь не найден',
            noPosts: 'Постов пока нет',
        },

        // Tags
        tags: {
            all: 'Все',
            general: 'Общее',
            defi: 'DeFi',
            nft: 'NFT',
            memes: 'Мемы',
            alpha: 'Альфа',
            dev: 'Разработка',
        },
        sort: {
            forYou: 'Для вас',
            following: 'Подписки',
            new: 'Новые',
            top: 'Топ',
        },

        // Modals
        modals: {
            superLike: {
                title: 'Суперлайк',
                desc: 'Отправьте любую сумму BNB, чтобы продвинуть этот пост в тренды. Больше BNB = выше ранг. Все BNB идут в экосистему.',
                amountLabel: 'Сумма (BNB)',
                anyAmount: 'Любая сумма',
                minAmount: '> 0 BNB',
                confirm: 'Суперлайк',
            },
            downvote: {
                title: 'Отрицательный голос',
                desc: 'Отрицательный голос за этот пост. Вы можете проголосовать против каждого поста только один раз.',
                confirm: 'Отрицательный голос',
            },
            tip: {
                title: 'Отправить чаевые автору',
                desc: 'Отправьте BNB напрямую автору поста в виде чаевых. Любая сумма > 0.',
                amountLabel: 'Сумма (BNB)',
                confirm: 'Отправить чаевые',
            },
            boost: {
                title: 'Продвинуть пост',
                desc: 'Продвиньте этот пост для большей видимости. Цены устанавливаются управлением экосистемы.',
                daysLabel: 'Дней',
                standard: 'Стандарт',
                featured: 'Рекомендуемый',
                confirm: 'Продвинуть пост',
            },
            boostProfile: {
                title: 'Продвижение профиля',
                desc: 'Продвиньте свой профиль для большей видимости. Цены устанавливаются управлением экосистемы.',
                daysLabel: 'Дней',
                confirm: 'Продвинуть профиль',
            },
            badge: {
                title: 'Значок доверия',
                desc: 'Получите верифицированный значок на 1 год. Более высокие уровни открывают длинные посты и больший престиж.',
                verified: 'Верифицирован',
                premium: 'Премиум',
                elite: 'Элита',
                charsPerPost: 'До {limit} символов на пост',
                current: 'текущий',
                withoutBadge: 'Без значка: 2 000 символов на пост',
            },
            report: {
                title: 'Пожаловаться на пост',
                desc: 'Пожаловаться на этот пост и заблокировать автора в вашей ленте. Стоимость: 0.0001 BNB',
                reasons: {
                    spam: 'Спам',
                    harassment: 'Оскорбления',
                    illegal: 'Незаконный контент',
                    scam: 'Мошенничество',
                    other: 'Другое',
                },
                confirm: 'Отправить жалобу',
            },
            editPost: {
                title: 'Редактировать пост',
                desc: 'Редактируйте в течение 15 минут после публикации. Бесплатно (только газ). Можно редактировать один раз.',
                confirm: 'Сохранить изменения',
            },
            editProfile: {
                title: 'Редактировать профиль',
                coverImage: 'Обложка',
                noCover: 'Без обложки',
                profilePicture: 'Фото профиля',
                changePhoto: 'Изменить фото',
                displayName: 'Отображаемое имя',
                displayNamePlaceholder: 'Ваше отображаемое имя',
                bio: 'О себе',
                bioPlaceholder: 'О вас...',
                location: 'Местоположение',
                locationPlaceholder: 'напр. Москва, Россия',
                language: 'Язык',
                socialLinks: 'Социальные ссылки',
                addLink: 'Добавить ссылку',
                platform: 'Платформа',
                usernameNote: 'Имя пользователя нельзя изменить. Применяется только плата за газ.',
                confirm: 'Сохранить изменения',
                maxLinks: 'Максимум 9 ссылок',
                uploadingAvatar: 'Загрузка аватара...',
                uploadingCover: 'Загрузка обложки...',
                imageTooLarge: 'Изображение слишком большое. Максимум 5МБ.',
                avatar: 'Аватар',
                banner: 'Баннер',
            },
            repost: {
                title: 'Репост',
                desc: 'Сделать репост для подписчиков? БЕСПЛАТНО (только газ)',
                confirm: 'Репост',
            },
            changeTag: {
                title: 'Изменить тег',
                desc: 'Выберите новую категорию для поста. Применяется только плата за газ.',
                confirm: 'Изменить тег',
            },
            deletePost: {
                title: 'Удалить пост',
                desc: 'Вы уверены? Это действие нельзя отменить.',
                confirm: 'Удалить',
            },
        },

        // Cart (batch actions)
        cart: {
            title: 'Корзина действий',
            empty: 'Корзина пуста',
            total: 'Итого',
            submit: 'Зарегистрировать в блокчейне',
            clear: 'Очистить',
            notOnChainYet: 'Ещё не зарегистрировано в блокчейне',
            actionsNotOnChain: '<strong>{count} действие(й)</strong> ещё не в блокчейне',
            action: 'действие',
            actions: 'действий',
            totalFee: 'Комиссия: {fee} ETH',
            savings: 'Экономия ~{pct}% газа с батчингом',
        },

        // Post Detail
        postDetail: {
            postNotFound: 'Пост не найден',
            replies: 'Ответы',
            repliesCount: 'Ответы ({count})',
            noReplies: 'Ответов пока нет. Будьте первым!',
            replyingTo: 'Ответ для {name}',
            replyPlaceholder: 'Напишите ответ...',
            reply: 'Ответить',
            replyFree: 'Текстовые ответы: БЕСПЛАТНО (только газ)',
            like: 'Нравится',
            likes: 'Нравится',
            replyCount: 'Ответ',
            beFirst: 'Будьте первым, кто ответит!',
        },

        // Upgrade hint
        upgrade: {
            charsWithTier: 'До {limit} символов с',
        },

        // Toast
        toast: {
            postCreated: 'Пост создан!',
            postFailed: 'Не удалось создать пост: {error}',
            replyCreated: 'Ответ опубликован!',
            replyFailed: 'Не удалось создать ответ: {error}',
            likeSuccess: 'Пост понравился!',
            likeFailed: 'Лайк не удался: {error}',
            followSuccess: 'Теперь вы подписаны!',
            followFailed: 'Подписка не удалась: {error}',
            unfollowSuccess: 'Отписка',
            unfollowFailed: 'Отписка не удалась: {error}',
            repostSuccess: 'Репост сделан!',
            repostFailed: 'Репост не удался: {error}',
            superLikeSuccess: 'Суперлайк отправлен!',
            superLikeFailed: 'Суперлайк не удался: {error}',
            downvoteSuccess: 'Отрицательный голос записан',
            downvoteFailed: 'Отрицательный голос не удался: {error}',
            tipSuccess: 'Чаевые отправлены!',
            tipFailed: 'Чаевые не удались: {error}',
            boostSuccess: 'Пост продвинут!',
            boostFailed: 'Продвижение не удалось: {error}',
            boostProfileSuccess: 'Профиль продвинут!',
            boostProfileFailed: 'Продвижение профиля не удалось: {error}',
            badgeSuccess: 'Значок активирован!',
            badgeFailed: 'Активация значка не удалась: {error}',
            reportSuccess: 'Жалоба отправлена',
            reportFailed: 'Жалоба не удалась: {error}',
            editSuccess: 'Пост отредактирован!',
            editFailed: 'Редактирование не удалось: {error}',
            deleteSuccess: 'Пост удалён',
            deleteFailed: 'Удаление не удалось: {error}',
            pinSuccess: 'Пост закреплён!',
            pinFailed: 'Закрепление не удалось: {error}',
            blockSuccess: 'Пользователь заблокирован',
            blockFailed: 'Блокировка не удалась: {error}',
            unblockSuccess: 'Пользователь разблокирован',
            unblockFailed: 'Разблокировка не удалась: {error}',
            profileCreated: 'Профиль успешно создан!',
            profileFailed: 'Создание профиля не удалось: {error}',
            profileUpdated: 'Профиль обновлён!',
            profileUpdateFailed: 'Обновление профиля не удалось: {error}',
            batchSuccess: '{count} действий зарегистрировано в блокчейне!',
            batchFailed: 'Пакетная транзакция не удалась',
            postShared: 'Пост опубликован!',
            linkCopied: 'Ссылка скопирована!',
            connectFirst: 'Сначала подключите кошелёк',
            createProfileFirst: 'Сначала создайте профиль',
            alreadyInCart: 'Уже в корзине',
            likeAddedToCart: 'Лайк добавлен в корзину',
            downvoteAddedToCart: 'Отрицательный голос добавлен в корзину',
            followAddedToCart: 'Подписка добавлена в корзину',
            cartCleared: 'Корзина очищена',
            cartEmpty: 'Корзина пуста',
            pleaseWrite: 'Пожалуйста, напишите что-нибудь',
            postTooLong: 'Пост слишком длинный (макс. {max} символов)',
            pleaseWriteReply: 'Пожалуйста, напишите ответ',
            replyPosted: 'Ответ опубликован!',
            reposted: 'Репост сделан!',
            superLiked: 'Суперлайк!',
            userBlocked: 'Пользователь заблокирован',
            userUnblocked: 'Пользователь разблокирован',
            postPinned: 'Пост закреплён!',
            unfollowed: 'Отписка',
            profileCreated: 'Профиль создан!',
            profileUpdated: 'Профиль обновлён!',
            badgeObtained: 'Значок {name} получен!',
            postReported: 'Пост обжалован. Автор заблокирован в вашей ленте.',
            postBoosted: 'Пост продвинут ({tier}) на {days} день(дней)!',
            tipped: 'Отправлено {amount} BNB чаевых!',
            profileBoosted: 'Профиль продвинут на {days} день(дней)!',
            tagChanged: 'Тег изменён!',
            contentRequired: 'Контент обязателен',
            tooLong: 'Слишком длинный (макс. {max})',
            postEdited: 'Пост отредактирован!',
            uploadFailed: 'Загрузка не удалась: {error}',
            avatarUploadError: 'Ошибка загрузки аватара: {error}',
            coverUploadError: 'Ошибка загрузки обложки: {error}',
            unsupportedFileType: 'Неподдерживаемый тип файла. Используйте изображения или видео.',
            invalidFormat: 'Неверный формат {type}.',
            fileTooLarge: 'Файл слишком большой. Максимум {limit}.',
            maxMediaItems: 'Максимум {max} медиафайлов',
            streamEnded: 'Трансляция завершена',
            youAreLive: 'Вы в ПРЯМОМ ЭФИРЕ!',
            streamEndedSaving: 'Трансляция завершена. Сохранение записи...',
            requestingCamera: 'Запрос доступа к камере...',
            creatingLivePost: 'Создание поста трансляции в блокчейне...',
            alreadyLive: 'Вы уже в эфире!',
            connectToGoLive: 'Подключите кошелёк для начала трансляции',
            browserNoSupport: 'Ваш браузер не поддерживает прямые трансляции (требуется HTTPS)',
            cameraPermDenied: 'Доступ к камере/микрофону запрещён. Разрешите доступ и попробуйте снова.',
            noCameraFound: 'Камера или микрофон не найдены на этом устройстве',
            cameraInUse: 'Камера используется другим приложением',
            failedToGoLive: 'Не удалось начать трансляцию: {error}',
            failedToStartStream: 'Не удалось запустить трансляцию: {error}',
            failedToCreateLive: 'Не удалось создать пост трансляции: {error}',
            streamError: 'Ошибка трансляции: {error}',
            recordingTooLarge: 'Запись слишком большая ({size}МБ). Максимум 100МБ.',
            savingRecording: 'Сохранение записи в Arweave ({size}МБ)...',
            recordingSaved: 'Запись трансляции сохранена навсегда!',
            failedToSaveRecording: 'Не удалось сохранить запись: {error}',
        },

        // Viewers
        viewers: '{count} зритель(ей)',

        // Wallet button
        wallet: {
            connect: 'Подключить',
            connected: 'Подключено',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NOTARY — pages/notary/*.js
    // ═══════════════════════════════════════════════════════════════════════
    notary: {
        // Header
        brandName: 'Цифровой нотариат',
        brandSub: 'Регистрация и сертификация в блокчейне',

        // Tabs
        documents: 'Документы',
        assets: 'Активы',
        verify: 'Проверить',
        stats: 'Статистика',
        notarize: 'Заверить',

        // Header detail views
        certDetail: {
            title: 'Сертификат #{id}',
            subtitle: 'Детали документа',
        },
        assetDetail: {
            title: 'Актив #{id}',
            subtitle: 'Детали собственности',
        },
        registerAsset: {
            title: 'Зарегистрировать актив',
            subtitle: 'Регистрация собственности в блокчейне',
        },

        // Documents tab
        documentsTab: {
            title: 'Мои документы',
            noDocuments: 'Заверённых документов пока нет',
            certifyFirst: 'Заверьте свой первый документ, чтобы начать!',
            notarizeNew: 'Заверить новый',
            filterAll: 'Все',
            filterDocument: 'Документы',
            filterImage: 'Изображения',
            filterCode: 'Код',
            filterOther: 'Другое',
            connectToView: 'Подключитесь для просмотра сертификатов',
            certCount: '{count} сертификат(ов)',
            notarizedDocument: 'Заверённый документ',
            received: 'Получено',
        },

        // Assets tab
        assetsTab: {
            title: 'Мои активы',
            noAssets: 'Зарегистрированных активов пока нет',
            registerFirst: 'Зарегистрируйте свой первый актив в блокчейне!',
            registerNew: 'Зарегистрировать новый',
            filterAll: 'Все',
            connectToView: 'Подключитесь для просмотра активов',
            assetCount: '{count} актив(ов)',
        },

        // Notarize wizard
        wizard: {
            step1Title: 'Выберите файл',
            step1Desc: 'Выберите файл для заверения',
            step2Title: 'Подробности',
            step2Desc: 'Добавьте информацию о документе',
            step3Title: 'Подтвердить',
            step3Desc: 'Проверьте и подтвердите заверение',

            dropzone: 'Перетащите или нажмите для выбора файла',
            maxSize: 'Максимальный размер: 10МБ',
            docType: 'Тип документа',
            docTitle: 'Название',
            docDescription: 'Описание (необязательно)',
            hash: 'Хеш файла',
            fee: 'Плата за заверение',
            confirm: 'Заверить документ',
            processing: 'Обработка...',

            docTypes: {
                general: 'Общее',
                contract: 'Контракт',
                identity: 'Удостоверение',
                diploma: 'Диплом',
                property: 'Собственность',
                financial: 'Финансовый',
                legal: 'Юридический',
                medical: 'Медицинский',
                ip: 'Интеллектуальная собственность',
                other: 'Другое',
            },

            fileSelected: 'Файл выбран',
            hashComputed: 'SHA-256 хеш вычислен в вашем браузере',
            remove: 'Удалить',
            checkingDuplicates: 'Проверка на дубликаты...',
            duplicateFound: 'Документ уже заверён!',
            duplicateExistsMsg: 'Этот хеш уже существует в блокчейне.',
            uniqueHash: 'Уникальный хеш — готов к сертификации',
            changeFile: 'Сменить файл',
            continue: 'Продолжить',
            computingHash: 'Вычисление SHA-256...',
            hashLocal: 'Хеш вычисляется локально в вашем браузере',
            localHash: 'Локальный хеш',
            arweave: 'Arweave',
            permanent: 'Постоянное',
            descPlaceholder: 'Напр., договор купли-продажи, подписанный в янв. 2025...',
            fees: 'Комиссии',
            arweaveStorage: 'Хранилище Arweave',
            certificationFee: 'Плата за сертификацию',
            arweaveDesc: 'Arweave = постоянное, децентрализованное хранилище',
            insufficientBnb: 'Недостаточно BNB для комиссий + газа',
            review: 'Проверить',
            noDescription: 'Без описания',
            signAndMint: 'Подписать и создать',
        },

        // Asset wizard
        assetWizard: {
            step1Title: 'Тип актива',
            step2Title: 'Подробности',
            step3Title: 'Документация',
            step4Title: 'Проверить',

            assetTypes: {
                property: 'Недвижимость',
                vehicle: 'Транспортное средство',
                equipment: 'Оборудование',
                artwork: 'Произведение искусства',
                intellectual: 'Интеллектуальная собственность',
                other: 'Другое',
            },

            name: 'Название актива',
            description: 'Описание',
            location: 'Местоположение',
            serialNumber: 'Серийный номер / регистрация',
            estimatedValue: 'Оценочная стоимость',
            addDocumentation: 'Добавить документацию',
            skipDoc: 'Пропустить (добавить позже)',
            register: 'Зарегистрировать актив',
        },

        // Cert Detail
        certDetailView: {
            documentType: 'Тип документа',
            certifiedBy: 'Заверено кем',
            certifiedOn: 'Заверено когда',
            fileHash: 'Хеш файла',
            txHash: 'Хеш транзакции',
            arweaveId: 'ID Arweave',
            viewDocument: 'Просмотреть документ',
            transferOwnership: 'Передать владение',
            transferTo: 'Передать кому',
            transferPlaceholder: 'Адрес кошелька (0x...)',
            confirmTransfer: 'Подтвердить передачу',
            shareProof: 'Поделиться доказательством',
            downloadCert: 'Скачать сертификат',
            description: 'Описание',
            tapToViewNft: 'Нажмите для просмотра NFT-карточки',
            transferCertificate: 'Передать сертификат',
            transferDesc: 'Передайте владение этим сертификатом другому кошельку. Это действие необратимо и требует небольшой комиссии.',
        },

        // Asset Detail
        assetDetailView: {
            owner: 'Владелец',
            registeredOn: 'Зарегистрировано',
            assetType: 'Тип актива',
            description: 'Описание',
            location: 'Местоположение',
            serialNumber: 'Серийный номер',
            annotations: 'Аннотации',
            noAnnotations: 'Аннотаций пока нет',
            addAnnotation: 'Добавить аннотацию',
            annotationPlaceholder: 'Напишите аннотацию...',
            transferOwnership: 'Передать владение',
            documents: 'Связанные документы',
            noDocuments: 'Нет связанных документов',
            tapToOpen: 'Нажмите, чтобы открыть',
            tapToView: 'Нажмите для просмотра',
            transfers: 'Переводы',
            youOwnThis: 'Вы владеете этим активом',
            documentHash: 'Хеш документа',
            additionalInfo: 'Дополнительная информация',
            annotate: 'Аннотировать',
            transferAsset: 'Передать актив',
            transferDesc: 'Передать владение. Это создаёт постоянную запись в блокчейне.',
            newOwnerPlaceholder: 'Адрес нового владельца (0x...)',
            declaredValuePlaceholder: 'Объявленная стоимость в BNB (необязательно)',
            transferNotePlaceholder: 'Примечание к передаче (необязательно)',
        },

        // Verify tab
        verifyTab: {
            title: 'Проверить документ',
            subtitle: 'Проверьте, был ли документ заверён в блокчейне',
            dropzone: 'Перетащите или нажмите для выбора файла для проверки',
            orEnterHash: 'Или введите хеш документа',
            hashPlaceholder: 'Хеш файла (SHA-256)',
            verifyButton: 'Проверить',
            verifying: 'Проверка...',
            verified: 'Документ проверен!',
            notFound: 'Документ не найден',
            verifiedDesc: 'Этот документ был заверён в блокчейне.',
            notFoundDesc: 'Этот документ не найден в реестре.',
            hashComputedLocally: 'SHA-256 хеш будет вычислен локально',
            verificationError: 'Ошибка проверки: {error}',
            tokenId: 'ID токена',
            date: 'Дата',
            sha256Hash: 'SHA-256 хеш',
            file: 'Файл',
        },

        // Stats tab
        statsTab: {
            title: 'Статистика',
            totalCertificates: 'Всего сертификатов',
            totalAssets: 'Всего активов',
            totalTransfers: 'Всего переводов',
            recentActivity: 'Недавняя активность',
            notarizations: 'Заверения',
            annotations: 'Аннотации',
            noRecentNotarizations: 'Недавних заверений не найдено',
            viewContract: 'Посмотреть контракт в обозревателе',
        },

        // NFT Certificate Card
        nftCard: {
            title: 'NFT Сертификат',
            viewOnChain: 'Посмотреть в блокчейне',
            addToWallet: 'Добавить в кошелёк',
        },

        // Toast
        toast: {
            notarizeSuccess: 'Документ успешно заверён!',
            notarizeFailed: 'Заверение не удалось: {error}',
            transferSuccess: 'Владение успешно передано!',
            transferFailed: 'Передача не удалась: {error}',
            registerAssetSuccess: 'Актив успешно зарегистрирован!',
            registerAssetFailed: 'Регистрация актива не удалась: {error}',
            annotationSuccess: 'Аннотация добавлена!',
            annotationFailed: 'Аннотация не удалась: {error}',
            hashCopied: 'Хеш скопирован!',
            linkCopied: 'Ссылка скопирована!',
            connectFirst: 'Сначала подключите кошелёк',
            invalidFile: 'Недопустимый файл',
            fileTooLarge: 'Файл слишком большой (макс. 10МБ)',
            hashError: 'Ошибка вычисления хеша файла',
            pleaseWait: 'Пожалуйста, подождите...',
            contractNotFound: 'Адрес контракта не найден',
            walletDisconnected: 'Кошелёк отключён. Пожалуйста, подключитесь снова.',
            tokenAdded: 'Токен #{id} добавлен в кошелёк!',
            rateLimited: 'MetaMask ограничен по частоте запросов. Подождите и попробуйте снова.',
            networkMismatch: 'Проверьте сеть кошелька и попробуйте снова.',
            addManually: 'Откройте MetaMask > NFT > Импортировать NFT для ручного добавления',
            copyFailed: 'Не удалось скопировать',
            invalidAddress: 'Введите корректный адрес кошелька',
            assetNotFound: 'Актив не найден',
            certNotFound: 'Сертификат не найден',
        },

        // Action button states
        actions: {
            uploading: 'Загрузка...',
            registering: 'Регистрация...',
            uploadingDoc: 'Загрузка документа...',
            transferring: 'Перевод...',
            adding: 'Добавление...',
        },
    },
};
