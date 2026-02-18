// pages/agora/composer.js
// Agora V13 — Compose box rendering
// ============================================================================

import { State } from '../../state.js';
import { BC, TAGS, getMaxContent } from './state.js';
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
// COMPOSE BOX
// ============================================================================

export function renderCompose() {
    if (!State.isConnected) return '';
    const hasMedia = !!BC.pendingImage;
    const feeLabel = hasMedia ? `~${formatETH(BC.fees.post || 0n)} BNB` : 'FREE';
    const profileBanner = (!BC.hasProfile && State.isConnected) ? `
        <div class="bc-profile-create-banner">
            <p>Create your profile to get a username and start posting</p>
            <button class="bc-btn bc-btn-primary" onclick="AgoraPage.openProfileSetup()">
                <i class="fa-solid fa-user-plus"></i> Create Profile
            </button>
        </div>` : '';

    return `
        ${profileBanner}
        <div class="bc-compose">
            <div class="bc-compose-row">
                <div class="bc-compose-avatar">
                    ${BC.userProfile?.username ? BC.userProfile.username.charAt(0).toUpperCase() : getInitials(State.userAddress)}
                </div>
                <div class="bc-compose-body">
                    <textarea id="bc-compose-input" class="bc-compose-textarea" placeholder="What's happening on-chain?" maxlength="${getMaxContent()}" oninput="AgoraPage._updateCharCount(this)"></textarea>
                    ${BC.pendingImagePreview ? `
                        <div class="bc-image-preview">
                            <img src="${BC.pendingImagePreview}" alt="Preview">
                            ${BC.pendingMediaType === 'video' ? '<div class="bc-video-badge"><i class="fa-solid fa-play"></i> Video</div>' : ''}
                            <button class="bc-image-remove" onclick="AgoraPage.removeImage()"><i class="fa-solid fa-xmark"></i></button>
                        </div>` : ''}
                    ${BC.isUploadingImage ? `<div class="bc-uploading-badge"><i class="fa-solid fa-spinner fa-spin"></i> Uploading ${BC.pendingMediaType === 'video' ? 'video' : 'image'}...</div>` : ''}
                    ${renderComposeTagPicker()}
                </div>
            </div>
            <div class="bc-compose-divider"></div>
            <div class="bc-compose-bottom">
                <div class="bc-compose-tools">
                    <button class="bc-compose-tool" title="Add image" onclick="document.getElementById('bc-image-input').click()"><i class="fa-solid fa-image"></i></button>
                    <input type="file" id="bc-image-input" hidden accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg" onchange="AgoraPage.handleImageSelect(event)">
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
