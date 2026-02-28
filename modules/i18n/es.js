// modules/i18n/es.js — Backchain i18n Spanish (es-LATAM) Dictionary
export default {

    // ═══════════════════════════════════════════════════════════════════════
    // COMMON — Cadenas compartidas en varias páginas
    // ═══════════════════════════════════════════════════════════════════════
    common: {
        buyOnRamp: 'Comprar Crypto',
        connectWallet: 'Conectar Billetera',
        connect: 'Conectar',
        loading: 'Cargando...',
        error: 'Error',
        success: '¡Éxito!',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        back: 'Volver',
        close: 'Cerrar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        copy: 'Copiar',
        copied: '¡Copiado!',
        share: 'Compartir',
        unknownError: 'Error desconocido',
        connectWalletFirst: 'Conecta tu billetera primero',
        insufficientBalance: 'Saldo insuficiente',
        transactionFailed: 'Transacción fallida',
        processing: 'Procesando...',
        max: 'MÁX',
        viewOnExplorer: 'Ver en Explorer',
        noData: 'Sin datos',
        retry: 'Reintentar',
        refresh: 'Actualizar',
        send: 'Enviar',
        receive: 'Recibir',
        approve: 'Aprobar',
        reject: 'Rechazar',
        yes: 'Sí',
        no: 'No',
        all: 'Todos',
        none: 'Ninguno',
        active: 'Activo',
        inactive: 'Inactivo',
        pending: 'Pendiente',
        approved: 'Aprobado',
        rejected: 'Rechazado',
        expired: 'Expirado',
        ready: 'Listo',
        balance: 'Saldo',
        available: 'Disponible',
        amount: 'Cantidad',
        fee: 'Comisión',
        total: 'Total',
        reward: 'Recompensa',
        rewards: 'Recompensas',
        status: 'Estado',
        details: 'Detalles',
        history: 'Historial',
        search: 'Buscar',
        filter: 'Filtrar',
        sort: 'Ordenar',
        prev: 'Anterior',
        next: 'Siguiente',
        justNow: 'Justo ahora',
        recent: 'Reciente',
        today: 'Hoy',
        day: 'día',
        days: 'días',
        hours: 'horas',
        minutes: 'minutos',
        seconds: 'segundos',
        agoSuffix: 'atrás',
        mAgo: 'hace {m}m',
        hAgo: 'hace {h}h',
        dAgo: 'hace {d}d',
        connectWalletToView: 'Conecta tu billetera para ver',
        withdraw: 'Retirar',
        deposit: 'Depositar',
        failed: 'Fallido',
        linkCopied: '¡Enlace copiado!',
        copyFailed: 'No se pudo copiar el enlace',
        connected: 'Conectado',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NAV — Etiquetas de navegación
    // ═══════════════════════════════════════════════════════════════════════
    nav: {
        main: 'Principal',
        dashboard: 'Panel',
        airdrop: 'Airdrop',
        earn: 'Ganar',
        stakeEarn: 'Stake &amp; Ganar',
        nftMarket: 'NFT Market',
        boostMarket: 'Boost Market',
        fortunePool: 'Fortune Pool',
        tradeBkc: 'Comprar BKC',
        community: 'Comunidad',
        charityPool: 'Charity Pool',
        services: 'Servicios',
        notary: 'Notaría',
        grow: 'Crecer',
        tutorSystem: 'Sistema Tutor',
        becomeOperator: 'Ser Operador',
        adminPanel: 'Panel Admin',
        about: 'Sobre el Proyecto',
        inviteEarn: 'Invitar &amp; Ganar',
        tutorials: 'Video Tutoriales',
        home: 'Inicio',
        social: 'Social',
        more: 'Más',
        tokenomics: 'Tokenomics',
        tutor: 'Tutor',
        operator: 'Operador',
        trade: 'Trading',
        fortune: 'Fortune',
        charity: 'Caridad',
        boost: 'Boost',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SPLASH — Pantalla de bienvenida
    // ═══════════════════════════════════════════════════════════════════════
    splash: {
        optimized: 'Optimizado para opBNB',
        mainnetLaunch: 'Lanzamiento Mainnet',
        days: 'días',
        hours: 'horas',
        minutes: 'min',
        seconds: 'seg',
        unstoppable: 'DeFi Imparable',
        enterApp: 'Entrar a la App',
        testnetBadge: 'TESTNET',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DASHBOARD — DashboardPage.js
    // ═══════════════════════════════════════════════════════════════════════
    dashboard: {
        // Hero
        youWillReceive: 'Vas a Recibir',
        claimRewards: 'Reclamar Recompensas',
        noRewardsYet: 'Sin Recompensas Aún',
        yourPStake: 'Tu pStake',
        stakeMore: 'Hacer Más Stake',
        earnMoreWithNft: '¡Gana +{amount} BKC más con NFT!',

        // Faucet
        faucet: {
            title: 'Obtén Tokens de Prueba Gratis',
            titleReceived: 'Tokens de Prueba Recibidos',
            desc: 'Obtén tBNB para gas — una vez al día',
            descReceived: 'Ya recibiste {amount} tBNB hoy — vuelve en 24h',
            descConnect: 'Conecta tu billetera para recibir tBNB para gas',
            claimFreeTokens: 'Reclamar Tokens Gratis',
            claimedToday: 'Reclamado Hoy',
            dailyClaimUsed: 'Reclamo diario usado',
            connectWallet: 'Conectar Billetera',
            sending: 'Enviando...',
            successMsg: 'Faucet: ¡{amount} tBNB enviados a tu billetera!',
            cooldownMsg: 'Faucet en espera. Intenta de nuevo en 24h.',
            unavailable: 'Faucet temporalmente no disponible. Intenta más tarde.',
        },

        // Tutor/Referral Widget
        tutor: {
            becomeTutor: 'Sé el Tutor de Alguien',
            shareLink: 'Comparte tu enlace. Gana 10% de todas las comisiones + 5% BKC de tus estudiantes — para siempre.',
            studentsEarning: '{count} Estudiante(s) Ganando para Ti',
            keepSharing: 'Ganas 10% BNB en todas las comisiones + 5% BKC en recompensas de staking. ¡Sigue compartiendo!',
            connectForLink: 'Conecta tu billetera para obtener tu enlace de tutor',
            tutorLinkCopied: '¡Enlace de tutor copiado!',
            failedToCopy: 'Error al copiar',
            shareTextCopied: '¡Texto para compartir copiado!',
            noTutorYet: 'Sin tutor aún',
            setATutor: 'Asignar Tutor',
            change: 'Cambiar',
            earnings: 'Ganancias de tutor: {amount} BNB disponibles',
        },

        // Buyback Widget
        buyback: {
            ready: 'Buyback Listo',
            title: 'Buyback Listo — {amount} BNB',
            desc: 'Ejecuta el buyback para ganar 5% del BNB pendiente como recompensa',
            descWithFee: 'Paga {fee} BNB de comisión, gana {reward} BNB (5%). La comisión amplifica el buyback.',
            pending: 'pendiente',
            earnAmount: 'Ganar {amount} BNB',
            execute: 'Ejecutar',
            executing: 'Ejecutando...',
            successMsg: '¡Buyback ejecutado! Ganaste 5% de recompensa en BNB',
            failedMsg: 'Buyback falló: {error}',
        },

        // Quick Actions
        actions: {
            agoraTitle: 'Agora',
            agoraDesc: 'Publica y discute on-chain',
            stakeBkcTitle: 'Hacer Stake BKC',
            stakeBkcDesc: 'Gana mientras duermes',
            fortunePoolTitle: 'Fortune Pool',
            fortunePoolDesc: 'Gana hasta 100x',
            notarizeTitle: 'Notarizar',
            notarizeDesc: 'Certifica en blockchain',
            charityPoolTitle: 'Charity Pool',
            charityPoolDesc: 'Dona y quema tokens',
            nftMarketTitle: 'NFT Market',
            nftMarketDesc: '2x tus recompensas',
            tradeBkcTitle: 'Comprar BKC',
            tradeBkcDesc: 'Swap en Uniswap V3',
        },

        // Metrics
        metrics: {
            supply: 'Suministro',
            pstake: 'pStake',
            burned: 'Quemados',
            fees: 'Comisiones',
            locked: 'Bloqueados',
            bkcPrice: 'Precio BKC',
            balance: 'Saldo',
        },

        // Activity Feed
        activity: {
            title: 'Actividad',
            yourActivity: 'Tu Actividad',
            networkActivity: 'Actividad de la Red',
            loadingActivity: 'Cargando actividad...',
            loadingYourActivity: 'Cargando tu actividad...',
            loadingNetworkActivity: 'Cargando actividad de la red...',
            noNetworkActivity: 'Sin actividad en la red aún',
            beFirst: '¡Sé el primero en hacer stake, swap o jugar!',
            filterAll: 'Todos',
            filterStaking: 'Staking',
            filterClaims: 'Claims',
            filterNft: 'NFT',
            filterFortune: 'Fortune',
            filterCharity: 'Caridad',
            filterNotary: 'Notaría',
            filterAgora: 'Agora',
            filterFaucet: 'Faucet',
            noMatch: 'Sin actividad que coincida',
            noActivity: 'Sin actividad aún',
            tryFilter: 'Prueba un filtro diferente',
            startMsg: '¡Empieza a hacer stake, trading o a jugar!',
            you: 'Tú',
        },

        // Fortune quick-action
        fortune: {
            prize: 'Premio: {amount} BKC',
            playToWin: 'Juega para ganar',
            bet: 'Apostar',
        },

        // Notary quick-action
        notary: {
            docsCertified: '{count} docs certificados',
            certifyDocs: 'Certificar documentos',
        },

        // Claim toast messages
        claim: {
            success: '¡Recompensas reclamadas!',
            failed: 'Reclamo fallido',
        },

        // Booster/NFT Display
        booster: {
            noBoosterNft: 'Sin Booster NFT',
            youKeep: 'conservas',
            upgradeToMax: 'Sube a Diamond para 100%',
            buyNft: 'Comprar NFT',
            rentNft: 'Rentar NFT',
            howItWorks: 'Cómo funciona',
            getUpToMore: 'Obtén hasta +{amount} BKC con NFT',
            recycledToStakers: '50% reciclado a stakers.',
            diamondKeep100: 'Diamond: conserva 100%',
            owned: 'PROPIO',
            rented: 'RENTADO',
            inYourWallet: 'En tu billetera',
            activeRental: 'Renta activa',
            netReward: 'Recompensa Neta',
            nftBonus: 'Bonus NFT',
        },

        // Modals
        modals: {
            boostEfficiency: 'Aumenta Eficiencia',
            nftHoldersEarnMore: 'Los holders de NFT ganan hasta 2x más',
            noGas: 'Sin Gas',
            needGasTokens: 'Necesitas tBNB para gas',
            getFreeGas: 'Obtén Gas + BKC Gratis',
        },

        // Activity labels (used in ACTIVITY_ICONS)
        activityLabels: {
            staked: 'Stakeado',
            unstaked: 'Unstakeado',
            forceUnstaked: 'Unstake Forzado',
            rewardsClaimed: 'Recompensas Reclamadas',
            boughtNft: 'NFT Comprado',
            soldNft: 'NFT Vendido',
            mintedBooster: 'Booster Minteado',
            transfer: 'Transferencia',
            listedNft: 'NFT Listado',
            rentedNft: 'NFT Rentado',
            withdrawn: 'Retirado',
            promotedNft: 'NFT Promovido',
            gameCommitted: 'Juego Confirmado',
            gameRevealed: 'Juego Revelado',
            fortuneBet: 'Apuesta Fortune',
            comboMode: 'Modo Combo',
            jackpotMode: 'Modo Jackpot',
            winner: '¡Ganador!',
            noLuck: 'Sin Suerte',
            notarized: 'Notarizado',
            posted: 'Publicado',
            liked: 'Like',
            replied: 'Respondido',
            superLiked: 'Super Like',
            reposted: 'Reposteado',
            followed: 'Seguido',
            profileCreated: 'Perfil Creado',
            profileBoosted: 'Perfil Boosteado',
            badgeActivated: 'Insignia Activada',
            tippedBkc: 'Propina BKC',
            bnbWithdrawn: 'BNB Retirado',
            donated: 'Donado',
            campaignCreated: 'Campaña Creada',
            campaignCancelled: 'Campaña Cancelada',
            fundsWithdrawn: 'Fondos Retirados',
            goalReached: '¡Meta Alcanzada!',
            faucetClaim: 'Reclamo Faucet',
            feeCollected: 'Comisión Cobrada',
            tutorSet: 'Tutor Asignado',
            tutorChanged: 'Tutor Cambiado',
            tutorEarned: 'Tutor Ganó',
            rewardsRecycled: 'Recompensas Recicladas',
            nftFused: 'NFT Fusionado',
            nftSplit: 'NFT Dividido',
            voted: 'Votado',
            proposalCreated: 'Propuesta Creada',
            buyback: 'Buyback',
            swap: 'Swap',
            liquidityAdded: 'Liquidez Agregada',
            liquidityRemoved: 'Liquidez Removida',
            earningsWithdrawn: 'Ganancias Retiradas',
            gameExpired: 'Juego Expirado',
            campaignBoosted: 'Campaña Boosteada',
            campaignClosed: 'Campaña Cerrada',
            downvoted: 'Downvote',
            unfollowed: 'Dejó de Seguir',
            batchActions: 'Acciones en Lote',
            postEdited: 'Post Editado',
            postReported: 'Post Reportado',
            postBoosted: 'Post Boosteado',
            userBlocked: 'Usuario Bloqueado',
            userUnblocked: 'Usuario Desbloqueado',
            profileUpdated: 'Perfil Actualizado',
            bulkFused: 'Fusión Masiva',
            rewardsCompounded: 'Recompensas Compuestas',
            buybackPaused: 'Buyback Pausado',
            buybackResumed: 'Buyback Reanudado',
            activity: 'Actividad',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STAKING — StakingPage.js
    // ═══════════════════════════════════════════════════════════════════════
    staking: {
        title: 'Stake & Ganar',
        subtitle: 'Delega BKC, gana recompensas. NFT + Tutor = conserva más',
        youWillReceive: 'Vas a Recibir',
        claimRewards: 'Reclamar Recompensas',
        noRewardsYet: 'Sin Recompensas Aún',
        compound: 'Componer',
        loadingBoost: 'Cargando boost...',

        // Breakdown
        breakdown: {
            staking: 'Staking',
            mining: 'Minería',
            recycled: 'Reciclado',
            tutor: 'Tutor',
            burned: 'Quemado',
            none: 'Ninguno',
        },

        // Claim fee
        claimFee: 'Comisión de claim: {fee} BNB',

        // Buyback
        buybackAvailable: 'Buyback Disponible',
        buybackReward: 'Recompensa 5%',
        pendingBnb: 'BNB Pendiente',
        yourReward: 'Tu Recompensa (5%)',
        bkcToStakers: 'BKC a Stakers',
        miningRate: 'Tasa de Minería',
        executeBuyback: 'Ejecutar Buyback',
        buybackInfo: 'Ejecuta el buyback para ganar 5% del BNB pendiente. El resto se convierte en recompensas BKC para stakers.',
        buybackFeeInfo: 'Comisión: {fee} BNB (se suma al buyback). Gana 5% del total.',
        buybackLast: 'Último: {time}',
        buybackTotal: 'Total: {count} buybacks',

        // Stats
        networkPStake: 'pStake de la Red',
        yourPower: 'Tu Poder',
        pendingRewards: 'Pendiente',
        activeLocks: 'Bloqueos Activos',

        // Stake Form
        delegateBkc: 'Delegar BKC',
        enterAmount: 'Ingresa una cantidad',
        available: 'Disponible',
        pstakePower: 'Poder pStake',
        netAmount: 'Monto Neto',
        feePercent: 'Comisión',
        durationMonths: '{n} Mes(es)',
        durationDays: '{n} Día(s)',
        durationYears: '{n} Año(s)',

        // Delegations
        activeDelegations: 'Delegaciones Activas',
        noActiveDelegations: 'Sin delegaciones activas',
        connectWalletToView: 'Conecta tu billetera para ver',
        unstake: 'Unstake',
        forceUnstakeTitle: 'Unstake Forzado',
        forceUnstakeWarning: 'El unstake forzado tiene una penalización según tu tier de NFT.',

        // History
        historyTitle: 'Historial',
        historyAll: 'Todos',
        historyStakes: 'Stakes',
        historyUnstakes: 'Unstakes',
        historyClaims: 'Claims',
        loadingHistory: 'Cargando historial...',
        noHistoryYet: 'Sin historial aún',

        // History labels
        delegated: 'Delegado',
        unstaked: 'Unstakeado',
        claimed: 'Reclamado',
        forceUnstaked: 'Unstake Forzado',

        // Boost panel
        boost: {
            keep: 'Conserva {rate}%',
            recycle: 'Recicla {rate}%',
            nftTierBenefits: 'Beneficios por Tier de NFT',
            getAnNft: 'Obtener NFT',
            upgradeToDiamond: 'Sube a Diamond para conservar 100%',
            upgrade: 'Subir',
            noTutorWarning: 'Sin tutor — +10% extra reciclado',
            setTutorHint: 'Asigna un tutor para reducir el reciclaje en 10%',
            setATutor: 'Asignar Tutor',
            tutorReduces: '-10% reciclaje',
        },

        // Toast messages
        toast: {
            delegationSuccess: '¡Delegación exitosa!',
            delegationFailed: 'Delegación fallida: {error}',
            unstakeSuccess: '¡Unstake exitoso!',
            forceUnstakeSuccess: 'Unstake forzado completado (penalización aplicada)',
            unstakeFailed: 'Unstake fallido: {error}',
            claimSuccess: '¡Recompensas reclamadas!',
            claimFailed: 'Claim fallido: {error}',
            compoundSuccess: '¡Recompensas compuestas en nueva delegación!',
            compoundFailed: 'Compound fallido: {error}',
            buybackSuccess: '¡Buyback ejecutado! Ganaste 5% de recompensa en BNB',
            buybackFailed: 'Buyback fallido: {error}',
            invalidAmount: 'Cantidad inválida',
            insufficientBkc: 'Saldo BKC insuficiente',
            insufficientGas: 'BNB insuficiente para gas',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STORE — StorePage.js (NFT Marketplace)
    // ═══════════════════════════════════════════════════════════════════════
    store: {
        title: 'NFT Market',
        subtitle: 'Compra, vende y fusiona Booster NFTs',

        // Tier Card
        buyPrice: 'Comprar',
        sellPrice: 'Vender',
        netSell: 'Venta Neta',
        poolSize: 'Pool',
        volume: 'Volumen',
        buy: 'Comprar',
        sell: 'Vender',
        keepRate: 'Conserva {rate}%',

        // Impact Card
        rewardImpact: 'Impacto en Recompensas',
        currentKeep: 'Conservas Actual',
        withNft: 'Con NFT',
        potentialGain: 'Ganancia Potencial',
        annualExtra: 'Extra Anual',
        stakeToSeeImpact: 'Haz stake de BKC para ver el impacto',

        // Tutor banner
        tutorBanner: {
            hasTutor: 'Tutor activo: {address} — conservas más en recompensas',
            noTutor: 'Sin tutor — pierdes 10% extra en reciclaje.',
            setTutor: 'Asignar Tutor',
        },

        // Inventory
        inventory: 'Inventario',
        noNftsYet: 'Sin NFTs aún',
        buyFirstNft: '¡Compra tu primer NFT para empezar a ganar más!',
        listForRent: 'Rentar',
        addToWallet: 'Agregar a Billetera',

        // Fusion/Split
        fusion: {
            title: 'Fusión & Split',
            fuseTab: 'Fusionar',
            splitTab: 'Dividir',
            bulkTab: 'Fusión Masiva',
            fuseHint: 'Selecciona 2 NFTs del mismo tier para fusionar en un tier superior',
            splitHint: 'Selecciona 1 NFT para dividir en 2 NFTs de tier inferior',
            bulkHint: 'Selecciona múltiples NFTs para fusionar a la vez hasta el tier deseado',
            selectNfts: 'Seleccionar NFTs',
            noEligibleNfts: 'No hay NFTs elegibles para esta acción',
            fuseButton: 'FUSIONAR',
            splitButton: 'DIVIDIR',
            bulkFuseButton: 'FUSIÓN MASIVA',
            fuseFee: 'Comisión: {fee} BNB',
            splitFee: 'Comisión: {fee} BNB',
            result: 'Resultado',
            splitInto: 'Dividir en',
            targetTier: 'Tier Objetivo',
        },

        // Trade History
        tradeHistory: 'Historial de Trades',
        noTradeHistory: 'Sin historial de trades',
        bought: 'Comprado',
        sold: 'Vendido',
        fused: 'Fusionado',
        split: 'Dividido',

        // Toast messages
        toast: {
            buySuccess: '¡NFT {tier} comprado exitosamente!',
            buyFailed: 'Compra fallida: {error}',
            sellSuccess: '¡NFT {tier} vendido exitosamente!',
            sellFailed: 'Venta fallida: {error}',
            fuseSuccess: '¡Fusión completa! Nuevo NFT {tier} creado',
            fuseFailed: 'Fusión fallida: {error}',
            splitSuccess: '¡Split completo! 2 NFTs {tier} creados',
            splitFailed: 'Split fallido: {error}',
            bulkFuseSuccess: '¡Fusión masiva completa!',
            bulkFuseFailed: 'Fusión masiva fallida: {error}',
            nftAddedToWallet: '¡NFT {tier} #{id} agregado a la billetera!',
            nftNotAdded: 'NFT no agregado a la billetera',
            failedToAddNft: 'Error al agregar NFT a la billetera',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FORTUNE — FortunePool.js
    // ═══════════════════════════════════════════════════════════════════════
    fortune: {
        title: 'Fortune Pool',
        subtitle: 'Prueba tu suerte — gana hasta 100x',
        prizePool: 'Pozo de Premios',
        playToWin: 'Juega para ganar',
        prize: 'Premio: {amount} BKC',

        // Tiers
        tiers: {
            standard: 'Estándar',
            combo: 'Combo',
            jackpot: 'Jackpot',
        },

        // Game flow
        selectBet: 'Seleccionar Apuesta',
        placeBet: 'Apostar',
        confirmInMetamask: 'Confirma en MetaMask...',
        waitingReveal: 'Esperando Resultado...',
        revealResult: '¡Revela y Ve el Resultado!',
        revealing: 'Revelando...',
        confirmed: 'Confirmado',
        retryingIn: 'Reintentando en {seconds}s...',

        // Results
        youWon: '¡Ganaste!',
        youLost: 'Sin Suerte',
        wonAmount: '¡Ganaste {amount} BKC!',

        // Odds
        odds: {
            win2x: '1 en 5 — Gana 2x',
            win5x: '1 en 10 — Gana 5x',
            win100x: '1 en 150 — Gana 100x',
        },

        // Stats
        totalGames: 'Total de Juegos',
        totalWins: 'Victorias',
        totalPrizesPaid: 'Premios Pagados',
        winsCount: '{wins}/{total} victorias',
        yourHistory: 'Tu Historial',

        // Share
        shareWin: 'Compartir Victoria',
        shareText: '¡Acabo de ganar {amount} BKC en Fortune Pool de Backcoin!',

        // Toast
        toast: {
            betPlaced: '¡Apuesta realizada! Esperando resultado...',
            betFailed: 'Apuesta fallida: {error}',
            revealSuccess: '¡Resultado revelado!',
            revealFailed: 'Revelación fallida: {error}',
            insufficientBkc: 'Saldo BKC insuficiente',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TRADE — TradePage.js
    // ═══════════════════════════════════════════════════════════════════════
    trade: {
        title: 'Trading',
        swap: 'Swap',
        connectWallet: 'Conectar Billetera',
        enterAmount: 'Ingresa cantidad',
        insufficientBnb: 'BNB insuficiente',
        insufficientBkc: 'BKC insuficiente',
        swapWithImpact: 'Swap ({impact}% impacto)',

        // Direction
        youPay: 'Tú Pagas',
        youReceive: 'Tú Recibes',
        balance: 'Saldo: {amount} {symbol}',

        // Info
        priceImpact: 'Impacto en Precio',
        slippage: 'Tolerancia al Slippage',
        minimumReceived: 'Mínimo Recibido',
        swapFee: 'Comisión de Swap',
        route: 'Ruta',

        // Settings
        settings: 'Ajustes',
        slippageTolerance: 'Tolerancia al Slippage',
        custom: 'Personalizado',

        // Pool info
        poolInfo: 'Info del Pool',
        ethReserve: 'Reserva BNB',
        bkcReserve: 'Reserva BKC',
        totalSwaps: 'Total de Swaps',
        totalVolume: 'Volumen Total',
        contractAddress: 'Dirección del Contrato',
        viewContract: 'Ver Contrato',
        backcoinPool: 'Pool Backchain',

        // Chart
        chart: {
            bkcPrice: 'Precio BKC',
            noDataYet: 'Sin datos de precio aún. El gráfico se llenará con el tiempo.',
        },

        // Toast
        toast: {
            swapSuccess: '¡Swap completado!',
            swapFailed: 'Swap fallido: {error}',
            approving: 'Aprobando BKC...',
            approvalComplete: '¡Aprobación completa!',
            approvalFailed: 'Aprobación fallida',
            swapping: 'Haciendo swap...',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CHARITY — CharityPage.js
    // ═══════════════════════════════════════════════════════════════════════
    charity: {
        title: 'Charity Pool',
        subtitle: 'Apoya causas con BNB',

        // Stats
        totalDonated: 'Total Donado',
        totalCampaigns: 'Total de Campañas',
        activeCampaigns: 'Campañas Activas',
        totalDonors: 'Total de Donantes',

        // Status
        statusActive: 'Activa',
        statusClosed: 'Cerrada',
        statusWithdrawn: 'Retirada',

        // Categories
        categories: {
            animal: 'Bienestar Animal',
            humanitarian: 'Ayuda Humanitaria',
            environment: 'Medio Ambiente',
            medical: 'Salud y Medicina',
            education: 'Educación y Juventud',
            disaster: 'Ayuda en Desastres',
            community: 'Comunidad y Social',
        },

        // Campaign Card
        raised: 'Recaudado',
        goal: 'Meta',
        donors: 'donantes',
        daysLeft: '{days} días restantes',
        goalReached: '¡Meta Alcanzada!',
        boosted: 'Boosteada',
        boostDaysLeft: '{days}d de boost restantes',

        // Actions
        donate: 'Donar',
        createCampaign: 'Crear Campaña',
        shareCampaign: 'Compartir Campaña',
        boostCampaign: 'Boostear Campaña',
        closeCampaign: 'Cerrar Campaña',
        withdrawFunds: 'Retirar Fondos',

        // Create Wizard
        create: {
            step1: 'Elegir Categoría',
            step2: 'Detalles de Campaña',
            step3: 'Revisar y Crear',
            campaignTitle: 'Título de la Campaña',
            description: 'Descripción',
            goalAmount: 'Meta (BNB)',
            duration: 'Duración (días)',
            addMedia: 'Agregar Media',
            review: 'Revisar',
            create: 'Crear Campaña',
        },

        // Donate Modal
        donateModal: {
            title: 'Donar a la Campaña',
            amount: 'Cantidad (BNB)',
            presets: 'Montos Rápidos',
            donateNow: 'Donar Ahora',
        },

        // Boost Modal
        boostModal: {
            title: 'Boostear Campaña',
            boostDays: 'Días de Boost',
            costPerDay: '{cost} BNB/día',
            totalCost: 'Costo Total',
            boostNow: 'Boostear Ahora',
        },

        // Toast
        toast: {
            donationSuccess: '¡Donación exitosa!',
            donationFailed: 'Donación fallida: {error}',
            createSuccess: '¡Campaña creada exitosamente!',
            createFailed: 'Creación de campaña fallida: {error}',
            boostSuccess: '¡Campaña boosteada exitosamente!',
            boostFailed: 'Boost fallido: {error}',
            closeSuccess: 'Campaña cerrada',
            closeFailed: 'Error al cerrar campaña: {error}',
            withdrawSuccess: '¡Fondos retirados exitosamente!',
            withdrawFailed: 'Retiro fallido: {error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // AIRDROP — AirdropPage.js
    // ═══════════════════════════════════════════════════════════════════════
    airdrop: {
        title: 'Airdrop',
        subtitle: 'Gana puntos, sube en el ranking, recibe recompensas',

        // Tabs
        tabs: {
            earn: 'Ganar',
            ranking: 'Ranking',
            history: 'Historial',
            nftRewards: 'Premios NFT',
        },

        // Earn Tab
        totalPoints: 'Puntos Totales',
        currentRank: 'Ranking Actual',
        multiplier: 'Multiplicador',
        postsApproved: 'Posts Aprobados',

        // Sharing
        shareOnX: 'Compartir en X',
        shareOnInstagram: 'Compartir en Instagram',
        shareOnOther: 'Compartir en Otro',
        shared: 'Compartido',
        shareToEarn: 'Comparte para ganar puntos',
        postFirst: 'Publica en Agora primero',

        // Platform usage
        platformUsage: 'Uso de la Plataforma',
        claimFaucet: 'Usar Faucet',
        delegateBkc: 'Delegar BKC',
        playFortune: 'Jugar Fortune',
        buyNft: 'Comprar NFT',
        sellNft: 'Vender NFT',
        listForRent: 'Listar para Renta',
        rentNft: 'Rentar NFT',
        notarizeDoc: 'Notarizar Documento',
        claimRewards: 'Reclamar Recompensas',

        // Inline composer
        writePost: 'Escribe algo para publicar...',
        createPost: 'Crear Post',
        postCreated: 'Post creado. Ahora comparte en X, Instagram y más.',

        // Ranking
        ranking: {
            byPosts: 'Por Posts',
            byPoints: 'Por Puntos',
            rank: 'Puesto',
            user: 'Usuario',
            posts: 'Posts',
            points: 'Puntos',
        },

        // NFT rewards section
        nftRewards: {
            title: 'Premios NFT',
            description: '¡Los usuarios mejor rankeados ganan NFT Boosters!',
            totalNfts: '{count} NFTs en total',
        },

        // Audit
        audit: {
            underReview: 'Tu post está en auditoría de seguridad...',
            verifying: 'Verificando autenticidad del post...',
            checking: 'Revisando cumplimiento de reglas...',
            reviewInProgress: 'Revisión de seguridad en progreso...',
            analyzing: 'Equipo de auditoría analizando tu envío...',
        },

        // Toast
        toast: {
            postTooLong: 'Post muy largo (máximo 2,000 caracteres).',
            writeFirst: 'Escribe algo para publicar.',
            uploadFailed: 'Subida fallida: {error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // REFERRAL — ReferralPage.js
    // ═══════════════════════════════════════════════════════════════════════
    referral: {
        title: 'Sistema Tutor',
        heroTitle: 'Invita Amigos,',
        heroHighlight: 'Gana para Siempre',
        heroDesc: 'Cada usuario tiene un tutor. Cuando tu amigo usa el protocolo, tú ganas automáticamente una parte de las comisiones — para siempre, garantizado por smart contracts.',

        // Share Card
        yourTutorLink: 'Tu Enlace de Tutor',
        connectForLink: 'Conecta tu billetera para obtener tu enlace de tutor',

        // Stats
        tutters: 'Estudiantes',
        yourTutor: 'Tu Tutor',
        noneYet: 'Ninguno aún',

        // Earnings
        yourEarnings: 'Tus Ganancias',
        accumulated: 'Acumulado de la actividad de estudiantes',
        shareToStart: 'Comparte tu enlace de tutor para empezar a ganar. Recibirás una parte de todas las comisiones que tus estudiantes paguen.',
        noFeesYet: 'Tus estudiantes aún no han generado comisiones. Las ganancias aparecerán aquí automáticamente cuando usen el protocolo.',

        // How it works
        howItWorks: {
            title: 'Cómo Funciona',
            step1Title: 'Comparte Tu Enlace',
            step1Desc: 'Envía tu enlace de tutor a amigos. Cuando se conecten y realicen su primera acción, te conviertes en su tutor — para siempre.',
            step2Title: 'Ellos Usan el Protocolo',
            step2Desc: 'Cada vez que hacen stake, juegan Fortune, compran NFTs, o cualquier acción — una parte de la comisión va directamente a ti.',
            step3Title: 'Ganas Automáticamente',
            step3Desc: '10% de todas las comisiones BNB + 5% de recompensas BKC de staking. Totalmente automático, on-chain, para siempre.',
        },

        // Change tutor
        changeTutor: {
            title: 'Cambiar Tutor',
            desc: 'Ingresa la nueva dirección del tutor',
            placeholder: '0x...',
            confirm: 'Cambiar Tutor',
            warning: 'Esto reemplazará a tu tutor actual. Tu nuevo tutor ganará de tu actividad futura.',
        },

        // Toast
        toast: {
            linkCopied: '¡Enlace de tutor copiado!',
            withdrawSuccess: '¡Ganancias retiradas exitosamente!',
            withdrawFailed: 'Retiro fallido: {error}',
            changeTutorSuccess: '¡Tutor cambiado exitosamente!',
            changeTutorFailed: 'Cambio de tutor fallido: {error}',
            invalidAddress: 'Dirección inválida',
            cannotBeSelf: 'No puedes ser tu propio tutor',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // RENTAL — RentalPage.js (Boost Market)
    // ═══════════════════════════════════════════════════════════════════════
    rental: {
        title: 'Boost Market',
        subtitle: 'Renta Booster NFTs para amplificar tus recompensas',

        // Tabs
        marketplace: 'Mercado',
        myRentals: 'Mis Rentas',
        myListings: 'Mis Listados',

        // Filters
        allTiers: 'Todos los Tiers',
        sortByBoosted: 'Boosteados',
        sortByPrice: 'Menor Precio',
        sortByExpiry: 'Por Expirar',

        // Listing Card
        perDay: '/día',
        listed: 'Listado',
        rented: 'Rentado',
        available: 'Disponible',
        timeLeft: '{time} restante',
        expired: 'Expirado',
        booster: 'Booster',
        yours: 'TUYO',

        // Keep Rate Descriptions
        keepAllRewards: '¡Conserva 100% de tus recompensas de staking!',
        saveBurns: 'Ahorra {rate}% en quemado de claims',
        keepRewards100: '¡Conserva 100% de las recompensas!',
        keepRewardsRate: 'Conserva {rate}% de recompensas en claims',
        keepRewardsOf: 'Conserva {rate}% de recompensas',

        // Connected status
        connected: 'Conectado',

        // Rent Modal
        rentNft: 'Rentar NFT',
        rentBooster: 'Rentar Booster',
        rentalDays: 'Días de Renta',
        rentalCost: 'Costo de Renta',
        ecosystemFee: 'Comisión del Ecosistema',
        ecosystemFeePercent: 'Comisión del Ecosistema (20%)',
        totalCost: 'Costo Total',
        rentNow: 'Rentar Ahora',
        rent1Day: 'Rentar 1 Día',
        oneDayDuration: '1 Día (24 horas)',
        duration: 'Duración',
        needBnb: 'Necesitas {amount} BNB',
        balanceWarning: 'Tu saldo: {balance} BNB — necesitas {deficit} BNB más',

        // List Modal
        listForRent: 'Listar para Renta',
        listNftForRent: 'Listar NFT para Renta',
        selectNft: 'Seleccionar NFT',
        selectNftPlaceholder: '-- Selecciona un NFT --',
        pricePerDay: 'Precio por Día (BNB)',
        listNow: 'Listar Ahora',
        listNft: 'Listar NFT',
        listBtn: 'Listar',
        fixedDayNote: 'Renta fija de 1 día. El NFT se re-lista automáticamente después de cada renta.',
        enterPrice: 'Ingresa un precio válido',

        // Earnings
        totalLifetimeEarnings: 'Ganancias Totales de por Vida',
        pendingBnb: 'BNB Pendiente',
        pendingEarnings: 'Ganancias Pendientes',
        withdrawEarnings: 'Retirar Ganancias',
        noEarnings: 'Sin ganancias pendientes',

        // My Listings / My Rentals empty states
        viewListings: 'Ver tus listados',
        viewRentals: 'Ver tus rentas activas',
        noListingsTitle: 'Sin Listados Aún',
        noListingsMsg: '¡Lista tu primer NFT para empezar a ganar BNB!',
        noRentalsTitle: 'Sin Rentas Activas',
        noRentalsMsg: '¡Renta un NFT booster para conservar más recompensas de staking!',

        // Boost Tiers
        boostTiers: 'Tiers de Boost',
        boostTiersDesc: 'Diamond = Conserva 100% | Gold = 90% | Silver = 80% | Bronze = 70% — Sin NFT: 50% reciclado.',

        // Boost Modal
        boostListing: 'Boostear Listado',
        boostDuration: 'Duración del Boost (días)',
        boostExplanation: 'Los listados boosteados aparecen primero en el mercado. Elige cuántos días boostear.',
        boostExtendNote: 'Los nuevos días se extenderán desde la expiración actual.',
        boostedDaysRemaining: 'Boosteado — {days} días restantes',
        notBoosted: 'Sin boost',
        costPerDay: 'Costo por día',
        calculating: 'Calculando...',

        // Boost buttons
        boost: {
            extend: 'Extender',
            boost: 'Boost',
            now: 'Boostear Ahora',
            extendBoost: 'Extender Boost',
        },

        // Withdraw NFT
        confirmWithdrawNft: '¿Retirar este NFT del mercado?',

        // Share
        shareText: '¡Renta NFT Boosters en Backchain Boost Market!\n\nConserva hasta 100% de tus recompensas de staking rentando un NFT booster.\n\n{url}\n\n#Backchain #DeFi #BNBChain #opBNB #Web3',

        // How It Works
        howItWorks: {
            title: 'Cómo Funciona el Boost Market',
            step1: 'Los dueños de NFT listan sus Boosters para renta',
            step2: 'Los inquilinos pagan BNB para usar el boost temporalmente',
            step3: 'El boost se aplica automáticamente a las recompensas de staking',
            step4: 'Cuando expira, el NFT regresa al dueño',
        },

        // Toast
        toast: {
            rentSuccess: '¡NFT rentado exitosamente!',
            rentFailed: 'Renta fallida: {error}',
            listSuccess: '¡NFT listado para renta!',
            listFailed: 'Listado fallido: {error}',
            withdrawSuccess: '¡Ganancias retiradas!',
            withdrawFailed: 'Retiro de ganancias fallido: {error}',
            withdrawNftSuccess: '¡NFT retirado exitosamente!',
            delistSuccess: 'NFT removido del listado',
            delistFailed: 'Error al remover del listado: {error}',
            promoteSuccess: '¡Listado promovido!',
            promoteFailed: 'Promoción fallida: {error}',
            boostSuccess: '¡Listado boosteado por {days} días!',
            boostFailed: 'Boost fallido: {error}',
            linkCopied: '¡Enlace copiado!',
            copyFailed: 'No se pudo copiar el enlace',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // OPERATOR — OperatorPage.js
    // ═══════════════════════════════════════════════════════════════════════
    operator: {
        title: 'Ser Operador',
        badge: 'Construye en Backchain',
        heroTitle: 'Construye en Backchain, Gana Comisiones Perpetuas',
        heroDesc: 'Cualquiera puede construir un frontend para Backchain (sitio web, app, bot) y ganar comisiones automáticas en cada transacción de tus usuarios. Sin aprobación. Sin permiso.',

        // How it works
        howItWorks: {
            title: 'Cómo Funciona',
            step1Title: 'Construye Tu Frontend',
            step1Desc: 'Crea un sitio web, app o bot que interactúe con los contratos de Backchain.',
            step2Title: 'Registra Tu Dirección',
            step2Desc: 'Configura tu dirección como operador en tu frontend.',
            step3Title: 'Gana Automáticamente',
            step3Desc: 'Cada transacción de tus usuarios genera comisión para ti — para siempre.',
        },

        // Modules
        modulesTitle: 'Módulos del Ecosistema',
        moduleName: 'Módulo',
        operatorFee: 'Comisión Operador',
        status: 'Estado',
        enabled: 'Activo',
        disabled: 'Desactivado',

        // Earnings
        yourEarnings: 'Tus Ganancias',
        pendingBnb: 'BNB Pendiente',
        withdraw: 'Retirar',
        noEarnings: 'Conecta tu billetera para ver tus ganancias',

        // Code Example
        codeExample: 'Ejemplo de Código',
        codeDesc: 'Registra tu dirección como operador:',

        // Toast
        toast: {
            withdrawSuccess: '¡Ganancias retiradas exitosamente!',
            withdrawFailed: 'Retiro fallido: {error}',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TOKENOMICS — TokenomicsPage.js
    // ═══════════════════════════════════════════════════════════════════════
    tokenomics: {
        title: 'Tokenomics',
        subtitle: 'Ecosistema modular de smart contracts. Rendimiento real de comisiones del protocolo. Deflacionario por diseño. Sin llaves admin. Imparable.',

        // Supply
        tokenSupply: 'Suministro de Tokens',
        erc20OnOpbnb: 'BKC — ERC-20 en opBNB',
        maxSupply: 'Suministro Máximo',
        circulating: 'Circulante',
        unminted: 'Sin Mintear',
        mintedSoFar: '{pct}% minteado hasta ahora',

        // TGE
        tgeAllocation: 'Asignación TGE',
        tokensAtLaunch: 'Tokens en el Lanzamiento',
        liquidityPool: 'Pool de Liquidez',
        airdropReserve: 'Reserva de Airdrop',
        phase: 'Fase',

        // Fee Flow
        feeFlow: 'Flujo de Comisiones',
        feeFlowDesc: 'Cada transacción genera comisiones en BNB que fluyen por el ecosistema.',
        operatorCut: 'Parte del Operador',
        tutorCut: 'Parte del Tutor',
        protocol: 'Protocolo',

        // BKC Distribution
        bkcDistribution: 'Distribución BKC',
        stakers: 'Stakers',
        burn: 'Quema',
        treasury: 'Tesorería',

        // Modules
        ecosystemModules: 'Módulos del Ecosistema',

        // Deflationary
        deflationaryDesign: 'Diseño Deflacionario',
        burnMechanisms: 'Mecanismos de Quema',

        // CTAs
        startStaking: 'Empezar Staking',
        becomeOperator: 'Ser Operador',
        inviteFriends: 'Invitar Amigos',
        footer: '¿Listo para unirte?',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ABOUT — AboutPage.js
    // ═══════════════════════════════════════════════════════════════════════
    about: {
        heroTitle: '¿Qué es Backchain?',
        heroSubtitle: 'Ecosistema DeFi modular en opBNB. Sin llaves admin. Imparable.',

        // Hero badges
        badgeCommunity: 'Propiedad Comunitaria',
        badgeSustaining: 'Auto-Sostenible',
        badgeUnstoppable: 'Imparable',
        badgeOpenSource: 'Código Abierto',

        // Philosophy
        philosophy: 'La Filosofía',
        philosophySub: 'Por qué existe Backchain',
        philosophyText: 'La mayoría de protocolos DeFi son controlados por equipos que pueden pausar contratos, bloquear billeteras o cambiar las reglas. Backchain fue construido con una filosofía diferente: <strong class="text-white">una vez desplegado, el código corre para siempre</strong> — ningún admin puede detenerlo, ninguna empresa puede cerrarlo, y ningún gobierno puede censurarlo.',
        noBlacklists: 'Sin Listas Negras',
        noBlacklistsDesc: 'Toda billetera tiene acceso igualitario. Ninguna dirección puede ser bloqueada o restringida.',
        immutableCore: 'Núcleo Inmutable',
        immutableCoreDesc: 'Los contratos centrales son inmutables. Los módulos pueden agregarse o removerse sin cambiar el código existente.',

        // Architecture
        architecture: {
            title: 'Arquitectura del Ecosistema',
            subtitle: 'Contratos modulares conectados a un hub central',
            hub: 'Ecosistema',
            hubDesc: 'Hub Central',
        },
        hubSpokeText: 'Backchain usa una <strong class="text-white">arquitectura modular</strong>. El <span class="text-amber-400 font-medium">Hub</span> (BackchainEcosystem) es el núcleo inmutable — gestiona todas las comisiones, distribución de recompensas, comisiones de operadores y referidos de tutores. Los <span class="text-emerald-400 font-medium">Spokes</span> son servicios independientes que se conectan al Hub. Se pueden agregar nuevos spokes en cualquier momento sin cambiar los contratos existentes.',
        hubTitle: 'El Hub (BackchainEcosystem)',
        hubFeature1: 'Cobro de comisiones y distribución por módulo',
        hubFeature2: 'Comisiones de operadores (10-20% para constructores)',
        hubFeature3: 'Sistema de referidos tutores (10% BNB + 5% BKC)',
        hubFeature4: 'Motor de Buyback & Burn (deflacionario)',
        spokesTitle: 'Los Spokes (Módulos de Servicio)',
        spokeFeature1: 'Cada spoke genera comisiones para el ecosistema',
        spokeFeature2: 'Despliegue y actualización independientes',
        spokeFeature3: 'Más spokes = más ingresos = mayores recompensas',

        // Module categories
        defiCore: 'DeFi Core',
        nftEcosystem: 'Ecosistema NFT',
        communityServices: 'Comunidad y Servicios',
        infraGovernance: 'Infraestructura y Gobernanza',

        // Modules
        modules: {
            staking: 'Staking Pool',
            stakingDesc: 'Delega BKC con bloqueo temporal. Gana BNB + recompensas BKC.',
            nftMarket: 'NFT Pool',
            nftMarketDesc: 'Mercado con curva de enlace. Compra bajo, vende alto.',
            fortune: 'Fortune Pool',
            fortuneDesc: 'Juego on-chain con probabilidades de 2x, 5x y 100x',
            agora: 'Agora',
            agoraDesc: 'Protocolo social descentralizado. Posts, likes, follows on-chain.',
            notary: 'Notaría',
            notaryDesc: 'Certifica documentos on-chain. Prueba inmutable de existencia.',
            charity: 'Charity Pool',
            charityDesc: 'Recaudación transparente. Seguimiento de donaciones on-chain.',
            rental: 'Rental Manager',
            rentalDesc: 'Renta boosts de NFT de otros usuarios. Mercado AirBNFT.',
            liquidity: 'Pool de Liquidez',
            liquidityDesc: 'AMM de producto constante para trading BNB/BKC.',
        },

        // Extended module descriptions (mod.*)
        mod: {
            bkcToken: 'BKC Token',
            bkcTokenDesc: 'ERC-20 con minteo basado en actividad. Límite 200M.',
            buybackMiner: 'Buyback Miner',
            buybackMinerDesc: 'Convierte comisiones BNB en BKC vía minería con curva de escasez.',
            rewardBooster: 'RewardBooster NFTs',
            rewardBoosterDesc: 'NFTs de 4 tiers (Diamond/Gold/Silver/Bronze) que reducen la tasa de quemado en staking.',
            nftFusion: 'NFT Fusion',
            nftFusionDesc: 'Fusiona 2 NFTs del mismo tier en 1 de tier superior, o divide hacia abajo.',
            ecosystem: 'BackchainEcosystem',
            ecosystemDesc: 'Hub maestro — comisiones, operadores, tutores, splits de recompensas.',
            governance: 'Gobernanza',
            governanceDesc: 'Descentralización progresiva: Admin → Multisig → Timelock → DAO.',
            faucet: 'Faucet Testnet',
            faucetDesc: 'BKC gratis para pruebas en testnet de opBNB.',
            ibackchain: 'IBackchain',
            ibackchainDesc: 'Interfaces compartidas para todas las interacciones con contratos.',
        },

        // Fee System
        feeSystemText: 'Cada acción del protocolo genera una pequeña comisión en BNB. El smart contract divide automáticamente esta comisión entre múltiples beneficiarios — creando incentivos alineados para usuarios, constructores, referidores y el protocolo.',
        whereFeesGo: 'A Dónde Van Tus Comisiones',
        userPaysFee: 'Usuario paga comisión (BNB)',
        ecosystemSplits: 'BackchainEcosystem divide automáticamente',
        feeTutor: 'Tutor',
        feeTutorDesc: 'Quien te refirió',
        feeOperator: 'Operador',
        feeOperatorDesc: 'Constructor de la app',
        feeBuyback: 'Buyback',
        feeBuybackDesc: 'Comprar + quemar BKC',
        feeTreasury: 'Tesorería',
        feeTreasuryDesc: 'Crecimiento del protocolo',
        feeDisclaimer: 'La distribución exacta varía por módulo. Todos los porcentajes son inmutables on-chain.',
        everyoneWins: 'Todos Ganan',
        everyoneWinsDesc: '¿Sin tutor? → 10% se quema. ¿Sin operador? → La parte del operador se quema. En cada escenario, o se recompensa a un participante o BKC se vuelve más escaso. El sistema no tiene fugas.',

        // Mining
        miningTitle: 'Minería por Compra',
        miningSub: 'Proof-of-Purchase: Usar = Minar',
        miningText: 'En Backchain, <strong class="text-white">usar la plataforma ES minar</strong>. Cuando compras un NFT Booster, el BuybackMiner convierte el BNB gastado en tokens BKC recién minteados vía una curva de escasez — cuanto más se ha minado, más difícil se pone, igual que Bitcoin.',
        howMiningWorks: 'Cómo Funciona la Minería',
        miningStep1: 'Compras un NFT Booster',
        miningStep1Desc: 'Del pool de curva de enlace (Diamond, Gold, Silver, Bronze)',
        miningStep2: 'BuybackMiner Convierte BNB → BKC',
        miningStep2Desc: 'Curva de escasez: los mineros tempranos obtienen más BKC por BNB',
        miningStep3: 'Recompensas Distribuidas',
        miningStep3Desc: '70% a stakers (proporcional al pStake), 30% a tesorería',
        stakerRewards: 'Recompensas de Stakers',
        stakerRewardsDesc: 'Distribuidas según peso de pStake',
        treasuryDesc: 'Financia el desarrollo del ecosistema',

        // Growth Programs
        growthTitle: 'Programas de Crecimiento',
        growthSub: 'Dos sistemas para hacer crecer el ecosistema',
        tutorSystem: 'Sistema Tutor',
        tutorSystemSub: 'Tutela nuevos usuarios, gana para siempre',
        tutorDesc: 'Comparte tu enlace de tutor. Cuando alguien se une a través de él, se convierte en tu estudiante y ganas <strong class="text-white">10% de sus comisiones BNB</strong> + <strong class="text-white">5% de sus claims BKC</strong> — para siempre.',
        operatorSystem: 'Sistema de Operadores',
        operatorSystemSub: 'Construye una app, gana comisiones',
        operatorDesc: 'Construye tu propio frontend, bot o integración. Configura tu billetera como <strong class="text-white">operador</strong> y gana <strong class="text-white">10-20% de cada comisión</strong> generada a través de tu app. Sin registro necesario.',
        learnMore: 'Saber Más',

        // Why Backchain features
        noVCs: 'Sin VCs, Sin Pre-mine, Sin Insiders',
        noVCsDesc: '35% del TGE (14M BKC) va directamente a la comunidad vía airdrop. 65% va al pool de liquidez. Sin inversores tirando tokens encima de ti. El equipo gana de la misma forma que tú — usando el protocolo.',
        realUtilityDesc: 'Notariza documentos legales. Juega juegos verificablemente justos. Comercia NFTs en curvas de enlace. Renta poder de boost. Publica en una red social resistente a la censura. Dona a caridades transparentes. Estas no son promesas — son contratos activos en opBNB.',
        sustainableYield: 'Rendimiento Sostenible, No Inflación',
        sustainableYieldDesc: 'Las recompensas de staking provienen de comisiones reales del protocolo (BNB) y actividad de minería — no de imprimir tokens. Cuanto más se usa el ecosistema, mayor el rendimiento real. Sin ponzinomics.',
        alignedIncentives: 'Incentivos Alineados en Cada Nivel',
        alignedIncentivesDesc: 'Los usuarios ganan haciendo staking. Los tutores ganan invitando. Los operadores ganan construyendo. El protocolo gana creciendo. Ningún participante extrae valor de otro — todos se benefician del crecimiento del uso.',

        // Tech Stack
        techStack: 'Stack Tecnológico',
        techStackSub: 'Construido sobre infraestructura probada en batalla',

        // CTA
        ctaDesc: 'Empieza a ganar puntos de airdrop hoy. Haz stake, tradea, juega o construye — cada acción cuenta.',
        whitepaper: 'Whitepaper',

        // Whitepaper Modal
        tokenomicsPaper: 'Tokenomics Paper V3',
        tokenomicsPaperDesc: 'Distribución, Minería y Motores de Escasez',
        technicalPaper: 'Technical Whitepaper V2',
        technicalPaperDesc: 'Arquitectura, Contratos y Sistema de Comisiones',

        // Footer
        footer: 'Construido por la comunidad, para la comunidad.',

        // Key Features
        keyFeatures: {
            title: 'Características Clave',
            noAdmin: 'Sin Llaves Admin',
            noAdminDesc: 'Contratos inmutables. Nadie puede pausar, modificar o retirar fondos.',
            realYield: 'Rendimiento Real',
            realYieldDesc: 'Recompensas de comisiones reales del protocolo, no de emisión inflacionaria.',
            modular: 'Modular',
            modularDesc: 'Los módulos se pueden agregar/remover sin afectar el ecosistema.',
            deflationary: 'Deflacionario',
            deflationaryDesc: '5% de todas las comisiones BKC se queman permanentemente.',
        },

        // Links
        links: {
            title: 'Enlaces del Proyecto',
            website: 'Sitio Web',
            docs: 'Documentación',
            github: 'GitHub',
            telegram: 'Telegram',
            twitter: 'X (Twitter)',
        },

        // Contract addresses
        contracts: {
            title: 'Direcciones de Contratos',
            viewOnExplorer: 'Ver en Explorer',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TUTORIALS — TutorialsPage.js
    // ═══════════════════════════════════════════════════════════════════════
    tutorials: {
        title: 'Video Tutoriales',
        subtitle: 'Aprende todo sobre el ecosistema Backchain',
        watchOnYoutube: 'Ver en YouTube',
        subscribe: 'Suscríbete en YouTube',
        subscribeDesc: 'Mantente al día con nuevos tutoriales y actualizaciones',
        subscribeBtn: 'Suscribirse',
        comingSoon: 'Próximamente',

        // Hero
        heroTitle: 'Domina el Ecosistema Backcoin',
        heroSubtitle: 'Tutoriales en video completos cubriendo cada función — desde tu primer BKC hasta construir tu propio negocio como operador',
        videoCount: 'Videos',
        languages: '2 Idiomas',
        categoriesLabel: 'Categorías',
        everyFeature: 'Cada función del ecosistema',

        // Filters
        filterAll: 'Todos',

        // Categories
        categories: {
            overview: 'Qué es Backcoin',
            gettingStarted: 'Primeros Pasos',
            stakingMining: 'Staking y Minería',
            nftBoosters: 'NFT Boosters',
            fortunePool: 'Fortune Pool',
            community: 'Comunidad y Social',
            services: 'Servicios',
            advanced: 'Avanzado',
        },

        // Tags
        tags: {
            beginner: 'Principiante',
            intermediate: 'Intermedio',
            advanced: 'Avanzado',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN — AdminPage.js
    // ═══════════════════════════════════════════════════════════════════════
    admin: {
        title: 'Panel Admin',
        accessDenied: 'Acceso Denegado',
        restrictedMsg: 'Esta página está restringida a administradores.',
        enterPassword: 'Ingresa la clave admin para continuar',
        login: 'Iniciar Sesión',
        quickActions: 'Acciones Rápidas',

        // Tabs
        tabs: {
            overview: 'Resumen',
            submissions: 'Envíos',
            users: 'Usuarios',
            tasks: 'Tareas',
            settings: 'Ajustes',
        },

        // Overview
        overview: {
            totalUsers: 'Total de Usuarios',
            totalSubmissions: 'Total de Envíos',
            pendingReview: 'Pendientes de Revisión',
            totalPoints: 'Puntos Totales',
        },

        // Status labels
        status: {
            pending: 'Pendiente de Revisión',
            auditing: 'En Auditoría',
            approved: 'Aprobado',
            rejected: 'Rechazado',
            flagged: 'Marcado',
        },

        // Actions
        approveAll: 'Aprobar Todos',
        rejectAll: 'Rechazar Todos',
        exportCsv: 'Exportar CSV',
        reloadData: 'Recargar Datos',
        ban: 'Banear',
        unban: 'Desbanear',

        // Faucet
        faucet: {
            status: 'Estado del Faucet',
            paused: 'PAUSADO',
            active: 'ACTIVO',
            pause: 'Pausar',
            unpause: 'Reanudar',
        },

        // Toast
        toast: {
            loadFailed: 'Error al cargar datos de admin.',
            txSent: 'Transacción enviada...',
            faucetPaused: '¡Faucet PAUSADO exitosamente!',
            faucetUnpaused: '¡Faucet REANUDADO exitosamente!',
            reloading: 'Recargando datos...',
            noUsersExport: 'No hay usuarios para exportar.',
            exportedUsers: '{count} usuarios exportados.',
            noSubmissionsExport: 'No hay envíos para exportar.',
            exportedSubmissions: '{count} envíos exportados.',
            submissionApproved: '¡Envío APROBADO!',
            submissionRejected: '¡Envío RECHAZADO!',
            userBanned: 'Usuario BANEADO.',
            userUnbanned: 'Usuario DESBANEADO.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOCIAL — SocialMedia.js
    // ═══════════════════════════════════════════════════════════════════════
    social: {
        title: 'Únete a la Comunidad Backcoin',
        subtitle: 'Conecta con miles de holders, mantente al día con el lanzamiento en Mainnet y participa en airdrops exclusivos.',

        // Telegram
        telegramTitle: 'Grupo Oficial de Telegram',
        telegramDesc: 'Chatea con el equipo y la comunidad \u2022 Soporte 24/7',
        joinNow: 'ÚNETE AHORA',

        // Social Cards
        twitter: 'X (Twitter)',
        twitterDesc: 'Últimas noticias y anuncios',
        youtube: 'YouTube',
        youtubeDesc: 'Video tutoriales y AMAs',
        instagram: 'Instagram',
        instagramDesc: 'Actualizaciones visuales e historias',
        tiktok: 'TikTok',
        tiktokDesc: 'Clips cortos y contenido viral',
        facebook: 'Facebook',
        facebookDesc: 'Discusiones de la comunidad',

        // Warning
        verifyLinks: 'Siempre verifica los enlaces. Los admins oficiales nunca envían DM pidiendo fondos.',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FEEDBACK — ui-feedback.js
    // ═══════════════════════════════════════════════════════════════════════
    feedback: {
        // RPC Errors
        metamaskPending: 'MetaMask tiene una solicitud pendiente. Abre tu extensión de MetaMask y completa o rechaza cualquier acción pendiente.',
        txCancelled: 'Transacción cancelada por el usuario.',
        insufficientFunds: 'Saldo insuficiente en tu billetera.',
        metamaskNotDetected: 'MetaMask no detectado',

        // NFT Wallet
        nftAddedToWallet: '¡NFT {tier} #{id} agregado a la billetera!',
        nftNotAdded: 'NFT no agregado a la billetera',
        failedToAddNft: 'Error al agregar NFT a la billetera',

        // Timer
        unlocked: 'Desbloqueado',

        // Wallet
        walletDisconnected: 'Billetera desconectada.',

        // Share Modal
        inviteEarn: 'Invitar y Ganar',
        shareBackchain: 'Compartir Backchain',
        shareTutorDesc: 'Comparte tu enlace de tutor — gana <strong class="text-amber-400">10% BNB</strong> + <strong class="text-amber-400">5% BKC</strong> de cada amigo',
        connectForTutorLink: '¡Conecta tu billetera para generar un enlace de invitación personal con tu referido de tutor incluido!',
        shareConnectedText: 'Únete a Backchain — ¡seré tu tutor! Haz stake de BKC, gana recompensas, y yo también ganaré. Usa mi enlace de invitación:',
        shareDisconnectedText: 'Conoce Backchain — DeFi Imparable en opBNB. Haz stake, tradea NFTs, juega Fortune Pool y más.',
        badge10BNB: '10% Comisiones BNB',
        badge5BKC: '5% Claims BKC',
        badgeForever: 'Para Siempre',
        tutorEmbedded: 'Tu dirección de tutor <span class="font-mono text-zinc-400">{addr}</span> está incluida en este enlace',
        footerConnected: 'Los amigos que se unan por tu enlace te asignan automáticamente como su tutor',
        footerDisconnected: 'Comparte ahora — cada nuevo usuario fortalece el ecosistema',
        shareOn: {
            twitter: 'Twitter',
            telegram: 'Telegram',
            whatsapp: 'WhatsApp',
            copyLink: 'Copiar Enlace',
        },
        linkCopied: '¡Enlace de tutor copiado!',
        inviteLinkCopied: '¡Enlace de invitación copiado!',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // AGORA — pages/agora/*.js
    // ═══════════════════════════════════════════════════════════════════════
    agora: {
        // Header / Nav
        brandName: 'Agora',
        feed: 'Feed',
        discover: 'Descubrir',
        profile: 'Perfil',
        post: 'Publicar',
        createProfile: 'Crear Perfil',

        // Compose
        compose: {
            placeholder: '¿Qué pasa on-chain?',
            post: 'Publicar',
            reply: 'Responder',
            addImage: 'Agregar Imagen',
            addVideo: 'Agregar Video',
            addMedia: 'Agregar media',
            charCount: '{current}/{max}',
            posting: 'Publicando...',
            uploadingMedia: 'Subiendo media...',
            video: 'Video',
            goLive: 'En Vivo',
            live: 'EN VIVO',
            free: 'GRATIS',
            newPost: 'Nuevo Post',
            createProfileBanner: 'Crea tu perfil para obtener un nombre de usuario y empezar a publicar',
        },

        // Feed
        feedEmpty: 'Sin posts aún. ¡Sé el primero!',
        feedEmptySubtext: '¡Sé el primero en publicar en la red social imparable!',
        discoverEmpty: 'Sin posts en tendencia aún',
        discoverSubtext: '¡Sé el primero en publicar! Los posts se clasifican por engagement — likes, respuestas y Super Likes aumentan la visibilidad.',
        discoverRankedBy: 'Clasificados por engagement — likes, respuestas, reposts y Super Likes',
        loadingPosts: 'Cargando posts...',
        noMorePosts: 'No hay más posts',
        loadMore: 'Cargar Más',
        comingSoon: '¡Próximamente!',
        comingSoonDesc: 'Agora está siendo desplegada. ¡La red social imparable estará activa pronto!',
        noTagPosts: 'Sin posts de {tag}',
        noTagPostsSubtext: '¡Prueba otra etiqueta o sé el primero en publicar!',
        welcomeTitle: 'Bienvenido a Agora',
        welcomeStep1: 'Crea tu perfil',
        welcomeStep2: 'Publica tu primer pensamiento',
        welcomeStep3: 'Gana Super Likes',
        readMore: 'Leer más',
        more: 'más',
        less: 'menos',
        endStream: 'Terminar Stream',
        joinLiveStream: 'Unirse al Stream en Vivo',
        leave: 'Salir',
        originalPostNotFound: 'Post original no encontrado',

        // Post Card
        postCard: {
            like: 'Like',
            liked: 'Like',
            reply: 'Responder',
            repost: 'Repost',
            reposted: '{name} reposteó',
            superLike: 'Super Like',
            downvote: 'Downvote',
            share: 'Compartir',
            tip: 'Propina',
            tipAuthor: 'Dar Propina',
            boost: 'Boost',
            boostPost: 'Boostear Post',
            report: 'Reportar',
            edit: 'Editar',
            editPost: 'Editar Post',
            delete: 'Eliminar',
            pin: 'Fijar',
            pinToProfile: 'Fijar en perfil',
            unpin: 'Desfijar',
            block: 'Bloquear',
            blockUser: 'Bloquear Usuario',
            unblock: 'Desbloquear',
            unblockUser: 'Desbloquear Usuario',
            changeTag: 'Cambiar Etiqueta',
            replies: '{count} respuesta(s)',
            viewThread: 'Ver Hilo',
            viewOnExplorer: 'Ver en Explorer',
            edited: 'editado',
            replyingTo: 'Respondiendo a {name}',
            options: 'Opciones',
        },

        // Profile
        profileSetup: {
            title: 'Crea Tu Perfil',
            subtitle: 'Configura tu identidad on-chain en Agora',
            username: 'Elige un Nombre de Usuario',
            usernamePlaceholder: 'ej. satoshi',
            usernameHint: '1-15 caracteres: letras minúsculas, números, guiones bajos. Nombres más cortos cuestan más BNB.',
            usernameChecking: 'Verificando...',
            usernameAvailable: 'Disponible',
            usernameTaken: 'No disponible',
            usernameFree: 'GRATIS',
            create: 'Crear Perfil',
            creating: 'Creando...',
            displayName: 'Nombre Público',
            displayNamePlaceholder: 'Tu nombre público',
            bio: 'Bio',
            bioPlaceholder: 'Cuéntale al mundo sobre ti...',
            language: 'Idioma',
            languageHint: 'Tus posts serán etiquetados con este idioma para filtrado.',
            step2Hint: 'Nombre público, bio e idioma se almacenan como metadata y se pueden actualizar en cualquier momento gratis.',
            usernameFee: 'Costo del Username',
            connectWalletToCreate: 'Conecta tu billetera para crear tu perfil.',
            connectWalletToView: 'Conecta tu billetera para ver tu perfil.',
        },

        myProfile: {
            posts: 'Posts',
            followers: 'Seguidores',
            following: 'Siguiendo',
            editProfile: 'Editar Perfil',
            noPosts: 'Sin posts aún',
            noPostsSubtext: 'Sin posts aún — ¡comparte tu primer pensamiento!',
            yourPosts: 'Tus Posts',
            total: '{count} en total',
            viewOnExplorer: 'Ver en Explorer',
            badge: 'Insignia',
            boost: 'Boost',
            boosted: 'Boosteado',
        },

        userProfile: {
            follow: 'Seguir',
            unfollow: 'Dejar de Seguir',
            following: 'Siguiendo',
            blocked: 'Bloqueado',
            block: 'Bloquear',
            unblock: 'Desbloquear',
            notFound: 'Usuario no encontrado',
            noPosts: 'Sin posts aún',
        },

        // Tags
        tags: {
            all: 'Todos',
            general: 'General',
            defi: 'DeFi',
            nft: 'NFT',
            memes: 'Memes',
            alpha: 'Alpha',
            dev: 'Dev',
        },

        // Modals
        modals: {
            superLike: {
                title: 'Super Like',
                desc: 'Envía cualquier cantidad de BNB para impulsar este post a tendencias. Más BNB = mayor ranking. Todo el BNB va al ecosistema.',
                amountLabel: 'Cantidad (BNB)',
                anyAmount: 'Cualquier cantidad',
                minAmount: '> 0 BNB',
                confirm: 'Super Like',
            },
            downvote: {
                title: 'Downvote',
                desc: 'Da downvote a este post. Solo puedes dar downvote a cada post una vez.',
                confirm: 'Downvote',
            },
            tip: {
                title: 'Dar Propina',
                desc: 'Envía BNB directamente al autor del post como propina. Cualquier cantidad > 0.',
                amountLabel: 'Cantidad (BNB)',
                confirm: 'Enviar Propina',
            },
            boost: {
                title: 'Boostear Post',
                desc: 'Boostea este post para más visibilidad. Precios establecidos por la gobernanza del ecosistema.',
                daysLabel: 'Días',
                standard: 'Estándar',
                featured: 'Destacado',
                confirm: 'Boostear Post',
            },
            boostProfile: {
                title: 'Boost de Perfil',
                desc: 'Boostea tu perfil para más visibilidad. Precios establecidos por la gobernanza del ecosistema.',
                daysLabel: 'Días',
                confirm: 'Boostear Perfil',
            },
            badge: {
                title: 'Insignia de Confianza',
                desc: 'Obtén una insignia verificada por 1 año. Tiers más altos desbloquean posts más largos y más prestigio.',
                verified: 'Verificado',
                premium: 'Premium',
                elite: 'Élite',
                charsPerPost: 'Hasta {limit} caracteres por post',
                current: 'actual',
                withoutBadge: 'Sin insignia: 2,000 caracteres por post',
            },
            report: {
                title: 'Reportar Post',
                desc: 'Reporta este post y bloquea al autor de tu feed. Costo: 0.0001 BNB',
                reasons: {
                    spam: 'Spam',
                    harassment: 'Acoso',
                    illegal: 'Contenido Ilegal',
                    scam: 'Estafa',
                    other: 'Otro',
                },
                confirm: 'Enviar Reporte',
            },
            editPost: {
                title: 'Editar Post',
                desc: 'Edita dentro de 15 minutos de publicar. Gratis (solo gas). Solo puedes editar una vez.',
                confirm: 'Guardar Edición',
            },
            editProfile: {
                title: 'Editar Perfil',
                coverImage: 'Imagen de Portada',
                noCover: 'Sin portada',
                profilePicture: 'Foto de Perfil',
                changePhoto: 'Cambiar Foto',
                displayName: 'Nombre Público',
                displayNamePlaceholder: 'Tu nombre público',
                bio: 'Bio',
                bioPlaceholder: 'Sobre ti...',
                location: 'Ubicación',
                locationPlaceholder: 'ej. Ciudad de México, México',
                language: 'Idioma',
                socialLinks: 'Enlaces Sociales',
                addLink: 'Agregar Enlace',
                platform: 'Plataforma',
                usernameNote: 'El nombre de usuario no se puede cambiar. Solo aplica comisión de gas.',
                confirm: 'Guardar Cambios',
                maxLinks: 'Máximo 9 enlaces',
                uploadingAvatar: 'Subiendo avatar...',
                uploadingCover: 'Subiendo portada...',
                imageTooLarge: 'Imagen muy grande. Máximo 5MB.',
                avatar: 'Avatar',
                banner: 'Banner',
            },
            repost: {
                title: 'Repost',
                desc: '¿Repostear esto a tus seguidores? GRATIS (solo gas)',
                confirm: 'Repostear',
            },
            changeTag: {
                title: 'Cambiar Etiqueta',
                desc: 'Selecciona una nueva categoría para tu post. Solo aplica comisión de gas.',
                confirm: 'Cambiar Etiqueta',
            },
            deletePost: {
                title: 'Eliminar Post',
                desc: '¿Estás seguro? Esta acción no se puede deshacer.',
                confirm: 'Eliminar',
            },
        },

        // Cart (batch actions)
        cart: {
            title: 'Carrito de Acciones',
            empty: 'Carrito vacío',
            total: 'Total',
            submit: 'Enviar Todo',
            clear: 'Limpiar',
            notOnChainYet: 'No registrado en blockchain aún',
            actionsNotOnChain: '<strong>{count} acción(es)</strong> no registradas en blockchain aún',
        },

        // Post Detail
        postDetail: {
            postNotFound: 'Post no encontrado',
            replies: 'Respuestas',
            repliesCount: 'Respuestas ({count})',
            noReplies: 'Sin respuestas aún. ¡Sé el primero!',
            replyingTo: 'Respondiendo a {name}',
            replyPlaceholder: 'Escribe una respuesta...',
            reply: 'Responder',
            replyFree: 'Respuestas de texto: GRATIS (solo gas)',
        },

        // Upgrade hint
        upgrade: {
            charsWithTier: 'Hasta {limit} caracteres con',
        },

        // Toast
        toast: {
            postCreated: '¡Post creado!',
            postFailed: 'Error al crear post: {error}',
            replyCreated: '¡Respuesta publicada!',
            replyFailed: 'Error al crear respuesta: {error}',
            likeSuccess: '¡Post gustado!',
            likeFailed: 'Like fallido: {error}',
            followSuccess: '¡Ahora sigues!',
            followFailed: 'Follow fallido: {error}',
            unfollowSuccess: 'Dejaste de seguir',
            unfollowFailed: 'Unfollow fallido: {error}',
            repostSuccess: '¡Post reposteado!',
            repostFailed: 'Repost fallido: {error}',
            superLikeSuccess: '¡Super Like enviado!',
            superLikeFailed: 'Super Like fallido: {error}',
            downvoteSuccess: 'Downvote registrado',
            downvoteFailed: 'Downvote fallido: {error}',
            tipSuccess: '¡Propina enviada!',
            tipFailed: 'Propina fallida: {error}',
            boostSuccess: '¡Post boosteado!',
            boostFailed: 'Boost fallido: {error}',
            boostProfileSuccess: '¡Perfil boosteado!',
            boostProfileFailed: 'Boost de perfil fallido: {error}',
            badgeSuccess: '¡Insignia activada!',
            badgeFailed: 'Activación de insignia fallida: {error}',
            reportSuccess: 'Reporte enviado',
            reportFailed: 'Reporte fallido: {error}',
            editSuccess: '¡Post editado!',
            editFailed: 'Edición fallida: {error}',
            deleteSuccess: 'Post eliminado',
            deleteFailed: 'Eliminación fallida: {error}',
            pinSuccess: '¡Post fijado!',
            pinFailed: 'Error al fijar: {error}',
            blockSuccess: 'Usuario bloqueado',
            blockFailed: 'Bloqueo fallido: {error}',
            unblockSuccess: 'Usuario desbloqueado',
            unblockFailed: 'Desbloqueo fallido: {error}',
            profileCreated: '¡Perfil creado exitosamente!',
            profileFailed: 'Creación de perfil fallida: {error}',
            profileUpdated: '¡Perfil actualizado!',
            profileUpdateFailed: 'Actualización de perfil fallida: {error}',
            batchSuccess: '¡{count} acciones registradas en blockchain!',
            batchFailed: 'Transacción por lotes fallida',
            postShared: '¡Post compartido!',
            linkCopied: '¡Enlace copiado!',
            connectFirst: 'Conecta tu billetera primero',
            createProfileFirst: 'Crea un perfil primero',
            alreadyInCart: 'Ya está en el carrito',
            likeAddedToCart: 'Like agregado al carrito',
            downvoteAddedToCart: 'Downvote agregado al carrito',
            followAddedToCart: 'Follow agregado al carrito',
            cartCleared: 'Carrito limpiado',
            cartEmpty: 'Carrito vacío',
            pleaseWrite: 'Escribe algo',
            postTooLong: 'Post muy largo (máx {max} caracteres)',
            pleaseWriteReply: 'Escribe una respuesta',
            replyPosted: '¡Respuesta publicada!',
            reposted: '¡Reposteado!',
            superLiked: '¡Super Like!',
            userBlocked: 'Usuario bloqueado',
            userUnblocked: 'Usuario desbloqueado',
            postPinned: '¡Post fijado!',
            unfollowed: 'Dejaste de seguir',
            profileCreated: '¡Perfil creado!',
            profileUpdated: '¡Perfil actualizado!',
            badgeObtained: '¡Insignia {name} obtenida!',
            postReported: 'Post reportado. Autor bloqueado de tu feed.',
            postBoosted: '¡Post boosteado ({tier}) por {days} día(s)!',
            tipped: '¡Propina de {amount} BNB!',
            profileBoosted: '¡Perfil boosteado por {days} día(s)!',
            tagChanged: '¡Etiqueta cambiada!',
            contentRequired: 'Se requiere contenido',
            tooLong: 'Muy largo (máx {max})',
            postEdited: '¡Post editado!',
            uploadFailed: 'Subida fallida: {error}',
            avatarUploadError: 'Error al subir avatar: {error}',
            coverUploadError: 'Error al subir portada: {error}',
            unsupportedFileType: 'Tipo de archivo no soportado. Usa imágenes o videos.',
            invalidFormat: 'Formato de {type} inválido.',
            fileTooLarge: 'Archivo muy grande. Máximo {limit}.',
            maxMediaItems: 'Máximo {max} archivos de media',
            streamEnded: 'Stream terminado',
            youAreLive: '¡Estás EN VIVO!',
            streamEndedSaving: 'Stream terminado. Guardando grabación...',
            requestingCamera: 'Solicitando acceso a la cámara...',
            creatingLivePost: 'Creando post en vivo on-chain...',
            alreadyLive: '¡Ya estás en vivo!',
            connectToGoLive: 'Conecta tu billetera para ir en vivo',
            browserNoSupport: 'Tu navegador no soporta streaming en vivo (se requiere HTTPS)',
            cameraPermDenied: 'Permiso de cámara/micrófono denegado. Permite el acceso e intenta de nuevo.',
            noCameraFound: 'No se encontró cámara o micrófono en este dispositivo',
            cameraInUse: 'La cámara está en uso por otra aplicación',
            failedToGoLive: 'Error al ir en vivo: {error}',
            failedToStartStream: 'Error al iniciar stream: {error}',
            failedToCreateLive: 'Error al crear post en vivo: {error}',
            streamError: 'Error de stream: {error}',
            recordingTooLarge: 'Grabación muy grande ({size}MB). Máximo 100MB.',
            savingRecording: 'Guardando grabación en Arweave ({size}MB)...',
            recordingSaved: '¡Grabación en vivo guardada permanentemente!',
            failedToSaveRecording: 'Error al guardar grabación: {error}',
        },

        // Viewers
        viewers: '{count} espectador(es)',

        // Wallet button
        wallet: {
            connect: 'Conectar',
            connected: 'Conectado',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NOTARY — pages/notary/*.js
    // ═══════════════════════════════════════════════════════════════════════
    notary: {
        // Header
        brandName: 'Notaría Digital',
        brandSub: 'Registro y certificación en blockchain',

        // Tabs
        documents: 'Documentos',
        assets: 'Activos',
        verify: 'Verificar',
        stats: 'Estadísticas',
        notarize: 'Notarizar',

        // Header detail views
        certDetail: {
            title: 'Certificado #{id}',
            subtitle: 'Detalles del documento',
        },
        assetDetail: {
            title: 'Activo #{id}',
            subtitle: 'Detalles de la propiedad',
        },
        registerAsset: {
            title: 'Registrar Activo',
            subtitle: 'Registro de propiedad on-chain',
        },

        // Documents tab
        documentsTab: {
            title: 'Mis Documentos',
            noDocuments: 'Sin documentos certificados aún',
            certifyFirst: '¡Notariza tu primer documento para empezar!',
            notarizeNew: 'Notarizar Nuevo',
            filterAll: 'Todos',
            filterDocument: 'Documentos',
            filterImage: 'Imágenes',
            filterCode: 'Código',
            filterOther: 'Otro',
            connectToView: 'Conecta para ver tus certificados',
            certCount: '{count} certificado(s)',
            notarizedDocument: 'Documento Notarizado',
            received: 'Recibido',
        },

        // Assets tab
        assetsTab: {
            title: 'Mis Activos',
            noAssets: 'Sin activos registrados aún',
            registerFirst: '¡Registra tu primer activo en la blockchain!',
            registerNew: 'Registrar Nuevo',
            filterAll: 'Todos',
            connectToView: 'Conecta para ver tus activos',
            assetCount: '{count} activo(s)',
        },

        // Notarize wizard
        wizard: {
            step1Title: 'Seleccionar Archivo',
            step1Desc: 'Elige el archivo a notarizar',
            step2Title: 'Detalles',
            step2Desc: 'Agrega información sobre el documento',
            step3Title: 'Confirmar',
            step3Desc: 'Revisa y confirma la notarización',

            dropzone: 'Arrastra o haz clic para seleccionar un archivo',
            maxSize: 'Tamaño máximo: 10MB',
            docType: 'Tipo de Documento',
            docTitle: 'Título',
            docDescription: 'Descripción (opcional)',
            hash: 'Hash del Archivo',
            fee: 'Comisión de Notarización',
            confirm: 'Notarizar Documento',
            processing: 'Procesando...',

            docTypes: {
                general: 'General',
                contract: 'Contrato',
                identity: 'Identidad',
                diploma: 'Diploma',
                property: 'Propiedad',
                financial: 'Financiero',
                legal: 'Legal',
                medical: 'Médico',
                ip: 'Propiedad Intelectual',
                other: 'Otro',
            },

            fileSelected: 'Archivo Seleccionado',
            hashComputed: 'Hash SHA-256 calculado en tu navegador',
            remove: 'Remover',
            checkingDuplicates: 'Buscando duplicados...',
            duplicateFound: '¡Documento ya notarizado!',
            duplicateExistsMsg: 'Este hash ya existe en la blockchain.',
            uniqueHash: 'Hash único — listo para certificar',
            changeFile: 'Cambiar Archivo',
            continue: 'Continuar',
            computingHash: 'Calculando SHA-256...',
            hashLocal: 'Hash siendo calculado localmente en tu navegador',
            localHash: 'Hash local',
            arweave: 'Arweave',
            permanent: 'Permanente',
            descPlaceholder: 'Ej., Escritura de propiedad firmada Ene 2025...',
            fees: 'Comisiones',
            arweaveStorage: 'Almacenamiento Arweave',
            certificationFee: 'Comisión de Certificación',
            arweaveDesc: 'Arweave = almacenamiento permanente y descentralizado',
            insufficientBnb: 'BNB insuficiente para comisiones + gas',
            review: 'Revisar',
            noDescription: 'Sin descripción',
            signAndMint: 'Firmar y Mintear',
        },

        // Asset wizard
        assetWizard: {
            step1Title: 'Tipo de Activo',
            step2Title: 'Detalles',
            step3Title: 'Documentación',
            step4Title: 'Revisar',

            assetTypes: {
                property: 'Bienes Raíces',
                vehicle: 'Vehículo',
                equipment: 'Equipo',
                artwork: 'Obra de Arte',
                intellectual: 'Propiedad Intelectual',
                other: 'Otro',
            },

            name: 'Nombre del Activo',
            description: 'Descripción',
            location: 'Ubicación',
            serialNumber: 'Número de Serie / Registro',
            estimatedValue: 'Valor Estimado',
            addDocumentation: 'Agregar Documentación',
            skipDoc: 'Omitir (agregar después)',
            register: 'Registrar Activo',
        },

        // Cert Detail
        certDetailView: {
            documentType: 'Tipo de Documento',
            certifiedBy: 'Certificado Por',
            certifiedOn: 'Certificado El',
            fileHash: 'Hash del Archivo',
            txHash: 'Hash de Transacción',
            arweaveId: 'ID de Arweave',
            viewDocument: 'Ver Documento',
            transferOwnership: 'Transferir Propiedad',
            transferTo: 'Transferir A',
            transferPlaceholder: 'Dirección de billetera (0x...)',
            confirmTransfer: 'Confirmar Transferencia',
            shareProof: 'Compartir Prueba',
            downloadCert: 'Descargar Certificado',
            description: 'Descripción',
            tapToViewNft: 'Toca para ver tarjeta NFT',
            transferCertificate: 'Transferir Certificado',
            transferDesc: 'Transfiere la propiedad de este certificado a otra billetera. Esta acción es permanente y requiere una pequeña comisión.',
        },

        // Asset Detail
        assetDetailView: {
            owner: 'Propietario',
            registeredOn: 'Registrado El',
            assetType: 'Tipo de Activo',
            description: 'Descripción',
            location: 'Ubicación',
            serialNumber: 'Número de Serie',
            annotations: 'Anotaciones',
            noAnnotations: 'Sin anotaciones aún',
            addAnnotation: 'Agregar Anotación',
            annotationPlaceholder: 'Escribe una anotación...',
            transferOwnership: 'Transferir Propiedad',
            documents: 'Documentos Vinculados',
            noDocuments: 'Sin documentos vinculados',
            tapToOpen: 'Toca para abrir',
            tapToView: 'Toca para ver',
            transfers: 'Transferencias',
            youOwnThis: 'Eres dueño de este activo',
            documentHash: 'Hash del Documento',
            additionalInfo: 'Info Adicional',
            annotate: 'Anotar',
            transferAsset: 'Transferir Activo',
            transferDesc: 'Transferir propiedad. Esto crea un registro permanente on-chain.',
            newOwnerPlaceholder: 'Dirección del nuevo propietario (0x...)',
            declaredValuePlaceholder: 'Valor declarado en BNB (opcional)',
            transferNotePlaceholder: 'Nota de transferencia (opcional)',
        },

        // Verify tab
        verifyTab: {
            title: 'Verificar Documento',
            subtitle: 'Comprueba si un documento ha sido certificado en la blockchain',
            dropzone: 'Arrastra o haz clic para seleccionar un archivo a verificar',
            orEnterHash: 'O ingresa el hash del documento',
            hashPlaceholder: 'Hash del archivo (SHA-256)',
            verifyButton: 'Verificar',
            verifying: 'Verificando...',
            verified: '¡Documento Verificado!',
            notFound: 'Documento No Encontrado',
            verifiedDesc: 'Este documento ha sido certificado en la blockchain.',
            notFoundDesc: 'Este documento no fue encontrado en el registro.',
            hashComputedLocally: 'El hash SHA-256 será calculado localmente',
            verificationError: 'Error de verificación: {error}',
            tokenId: 'Token ID',
            date: 'Fecha',
            sha256Hash: 'Hash SHA-256',
            file: 'Archivo',
        },

        // Stats tab
        statsTab: {
            title: 'Estadísticas',
            totalCertificates: 'Total de Certificados',
            totalAssets: 'Total de Activos',
            totalTransfers: 'Total de Transferencias',
            recentActivity: 'Actividad Reciente',
            notarizations: 'Notarizaciones',
            annotations: 'Anotaciones',
            noRecentNotarizations: 'Sin notarizaciones recientes',
            viewContract: 'Ver Contrato en Explorer',
        },

        // NFT Certificate Card
        nftCard: {
            title: 'Certificado NFT',
            viewOnChain: 'Ver en Blockchain',
            addToWallet: 'Agregar a Billetera',
        },

        // Toast
        toast: {
            notarizeSuccess: '¡Documento notarizado exitosamente!',
            notarizeFailed: 'Notarización fallida: {error}',
            transferSuccess: '¡Propiedad transferida exitosamente!',
            transferFailed: 'Transferencia fallida: {error}',
            registerAssetSuccess: '¡Activo registrado exitosamente!',
            registerAssetFailed: 'Registro de activo fallido: {error}',
            annotationSuccess: '¡Anotación agregada!',
            annotationFailed: 'Anotación fallida: {error}',
            hashCopied: '¡Hash copiado!',
            linkCopied: '¡Enlace copiado!',
            connectFirst: 'Conecta tu billetera primero',
            invalidFile: 'Archivo inválido',
            fileTooLarge: 'Archivo muy grande (máx 10MB)',
            hashError: 'Error al calcular hash del archivo',
            pleaseWait: 'Espera por favor...',
            contractNotFound: 'Dirección del contrato no encontrada',
            walletDisconnected: 'Billetera desconectada. Reconecta por favor.',
            tokenAdded: '¡Token #{id} agregado a la billetera!',
            rateLimited: 'MetaMask tiene límite de solicitudes. Espera un momento e intenta de nuevo.',
            networkMismatch: 'Verifica la red de tu billetera e intenta de nuevo.',
            addManually: 'Abre MetaMask > NFTs > Importar NFT para agregar manualmente',
            copyFailed: 'Error al copiar',
            invalidAddress: 'Ingresa una dirección de billetera válida',
            assetNotFound: 'Activo no encontrado',
            certNotFound: 'Certificado no encontrado',
        },

        // Action button states
        actions: {
            uploading: 'Subiendo...',
            registering: 'Registrando...',
            uploadingDoc: 'Subiendo documento...',
            transferring: 'Transfiriendo...',
            adding: 'Agregando...',
        },
    },
};
