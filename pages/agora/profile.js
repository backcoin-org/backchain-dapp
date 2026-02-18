// pages/agora/profile.js
// Agora V13 — Profile views rendering
// ============================================================================

import { State } from '../../state.js';
import { BackchatTx } from '../../modules/transactions/index.js';
import { BC, EXPLORER_ADDRESS, LANGUAGES, getMaxContent, formatExpiry, renderExpiryWarnings } from './state.js';
import {
    shortenAddress, escapeHtml, formatETH, getIPFSUrl, getInitials,
    getProfileAvatar, getProfileName, getProfileUsername
} from './utils.js';
import { renderPost } from './post-card.js';

// ============================================================================
// OWN PROFILE
// ============================================================================

export function renderProfile() {
    if (!State.isConnected) {
        return `<div class="bc-empty">
            <div class="bc-empty-glyph"><i class="fa-solid fa-wallet"></i></div>
            <div class="bc-empty-title">Connect Wallet</div>
            <div class="bc-empty-text">Connect your wallet to view your profile.</div>
            <button class="bc-btn bc-btn-primary" style="margin-top:24px;" onclick="window.openConnectModal && window.openConnectModal()"><i class="fa-solid fa-wallet"></i> Connect Wallet</button>
        </div>`;
    }

    const myAddr = State.userAddress?.toLowerCase();
    const userPosts = BC.allItems.filter(p => p.author?.toLowerCase() === myAddr && p.type !== 'repost');
    const followersCount = BC.followCounts.get(myAddr)?.followers ?? BC.followers.size;
    const followingCount = BC.followCounts.get(myAddr)?.following ?? BC.following.size;
    const displayName = BC.userProfile?.displayName || BC.userProfile?.username || shortenAddress(State.userAddress);
    const avatarUrl = BC.userProfile?.avatar ? getIPFSUrl(BC.userProfile.avatar) : '';
    const totalSuperLikeETH = userPosts.reduce((sum, p) => sum + (p.superLikeETH || 0n), 0n);

    return `
        <div class="bc-profile-section">
            <div class="bc-profile-banner"></div>
            <div class="bc-profile-main">
                <div class="bc-profile-top-row">
                    <div class="bc-profile-pic ${BC.isBoosted ? 'boosted' : ''}">${avatarUrl ? `<img src="${avatarUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" onerror="this.outerHTML='${BC.userProfile?.username ? BC.userProfile.username.charAt(0).toUpperCase() : getInitials(State.userAddress)}'">` : (BC.userProfile?.username ? BC.userProfile.username.charAt(0).toUpperCase() : getInitials(State.userAddress))}</div>
                    <div class="bc-profile-actions">
                        ${BC.hasProfile ? `<button class="bc-btn bc-btn-outline" onclick="AgoraPage.openEditProfile()"><i class="fa-solid fa-pen"></i> Edit</button>` : `<button class="bc-btn bc-btn-primary" onclick="AgoraPage.openProfileSetup()"><i class="fa-solid fa-user-plus"></i> Create Profile</button>`}
                        ${!BC.hasBadge ? `<button class="bc-btn bc-btn-outline" onclick="AgoraPage.openBadge()"><i class="fa-solid fa-circle-check"></i> Badge</button>` : ''}
                        ${!BC.isBoosted ? `<button class="bc-btn bc-btn-outline" onclick="AgoraPage.openBoost()"><i class="fa-solid fa-rocket"></i> Boost</button>` : ''}
                    </div>
                </div>
                <div class="bc-profile-name-row">
                    <span class="bc-profile-name">${escapeHtml(displayName)}</span>
                    ${BC.hasBadge ? `<i class="fa-solid fa-circle-check bc-profile-badge"></i> <span style="font-size:11px;color:var(--bc-text-3);">${formatExpiry(BC.badgeExpiry)}</span>` : ''}
                    ${BC.isBoosted ? `<span class="bc-boosted-tag"><i class="fa-solid fa-rocket"></i> Boosted ${formatExpiry(BC.boostExpiry)}</span>` : ''}
                </div>
                ${BC.userProfile?.username ? `<div class="bc-profile-username">@${BC.userProfile.username}</div>` : ''}
                ${BC.userProfile?.bio ? `<div class="bc-profile-bio">${escapeHtml(BC.userProfile.bio)}</div>` : ''}
                <div class="bc-profile-handle">
                    <a href="${EXPLORER_ADDRESS}${State.userAddress}" target="_blank" rel="noopener">View on Explorer <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                </div>
                <div class="bc-profile-stats" style="grid-template-columns:repeat(4,1fr);">
                    <div class="bc-stat-cell"><div class="bc-stat-value">${userPosts.length}</div><div class="bc-stat-label">Posts</div></div>
                    <div class="bc-stat-cell"><div class="bc-stat-value">${followersCount}</div><div class="bc-stat-label">Followers</div></div>
                    <div class="bc-stat-cell"><div class="bc-stat-value">${followingCount}</div><div class="bc-stat-label">Following</div></div>
                    <div class="bc-stat-cell"><div class="bc-stat-value" style="color:var(--bc-accent);">${formatETH(totalSuperLikeETH)}</div><div class="bc-stat-label"><i class="fa-solid fa-star" style="color:var(--bc-accent);font-size:10px;"></i> BNB</div></div>
                </div>
                ${renderExpiryWarnings()}
            </div>
            <div class="bc-section-head">
                <span class="bc-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Your Posts</span>
                <span class="bc-section-subtitle">${userPosts.length} total</span>
            </div>
            ${userPosts.length === 0
                ? '<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet — share your first thought!</div></div>'
                : userPosts.sort((a, b) => b.timestamp - a.timestamp).map((p, i) => renderPost(p, i)).join('')}
        </div>`;
}

// ============================================================================
// OTHER USER PROFILE
// ============================================================================

export function renderUserProfile() {
    const addr = BC.selectedProfile;
    if (!addr) return '<div class="bc-empty"><div class="bc-empty-title">User not found</div></div>';

    const addrLower = addr.toLowerCase();
    const profile = BC.profiles.get(addrLower);
    const displayName = profile?.displayName || profile?.username || shortenAddress(addr);
    const username = profile?.username;
    const bio = profile?.bio;
    const avatarUrl = getProfileAvatar(addr);
    const avatarFallback = username ? username.charAt(0).toUpperCase() : getInitials(addr);
    const isMe = addrLower === State.userAddress?.toLowerCase();
    const isFollowing = BC.following.has(addrLower);
    const isBlocked = BC.blockedAuthors.has(addrLower);
    const counts = BC.followCounts.get(addrLower) || { followers: 0, following: 0 };
    const userPosts = BC.allItems.filter(p => p.author?.toLowerCase() === addrLower && p.type !== 'repost');

    // Lazy-load on-chain follow counts for this profile
    if (!BC.followCounts.has(addrLower)) {
        BackchatTx.getUserProfile(addr).then(p => {
            if (p) {
                BC.followCounts.set(addrLower, { followers: p.followers, following: p.following });
                BC._render();
            }
        }).catch(() => {});
    }

    return `
        <div class="bc-profile-section">
            <div class="bc-profile-banner"></div>
            <div class="bc-profile-main">
                <div class="bc-profile-top-row">
                    <div class="bc-profile-pic">${avatarUrl ? `<img src="${avatarUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" onerror="this.outerHTML='${avatarFallback}'">` : avatarFallback}</div>
                    <div class="bc-profile-actions">
                        ${!isMe && State.isConnected ? `
                            <button class="bc-follow-toggle ${isFollowing ? 'do-unfollow' : 'do-follow'}"
                                onclick="AgoraPage.${isFollowing ? 'unfollow' : 'follow'}('${addr}')">
                                ${isFollowing ? 'Following' : 'Follow'}
                            </button>
                            <button class="bc-btn bc-btn-outline" style="padding:8px 14px;${isBlocked ? 'border-color:var(--bc-red);color:var(--bc-red);' : ''}"
                                onclick="AgoraPage.${isBlocked ? 'unblockUser' : 'blockUser'}('${addr}')">
                                <i class="fa-solid fa-${isBlocked ? 'unlock' : 'ban'}"></i> ${isBlocked ? 'Unblock' : 'Block'}
                            </button>` : ''}
                    </div>
                </div>
                <div class="bc-profile-name-row"><span class="bc-profile-name">${escapeHtml(displayName)}</span></div>
                ${username ? `<div class="bc-profile-username">@${username}</div>` : ''}
                ${bio ? `<div class="bc-profile-bio">${escapeHtml(bio)}</div>` : ''}
                <div class="bc-profile-handle">
                    <a href="${EXPLORER_ADDRESS}${addr}" target="_blank" rel="noopener">${shortenAddress(addr)} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                </div>
                <div class="bc-profile-stats">
                    <div class="bc-stat-cell"><div class="bc-stat-value">${userPosts.length}</div><div class="bc-stat-label">Posts</div></div>
                    <div class="bc-stat-cell"><div class="bc-stat-value">${counts.followers}</div><div class="bc-stat-label">Followers</div></div>
                    <div class="bc-stat-cell"><div class="bc-stat-value">${counts.following}</div><div class="bc-stat-label">Following</div></div>
                </div>
            </div>
            <div class="bc-section-head"><span class="bc-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Posts</span><span class="bc-section-subtitle">${userPosts.length}</span></div>
            ${userPosts.length === 0
                ? '<div class="bc-empty" style="padding:40px 20px;"><div class="bc-empty-text">No posts yet</div></div>'
                : userPosts.sort((a, b) => b.timestamp - a.timestamp).map((p, i) => renderPost(p, i)).join('')}
        </div>`;
}

// ============================================================================
// PROFILE SETUP WIZARD
// ============================================================================

export function renderProfileSetup() {
    if (!State.isConnected) {
        return `<div class="bc-empty">
            <div class="bc-empty-glyph"><i class="fa-solid fa-wallet"></i></div>
            <div class="bc-empty-title">Connect Wallet</div>
            <div class="bc-empty-text">Connect your wallet to create your profile.</div>
        </div>`;
    }
    const step = BC.wizStep;
    return `
        <div class="bc-wizard">
            <div class="bc-wizard-title">Create Your Profile</div>
            <div class="bc-wizard-desc">Set up your on-chain identity on Agora</div>
            <div class="bc-wizard-dots">
                <div class="bc-wizard-dot ${step === 1 ? 'active' : step > 1 ? 'done' : ''}"></div>
                <div class="bc-wizard-dot ${step === 2 ? 'active' : step > 2 ? 'done' : ''}"></div>
                <div class="bc-wizard-dot ${step === 3 ? 'active' : ''}"></div>
            </div>
            <div class="bc-wizard-card">
                ${step === 1 ? `
                    <div class="bc-field">
                        <label class="bc-label">Choose a Username</label>
                        <input type="text" id="wiz-username-input" class="bc-input" placeholder="e.g. satoshi"
                            value="${BC.wizUsername}" maxlength="15" oninput="AgoraPage.onWizUsernameInput(this.value)">
                        <div id="wiz-username-status" class="bc-username-row"></div>
                        <div style="font-size:12px;color:var(--bc-text-3);margin-top:8px;">1-15 chars: lowercase letters, numbers, underscores. Shorter usernames cost more BNB.</div>
                    </div>
                ` : step === 2 ? `
                    <div class="bc-field">
                        <label class="bc-label">Display Name</label>
                        <input type="text" id="wiz-displayname-input" class="bc-input" placeholder="Your public name" value="${escapeHtml(BC.wizDisplayName)}" maxlength="30">
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Bio</label>
                        <textarea id="wiz-bio-input" class="bc-input" placeholder="Tell the world about yourself..." maxlength="160" rows="3" style="resize:none;">${escapeHtml(BC.wizBio)}</textarea>
                    </div>
                    <div class="bc-field">
                        <label class="bc-label">Language</label>
                        <div style="display:flex;flex-wrap:wrap;gap:6px;">
                            ${LANGUAGES.map(l => `<button class="bc-compose-tag ${BC.wizLanguage === l.code ? 'active' : ''}" onclick="AgoraPage.setWizLanguage('${l.code}')" style="font-size:13px;">${l.flag} ${l.name}</button>`).join('')}
                        </div>
                        <div style="font-size:12px;color:var(--bc-text-3);margin-top:6px;">Your posts will be tagged with this language for filtering.</div>
                    </div>
                    <div style="font-size:12px;color:var(--bc-text-3);">Display name, bio, and language are stored as metadata and can be updated anytime for free.</div>
                ` : `
                    <div style="text-align:center;">
                        <div style="font-size:48px; margin-bottom:16px;">${BC.wizUsername.charAt(0).toUpperCase()}</div>
                        <div style="font-size:18px; font-weight:700; color:var(--bc-text);">@${BC.wizUsername}</div>
                        ${BC.wizDisplayName ? `<div style="font-size:14px; color:var(--bc-text-2); margin-top:4px;">${escapeHtml(BC.wizDisplayName)}</div>` : ''}
                        ${BC.wizBio ? `<div style="font-size:13px; color:var(--bc-text-3); margin-top:8px;">${escapeHtml(BC.wizBio)}</div>` : ''}
                        <div style="font-size:13px; color:var(--bc-text-2); margin-top:8px;">${(LANGUAGES.find(l => l.code === BC.wizLanguage) || LANGUAGES[0]).flag} ${(LANGUAGES.find(l => l.code === BC.wizLanguage) || LANGUAGES[0]).name}</div>
                        <div class="bc-fee-row" style="margin-top:20px;">
                            <span class="bc-fee-label">Username Fee</span>
                            <span class="bc-fee-val">${BC.wizFee || '0'} BNB</span>
                        </div>
                    </div>
                `}
            </div>
            <div class="bc-wizard-nav">
                ${step > 1 ? '<button class="bc-btn bc-btn-outline" onclick="AgoraPage.wizBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>' : ''}
                ${step < 3 ? `
                    <button class="bc-btn bc-btn-primary" onclick="AgoraPage.wizNext()" ${step === 1 && !BC.wizUsernameOk ? 'disabled' : ''}>
                        Next <i class="fa-solid fa-arrow-right"></i>
                    </button>
                ` : `
                    <button id="bc-wizard-confirm-btn" class="bc-btn bc-btn-primary" onclick="AgoraPage.wizConfirm()">
                        <i class="fa-solid fa-check"></i> Create Profile
                    </button>
                `}
            </div>
        </div>`;
}
