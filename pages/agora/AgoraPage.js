// pages/agora/AgoraPage.js
// Agora V13 — Main orchestrator
// ============================================================================

import { State } from '../../state.js';
import { openConnectModal, disconnectWallet as doDisconnect } from '../../modules/wallet.js';
import { BC, getMaxContent } from './state.js';
import { getProfileName, getInitials, escapeHtml, linkifyContent } from './utils.js';
import { injectStyles } from './styles.js';
import { loadFees, loadUserStatus, loadGlobalStats, loadProfiles, loadPosts, loadSocialGraph, loadBlockedAuthors, loadActiveRooms } from './data-loader.js';
import { navigateView, goBack, doCreatePost, doCreateReply, doLike, doFollow, doUnfollow, doDeletePost, doPinPost, doBlockUser, doUnblockUser, handleImageSelect, removeImage, onWizUsernameInput, doCreateProfile, goLive, endLive, watchLive, leaveLive, sharePost, closeModal, togglePostMenu, openChangeTag, selectNewTag, confirmChangeTag, restoreCart, removeFromCart, clearCart, toggleCart, submitCart, getCartFeeTotal } from './actions.js';
import { renderCompose } from './composer.js';
import { renderFeed, renderDiscover, renderTagBar, renderLanguageBar, renderLiveStreamBar } from './feed.js';
import { renderProfile, renderUserProfile, renderProfileSetup } from './profile.js';
import { renderPostDetail } from './post-detail.js';
import { renderModals, openSuperLike, confirmSuperLike, openDownvote, confirmDownvote, openBadge, confirmBadge, openBoost, confirmBoost, openReport, confirmReport, openBoostPost, confirmBoostPost, openTip, confirmTip, openEditPost, confirmEditPost, previewAvatar, openRepostConfirm, confirmRepost, openEditProfile, confirmEditProfile } from './modals.js';

// ============================================================================
// HEADER
// ============================================================================

function renderHeader() {
    const isDetailView = ['post-detail', 'user-profile', 'profile-setup'].includes(BC.view);
    if (isDetailView) {
        let title = 'Post';
        if (BC.view === 'user-profile') title = getProfileName(BC.selectedProfile);
        if (BC.view === 'profile-setup') title = 'Create Profile';
        return `
            <div class="bc-header">
                <div class="bc-back-header">
                    <button class="bc-back-btn" onclick="AgoraPage.goBack()"><i class="fa-solid fa-arrow-left"></i></button>
                    <span class="bc-back-title">${title}</span>
                </div>
            </div>`;
    }
    return `
        <div class="bc-header">
            <div class="bc-header-bar">
                <div class="bc-brand">
                    <img src="assets/Agora.png" alt="Agora" class="bc-brand-icon" onerror="this.style.display='none'">
                    <span class="bc-brand-name">Agora</span>
                </div>
                <div class="bc-header-right">
                    ${_renderWalletBtn()}
                    <button class="bc-icon-btn" onclick="AgoraPage.refresh()" title="Refresh"><i class="fa-solid fa-arrows-rotate"></i></button>
                </div>
            </div>
            <div class="bc-nav">
                <button class="bc-nav-item ${BC.activeTab === 'feed' ? 'active' : ''}" onclick="AgoraPage.setTab('feed')">
                    <i class="fa-solid fa-house"></i> Feed
                </button>
                <button class="bc-nav-item ${BC.activeTab === 'discover' ? 'active' : ''}" onclick="AgoraPage.setTab('discover')">
                    <i class="fa-solid fa-fire"></i> Discover
                </button>
                <button class="bc-nav-item ${BC.activeTab === 'profile' ? 'active' : ''}" onclick="AgoraPage.setTab('profile')">
                    <i class="fa-solid fa-user"></i> Profile
                </button>
            </div>
        </div>`;
}

// ============================================================================
// WALLET BUTTON (inline in Agora header)
// ============================================================================

function _renderWalletBtn() {
    if (State.isConnected && State.userAddress) {
        const short = State.userAddress.slice(0, 6) + '...' + State.userAddress.slice(-4);
        return `<button class="bc-wallet-inline connected" onclick="event.stopPropagation(); AgoraPage.disconnectWallet()" title="Tap to disconnect">
            <span class="bc-wallet-dot"></span>${short}<i class="fa-solid fa-power-off bc-disconnect-icon"></i>
        </button>`;
    }
    return `<button class="bc-wallet-inline disconnected" onclick="event.stopPropagation(); AgoraPage.connectWallet()" title="Connect Wallet">
        <i class="fa-solid fa-wallet"></i> Connect
    </button>`;
}

// Hide/show the main DApp header when Agora is active
function _hideDappHeader() {
    const header = document.querySelector('header.sticky');
    if (header) header.style.display = 'none';
}

function _restoreDappHeader() {
    const header = document.querySelector('header.sticky');
    if (header) header.style.display = '';
}

// ============================================================================
// CONTENT ROUTER
// ============================================================================

function renderContent() {
    const container = document.getElementById('backchat-content');
    if (!container) return;
    let content = '';
    switch (BC.view) {
        case 'feed':
            content = renderFeed();
            break;

        case 'discover':
            content = renderDiscover();
            break;
        case 'profile':
            content = (!BC.hasProfile && State.isConnected) ? renderProfileSetup() : renderProfile();
            break;
        case 'post-detail':
            content = renderPostDetail();
            break;
        case 'user-profile':
            content = renderUserProfile();
            break;
        case 'profile-setup':
            content = renderProfileSetup();
            break;
        default:
            content = renderCompose() + renderLanguageBar() + renderTagBar() + renderFeed();
    }
    container.innerHTML = content;
    container.style.paddingBottom = BC.actionCart.length > 0 ? '80px' : '';
    // Update cart bar without full re-render
    const existingCart = document.querySelector('.bc-cart-bar');
    const cartHTML = renderCartBar();
    if (cartHTML && !existingCart) {
        const section = document.getElementById('agora');
        if (section) section.insertAdjacentHTML('afterend', cartHTML);
    } else if (existingCart) {
        if (!cartHTML) { existingCart.remove(); }
        else { existingCart.outerHTML = cartHTML; }
    }
}

// After rendering content, set up video auto-play observers
function _observeVideos() {
    if (!BC._videoObserver) {
        BC._videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            });
        }, { threshold: [0, 0.6] });
    }
    // Disconnect previously observed, re-observe all current videos
    BC._videoObserver.disconnect();
    document.querySelectorAll('video[data-post-video]').forEach(v => {
        BC._videoObserver.observe(v);
    });
}

// Infinite scroll sentinel observer
function _observeSentinel() {
    if (BC._sentinelObserver) BC._sentinelObserver.disconnect();
    const sentinel = document.querySelector('[data-sentinel="feed"]');
    if (!sentinel) return;
    BC._sentinelObserver = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
            BC.feedPage++;
            renderContent();
            _observeVideos();
            _observeSentinel();
        }
    }, { rootMargin: '200px' });
    BC._sentinelObserver.observe(sentinel);
}

// Double-tap to like (TikTok mode)
let _lastTapTime = 0;
function _initDoubleTap() {
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.bc-tiktok-card');
        if (!card) return;
        const now = Date.now();
        if (now - _lastTapTime < 300) {
            // Double-tap → like
            const postId = card.dataset.postId;
            if (postId) {
                window.AgoraPage?.like(postId);
                // Float heart animation
                const heart = document.createElement('div');
                heart.className = 'bc-float-heart';
                heart.innerHTML = '<i class="fa-solid fa-heart"></i>';
                heart.style.left = (e.clientX - card.getBoundingClientRect().left - 30) + 'px';
                heart.style.top = (e.clientY - card.getBoundingClientRect().top - 30) + 'px';
                card.appendChild(heart);
                setTimeout(() => heart.remove(), 900);
                if (navigator.vibrate) navigator.vibrate(50);
            }
            _lastTapTime = 0;
        } else {
            _lastTapTime = now;
        }
    });
}
_initDoubleTap();

// Connect BC._render to renderContent so modules can trigger re-renders
BC._render = () => { renderContent(); _observeVideos(); _observeSentinel(); };

// Mobile: reload data when returning from MetaMask app (tab becomes visible again)
let _lastVisibilityRefresh = 0;
document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    // Only refresh if on Agora page and enough time has passed (debounce 3s)
    const now = Date.now();
    if (now - _lastVisibilityRefresh < 3000) return;
    if (!document.getElementById('agora')?.classList.contains('active')) return;
    _lastVisibilityRefresh = now;
    // Refresh data in the background
    Promise.all([loadProfiles(), loadPosts(), loadSocialGraph(), loadUserStatus()])
        .then(() => { renderContent(); _observeVideos(); _observeSentinel(); })
        .catch(() => {});
});

// ============================================================================
// CART BAR
// ============================================================================

function renderCartBar() {
    if (BC.actionCart.length === 0) return '';
    const count = BC.actionCart.length;

    const ICONS = { like: 'fa-heart', follow: 'fa-user-plus', downvote: 'fa-arrow-down' };
    const ICON_CLASS = { like: 'like', follow: 'follow', downvote: 'downvote' };
    const LABELS = { like: 'Like', follow: 'Follow', downvote: 'Downvote' };

    let panelHTML = '';
    if (BC.cartVisible) {
        const itemsHTML = BC.actionCart.map((item, i) => `
            <div class="bc-cart-item">
                <div class="bc-cart-item-info">
                    <div class="bc-cart-item-icon ${ICON_CLASS[item.type]}"><i class="fa-solid ${ICONS[item.type]}"></i></div>
                    <div>
                        <div class="bc-cart-item-label">${LABELS[item.type]} — ${item.label}</div>
                        <div class="bc-cart-item-type">${item.type}</div>
                    </div>
                </div>
                <button class="bc-cart-item-remove" onclick="event.stopPropagation(); AgoraPage.removeFromCart(${i})" title="Remove">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>`).join('');

        panelHTML = `
            <div class="bc-cart-panel">
                <div class="bc-cart-header">
                    <span class="bc-cart-title">Action Cart (${count})</span>
                    <button class="bc-cart-clear" onclick="AgoraPage.clearCart()"><i class="fa-solid fa-trash"></i> Clear All</button>
                </div>
                ${itemsHTML}
                <div class="bc-cart-footer">
                    <div class="bc-cart-warning"><i class="fa-solid fa-circle-info"></i> Not registered on blockchain yet</div>
                </div>
            </div>`;
    }

    return `
        <div class="bc-cart-bar">
            ${BC.cartVisible ? panelHTML : ''}
            <div class="bc-cart-summary" onclick="AgoraPage.toggleCart()">
                <div class="bc-cart-info">
                    <span class="bc-cart-badge">${count}</span>
                    <span class="bc-cart-label"><strong>${count} action${count !== 1 ? 's' : ''}</strong> not on blockchain yet</span>
                </div>
                <div class="bc-cart-actions">
                    <button class="bc-cart-submit-btn" onclick="event.stopPropagation(); AgoraPage.submitCart()" ${BC.cartSubmitting ? 'disabled' : ''}>
                        ${BC.cartSubmitting
                            ? '<i class="fa-solid fa-spinner fa-spin"></i> Registering...'
                            : '<i class="fa-solid fa-link"></i> Register'}
                    </button>
                    <button class="bc-cart-toggle" onclick="event.stopPropagation(); AgoraPage.toggleCart()">
                        <i class="fa-solid fa-chevron-${BC.cartVisible ? 'down' : 'up'}"></i>
                    </button>
                </div>
            </div>
        </div>`;
}

// ============================================================================
// MAIN RENDER
// ============================================================================

function _renderFAB() {
    if (!State.isConnected) return '';
    return `<button class="bc-fab" onclick="AgoraPage.openCompose()" title="New Post">
        <i class="fa-solid fa-plus"></i>
    </button>`;
}

function _openCompose() {
    const modal = document.getElementById('modal-compose');
    if (modal) modal.style.display = 'flex';
}

function _renderComposeModal() {
    return `
        <div class="bc-modal-overlay" id="modal-compose" style="display:none;" onclick="if(event.target===this) AgoraPage.closeModal('compose')">
            <div class="bc-modal-box" style="max-width:540px;width:95%;">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-pen-to-square" style="color:var(--bc-accent)"></i> New Post</span>
                    <button class="bc-modal-x" onclick="AgoraPage.closeModal('compose')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner" style="padding:0;">
                    ${renderCompose()}
                </div>
            </div>
        </div>`;
}

function render() {
    injectStyles();
    _hideDappHeader();
    const section = document.getElementById('agora');
    if (!section) return;
    section.innerHTML = `
        <div class="bc-shell">
            ${renderHeader()}
            <div id="backchat-content" style="${BC.actionCart.length > 0 ? 'padding-bottom:80px;' : ''}"></div>
        </div>
        ${_renderFAB()}
        ${renderCartBar()}
        ${_renderComposeModal()}
        ${renderModals()}`;
    renderContent();
    _observeVideos();
    _observeSentinel();
}

// ============================================================================
// DEEP LINK
// ============================================================================

function checkDeepLink() {
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex === -1) return;

    const query = hash.substring(qIndex + 1);
    let postId = null;

    // New format: @username/postId
    const usernameMatch = query.match(/^@[\w]+\/(\d+)/);
    if (usernameMatch) postId = usernameMatch[1];

    // Legacy format: ?post=123
    if (!postId) {
        const params = new URLSearchParams(query);
        postId = params.get('post');
    }

    if (!postId) return;

    // Clean the URL to avoid re-triggering
    window.history.replaceState(null, '', `${window.location.pathname}#agora`);

    if (BC.postsById.has(postId)) {
        navigateView('post-detail', { post: postId });
    } else {
        BC.selectedPost = postId;
        BC.view = 'post-detail';
        render();
    }
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function _updateCharCount(textarea) {
    const counter = document.getElementById('bc-char-counter');
    if (!counter) return;
    const maxLen = getMaxContent();
    const len = textarea.value.length;
    counter.textContent = `${len.toLocaleString()}/${maxLen.toLocaleString()}`;
    counter.className = 'bc-char-count';
    if (len > maxLen - 50) counter.classList.add('danger');
    else if (len > maxLen * 0.9) counter.classList.add('warn');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px';

    // Show upgrade hint when approaching limit (not elite)
    const hint = document.querySelector('.bc-upgrade-hint');
    if (hint) {
        hint.style.display = (len > maxLen * 0.8 && (!BC.hasBadge || BC.badgeTier < 2)) ? 'flex' : '';
    }
}

// Close post menus on click outside
document.addEventListener('click', () => {
    document.querySelectorAll('.bc-post-dropdown').forEach(el => el.style.display = 'none');
});

// ============================================================================
// CAROUSEL NAVIGATION
// ============================================================================

function _moveCarousel(postId, direction) {
    const carousel = document.querySelector(`[data-carousel="${postId}"]`);
    if (!carousel) return;
    const total = parseInt(carousel.dataset.total) || 1;
    let current = parseInt(carousel.dataset.current) || 0;
    current = Math.max(0, Math.min(total - 1, current + direction));
    carousel.dataset.current = current;

    // Show/hide slides
    carousel.querySelectorAll('.bc-carousel-slide').forEach((s, i) => {
        s.style.display = i === current ? '' : 'none';
    });
    // Update dots
    carousel.querySelectorAll('.bc-carousel-dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
    });
    // Update arrows visibility
    const prev = carousel.querySelector('.bc-carousel-prev');
    const next = carousel.querySelector('.bc-carousel-next');
    if (prev) prev.style.display = current === 0 ? 'none' : '';
    if (next) next.style.display = current === total - 1 ? 'none' : '';
    // Update counter
    const counter = carousel.querySelector('.bc-carousel-counter');
    if (counter) counter.textContent = `${current + 1}/${total}`;
    // Pause/play videos
    carousel.querySelectorAll('video').forEach((v, i) => {
        if (i === current) { v.play().catch(() => {}); } else { v.pause(); }
    });
}

function _initCarouselSwipe() {
    document.addEventListener('touchstart', e => {
        const carousel = e.target.closest('[data-carousel]');
        if (!carousel) return;
        carousel._touchStartX = e.touches[0].clientX;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        const carousel = e.target.closest('[data-carousel]');
        if (!carousel || carousel._touchStartX == null) return;
        const dx = e.changedTouches[0].clientX - carousel._touchStartX;
        carousel._touchStartX = null;
        if (Math.abs(dx) < 40) return; // too short swipe
        _moveCarousel(carousel.dataset.carousel, dx < 0 ? 1 : -1);
    }, { passive: true });
}
_initCarouselSwipe();

// ============================================================================
// TIKTOK CAPTION TOGGLE
// ============================================================================

function _toggleCaption(postId) {
    const el = document.querySelector(`.bc-tiktok-caption[data-caption-id="${postId}"]`);
    if (!el) return;
    el.classList.toggle('expanded');
    // Update "more" hint
    const hint = el.querySelector('.bc-tiktok-more');
    if (hint) hint.textContent = el.classList.contains('expanded') ? ' less' : ' more';
}

// ============================================================================
// EXPAND POST (inline text expansion)
// ============================================================================

function _expandPost(postId) {
    const body = document.querySelector(`.bc-post-body[data-post-id="${postId}"]`);
    if (!body) return;
    const post = BC.postsById.get(postId);
    if (!post?.content) return;
    body.innerHTML = linkifyContent(escapeHtml(post.content));
}

// ============================================================================
// EXPORT
// ============================================================================

export const AgoraPage = {
    async render(isActive) {
        if (!isActive) return;
        render();
        await Promise.all([
            loadFees(),
            loadUserStatus(),
            loadGlobalStats(),
            loadProfiles(),
            loadPosts(),
            loadSocialGraph(),
            loadActiveRooms()
        ]);
        await loadBlockedAuthors();
        restoreCart();
        renderContent();
        _observeVideos();
        _observeSentinel();
        checkDeepLink();
    },

    cleanup() {
        _restoreDappHeader();
    },

    // Called by app.js when wallet state changes without full page navigation
    // (e.g. mobile returning from MetaMask with session restore)
    async update(isConnected) {
        await this.refresh();
        renderContent();
        _observeVideos();
        _observeSentinel();
    },

    async refresh() {
        await Promise.all([
            loadFees(),
            loadUserStatus(),
            loadGlobalStats(),
            loadProfiles(),
            loadPosts(),
            loadSocialGraph(),
            loadActiveRooms()
        ]);
        await loadBlockedAuthors();
    },

    setTab(tab) {
        BC.activeTab = tab;
        BC.view = tab;
        BC.selectedTag = -1;
        BC.feedPage = 0;
        render();
    },

    filterTag(tagId) {
        BC.selectedTag = tagId;
        BC.feedPage = 0;
        renderContent();
        _observeSentinel();
    },

    filterLanguage(code) {
        BC.selectedLanguage = code;
        BC.feedPage = 0;
        renderContent();
        _observeSentinel();
    },

    setFeedMode(mode) {
        BC.feedMode = mode;
        render();
        _observeVideos();
        _observeSentinel();
    },

    setWizLanguage(code) {
        BC.wizLanguage = code;
        renderContent();
    },

    setComposeTag(tagId) {
        BC.composeTag = tagId;
        renderContent();
    },

    goBack,
    sharePost,
    viewPost(postId) { navigateView('post-detail', { post: postId }); },
    viewProfile(address) {
        if (address?.toLowerCase() === State.userAddress?.toLowerCase()) {
            BC.activeTab = 'profile';
            BC.view = 'profile';
            render();
        } else {
            navigateView('user-profile', { profile: address });
        }
    },
    openReply(postId) { navigateView('post-detail', { post: postId }); },
    openProfileSetup() {
        BC.wizStep = 1;
        BC.wizUsername = '';
        BC.wizDisplayName = '';
        BC.wizBio = '';
        BC.wizUsernameOk = null;
        BC.wizFee = null;
        navigateView('profile-setup');
    },

    // Actions
    openCompose: _openCompose,
    createPost: doCreatePost,
    submitReply: doCreateReply,
    like: doLike,
    follow: doFollow,
    unfollow: doUnfollow,
    deletePost: doDeletePost,
    pinPost: doPinPost,
    blockUser: doBlockUser,
    unblockUser: doUnblockUser,
    handleImageSelect,
    removeImage,
    onWizUsernameInput,
    closeModal,
    togglePostMenu,
    openChangeTag,
    selectNewTag,
    confirmChangeTag,

    // Modals
    openSuperLike,
    confirmSuperLike,
    openDownvote,
    confirmDownvote,
    openRepostConfirm,
    confirmRepost,
    openBadge,
    confirmBadge,
    openBoost,
    confirmBoost,
    openEditProfile,
    confirmEditProfile,
    openReport,
    confirmReport,
    openBoostPost,
    confirmBoostPost,
    openTip,
    confirmTip,
    previewAvatar,
    openEditPost,
    confirmEditPost,

    // Action Cart
    removeFromCart,
    clearCart,
    toggleCart,
    submitCart,

    // Carousel + Expand + Caption Toggle
    toggleCaption: _toggleCaption,
    expandPost: _expandPost,
    carouselPrev(postId) { _moveCarousel(postId, -1); },
    carouselNext(postId) { _moveCarousel(postId, 1); },

    // Wallet
    connectWallet() { openConnectModal(); },
    disconnectWallet() { doDisconnect(); },

    // Live streaming
    goLive,
    endLive,
    watchLive,
    leaveLive,

    // Wizard
    wizNext() {
        if (BC.wizStep === 1 && !BC.wizUsernameOk) return;
        if (BC.wizStep === 1) {
            BC.wizStep = 2;
        } else if (BC.wizStep === 2) {
            BC.wizDisplayName = document.getElementById('wiz-displayname-input')?.value?.trim() || '';
            BC.wizBio = document.getElementById('wiz-bio-input')?.value?.trim() || '';
            BC.wizStep = 3;
        }
        renderContent();
    },
    wizBack() {
        if (BC.wizStep > 1) {
            if (BC.wizStep === 2) {
                BC.wizDisplayName = document.getElementById('wiz-displayname-input')?.value?.trim() || '';
                BC.wizBio = document.getElementById('wiz-bio-input')?.value?.trim() || '';
            }
            BC.wizStep--;
            renderContent();
        }
    },
    wizConfirm: doCreateProfile,

    _updateCharCount
};

// Expose globally for inline onclick handlers
window.AgoraPage = AgoraPage;

// Legacy alias for backward compatibility
window.BackchatPage = AgoraPage;
