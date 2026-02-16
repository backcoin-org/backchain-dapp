// pages/agora/feed.js
// Agora V13 — Feed and Discover view rendering
// ============================================================================

import { State } from '../../state.js';
import { BC, TAGS, LANGUAGES } from './state.js';
import { renderPost } from './post-card.js';

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
    return filteredPosts.map((post, i) => renderPost(post, i)).join('');
}

// ============================================================================
// DISCOVER VIEW
// ============================================================================

export function renderDiscover() {
    if (BC.trendingPosts.length === 0) {
        return `
            <div class="bc-discover-header">
                <h2><i class="fa-solid fa-fire"></i> Discover</h2>
                <p>Ranked by engagement — likes, replies, reposts & Super Likes</p>
            </div>
            <div class="bc-empty">
                <div class="bc-empty-glyph accent"><i class="fa-solid fa-fire"></i></div>
                <div class="bc-empty-title">No posts yet</div>
                <div class="bc-empty-text">Be the first to post! Posts are ranked by engagement — likes, replies, and Super Likes boost visibility.</div>
            </div>`;
    }
    return `
        <div class="bc-discover-header">
            <h2><i class="fa-solid fa-fire"></i> Discover</h2>
            <p>Ranked by engagement — likes, replies, reposts & Super Likes</p>
        </div>
        ${BC.trendingPosts.map((post, i) => renderPost(post, i, { trendingRank: i + 1 })).join('')}`;
}
