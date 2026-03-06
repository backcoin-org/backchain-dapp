// pages/agora/post-card.js
// Agora V13 — Post card rendering (shared by feed, profile, post-detail)
// ============================================================================

import { State } from '../../state.js';
import { resolveContentUrl, t } from '../../modules/core/index.js';
import { BC, EXPLORER_TX } from './state.js';
import {
    getProfileName, getProfileUsername, isUserBoosted, isUserBadged,
    formatETH, formatTimeAgo, escapeHtml, linkifyContent,
    renderAvatar, getTagInfo
} from './utils.js';

const FEED_PREVIEW_CHARS = 280;

// ============================================================================
// POST BODY (with truncation in feed)
// ============================================================================

function _hasMedia(post) {
    return (post.media && post.media.length > 0) || !!post.mediaCID;
}

function _renderPostBody(post, options = {}) {
    if (!post.content) return '';
    const isDetail = options.noAnimation && !options.isRepostContent; // post-detail uses noAnimation
    const isTruncated = !isDetail && post.content.length > FEED_PREVIEW_CHARS;
    const displayText = isTruncated ? post.content.slice(0, FEED_PREVIEW_CHARS) + '...' : post.content;
    const isTextOnly = !_hasMedia(post) && post.type !== 'repost';
    const isShort = post.content.length <= 140;

    if (isTextOnly) {
        return `<div class="bc-post-body bc-quote-card${isShort ? ' bc-quote-short' : ''}" data-post-id="${post.id}">
            <span class="bc-quote-open">\u201C</span>
            <div class="bc-quote-text">${linkifyContent(escapeHtml(displayText))}${isTruncated ? `<span class="bc-read-more" onclick="event.stopPropagation(); AgoraPage.expandPost('${post.id}')">${t('agora.readMore')}</span>` : ''}</div>
            <span class="bc-quote-close">\u201D</span>
        </div>`;
    }

    return `<div class="bc-post-body" data-post-id="${post.id}">
        ${linkifyContent(escapeHtml(displayText))}
        ${isTruncated ? `<span class="bc-read-more" onclick="event.stopPropagation(); AgoraPage.expandPost('${post.id}')">${t('agora.readMore')}</span>` : ''}
    </div>`;
}

// ============================================================================
// POST MEDIA (carousel for multi-media, single for legacy)
// ============================================================================

function _renderPostMedia(post) {
    const media = post.media || [];

    // No media at all
    if (media.length === 0 && !post.mediaCID) return '';

    // Single media (legacy or 1-item gallery)
    if (media.length <= 1) {
        const cid = media[0]?.cid || post.mediaCID;
        const isVid = media[0]?.type === 'video' || post.isVideo;
        if (!cid) return '';
        const url = resolveContentUrl(cid) || '';
        return `<div class="bc-post-media">${isVid
            ? `<video src="${url}" playsinline muted loop preload="metadata" data-post-video="${post.id}" onerror="this.style.display='none'"></video>`
            : `<img src="${url}" alt="Media" loading="lazy" onerror="this.style.display='none'">`
        }</div>`;
    }

    // Multi-media carousel
    const slides = media.map((m, i) => {
        const url = resolveContentUrl(m.cid) || '';
        const hidden = i === 0 ? '' : ' style="display:none;"';
        return m.type === 'video'
            ? `<div class="bc-carousel-slide" data-slide="${i}"${hidden}><video src="${url}" playsinline muted loop preload="metadata" data-post-video="${post.id}"></video></div>`
            : `<div class="bc-carousel-slide" data-slide="${i}"${hidden}><img src="${url}" alt="Media ${i+1}" loading="lazy"></div>`;
    }).join('');

    const dots = media.map((_, i) =>
        `<span class="bc-carousel-dot${i === 0 ? ' active' : ''}" data-idx="${i}"></span>`
    ).join('');

    return `
        <div class="bc-post-media bc-carousel" data-carousel="${post.id}" data-current="0" data-total="${media.length}" onclick="event.stopPropagation();">
            <div class="bc-carousel-track">${slides}</div>
            <div class="bc-carousel-dots">${dots}</div>
            <button class="bc-carousel-arrow bc-carousel-prev" onclick="AgoraPage.carouselPrev('${post.id}')" style="display:none;"><i class="fa-solid fa-chevron-left"></i></button>
            <button class="bc-carousel-arrow bc-carousel-next" onclick="AgoraPage.carouselNext('${post.id}')"><i class="fa-solid fa-chevron-right"></i></button>
            <span class="bc-carousel-counter">1/${media.length}</span>
        </div>`;
}

// ============================================================================
// LINK PREVIEW (lightweight, client-side)
// ============================================================================

const URL_RE = /https?:\/\/[^\s<]+/g;
const YT_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/;
const TWITTER_RE = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/;

function _renderLinkPreview(post) {
    if (!post.content) return '';
    const urls = post.content.match(URL_RE);
    if (!urls || urls.length === 0) return '';
    const url = urls[0];

    try {
        const parsed = new URL(url);
        const domain = parsed.hostname.replace(/^www\./, '');

        // YouTube — show thumbnail
        const ytMatch = url.match(YT_RE);
        if (ytMatch) {
            const vid = ytMatch[1];
            return `<a class="bc-link-preview bc-link-yt" href="${escapeHtml(url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
                <div class="bc-link-thumb"><img src="https://img.youtube.com/vi/${vid}/mqdefault.jpg" alt="YouTube" loading="lazy"><div class="bc-link-play"><i class="fa-solid fa-play"></i></div></div>
                <div class="bc-link-info"><span class="bc-link-domain"><i class="fa-brands fa-youtube" style="color:#FF0000"></i> YouTube</span></div>
            </a>`;
        }

        // Twitter/X
        const twMatch = url.match(TWITTER_RE);
        if (twMatch) {
            return `<a class="bc-link-preview" href="${escapeHtml(url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
                <div class="bc-link-info"><span class="bc-link-domain"><i class="fa-brands fa-x-twitter"></i> ${domain}</span><span class="bc-link-url">${escapeHtml(parsed.pathname)}</span></div>
            </a>`;
        }

        // Generic URL
        return `<a class="bc-link-preview" href="${escapeHtml(url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
            <div class="bc-link-info"><img class="bc-link-favicon" src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="" loading="lazy"><span class="bc-link-domain">${escapeHtml(domain)}</span><span class="bc-link-url">${escapeHtml(parsed.pathname.length > 40 ? parsed.pathname.slice(0, 40) + '...' : parsed.pathname)}</span></div>
        </a>`;
    } catch {
        return '';
    }
}

// ============================================================================
// POST MENU
// ============================================================================

export function renderPostMenu(post) {
    if (!State.isConnected) return '';
    const isOwn = post.author?.toLowerCase() === State.userAddress?.toLowerCase();
    const isBlocked = BC.blockedAuthors.has(post.author?.toLowerCase());
    const canEdit = isOwn;
    return `
        <div class="bc-post-menu-wrap">
            <button class="bc-post-menu-btn" onclick="event.stopPropagation(); AgoraPage.togglePostMenu('${post.id}')" title="${t('agora.postCard.options')}">
                <i class="fa-solid fa-ellipsis"></i>
            </button>
            <div class="bc-post-dropdown" id="post-menu-${post.id}" style="display:none;">
                ${isOwn ? `
                ${canEdit ? `<button class="bc-post-dropdown-item" onclick="event.stopPropagation(); AgoraPage.openEditPost('${post.id}')">
                    <i class="fa-solid fa-pen"></i> ${t('agora.postCard.editPost')}
                </button>` : ''}
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); AgoraPage.pinPost('${post.id}')">
                    <i class="fa-solid fa-thumbtack"></i> ${t('agora.postCard.pinToProfile')}
                </button>
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); AgoraPage.openChangeTag('${post.id}')">
                    <i class="fa-solid fa-tag"></i> ${t('agora.postCard.changeTag')}
                </button>` : `
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); AgoraPage.openTip('${post.id}')">
                    <i class="fa-solid fa-hand-holding-dollar"></i> ${t('agora.postCard.tipAuthor')}
                </button>
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); AgoraPage.${isBlocked ? 'unblockUser' : 'blockUser'}('${post.author}')">
                    <i class="fa-solid fa-${isBlocked ? 'unlock' : 'ban'}"></i> ${isBlocked ? t('agora.postCard.unblockUser') : t('agora.postCard.blockUser')}
                </button>
                <button class="bc-post-dropdown-item danger" onclick="event.stopPropagation(); AgoraPage.openReport('${post.id}')">
                    <i class="fa-solid fa-flag"></i> ${t('agora.postCard.report')}
                </button>`}
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); AgoraPage.sharePost('${post.id}')">
                    <i class="fa-solid fa-share-nodes"></i> ${t('agora.postCard.share')}
                </button>
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); AgoraPage.openBoostPost('${post.id}')">
                    <i class="fa-solid fa-rocket"></i> ${t('agora.postCard.boostPost')}
                </button>
                ${post.txHash ? `
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); window.open('${EXPLORER_TX}${post.txHash}', '_blank')">
                    <i class="fa-solid fa-cube"></i> ${t('agora.postCard.viewOnExplorer')}
                </button>` : ''}
                ${isOwn ? `
                <button class="bc-post-dropdown-item danger" onclick="event.stopPropagation(); AgoraPage.deletePost('${post.id}')">
                    <i class="fa-solid fa-trash"></i> ${t('agora.postCard.delete')}
                </button>` : ''}
            </div>
        </div>`;
}

// ============================================================================
// POST CARD
// ============================================================================

export function renderPost(post, index = 0, options = {}) {
    if (post.type === 'repost' && !options.isRepostContent) {
        const originalPost = BC.postsById.get(post.originalPostId);
        return `
            <div class="bc-post" data-post-id="${post.id}" style="animation-delay:${Math.min(index * 0.04, 0.4)}s">
                <div class="bc-repost-banner"><i class="fa-solid fa-retweet"></i> <span>${t('agora.postCard.reposted', {name: getProfileName(post.author)})}</span></div>
                ${originalPost ? renderPost(originalPost, index, { isRepostContent: true, noAnimation: true }) : `<div class="bc-post-body" style="padding:16px 20px;color:var(--bc-text-3);">${t('agora.originalPostNotFound')}</div>`}
            </div>`;
    }

    const authorName = getProfileName(post.author);
    const username = getProfileUsername(post.author);
    const boosted = isUserBoosted(post.author);
    const badged = isUserBadged(post.author);
    const superLikesETH = formatETH(post.superLikeETH || 0n);
    const replyCount = post.repliesCount || BC.replyCountMap.get(post.id) || 0;
    const repostCount = post.repostsCount || BC.repostCountMap.get(post.id) || 0;
    const likeCount = post.likesCount || BC.likesMap.get(post.id)?.size || 0;
    const downCount = post.downvotesCount || 0;
    const isLiked = BC.likesMap.get(post.id)?.has(State.userAddress?.toLowerCase()) || false;
    const isEdited = post.editedAt > 0;
    const animStyle = options.noAnimation ? '' : `style="animation-delay:${Math.min(index * 0.04, 0.4)}s"`;
    const tagInfo = getTagInfo(post.tag || 0);
    const isOwn = post.author?.toLowerCase() === State.userAddress?.toLowerCase();
    const isFollowing = BC.following.has(post.author?.toLowerCase());

    return `
        <div class="bc-post" data-post-id="${post.id}" ${animStyle} onclick="AgoraPage.viewPost('${post.id}')">
            <div class="bc-post-top">
                <div class="bc-avatar ${boosted ? 'boosted' : ''}" onclick="event.stopPropagation(); AgoraPage.viewProfile('${post.author}')">
                    ${renderAvatar(post.author)}
                </div>
                <div class="bc-post-head">
                    <div class="bc-post-author-row">
                        <span class="bc-author-name" onclick="event.stopPropagation(); AgoraPage.viewProfile('${post.author}')">${authorName}</span>
                        ${badged ? `<i class="fa-solid fa-circle-check bc-verified-icon" title="${['Verified','Premium','Elite'][BC.badgeTier] || 'Verified'}" style="${BC.badgeTier === 2 ? 'color:#a855f7' : BC.badgeTier === 1 ? 'color:#f59e0b' : ''}"></i>` : ''}
                        ${username ? `<span class="bc-post-time">@${username}</span>` : ''}
                        ${State.isConnected && !isOwn && !isFollowing ? `<button class="bc-follow-inline" onclick="event.stopPropagation(); AgoraPage.follow('${post.author}')"><i class="fa-solid fa-user-plus"></i></button>` : ''}
                        ${isFollowing && !isOwn ? `<span class="bc-following-badge"><i class="fa-solid fa-check"></i></span>` : ''}
                        <span class="bc-post-time">&middot; ${formatTimeAgo(post.timestamp)}</span>
                        ${isEdited ? `<span class="bc-post-time bc-edited-hint" title="${t('agora.postCard.edited')} ${formatTimeAgo(post.editedAt)}">&#9998; ${t('agora.postCard.edited')}</span>` : ''}
                        ${post.tag > 0 ? `<span class="bc-tag-badge" style="color:${tagInfo.color};border-color:${tagInfo.color}30"><i class="fa-solid ${tagInfo.icon}"></i> ${tagInfo.name}</span>` : ''}
                        ${BC.activeRooms.has(String(post.id)) ? '<span class="bc-live-badge"><span class="bc-live-badge-dot"></span> LIVE</span>' : ''}
                    </div>
                    ${post.type === 'reply' ? `<div class="bc-post-context">${t('agora.postCard.replyingTo', {name: getProfileName(BC.postsById.get(post.parentId)?.author)})}</div>` : ''}
                </div>
                ${renderPostMenu(post)}
            </div>
            ${_renderPostBody(post, options)}
            ${_renderPostMedia(post)}
            ${_renderLinkPreview(post)}
            <div class="bc-actions" onclick="event.stopPropagation()">
                <button class="bc-action act-reply" onclick="AgoraPage.openReply('${post.id}')" title="${t('agora.postCard.reply')}">
                    <i class="fa-regular fa-comment"></i>${replyCount > 0 ? `<span class="count">${replyCount}</span>` : ''}
                </button>
                <button class="bc-action act-repost" onclick="AgoraPage.openRepostConfirm('${post.id}')" title="${t('agora.postCard.repost')}">
                    <i class="fa-solid fa-retweet"></i>${repostCount > 0 ? `<span class="count">${repostCount}</span>` : ''}
                </button>
                <button class="bc-action act-like ${isLiked ? 'liked' : ''}" onclick="AgoraPage.like('${post.id}')" title="${t('agora.postCard.like')}">
                    <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>${likeCount > 0 ? `<span class="count">${likeCount}</span>` : ''}
                </button>
                <button class="bc-action act-down" onclick="AgoraPage.openDownvote('${post.id}')" title="${t('agora.postCard.downvote')}">
                    <i class="fa-solid fa-arrow-down"></i>${downCount > 0 ? `<span class="count">${downCount}</span>` : ''}
                </button>
                <button class="bc-action act-super" onclick="AgoraPage.openSuperLike('${post.id}')" title="${t('agora.postCard.superLike')}">
                    <i class="fa-solid fa-star"></i>${(post.superLikeETH || 0n) > 0n ? `<span class="bc-eth-val">${superLikesETH}</span>` : ''}
                </button>
                <button class="bc-action act-share" onclick="AgoraPage.sharePost('${post.id}')" title="${t('agora.postCard.share')}">
                    <i class="fa-solid fa-arrow-up-from-bracket"></i>
                </button>
            </div>
        </div>`;
}
