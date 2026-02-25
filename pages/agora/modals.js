// pages/agora/modals.js
// Agora V13 — Modal dialogs and their handlers
// ============================================================================

import { showToast } from '../../ui-feedback.js';
import { BC, TAGS, LANGUAGES, SOCIAL_LINK_TYPES, getMaxContent } from './state.js';
import { formatETH, escapeHtml, getIPFSUrl } from './utils.js';
import {
    doSuperLike, doDownvote, doObtainBadge, doBoostProfile, doRepost,
    doReportPost, doBoostPost, doTipPost, doEditPost, doUpdateProfile,
    closeModal
} from './actions.js';

// ============================================================================
// MODAL STATE
// ============================================================================

let selectedPostForAction = null;

// ============================================================================
// RENDER ALL MODALS
// ============================================================================

export function renderModals() {
    return `
        <!-- Super Like Modal -->
        <div class="bc-modal-overlay" id="modal-superlike" onclick="if(event.target===this) AgoraPage.closeModal('superlike')">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-star" style="color:var(--bc-accent)"></i> Super Like</span>
                    <button class="bc-modal-x" onclick="AgoraPage.closeModal('superlike')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Send any amount of BNB to boost this post to trending. More BNB = higher rank. All BNB goes to the ecosystem.</p>
                    <div class="bc-field"><label class="bc-label">Amount (BNB)</label><input type="number" id="superlike-amount" class="bc-input" value="0.001" min="0.000001" step="0.0001"></div>
                    <div class="bc-fee-row"><span class="bc-fee-label">Any amount</span><span class="bc-fee-val">&gt; 0 BNB</span></div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:20px;justify-content:center;" onclick="AgoraPage.confirmSuperLike()"><i class="fa-solid fa-star"></i> Super Like</button>
                </div>
            </div>
        </div>

        <!-- Downvote Modal -->
        <div class="bc-modal-overlay" id="modal-downvote" onclick="if(event.target===this) AgoraPage.closeModal('downvote')">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-arrow-down" style="color:var(--bc-purple)"></i> Downvote</span>
                    <button class="bc-modal-x" onclick="AgoraPage.closeModal('downvote')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Downvote this post. You can only downvote each post once.</p>
                    <button class="bc-btn bc-btn-outline" style="width:100%;margin-top:20px;justify-content:center;border-color:var(--bc-purple);color:var(--bc-purple);" onclick="AgoraPage.confirmDownvote()"><i class="fa-solid fa-arrow-down"></i> Downvote</button>
                </div>
            </div>
        </div>

        <!-- Badge Modal -->
        <div class="bc-modal-overlay" id="modal-badge" onclick="if(event.target===this) AgoraPage.closeModal('badge')">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-circle-check" style="color:var(--bc-accent)"></i> Trust Badge</span>
                    <button class="bc-modal-x" onclick="AgoraPage.closeModal('badge')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Get a verified badge for 1 year. Higher tiers unlock longer posts and more prestige.</p>
                    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
                        <button class="bc-btn bc-btn-outline bc-badge-option" style="width:100%;padding:12px 16px;${BC.badgeTier === 0 && BC.hasBadge ? 'border-color:#3b82f6;opacity:0.5;' : ''}" onclick="AgoraPage.confirmBadge(0)">
                            <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
                                <span><i class="fa-solid fa-circle-check" style="color:#3b82f6"></i> Verified</span><span style="color:var(--bc-text-3)">0.02 BNB/yr</span>
                            </div>
                            <div style="font-size:10px;color:var(--bc-text-3);margin-top:4px;text-align:left;">Up to 5,000 chars per post${BC.hasBadge && BC.badgeTier >= 0 ? ' <span style="color:#3b82f6">&#10003; current</span>' : ''}</div>
                        </button>
                        <button class="bc-btn bc-btn-outline bc-badge-option" style="width:100%;padding:12px 16px;border-color:#eab308;${BC.badgeTier === 1 && BC.hasBadge ? 'opacity:0.5;' : ''}" onclick="AgoraPage.confirmBadge(1)">
                            <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
                                <span><i class="fa-solid fa-circle-check" style="color:#eab308"></i> Premium</span><span style="color:var(--bc-text-3)">0.1 BNB/yr</span>
                            </div>
                            <div style="font-size:10px;color:var(--bc-text-3);margin-top:4px;text-align:left;">Up to 20,000 chars per post${BC.hasBadge && BC.badgeTier >= 1 ? ' <span style="color:#eab308">&#10003; current</span>' : ''}</div>
                        </button>
                        <button class="bc-btn bc-btn-outline bc-badge-option" style="width:100%;padding:12px 16px;border-color:#a855f7;" onclick="AgoraPage.confirmBadge(2)">
                            <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
                                <span><i class="fa-solid fa-gem" style="color:#a855f7"></i> Elite</span><span style="color:var(--bc-text-3)">0.25 BNB/yr</span>
                            </div>
                            <div style="font-size:10px;color:var(--bc-text-3);margin-top:4px;text-align:left;">Up to 50,000 chars per post${BC.hasBadge && BC.badgeTier >= 2 ? ' <span style="color:#a855f7">&#10003; current</span>' : ''}</div>
                        </button>
                    </div>
                    <div style="font-size:10px;color:var(--bc-text-3);text-align:center;opacity:0.6;">Without badge: 2,000 chars per post</div>
                </div>
            </div>
        </div>

        <!-- Boost Modal -->
        <div class="bc-modal-overlay" id="modal-boost" onclick="if(event.target===this) AgoraPage.closeModal('boost')">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-rocket" style="color:var(--bc-accent)"></i> Profile Boost</span>
                    <button class="bc-modal-x" onclick="AgoraPage.closeModal('boost')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Boost your profile for more visibility. Pricing set by ecosystem governance.</p>
                    <div class="bc-field"><label class="bc-label">Days</label><input type="number" id="boost-days" class="bc-input" value="7" min="1" max="365" step="1"></div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:20px;justify-content:center;" onclick="AgoraPage.confirmBoost()"><i class="fa-solid fa-rocket"></i> Boost Profile</button>
                </div>
            </div>
        </div>

        <!-- Repost Modal -->
        <div class="bc-modal-overlay" id="modal-repost" onclick="if(event.target===this) AgoraPage.closeModal('repost')">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-retweet" style="color:var(--bc-green)"></i> Repost</span>
                    <button class="bc-modal-x" onclick="AgoraPage.closeModal('repost')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Repost this to your followers? FREE (gas only)</p>
                    <button id="bc-repost-confirm-btn" class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="AgoraPage.confirmRepost()"><i class="fa-solid fa-retweet"></i> Repost</button>
                </div>
            </div>
        </div>

        <!-- Change Tag Modal -->
        <div class="bc-modal-overlay" id="modal-change-tag" onclick="if(event.target===this) AgoraPage.closeModal('change-tag')">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-tag" style="color:var(--bc-accent)"></i> Change Tag</span>
                    <button class="bc-modal-x" onclick="AgoraPage.closeModal('change-tag')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Select a new category for your post. Only gas fee applies.</p>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">
                        ${TAGS.map(tag => `<button class="bc-compose-tag" onclick="AgoraPage.selectNewTag(${tag.id})" id="change-tag-opt-${tag.id}" style="color:${tag.color}"><i class="fa-solid ${tag.icon}"></i> ${tag.name}</button>`).join('')}
                    </div>
                    <button id="bc-change-tag-btn" class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="AgoraPage.confirmChangeTag()" disabled><i class="fa-solid fa-check"></i> Change Tag</button>
                </div>
            </div>
        </div>

        <!-- Edit Profile Modal -->
        <div class="bc-modal-overlay" id="modal-edit-profile" onclick="if(event.target===this) AgoraPage.closeModal('edit-profile')">
            <div class="bc-modal-box" style="max-width:480px;">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-pen" style="color:var(--bc-accent)"></i> Edit Profile</span>
                    <button class="bc-modal-x" onclick="AgoraPage.closeModal('edit-profile')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner" style="max-height:70vh;overflow-y:auto;">
                    <!-- Banner -->
                    <div class="bc-field">
                        <label class="bc-label">Cover Image</label>
                        <div class="bc-edit-banner-wrap" id="edit-banner-preview">
                            ${BC.userProfile?.banner ? `<img src="${getIPFSUrl(BC.userProfile.banner)}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--bc-radius-sm);">` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--bc-text-3);font-size:13px;"><i class="fa-solid fa-image" style="margin-right:6px;"></i> No cover</div>'}
                            <label class="bc-edit-banner-btn">
                                <i class="fa-solid fa-camera"></i>
                                <input type="file" id="edit-banner-file" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none;" onchange="AgoraPage.previewBanner(this)">
                            </label>
                        </div>
                    </div>
                    <!-- Avatar -->
                    <div class="bc-field">
                        <label class="bc-label">Profile Picture</label>
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                            <div class="bc-avatar" style="width:56px;height:56px;font-size:20px;" id="edit-avatar-preview">
                                ${BC.userProfile?.avatar ? `<img src="${getIPFSUrl(BC.userProfile.avatar)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : (BC.userProfile?.username ? BC.userProfile.username.charAt(0).toUpperCase() : '?')}
                            </div>
                            <label class="bc-btn bc-btn-outline" style="cursor:pointer;font-size:13px;">
                                <i class="fa-solid fa-camera"></i> Change Photo
                                <input type="file" id="edit-avatar-file" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none;" onchange="AgoraPage.previewAvatar(this)">
                            </label>
                        </div>
                    </div>
                    <!-- Name & Bio -->
                    <div class="bc-field"><label class="bc-label">Display Name</label><input type="text" id="edit-displayname" class="bc-input" value="${escapeHtml(BC.userProfile?.displayName || '')}" maxlength="30" placeholder="Your display name"></div>
                    <div class="bc-field"><label class="bc-label">Bio</label><textarea id="edit-bio" class="bc-input" maxlength="160" rows="3" placeholder="About you..." style="resize:none;">${escapeHtml(BC.userProfile?.bio || '')}</textarea></div>
                    <!-- Location -->
                    <div class="bc-field"><label class="bc-label"><i class="fa-solid fa-location-dot" style="color:var(--bc-red);margin-right:4px;"></i> Location</label><input type="text" id="edit-location" class="bc-input" value="${escapeHtml(BC.userProfile?.location || '')}" maxlength="50" placeholder="e.g. São Paulo, Brazil"></div>
                    <!-- Language -->
                    <div class="bc-field">
                        <label class="bc-label">Language</label>
                        <select id="edit-language" class="bc-input" style="padding:10px 12px;">
                            ${LANGUAGES.map(l => `<option value="${l.code}" ${(BC.userProfile?.language || '') === l.code ? 'selected' : ''}>${l.flag} ${l.name}</option>`).join('')}
                        </select>
                    </div>
                    <!-- Social Links -->
                    <div class="bc-field">
                        <label class="bc-label"><i class="fa-solid fa-link" style="color:var(--bc-accent);margin-right:4px;"></i> Social Links</label>
                        <div id="edit-social-links" class="bc-edit-links-list">
                            ${_renderEditLinks()}
                        </div>
                        <button class="bc-btn bc-btn-outline" style="width:100%;margin-top:8px;font-size:12px;justify-content:center;" onclick="AgoraPage.addSocialLink()"><i class="fa-solid fa-plus"></i> Add Link</button>
                    </div>
                    <p style="font-size:12px;color:var(--bc-text-3);margin-bottom:16px;">Username cannot be changed. Only gas fee applies.</p>
                    <button id="bc-edit-profile-btn" class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="AgoraPage.confirmEditProfile()"><i class="fa-solid fa-check"></i> Save Changes</button>
                </div>
            </div>
        </div>

        <!-- Report Modal -->
        <div class="bc-modal-overlay" id="modal-report" onclick="if(event.target===this) AgoraPage.closeModal('report')">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-flag" style="color:#ef4444"></i> Report Post</span>
                    <button class="bc-modal-x" onclick="AgoraPage.closeModal('report')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Report this post and block the author from your feed. Cost: 0.0001 BNB</p>
                    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
                        <button class="bc-btn bc-btn-outline" style="width:100%;justify-content:flex-start;gap:8px;" onclick="AgoraPage.confirmReport(0)"><i class="fa-solid fa-robot"></i> Spam</button>
                        <button class="bc-btn bc-btn-outline" style="width:100%;justify-content:flex-start;gap:8px;" onclick="AgoraPage.confirmReport(1)"><i class="fa-solid fa-hand"></i> Harassment</button>
                        <button class="bc-btn bc-btn-outline" style="width:100%;justify-content:flex-start;gap:8px;border-color:#ef4444;color:#ef4444;" onclick="AgoraPage.confirmReport(2)"><i class="fa-solid fa-gavel"></i> Illegal Content</button>
                        <button class="bc-btn bc-btn-outline" style="width:100%;justify-content:flex-start;gap:8px;" onclick="AgoraPage.confirmReport(3)"><i class="fa-solid fa-mask"></i> Scam</button>
                        <button class="bc-btn bc-btn-outline" style="width:100%;justify-content:flex-start;gap:8px;" onclick="AgoraPage.confirmReport(4)"><i class="fa-solid fa-circle-exclamation"></i> Other</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Boost Post Modal -->
        <div class="bc-modal-overlay" id="modal-boost-post" onclick="if(event.target===this) AgoraPage.closeModal('boost-post')">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-rocket" style="color:var(--bc-accent)"></i> Boost Post</span>
                    <button class="bc-modal-x" onclick="AgoraPage.closeModal('boost-post')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Boost this post for more visibility. Pricing set by ecosystem governance.</p>
                    <div class="bc-field"><label class="bc-label">Days</label><input type="number" id="boost-post-days" class="bc-input" value="1" min="1" max="90" step="1"></div>
                    <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
                        <button class="bc-btn bc-btn-outline" style="width:100%;justify-content:space-between;" onclick="AgoraPage.confirmBoostPost(0)">
                            <span><i class="fa-solid fa-rocket"></i> Standard</span><span style="color:var(--bc-text-3)">~${formatETH(BC.fees.boostStd)} BNB/day</span>
                        </button>
                        <button class="bc-btn bc-btn-primary" style="width:100%;justify-content:space-between;" onclick="AgoraPage.confirmBoostPost(1)">
                            <span><i class="fa-solid fa-star"></i> Featured</span><span>~${formatETH(BC.fees.boostFeat)} BNB/day</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tip Modal -->
        <div class="bc-modal-overlay" id="modal-tip" onclick="if(event.target===this) AgoraPage.closeModal('tip')">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-hand-holding-dollar" style="color:var(--bc-green)"></i> Tip Author</span>
                    <button class="bc-modal-x" onclick="AgoraPage.closeModal('tip')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Send BNB directly to the post author as a tip. Any amount &gt; 0.</p>
                    <div class="bc-field"><label class="bc-label">Amount (BNB)</label><input type="number" id="tip-amount" class="bc-input" value="0.001" min="0.000001" step="0.0001"></div>
                    <button class="bc-btn bc-btn-primary" style="width:100%;margin-top:16px;justify-content:center;background:var(--bc-green);" onclick="AgoraPage.confirmTip()"><i class="fa-solid fa-hand-holding-dollar"></i> Send Tip</button>
                </div>
            </div>
        </div>

        <!-- Edit Post Modal -->
        <div class="bc-modal-overlay" id="modal-edit-post" onclick="if(event.target===this) AgoraPage.closeModal('edit-post')">
            <div class="bc-modal-box">
                <div class="bc-modal-top">
                    <span class="bc-modal-title"><i class="fa-solid fa-pen" style="color:var(--bc-accent)"></i> Edit Post</span>
                    <button class="bc-modal-x" onclick="AgoraPage.closeModal('edit-post')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="bc-modal-inner">
                    <p class="bc-modal-desc">Edit within 15 minutes of posting. Free (gas only). Can only edit once.</p>
                    <div class="bc-field">
                        <textarea id="bc-edit-post-input" class="bc-input" rows="4" maxlength="${getMaxContent()}" style="resize:none;"></textarea>
                    </div>
                    <button id="bc-edit-post-btn" class="bc-btn bc-btn-primary" style="width:100%;justify-content:center;" onclick="AgoraPage.confirmEditPost()"><i class="fa-solid fa-check"></i> Save Edit</button>
                </div>
            </div>
        </div>`;
}

// ============================================================================
// MODAL HANDLERS
// ============================================================================

export function openSuperLike(postId) {
    selectedPostForAction = postId;
    document.getElementById('modal-superlike')?.classList.add('active');
}

export async function confirmSuperLike() {
    const amount = document.getElementById('superlike-amount')?.value || '0.001';
    closeModal('superlike');
    await doSuperLike(selectedPostForAction, amount);
}

export function openDownvote(postId) {
    selectedPostForAction = postId;
    document.getElementById('modal-downvote')?.classList.add('active');
}

export async function confirmDownvote() {
    closeModal('downvote');
    await doDownvote(selectedPostForAction);
}

export function openBadge() { document.getElementById('modal-badge')?.classList.add('active'); }
export async function confirmBadge(tier = 0) { await doObtainBadge(tier); }

export function openBoost() { document.getElementById('modal-boost')?.classList.add('active'); }
export async function confirmBoost() {
    const days = parseInt(document.getElementById('boost-days')?.value || '7', 10);
    closeModal('boost');
    await doBoostProfile(days);
}

export function openReport(postId) { selectedPostForAction = postId; document.getElementById('modal-report')?.classList.add('active'); }
export async function confirmReport(category) { await doReportPost(selectedPostForAction, category); }

export function openBoostPost(postId) { selectedPostForAction = postId; document.getElementById('modal-boost-post')?.classList.add('active'); }
export async function confirmBoostPost(tier) { await doBoostPost(selectedPostForAction, tier); }

export function openTip(postId) { selectedPostForAction = postId; document.getElementById('modal-tip')?.classList.add('active'); }
export async function confirmTip() { await doTipPost(selectedPostForAction); }

export function openEditPost(postId) {
    selectedPostForAction = postId;
    const post = BC.postsById.get(postId);
    BC._render(); // re-render to include modal
    const modal = document.getElementById('modal-edit-post');
    const input = document.getElementById('bc-edit-post-input');
    if (input && post) input.value = post.content || '';
    modal?.classList.add('active');
}
export async function confirmEditPost() { await doEditPost(selectedPostForAction); }

export function previewAvatar(input) {
    const file = input?.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Image too large. Maximum 5MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
        const preview = document.getElementById('edit-avatar-preview');
        if (preview) preview.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    };
    reader.readAsDataURL(file);
}

export function openRepostConfirm(postId) {
    selectedPostForAction = postId;
    document.getElementById('modal-repost')?.classList.add('active');
}
export async function confirmRepost() { await doRepost(selectedPostForAction); }

export function openEditProfile() {
    // Initialize edit links from current profile
    _editLinks = (BC.userProfile?.links || []).map(l => ({ ...l }));
    if (_editLinks.length === 0) _editLinks.push({ type: '', url: '' });
    BC._render();
    document.getElementById('modal-edit-profile')?.classList.add('active');
}
export async function confirmEditProfile() { await doUpdateProfile(); }

// Banner preview — update only the image, preserve the file input
export function previewBanner(input) {
    const file = input?.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Image too large. Maximum 5MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
        const preview = document.getElementById('edit-banner-preview');
        if (!preview) return;
        // Remove existing image/placeholder but keep the label with file input
        const existing = preview.querySelector('img, div');
        if (existing) existing.remove();
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:var(--bc-radius-sm);';
        preview.insertBefore(img, preview.firstChild);
    };
    reader.readAsDataURL(file);
}

// Social links editing
let _editLinks = [{ type: '', url: '' }];

function _renderEditLinks() {
    return _editLinks.map((link, i) => `
        <div class="bc-edit-link-row" data-link-idx="${i}">
            <select class="bc-input bc-link-type-select" onchange="AgoraPage.updateLinkType(${i}, this.value)" style="padding:8px;flex:0 0 110px;">
                <option value="">Platform</option>
                ${SOCIAL_LINK_TYPES.map(t => `<option value="${t.id}" ${link.type === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
            </select>
            <input type="text" class="bc-input" value="${escapeHtml(link.url || '')}" placeholder="${_getLinkPlaceholder(link.type)}" maxlength="200" style="flex:1;padding:8px;" onchange="AgoraPage.updateLinkUrl(${i}, this.value)">
            <button class="bc-btn bc-btn-outline" style="padding:6px 8px;border-color:var(--bc-red);color:var(--bc-red);flex-shrink:0;" onclick="AgoraPage.removeSocialLink(${i})"><i class="fa-solid fa-xmark"></i></button>
        </div>`).join('');
}

function _getLinkPlaceholder(type) {
    const found = SOCIAL_LINK_TYPES.find(t => t.id === type);
    return found?.placeholder || 'https://...';
}

export function addSocialLink() {
    if (_editLinks.length >= 9) { showToast('Maximum 9 links', 'error'); return; }
    _editLinks.push({ type: '', url: '' });
    const container = document.getElementById('edit-social-links');
    if (container) container.innerHTML = _renderEditLinks();
}

export function removeSocialLink(index) {
    _editLinks.splice(index, 1);
    if (_editLinks.length === 0) _editLinks.push({ type: '', url: '' });
    const container = document.getElementById('edit-social-links');
    if (container) container.innerHTML = _renderEditLinks();
}

export function updateLinkType(index, value) {
    if (_editLinks[index]) _editLinks[index].type = value;
    // Update placeholder
    const row = document.querySelector(`[data-link-idx="${index}"] input[type="text"]`);
    if (row) row.placeholder = _getLinkPlaceholder(value);
}

export function updateLinkUrl(index, value) {
    if (_editLinks[index]) _editLinks[index].url = value.trim();
}

export function getEditLinks() {
    return _editLinks.filter(l => l.type && l.url);
}
