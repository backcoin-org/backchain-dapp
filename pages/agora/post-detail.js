// pages/agora/post-detail.js
// Agora V14 — Post detail/thread view rendering (enhanced UX)
// ============================================================================

import { State } from '../../state.js';
import { t } from '../../modules/core/index.js';
import { BC, getMaxContent } from './state.js';
import { getProfileName, formatETH, renderAvatar, formatTimeAgo } from './utils.js';
import { renderPost } from './post-card.js';
import { renderLiveViewer } from './feed.js';

// ============================================================================
// ENGAGEMENT STATS BAR
// ============================================================================

function _renderEngagementBar(post) {
    const likes = post.likesCount || BC.likesMap.get(post.id)?.size || 0;
    const replies = post.repliesCount || BC.replyCountMap?.get(post.id) || 0;
    const reposts = post.repostsCount || BC.repostCountMap?.get(post.id) || 0;
    const superETH = post.superLikeETH || 0n;
    const downs = post.downvotesCount || 0;

    const items = [];
    if (likes > 0) items.push(`<span class="bc-stat-item"><i class="fa-solid fa-heart" style="color:var(--bc-red)"></i> <strong>${likes}</strong> ${likes === 1 ? t('agora.postDetail.like') : t('agora.postDetail.likes')}</span>`);
    if (replies > 0) items.push(`<span class="bc-stat-item"><i class="fa-solid fa-comment" style="color:var(--bc-blue)"></i> <strong>${replies}</strong> ${replies === 1 ? t('agora.postDetail.replyCount') : t('agora.postDetail.repliesCount', { count: String(replies) })}</span>`);
    if (reposts > 0) items.push(`<span class="bc-stat-item"><i class="fa-solid fa-retweet" style="color:var(--bc-green)"></i> <strong>${reposts}</strong> ${t('agora.postCard.repost')}</span>`);
    if (superETH > 0n) items.push(`<span class="bc-stat-item"><i class="fa-solid fa-star" style="color:var(--bc-accent)"></i> <strong>${formatETH(superETH)}</strong> BNB</span>`);
    if (downs > 0) items.push(`<span class="bc-stat-item" style="opacity:0.5"><i class="fa-solid fa-arrow-down"></i> ${downs}</span>`);

    if (items.length === 0) return '';
    return `<div class="bc-engagement-bar">${items.join('')}</div>`;
}

// ============================================================================
// REPLY TREE (nested replies with depth limit)
// ============================================================================

const MAX_DEPTH = 3;

function _renderReplyItem(reply, isLast, depth = 0) {
    const subReplies = BC.replies.get(reply.id) || [];
    subReplies.sort((a, b) => a.timestamp - b.timestamp);
    const hasChildren = subReplies.length > 0 && depth < MAX_DEPTH;

    return `
        <div class="bc-thread-item ${isLast && !hasChildren ? 'bc-thread-last' : ''}" style="${depth > 0 ? `margin-left:${Math.min(depth * 24, 72)}px` : ''}">
            <div class="bc-thread-line"></div>
            ${renderPost(reply, 0, { noAnimation: true })}
            ${hasChildren ? subReplies.map((r, i) => _renderReplyItem(r, i === subReplies.length - 1, depth + 1)).join('') : ''}
            ${subReplies.length > 0 && depth >= MAX_DEPTH ? `<div class="bc-thread-more" onclick="event.stopPropagation(); AgoraPage.viewPost('${reply.id}')"><i class="fa-solid fa-arrow-right"></i> ${subReplies.length} more</div>` : ''}
        </div>`;
}

function _countAllReplies(postId) {
    const direct = BC.replies.get(postId) || [];
    let count = direct.length;
    for (const r of direct) count += _countAllReplies(r.id);
    return count;
}

// ============================================================================
// POST DETAIL (THREAD VIEW)
// ============================================================================

export function renderPostDetail() {
    const post = BC.selectedPost ? BC.postsById.get(BC.selectedPost) : null;
    if (!post) return `<div class="bc-empty"><div class="bc-empty-title">${t('agora.postDetail.postNotFound')}</div></div>`;

    const replies = BC.replies.get(post.id) || [];
    replies.sort((a, b) => a.timestamp - b.timestamp);
    const replyCount = _countAllReplies(post.id);

    const hasLiveRoom = BC.activeRooms.has(String(post.id));
    const isWatching = BC.watchingStreamId === String(post.id);

    return `
        ${isWatching ? renderLiveViewer() : ''}
        ${hasLiveRoom && !isWatching ? `
            <div class="bc-live-join">
                <button class="bc-go-live-btn" onclick="AgoraPage.watchLive('${post.id}')">
                    <i class="fa-solid fa-play"></i> ${t('agora.joinLiveStream')}
                </button>
            </div>` : ''}
        <div class="bc-thread-parent">${renderPost(post, 0, { noAnimation: true })}</div>
        ${_renderEngagementBar(post)}
        <div class="bc-thread-divider">
            <span>${replyCount > 0 ? `${replyCount} ${replyCount === 1 ? t('agora.postDetail.replyCount') : t('agora.postDetail.replies')}` : t('agora.postDetail.replies')}</span>
        </div>
        ${replyCount === 0
            ? `<div class="bc-empty" style="padding:40px 20px;">
                <div class="bc-empty-glyph" style="font-size:28px;"><i class="fa-regular fa-comment-dots"></i></div>
                <div class="bc-empty-text">${t('agora.postDetail.noReplies')}</div>
                ${State.isConnected ? `<div class="bc-empty-text" style="margin-top:8px;font-size:12px;color:var(--bc-accent);">${t('agora.postDetail.beFirst')}</div>` : ''}
            </div>`
            : `<div class="bc-thread-replies">${replies.map((r, i) => _renderReplyItem(r, i === replies.length - 1, 0)).join('')}</div>`}
        ${State.isConnected ? `
            <div class="bc-reply-compose-sticky">
                <div class="bc-reply-compose-inner">
                    <div class="bc-reply-avatar">${renderAvatar(State.userAddress)}</div>
                    <textarea id="bc-reply-input" class="bc-reply-input-v2" placeholder="${t('agora.postDetail.replyPlaceholder')}" maxlength="${getMaxContent()}" rows="1" oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
                    <button id="bc-reply-btn" class="bc-reply-send-v2" onclick="AgoraPage.submitReply('${post.id}')">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>` : ''}`;
}
