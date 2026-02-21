// pages/agora/composer.js
// Agora V13 — Compose box rendering
// ============================================================================

import { State } from '../../state.js';
import { BC, TAGS, CONTENT_LIMITS, GALLERY_MAX_ITEMS, getMaxContent } from './state.js';
import { getInitials, formatETH } from './utils.js';

// ============================================================================
// TAG PICKER
// ============================================================================

function renderComposeTagPicker() {
    let html = '<div class="bc-compose-tags">';
    for (const tag of TAGS) {
        const active = BC.composeTag === tag.id ? 'active' : '';
        html += `<button class="bc-compose-tag ${active}" onclick="AgoraPage.setComposeTag(${tag.id})">${tag.name}</button>`;
    }
    html += '</div>';
    return html;
}

// ============================================================================
// UPGRADE HINT
// ============================================================================

function _renderUpgradeHint() {
    // Elite (tier 2) = max tier, no upsell needed
    if (BC.hasBadge && BC.badgeTier >= 2) return '';

    const currentLimit = getMaxContent();
    let nextTierName, nextLimit, icon, color;

    if (!BC.hasBadge) {
        nextTierName = 'Verified';
        nextLimit = CONTENT_LIMITS.verified;
        icon = 'fa-circle-check';
        color = '#3b82f6';
    } else if (BC.badgeTier === 0) {
        nextTierName = 'Premium';
        nextLimit = CONTENT_LIMITS.premium;
        icon = 'fa-circle-check';
        color = '#eab308';
    } else {
        nextTierName = 'Elite';
        nextLimit = CONTENT_LIMITS.elite;
        icon = 'fa-gem';
        color = '#a855f7';
    }

    return `<div class="bc-upgrade-hint" onclick="AgoraPage.openBadge()">
        <i class="fa-solid ${icon}" style="color:${color};font-size:11px;"></i>
        <span>Up to ${nextLimit.toLocaleString()} chars with <strong style="color:${color}">${nextTierName}</strong></span>
        <i class="fa-solid fa-chevron-right" style="font-size:9px;opacity:0.5;"></i>
    </div>`;
}

// ============================================================================
// COMPOSE BOX
// ============================================================================

function _renderMediaGrid() {
    if (BC.pendingMedia.length === 0) return '';
    const canAddMore = BC.pendingMedia.length < GALLERY_MAX_ITEMS;
    const items = BC.pendingMedia.map((m, i) => `
        <div class="bc-media-thumb">
            <img src="${m.preview}" alt="">
            ${m.type === 'video' ? '<div class="bc-video-badge"><i class="fa-solid fa-play"></i> Video</div>' : ''}
            <button class="bc-image-remove" onclick="event.stopPropagation(); AgoraPage.removeImage(${i})"><i class="fa-solid fa-xmark"></i></button>
        </div>`).join('');
    const addBtn = canAddMore ? `
        <div class="bc-media-thumb bc-media-add" onclick="document.getElementById('bc-image-input').click()">
            <i class="fa-solid fa-plus"></i>
        </div>` : '';
    return `<div class="bc-media-grid">${items}${addBtn}</div>`;
}

export function renderCompose() {
    if (!State.isConnected) return '';
    const hasMedia = BC.pendingMedia.length > 0;
    const feeLabel = hasMedia ? `~${formatETH(BC.fees.post || 0n)} BNB` : 'FREE';
    const profileBanner = (!BC.hasProfile && State.isConnected) ? `
        <div class="bc-profile-create-banner">
            <p>Create your profile to get a username and start posting</p>
            <button class="bc-btn bc-btn-primary" onclick="AgoraPage.openProfileSetup()">
                <i class="fa-solid fa-user-plus"></i> Create Profile
            </button>
        </div>` : '';

    const upgradeHint = _renderUpgradeHint();

    return `
        ${profileBanner}
        <div class="bc-compose">
            <div class="bc-compose-row">
                <div class="bc-compose-avatar">
                    ${BC.userProfile?.username ? BC.userProfile.username.charAt(0).toUpperCase() : getInitials(State.userAddress)}
                </div>
                <div class="bc-compose-body">
                    <textarea id="bc-compose-input" class="bc-compose-textarea" placeholder="What's happening on-chain?" maxlength="${getMaxContent()}" oninput="AgoraPage._updateCharCount(this)"></textarea>
                    ${_renderMediaGrid()}
                    ${BC.isUploadingImage ? `<div class="bc-uploading-badge"><i class="fa-solid fa-spinner fa-spin"></i> Uploading media...</div>` : ''}
                    ${renderComposeTagPicker()}
                </div>
            </div>
            ${upgradeHint}
            <div class="bc-compose-divider"></div>
            <div class="bc-compose-bottom">
                <div class="bc-compose-tools">
                    <button class="bc-compose-tool" title="Add media" onclick="document.getElementById('bc-image-input').click()" ${BC.pendingMedia.length >= GALLERY_MAX_ITEMS ? 'disabled' : ''}><i class="fa-solid fa-image"></i></button>
                    <input type="file" id="bc-image-input" hidden accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg" multiple onchange="AgoraPage.handleImageSelect(event)">
                    <button class="bc-go-live-btn" title="Go Live" onclick="AgoraPage.goLive()" ${BC.isLive ? 'disabled' : ''}>
                        <i class="fa-solid fa-video"></i> ${BC.isLive ? 'LIVE' : 'Go Live'}
                    </button>
                </div>
                <div class="bc-compose-right">
                    <span class="bc-char-count" id="bc-char-counter">0/${getMaxContent().toLocaleString()}</span>
                    <span class="bc-compose-fee">${feeLabel}</span>
                    <button id="bc-post-btn" class="bc-post-btn" onclick="AgoraPage.createPost()" ${BC.isPosting ? 'disabled' : ''}>
                        ${BC.isPosting ? '<i class="fa-solid fa-spinner fa-spin"></i> Posting' : 'Post'}
                    </button>
                </div>
            </div>
        </div>`;
}
