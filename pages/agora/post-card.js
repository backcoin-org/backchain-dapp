// pages/agora/post-card.js
// Agora V13 — Post card rendering (shared by feed, profile, post-detail)
// ============================================================================

import { State } from '../../state.js';
import { resolveContentUrl } from '../../modules/core/index.js';
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

function _renderPostBody(post, options = {}) {
    if (!post.content) return '';
    const isDetail = options.noAnimation && !options.isRepostContent; // post-detail uses noAnimation
    const isTruncated = !isDetail && post.content.length > FEED_PREVIEW_CHARS;
    const displayText = isTruncated ? post.content.slice(0, FEED_PREVIEW_CHARS) + '...' : post.content;
    return `<div class="bc-post-body" data-post-id="${post.id}">
        ${linkifyContent(escapeHtml(displayText))}
        ${isTruncated ? `<span class="bc-read-more" onclick="event.stopPropagation(); AgoraPage.expandPost('${post.id}')">Read more</span>` : ''}
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
// POST MENU
// ============================================================================

export function renderPostMenu(post) {
    if (!State.isConnected) return '';
    const isOwn = post.author?.toLowerCase() === State.userAddress?.toLowerCase();
    const isBlocked = BC.blockedAuthors.has(post.author?.toLowerCase());
    const canEdit = isOwn;
    return `
        <div class="bc-post-menu-wrap">
            <button class="bc-post-menu-btn" onclick="event.stopPropagation(); AgoraPage.togglePostMenu('${post.id}')" title="Options">
                <i class="fa-solid fa-ellipsis"></i>
            </button>
            <div class="bc-post-dropdown" id="post-menu-${post.id}" style="display:none;">
                ${isOwn ? `
                ${canEdit ? `<button class="bc-post-dropdown-item" onclick="event.stopPropagation(); AgoraPage.openEditPost('${post.id}')">
                    <i class="fa-solid fa-pen"></i> Edit Post
                </button>` : ''}
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); AgoraPage.pinPost('${post.id}')">
                    <i class="fa-solid fa-thumbtack"></i> Pin to profile
                </button>
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); AgoraPage.openChangeTag('${post.id}')">
                    <i class="fa-solid fa-tag"></i> Change Tag
                </button>` : `
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); AgoraPage.openTip('${post.id}')">
                    <i class="fa-solid fa-hand-holding-dollar"></i> Tip Author
                </button>
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); AgoraPage.${isBlocked ? 'unblockUser' : 'blockUser'}('${post.author}')">
                    <i class="fa-solid fa-${isBlocked ? 'unlock' : 'ban'}"></i> ${isBlocked ? 'Unblock' : 'Block'} User
                </button>
                <button class="bc-post-dropdown-item danger" onclick="event.stopPropagation(); AgoraPage.openReport('${post.id}')">
                    <i class="fa-solid fa-flag"></i> Report
                </button>`}
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); AgoraPage.sharePost('${post.id}')">
                    <i class="fa-solid fa-share-nodes"></i> Share
                </button>
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); AgoraPage.openBoostPost('${post.id}')">
                    <i class="fa-solid fa-rocket"></i> Boost Post
                </button>
                ${post.txHash ? `
                <button class="bc-post-dropdown-item" onclick="event.stopPropagation(); window.open('${EXPLORER_TX}${post.txHash}', '_blank')">
                    <i class="fa-solid fa-cube"></i> View on Explorer
                </button>` : ''}
                ${isOwn ? `
                <button class="bc-post-dropdown-item danger" onclick="event.stopPropagation(); AgoraPage.deletePost('${post.id}')">
                    <i class="fa-solid fa-trash"></i> Delete
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
                <div class="bc-repost-banner"><i class="fa-solid fa-retweet"></i> <span>${getProfileName(post.author)} reposted</span></div>
                ${originalPost ? renderPost(originalPost, index, { isRepostContent: true, noAnimation: true }) : '<div class="bc-post-body" style="padding:16px 20px;color:var(--bc-text-3);">Original post not found</div>'}
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

    const rank = options.trendingRank || 0;
    const rankBadge = rank >= 1 && rank <= 3 ? `<span class="bc-rank-badge bc-rank-${rank}">${rank}</span>` : '';

    return `
        <div class="bc-post" data-post-id="${post.id}" ${animStyle} onclick="AgoraPage.viewPost('${post.id}')">
            <div class="bc-post-top">
                ${rankBadge}
                <div class="bc-avatar ${boosted ? 'boosted' : ''}" onclick="event.stopPropagation(); AgoraPage.viewProfile('${post.author}')">
                    ${renderAvatar(post.author)}
                </div>
                <div class="bc-post-head">
                    <div class="bc-post-author-row">
                        <span class="bc-author-name" onclick="event.stopPropagation(); AgoraPage.viewProfile('${post.author}')">${authorName}</span>
                        ${badged ? `<i class="fa-solid fa-circle-check bc-verified-icon" title="${['Verified','Premium','Elite'][BC.badgeTier] || 'Verified'}" style="${BC.badgeTier === 2 ? 'color:#a855f7' : BC.badgeTier === 1 ? 'color:#f59e0b' : ''}"></i>` : ''}
                        ${username ? `<span class="bc-post-time">@${username}</span>` : ''}
                        <span class="bc-post-time">&middot; ${formatTimeAgo(post.timestamp)}</span>
                        ${isEdited ? `<span class="bc-post-time bc-edited-hint" title="Edited ${formatTimeAgo(post.editedAt)}">&#9998; edited</span>` : ''}
                        ${post.tag > 0 ? `<span class="bc-tag-badge" style="color:${tagInfo.color};border-color:${tagInfo.color}30"><i class="fa-solid ${tagInfo.icon}"></i> ${tagInfo.name}</span>` : ''}
                        ${BC.activeRooms.has(String(post.id)) ? '<span class="bc-live-badge"><span class="bc-live-badge-dot"></span> LIVE</span>' : ''}
                    </div>
                    ${post.type === 'reply' ? `<div class="bc-post-context">Replying to ${getProfileName(BC.postsById.get(post.parentId)?.author)}</div>` : ''}
                </div>
                ${renderPostMenu(post)}
            </div>
            ${_renderPostBody(post, options)}
            ${_renderPostMedia(post)}
            <div class="bc-actions" onclick="event.stopPropagation()">
                <button class="bc-action act-reply" onclick="AgoraPage.openReply('${post.id}')" title="Reply">
                    <i class="fa-regular fa-comment"></i>${replyCount > 0 ? `<span class="count">${replyCount}</span>` : ''}
                </button>
                <button class="bc-action act-repost" onclick="AgoraPage.openRepostConfirm('${post.id}')" title="Repost">
                    <i class="fa-solid fa-retweet"></i>${repostCount > 0 ? `<span class="count">${repostCount}</span>` : ''}
                </button>
                <button class="bc-action act-like ${isLiked ? 'liked' : ''}" onclick="AgoraPage.like('${post.id}')" title="Like">
                    <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>${likeCount > 0 ? `<span class="count">${likeCount}</span>` : ''}
                </button>
                <button class="bc-action act-down" onclick="AgoraPage.openDownvote('${post.id}')" title="Downvote">
                    <i class="fa-solid fa-arrow-down"></i>${downCount > 0 ? `<span class="count">${downCount}</span>` : ''}
                </button>
                <button class="bc-action act-super" onclick="AgoraPage.openSuperLike('${post.id}')" title="Super Like">
                    <i class="fa-solid fa-star"></i>${(post.superLikeETH || 0n) > 0n ? `<span class="bc-eth-val">${superLikesETH}</span>` : ''}
                </button>
                <button class="bc-action act-share" onclick="AgoraPage.sharePost('${post.id}')" title="Share">
                    <i class="fa-solid fa-arrow-up-from-bracket"></i>
                </button>
            </div>
        </div>`;
}
