// pages/agora/post-detail.js
// Agora V13 — Post detail/thread view rendering
// ============================================================================

import { State } from '../../state.js';
import { t } from '../../modules/core/index.js';
import { BC, getMaxContent } from './state.js';
import { getProfileName } from './utils.js';
import { renderPost } from './post-card.js';
import { renderLiveViewer } from './feed.js';

// ============================================================================
// POST DETAIL (THREAD VIEW)
// ============================================================================

export function renderPostDetail() {
    const post = BC.selectedPost ? BC.postsById.get(BC.selectedPost) : null;
    if (!post) return `<div class="bc-empty"><div class="bc-empty-title">${t('agora.postDetail.postNotFound')}</div></div>`;

    const replies = BC.replies.get(post.id) || [];
    replies.sort((a, b) => a.timestamp - b.timestamp);
    const parentAuthor = getProfileName(post.author);

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
        <div class="bc-thread-divider">${replies.length > 0 ? t('agora.postDetail.repliesCount', {count: String(replies.length)}) : t('agora.postDetail.replies')}</div>
        ${replies.length === 0
            ? `<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">${t('agora.postDetail.noReplies')}</div></div>`
            : replies.map((r, i) => `<div class="bc-thread-reply">${renderPost(r, i, { noAnimation: true })}</div>`).join('')}
        ${State.isConnected ? `
            <div class="bc-reply-compose">
                <div class="bc-reply-label">${t('agora.postDetail.replyingTo', {name: parentAuthor})}</div>
                <div class="bc-reply-row">
                    <textarea id="bc-reply-input" class="bc-reply-input" placeholder="${t('agora.postDetail.replyPlaceholder')}" maxlength="${getMaxContent()}"></textarea>
                    <button id="bc-reply-btn" class="bc-btn bc-btn-primary bc-reply-send" onclick="AgoraPage.submitReply('${post.id}')">${t('agora.postDetail.reply')}</button>
                </div>
                <div style="font-size:11px;color:var(--bc-text-3);margin-top:6px;">${t('agora.postDetail.replyFree')}</div>
            </div>` : ''}`;
}
