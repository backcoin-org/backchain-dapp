// pages/agora/feed.js
// Agora V13 — Feed and Discover view rendering
// ============================================================================

import { State } from '../../state.js';
import { BC, TAGS, LANGUAGES } from './state.js';
import { renderPost } from './post-card.js';
import { resolveContentUrl } from '../../modules/core/index.js';
import { getProfileName, renderAvatar, formatETH, formatTimeAgo, escapeHtml } from './utils.js';

const FEED_PAGE_SIZE = 20;

// ============================================================================
// TAG & LANGUAGE BARS
// ============================================================================

export function renderTagBar() {
    const allActive = BC.selectedTag === -1 ? 'active' : '';
    let html = `<div class="bc-tag-bar">
        <button class="bc-tag-pill ${allActive}" onclick="AgoraPage.filterTag(-1)"><i class="fa-solid fa-layer-group"></i> All</button>`;
    for (const tag of TAGS) {
        const active = BC.selectedTag === tag.id ? 'active' : '';
        html += `<button class="bc-tag-pill ${active}" onclick="AgoraPage.filterTag(${tag.id})" style="${active ? '' : `color:${tag.color}`}"><i class="fa-solid ${tag.icon}"></i> ${tag.name}</button>`;
    }
    html += `</div>`;
    return html;
}

export function renderLanguageBar() {
    const langCounts = {};
    for (const post of BC.posts) {
        const profile = BC.profiles.get(post.author?.toLowerCase());
        const lang = profile?.language || '';
        if (lang) langCounts[lang] = (langCounts[lang] || 0) + 1;
    }
    const activeLangs = LANGUAGES.filter(l => langCounts[l.code]);
    if (activeLangs.length <= 1) return '';

    const allActive = !BC.selectedLanguage ? 'active' : '';
    let html = `<div class="bc-tag-bar" style="margin-bottom:4px;">
        <button class="bc-tag-pill ${allActive}" onclick="AgoraPage.filterLanguage(null)"><i class="fa-solid fa-globe"></i> All</button>`;
    for (const lang of activeLangs) {
        const active = BC.selectedLanguage === lang.code ? 'active' : '';
        html += `<button class="bc-tag-pill ${active}" onclick="AgoraPage.filterLanguage('${lang.code}')">${lang.flag} ${lang.name} <span style="opacity:0.6;font-size:11px;">${langCounts[lang.code]}</span></button>`;
    }
    html += `</div>`;
    return html;
}

// ============================================================================
// LIVE STREAM BARS
// ============================================================================

export function renderLiveStreamBar() {
    if (!BC.isLive) return '';
    return `
        <div class="bc-live-bar">
            <div class="bc-live-bar-header">
                <div class="bc-live-indicator">
                    <span class="bc-live-dot"></span>
                    <span class="bc-live-label">LIVE</span>
                    <span class="bc-live-viewers" data-live-viewers>${BC.liveViewerCount} viewer${BC.liveViewerCount !== 1 ? 's' : ''}</span>
                </div>
                <button class="bc-btn bc-btn-outline" style="border-color:#ef4444;color:#ef4444;padding:6px 14px;font-size:12px;" onclick="AgoraPage.endLive()">
                    <i class="fa-solid fa-stop"></i> End Stream
                </button>
            </div>
            <video id="bc-local-video" class="bc-live-video" autoplay muted playsinline></video>
        </div>`;
}

export function renderLiveViewer() {
    if (!BC.watchingStreamId) return '';
    return `
        <div class="bc-live-bar">
            <video id="bc-remote-video" class="bc-live-video" autoplay playsinline style="max-height:400px;object-fit:contain;"></video>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;">
                <div class="bc-live-indicator">
                    <span class="bc-live-dot"></span>
                    <span class="bc-live-label">LIVE</span>
                </div>
                <button class="bc-btn bc-btn-outline" onclick="AgoraPage.leaveLive()">
                    <i class="fa-solid fa-xmark"></i> Leave
                </button>
            </div>
        </div>`;
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

function renderSkeleton() {
    const sk = `<div class="bc-skeleton-post">
        <div class="bc-skeleton-avatar"></div>
        <div class="bc-skeleton-body">
            <div class="bc-skeleton-line short"></div>
            <div class="bc-skeleton-line long"></div>
            <div class="bc-skeleton-line medium"></div>
            <div class="bc-skeleton-actions"><div class="bc-skeleton-dot"></div><div class="bc-skeleton-dot"></div><div class="bc-skeleton-dot"></div><div class="bc-skeleton-dot"></div></div>
        </div>
    </div>`;
    return sk + sk + sk;
}

// ============================================================================
// FEED VIEW
// ============================================================================

export function renderFeed() {
    if (!BC.contractAvailable) {
        return `<div class="bc-empty">
            <div class="bc-empty-glyph accent"><i class="fa-solid fa-rocket"></i></div>
            <div class="bc-empty-title">Coming Soon!</div>
            <div class="bc-empty-text">${BC.error || 'Agora is being deployed. The unstoppable social network will be live soon!'}</div>
            <button class="bc-btn bc-btn-outline" style="margin-top:24px;" onclick="AgoraPage.refresh()"><i class="fa-solid fa-arrows-rotate"></i> Retry</button>
        </div>`;
    }
    if (BC.isLoading) return renderSkeleton();

    let filteredPosts = BC.posts;

    // Language filter
    if (BC.selectedLanguage) {
        filteredPosts = filteredPosts.filter(p => {
            const author = p.type === 'repost' ? BC.postsById.get(p.originalPostId)?.author : p.author;
            const profile = BC.profiles.get(author?.toLowerCase());
            return profile?.language === BC.selectedLanguage;
        });
    }

    // Tag filter
    if (BC.selectedTag >= 0) {
        filteredPosts = filteredPosts.filter(p => {
            if (p.type === 'repost') {
                const orig = BC.postsById.get(p.originalPostId);
                return orig && orig.tag === BC.selectedTag;
            }
            return p.tag === BC.selectedTag;
        });
    }

    if (filteredPosts.length === 0) {
        const tagName = BC.selectedTag >= 0 ? TAGS[BC.selectedTag]?.name || '' : '';
        if (BC.selectedTag >= 0) {
            return `<div class="bc-empty">
                <div class="bc-empty-glyph"><i class="fa-regular fa-comment-dots"></i></div>
                <div class="bc-empty-title">No ${tagName} posts</div>
                <div class="bc-empty-text">Try a different tag or be the first to post!</div>
            </div>`;
        }
        if (State.isConnected && !BC.hasProfile) {
            return `<div class="bc-empty">
                <div class="bc-empty-glyph accent"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
                <div class="bc-empty-title">Welcome to Agora</div>
                <div style="display:flex;flex-direction:column;gap:12px;margin:16px 0;text-align:left;max-width:280px;">
                    <div style="display:flex;align-items:center;gap:10px;font-size:14px;color:var(--bc-text-2);">
                        <span style="width:24px;height:24px;border-radius:50%;background:var(--bc-accent);color:#000;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">1</span>
                        Create your profile
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;font-size:14px;color:var(--bc-text-2);">
                        <span style="width:24px;height:24px;border-radius:50%;background:var(--bc-bg3);color:var(--bc-text-3);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">2</span>
                        Post your first thought
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;font-size:14px;color:var(--bc-text-2);">
                        <span style="width:24px;height:24px;border-radius:50%;background:var(--bc-bg3);color:var(--bc-text-3);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">3</span>
                        Earn Super Likes
                    </div>
                </div>
                <button class="bc-btn bc-btn-primary" style="margin-top:8px;" onclick="AgoraPage.openProfileSetup()"><i class="fa-solid fa-user-plus"></i> Get Started</button>
            </div>`;
        }
        return `<div class="bc-empty">
            <div class="bc-empty-glyph"><i class="fa-regular fa-comment-dots"></i></div>
            <div class="bc-empty-title">No posts yet</div>
            <div class="bc-empty-text">Be the first to post on the unstoppable social network!</div>
        </div>`;
    }

    // Infinite scroll — render only (feedPage+1)*PAGE_SIZE posts
    const limit = (BC.feedPage + 1) * FEED_PAGE_SIZE;
    const visible = filteredPosts.slice(0, limit);
    const hasMore = filteredPosts.length > limit;

    let html = visible.map((post, i) => renderPost(post, i)).join('');
    if (hasMore) {
        html += `<div class="bc-feed-sentinel" data-sentinel="feed"><div class="bc-loading"><div class="bc-spinner"></div></div></div>`;
    }
    return html;
}

// ============================================================================
// DISCOVER VIEW
// ============================================================================

// ============================================================================
// TIKTOK VERTICAL SCROLL CARD
// ============================================================================

function _renderTikTokCard(post, i) {
    const cid = post.media?.[0]?.cid || post.mediaCID;
    const isVid = post.media?.[0]?.type === 'video' || post.isVideo;
    const mediaUrl = cid ? (resolveContentUrl(cid) || '') : '';
    const authorName = getProfileName(post.author);
    const caption = post.content ? escapeHtml(post.content.slice(0, 150)) + (post.content.length > 150 ? '...' : '') : '';
    const likeCount = post.likesCount || BC.likesMap.get(post.id)?.size || 0;
    const replyCount = post.repliesCount || BC.replyCountMap.get(post.id) || 0;
    const superETH = formatETH(post.superLikeETH || 0n);
    const isLiked = BC.likesMap.get(post.id)?.has(State.userAddress?.toLowerCase()) || false;

    let bgStyle;
    if (isVid && mediaUrl) {
        bgStyle = `background:#000;`;
    } else if (mediaUrl) {
        bgStyle = `background-image:url('${mediaUrl}');background-size:cover;background-position:center;`;
    } else {
        // Gradient background for text-only posts
        const hue = (post.id * 37) % 360;
        bgStyle = `background:linear-gradient(135deg, hsl(${hue},40%,15%), hsl(${(hue+60)%360},30%,8%));`;
    }

    return `
        <div class="bc-tiktok-card" data-post-id="${post.id}" ${bgStyle.includes('background-image') ? `style="${bgStyle}"` : `style="${bgStyle}"`}>
            ${isVid && mediaUrl ? `<video class="bc-tiktok-video" src="${mediaUrl}" playsinline muted loop preload="metadata" data-post-video="${post.id}"></video>` : ''}
            ${!isVid && mediaUrl ? `<div class="bc-tiktok-img-overlay"></div>` : ''}
            <div class="bc-tiktok-overlay">
                <div class="bc-tiktok-bottom">
                    <div class="bc-tiktok-info">
                        <div class="bc-tiktok-author" onclick="event.stopPropagation(); AgoraPage.viewProfile('${post.author}')">
                            <strong>${authorName}</strong>
                            <span class="bc-tiktok-time">${formatTimeAgo(post.timestamp)}</span>
                        </div>
                        ${caption ? `<div class="bc-tiktok-caption">${caption}</div>` : ''}
                    </div>
                    <div class="bc-tiktok-actions">
                        <div class="bc-tiktok-action" onclick="event.stopPropagation(); AgoraPage.viewProfile('${post.author}')">
                            <div class="bc-tiktok-avatar">${renderAvatar(post.author)}</div>
                        </div>
                        <div class="bc-tiktok-action ${isLiked ? 'liked' : ''}" onclick="event.stopPropagation(); AgoraPage.like('${post.id}')">
                            <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                            <span>${likeCount || ''}</span>
                        </div>
                        <div class="bc-tiktok-action" onclick="event.stopPropagation(); AgoraPage.viewPost('${post.id}')">
                            <i class="fa-regular fa-comment"></i>
                            <span>${replyCount || ''}</span>
                        </div>
                        <div class="bc-tiktok-action" onclick="event.stopPropagation(); AgoraPage.openSuperLike('${post.id}')">
                            <i class="fa-solid fa-star"></i>
                            <span>${(post.superLikeETH || 0n) > 0n ? superETH : ''}</span>
                        </div>
                        <div class="bc-tiktok-action" onclick="event.stopPropagation(); AgoraPage.sharePost('${post.id}')">
                            <i class="fa-solid fa-arrow-up-from-bracket"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

export function renderDiscover() {
    const modeToggle = `
        <div class="bc-discover-mode-toggle">
            <button class="bc-mode-btn ${BC.feedMode === 'list' ? 'active' : ''}" onclick="AgoraPage.setFeedMode('list')" title="List view">
                <i class="fa-solid fa-list"></i>
            </button>
            <button class="bc-mode-btn ${BC.feedMode === 'tiktok' ? 'active' : ''}" onclick="AgoraPage.setFeedMode('tiktok')" title="Vertical scroll">
                <i class="fa-solid fa-clapperboard"></i>
            </button>
        </div>`;

    if (BC.trendingPosts.length === 0) {
        return `
            <div class="bc-discover-header">
                <h2><i class="fa-solid fa-fire"></i> Discover ${modeToggle}</h2>
                <p>Ranked by engagement — likes, replies, reposts & Super Likes</p>
            </div>
            <div class="bc-empty">
                <div class="bc-empty-glyph accent"><i class="fa-solid fa-fire"></i></div>
                <div class="bc-empty-title">No posts yet</div>
                <div class="bc-empty-text">Be the first to post! Posts are ranked by engagement — likes, replies, and Super Likes boost visibility.</div>
            </div>`;
    }

    if (BC.feedMode === 'tiktok') {
        return `
            <div class="bc-tiktok-feed" data-tiktok-feed>
                ${BC.trendingPosts.map((post, i) => _renderTikTokCard(post, i)).join('')}
            </div>`;
    }

    return `
        <div class="bc-discover-header">
            <h2><i class="fa-solid fa-fire"></i> Discover ${modeToggle}</h2>
            <p>Ranked by engagement — likes, replies, reposts & Super Likes</p>
        </div>
        ${BC.trendingPosts.map((post, i) => renderPost(post, i, { trendingRank: i + 1 })).join('')}`;
}
