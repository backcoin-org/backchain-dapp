// pages/agora/actions.js
// Agora V13 — User action handlers (social interactions)
// ============================================================================

const ethers = window.ethers;

import { State } from '../../state.js';
import { showToast } from '../../ui-feedback.js';
import { agoraABI } from '../../config.js';
import { BackchatTx } from '../../modules/transactions/index.js';
import { irysUploadFile, t } from '../../modules/core/index.js';
import { LiveStream } from '../../modules/webrtc-live.js';
import { BC, getMaxContent, getOperatorAddress, MEDIA_LIMITS, GALLERY_MAX_ITEMS, SOCIAL_LINK_TYPES } from './state.js';
import { getProfileName, getProfileUsername, getIPFSUrl } from './utils.js';
import { loadPosts, invalidateFeedCache } from './data-loader.js';

// ============================================================================
// NAVIGATION
// ============================================================================

export function navigateView(view, data) {
    BC.viewHistory.push({ view: BC.view, activeTab: BC.activeTab, selectedPost: BC.selectedPost, selectedProfile: BC.selectedProfile, scrollY: window.scrollY });
    BC.view = view;
    if (data?.post) BC.selectedPost = data.post;
    if (data?.profile) BC.selectedProfile = data.profile;
    BC._render();
    window.scrollTo(0, 0);
}

export function goBack() {
    let restoreScroll = 0;
    if (BC.viewHistory.length > 0) {
        const prev = BC.viewHistory.pop();
        BC.view = prev.view;
        BC.activeTab = prev.activeTab || BC.view;
        BC.selectedPost = prev.selectedPost;
        BC.selectedProfile = prev.selectedProfile;
        restoreScroll = prev.scrollY || 0;
    } else {
        BC.view = 'feed';
        BC.activeTab = 'feed';
    }
    BC._render();
    requestAnimationFrame(() => window.scrollTo(0, restoreScroll));
}

// ============================================================================
// POST ACTIONS
// ============================================================================

export async function doCreatePost() {
    const input = document.getElementById('bc-compose-input');
    const content = input?.value?.trim();
    if (!content) { showToast(t('agora.toast.pleaseWrite'), 'error'); return; }
    const maxLen = getMaxContent();
    if (content.length > maxLen) { showToast(t('agora.toast.postTooLong', {max: maxLen.toLocaleString()}), 'error'); return; }

    BC.isPosting = true;
    BC._render();

    let finalContent = content;
    let contentType = 0;

    // Multi-media upload
    if (BC.pendingMedia.length > 0) {
        try {
            BC.isUploadingImage = true;
            BC._render();
            const uploaded = [];
            for (const m of BC.pendingMedia) {
                const result = await uploadMediaToStorage(m.file);
                if (result.ipfsHash) uploaded.push({ cid: result.ipfsHash, type: m.type });
            }
            if (uploaded.length === 1) {
                // Single media — legacy format for backward compat
                const m = uploaded[0];
                finalContent = content + (m.type === 'video' ? '\n[vid]' : '\n[img]') + m.cid;
                contentType = m.type === 'video' ? 2 : 1;
            } else if (uploaded.length > 1) {
                // Gallery format
                const gallery = uploaded.map(m => `${m.type === 'video' ? 'vid' : 'img'}:${m.cid}`).join('|');
                finalContent = content + '\n[gallery]' + gallery;
                contentType = 1;
            }
        } catch (e) {
            console.error('[Agora] Media upload failed:', e);
            showToast(t('agora.toast.uploadFailed', {error: e.message}), 'error');
            BC.isPosting = false;
            BC.isUploadingImage = false;
            BC._render();
            return;
        } finally {
            BC.isUploadingImage = false;
        }
    }

    const btn = document.getElementById('bc-post-btn');
    await BackchatTx.createPost({
        content: finalContent,
        tag: BC.composeTag,
        contentType,
        operator: getOperatorAddress(),
        button: btn,
        onSuccess: async () => {
            if (input) input.value = '';
            BC.pendingMedia = [];
            BC.pendingImage = null;
            BC.pendingImagePreview = null;
            BC.pendingMediaType = null;
            BC.composeTag = 0;
            BC.isPosting = false;
            showToast(t('agora.toast.postCreated'), 'success');
            invalidateFeedCache(); await loadPosts();
        },
        onError: () => {
            BC.isPosting = false;
            BC._render();
        }
    });
    BC.isPosting = false;
    BC._render();
}

export async function doCreateReply(parentId) {
    const input = document.getElementById('bc-reply-input');
    const content = input?.value?.trim();
    if (!content) { showToast(t('agora.toast.pleaseWriteReply'), 'error'); return; }

    const btn = document.getElementById('bc-reply-btn');
    await BackchatTx.createReply({
        parentId, content, contentType: 0,
        operator: getOperatorAddress(),
        button: btn,
        onSuccess: async () => {
            if (input) input.value = '';
            showToast(t('agora.toast.replyPosted'), 'success');
            invalidateFeedCache(); await loadPosts();
            BC._render();
        }
    });
}

export async function doRepost(originalPostId) {
    const btn = document.getElementById('bc-repost-confirm-btn');
    await BackchatTx.createRepost({
        originalPostId,
        operator: getOperatorAddress(),
        button: btn,
        onSuccess: async () => {
            closeModal('repost');
            showToast(t('agora.toast.reposted'), 'success');
            invalidateFeedCache(); await loadPosts();
        }
    });
}

export async function doLike(postId) {
    const myAddr = State.userAddress?.toLowerCase();
    // Check if already in cart
    if (BC.actionCart.some(a => a.type === 'like' && String(a.targetId) === String(postId))) {
        showToast(t('agora.toast.alreadyInCart'), 'info');
        return;
    }
    // Optimistic UI
    if (myAddr) {
        if (!BC.likesMap.has(postId)) BC.likesMap.set(postId, new Set());
        BC.likesMap.get(postId).add(myAddr);
    }
    // Add to cart
    const postLabel = `Post #${postId}`;
    BC.actionCart.push({ type: 'like', targetId: String(postId), label: postLabel });
    _saveCart();
    showToast(t('agora.toast.likeAddedToCart'), 'success');
    BC._render();
}

export async function doSuperLike(postId, amount) {
    const ethAmount = ethers.parseEther(amount || '0.001');
    await BackchatTx.superLike({
        postId, ethAmount,
        operator: getOperatorAddress(),
        onSuccess: async () => {
            showToast(t('agora.toast.superLiked'), 'success');
            invalidateFeedCache(); await loadPosts();
        }
    });
}

export async function doDownvote(postId) {
    // Check if already in cart
    if (BC.actionCart.some(a => a.type === 'downvote' && String(a.targetId) === String(postId))) {
        showToast(t('agora.toast.alreadyInCart'), 'info');
        return;
    }
    // Add to cart
    const postLabel = `Post #${postId}`;
    BC.actionCart.push({ type: 'downvote', targetId: String(postId), label: postLabel });
    _saveCart();
    showToast(t('agora.toast.downvoteAddedToCart'), 'success');
    BC._render();
}

export async function doDeletePost(postId) {
    await BackchatTx.deletePost({
        postId,
        onSuccess: async () => {
            showToast(t('agora.toast.deleteSuccess'), 'success');
            invalidateFeedCache(); await loadPosts();
        }
    });
}

export async function doEditPost(postId) {
    const input = document.getElementById('bc-edit-post-input');
    const newContent = input?.value?.trim();
    if (!newContent) { showToast(t('agora.toast.contentRequired'), 'error'); return; }
    const maxLen = getMaxContent();
    if (newContent.length > maxLen) { showToast(t('agora.toast.tooLong', {max: maxLen.toLocaleString()}), 'error'); return; }

    const btn = document.getElementById('bc-edit-post-btn');
    await BackchatTx.editPost({
        postId, newContent, button: btn,
        onSuccess: async () => {
            showToast(t('agora.toast.postEdited'), 'success');
            closeModal('edit-post');
            invalidateFeedCache(); await loadPosts();
            BC._render();
        },
        onError: (err) => {
            showToast(err?.shortMessage || err?.message || 'Edit failed', 'error');
        }
    });
}

// ============================================================================
// SOCIAL ACTIONS
// ============================================================================

export async function doBlockUser(address) {
    await BackchatTx.blockUser({
        userAddress: address,
        onSuccess: () => {
            BC.blockedAuthors.add(address.toLowerCase());
            showToast(t('agora.toast.userBlocked'), 'success');
            BC._render();
        },
        onError: (err) => { showToast(err?.shortMessage || err?.message || 'Block failed', 'error'); }
    });
}

export async function doUnblockUser(address) {
    await BackchatTx.unblockUser({
        userAddress: address,
        onSuccess: () => {
            BC.blockedAuthors.delete(address.toLowerCase());
            showToast(t('agora.toast.userUnblocked'), 'success');
            BC._render();
        },
        onError: (err) => { showToast(err?.shortMessage || err?.message || 'Unblock failed', 'error'); }
    });
}

export async function doPinPost(postId) {
    await BackchatTx.pinPost({
        postId,
        onSuccess: async () => {
            showToast(t('agora.toast.postPinned'), 'success');
            invalidateFeedCache(); await loadPosts();
        }
    });
}

export async function doFollow(address) {
    // Check if already in cart
    if (BC.actionCart.some(a => a.type === 'follow' && a.targetId.toLowerCase() === address.toLowerCase())) {
        showToast(t('agora.toast.alreadyInCart'), 'info');
        return;
    }
    // Optimistic UI
    BC.following.add(address.toLowerCase());
    // Add to cart
    const name = getProfileName(address);
    BC.actionCart.push({ type: 'follow', targetId: address, label: name });
    _saveCart();
    showToast(t('agora.toast.followAddedToCart'), 'success');
    BC._render();
}

export async function doUnfollow(address) {
    await BackchatTx.unfollow({
        toUnfollow: address,
        onSuccess: () => {
            BC.following.delete(address.toLowerCase());
            showToast(t('agora.toast.unfollowed'), 'success');
            BC._render();
        }
    });
}

// ============================================================================
// PROFILE ACTIONS
// ============================================================================

export async function doCreateProfile() {
    const metadataURI = JSON.stringify({ displayName: BC.wizDisplayName, bio: BC.wizBio, language: BC.wizLanguage });
    const btn = document.getElementById('bc-wizard-confirm-btn');

    await BackchatTx.createProfile({
        username: BC.wizUsername,
        metadataURI,
        operator: getOperatorAddress(),
        button: btn,
        onSuccess: async () => {
            showToast(t('agora.toast.profileCreated'), 'success');
            BC.hasProfile = true;
            BC.userProfile = { username: BC.wizUsername, displayName: BC.wizDisplayName, bio: BC.wizBio, language: BC.wizLanguage, address: State.userAddress };
            BC.profiles.set(State.userAddress.toLowerCase(), { username: BC.wizUsername, displayName: BC.wizDisplayName, bio: BC.wizBio, language: BC.wizLanguage });
            BC.selectedLanguage = BC.wizLanguage;
            BC.wizStep = 1; BC.wizUsername = ''; BC.wizDisplayName = ''; BC.wizBio = '';
            BC.view = 'profile';
            BC.activeTab = 'profile';
            BC._render();
        }
    });
}

export async function doUpdateProfile() {
    const displayName = document.getElementById('edit-displayname')?.value?.trim() || '';
    const bio = document.getElementById('edit-bio')?.value?.trim() || '';
    const location = document.getElementById('edit-location')?.value?.trim() || '';
    const btn = document.getElementById('bc-edit-profile-btn');

    // Import getEditLinks dynamically to avoid circular deps
    const { getEditLinks } = await import('./modals.js');
    const links = getEditLinks();

    let avatar = BC.userProfile?.avatar || '';
    const avatarFile = document.getElementById('edit-avatar-file')?.files?.[0];
    if (avatarFile) {
        try {
            btn && (btn.disabled = true);
            btn && (btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t('agora.modals.editProfile.uploadingAvatar')}`);
            const result = await irysUploadFile(avatarFile, {
                tags: [{ name: 'Type', value: 'agora-avatar' }],
                optimize: { maxWidth: 512, maxHeight: 512, quality: 0.8 }
            });
            avatar = result.id;
        } catch (e) {
            showToast(t('agora.toast.avatarUploadError', {error: e.message}), 'error');
            btn && (btn.disabled = false);
            btn && (btn.innerHTML = `<i class="fa-solid fa-check"></i> ${t('agora.modals.editProfile.confirm')}`);
            return;
        }
    }

    let banner = BC.userProfile?.banner || '';
    const bannerFile = document.getElementById('edit-banner-file')?.files?.[0];
    if (bannerFile) {
        try {
            btn && (btn.disabled = true);
            btn && (btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t('agora.modals.editProfile.uploadingCover')}`);
            const result = await irysUploadFile(bannerFile, {
                tags: [{ name: 'Type', value: 'agora-banner' }],
                optimize: { maxWidth: 1200, maxHeight: 400, quality: 0.85 }
            });
            banner = result.id;
        } catch (e) {
            showToast(t('agora.toast.coverUploadError', {error: e.message}), 'error');
            btn && (btn.disabled = false);
            btn && (btn.innerHTML = `<i class="fa-solid fa-check"></i> ${t('agora.modals.editProfile.confirm')}`);
            return;
        }
    }

    const language = document.getElementById('edit-language')?.value || BC.userProfile?.language || '';
    const metadataURI = JSON.stringify({ displayName, bio, avatar, banner, language, location, links });

    await BackchatTx.updateProfile({
        metadataURI, button: btn,
        onSuccess: () => {
            BC.userProfile.displayName = displayName;
            BC.userProfile.bio = bio;
            BC.userProfile.avatar = avatar;
            BC.userProfile.banner = banner;
            BC.userProfile.language = language;
            BC.userProfile.location = location;
            BC.userProfile.links = links;
            BC.profiles.set(State.userAddress.toLowerCase(), { ...BC.profiles.get(State.userAddress.toLowerCase()), displayName, bio, avatar, banner, language, location, links });
            closeModal('edit-profile');
            showToast(t('agora.toast.profileUpdated'), 'success');
            BC._render();
        }
    });
}

// ============================================================================
// PREMIUM ACTIONS
// ============================================================================

export async function doObtainBadge(tier = 0) {
    await BackchatTx.obtainBadge({
        tier, operator: getOperatorAddress(),
        onSuccess: () => {
            BC.hasBadge = true;
            BC.badgeTier = Math.max(BC.badgeTier, tier);
            closeModal('badge');
            const names = [t('agora.modals.badge.verified'), t('agora.modals.badge.premium'), t('agora.modals.badge.elite')];
            showToast(t('agora.toast.badgeObtained', {name: names[tier]}), 'success');
            BC._render();
        }
    });
}

export async function doReportPost(postId, category = 0) {
    await BackchatTx.reportPost({
        postId, category, operator: getOperatorAddress(),
        onSuccess: () => {
            const post = BC.postsById.get(Number(postId));
            if (post) BC.blockedAuthors.add(post.author.toLowerCase());
            closeModal('report');
            showToast(t('agora.toast.postReported'), 'success');
            BC._render();
        },
        onError: (err) => { showToast(err?.shortMessage || err?.message || 'Report failed', 'error'); }
    });
}

export async function doBoostPost(postId, tier = 0) {
    const days = parseInt(document.getElementById('boost-post-days')?.value || '1', 10);
    await BackchatTx.boostPost({
        postId, tier, days, operator: getOperatorAddress(),
        onSuccess: () => {
            closeModal('boost-post');
            const names = [t('agora.modals.boost.standard'), t('agora.modals.boost.featured')];
            showToast(t('agora.toast.postBoosted', {tier: names[tier], days: String(days)}), 'success');
            BC._render();
        },
        onError: (err) => { showToast(err?.shortMessage || err?.message || 'Boost failed', 'error'); }
    });
}

export async function doTipPost(postId) {
    const amount = document.getElementById('tip-amount')?.value || '0.001';
    await BackchatTx.tipPost({
        postId, ethAmount: ethers.parseEther(amount),
        operator: getOperatorAddress(),
        onSuccess: () => {
            closeModal('tip');
            showToast(t('agora.toast.tipped', {amount}), 'success');
            BC._render();
        },
        onError: (err) => { showToast(err?.shortMessage || err?.message || 'Tip failed', 'error'); }
    });
}

export async function doBoostProfile(days = 1) {
    await BackchatTx.boostProfile({
        days, operator: getOperatorAddress(),
        onSuccess: () => {
            BC.isBoosted = true;
            closeModal('boost');
            showToast(t('agora.toast.profileBoosted', {days: String(days)}), 'success');
            BC._render();
        },
        onError: (err) => { showToast(err?.shortMessage || err?.message || 'Boost failed', 'error'); }
    });
}

// ============================================================================
// CHANGE TAG
// ============================================================================

let _changeTagPostId = null;
let _changeTagNewTag = null;

export function openChangeTag(postId) {
    _changeTagPostId = postId;
    _changeTagNewTag = null;
    document.querySelectorAll('[id^="change-tag-opt-"]').forEach(el => el.classList.remove('active'));
    const btn = document.getElementById('bc-change-tag-btn');
    if (btn) btn.disabled = true;
    document.getElementById('modal-change-tag')?.classList.add('active');
}

export function selectNewTag(tagId) {
    _changeTagNewTag = tagId;
    document.querySelectorAll('[id^="change-tag-opt-"]').forEach(el => el.classList.remove('active'));
    document.getElementById(`change-tag-opt-${tagId}`)?.classList.add('active');
    const btn = document.getElementById('bc-change-tag-btn');
    if (btn) btn.disabled = false;
}

export async function confirmChangeTag() {
    if (_changeTagNewTag === null || !_changeTagPostId) return;
    closeModal('change-tag');
    await BackchatTx.changeTag({
        postId: _changeTagPostId,
        newTag: _changeTagNewTag,
        onSuccess: async () => {
            showToast(t('agora.toast.tagChanged'), 'success');
            invalidateFeedCache(); await loadPosts();
        }
    });
}

// ============================================================================
// MEDIA UPLOAD
// ============================================================================

export async function uploadMediaToStorage(file) {
    const isVideo = file.type.startsWith('video/');
    const result = await irysUploadFile(file, {
        tags: [{ name: 'Type', value: isVideo ? 'agora-video' : 'agora-image' }, { name: 'Content-Type', value: file.type }]
    });
    return { success: true, ipfsHash: result.id, isVideo };
}

export function handleImageSelect(e) {
    const files = e.target?.files;
    if (!files || files.length === 0) return;
    const remaining = GALLERY_MAX_ITEMS - BC.pendingMedia.length;
    if (remaining <= 0) { showToast(t('agora.toast.maxMediaItems', {max: String(GALLERY_MAX_ITEMS)}), 'error'); return; }
    const toAdd = Array.from(files).slice(0, remaining);
    let processed = 0;

    for (const file of toAdd) {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        if (!isImage && !isVideo) { showToast(t('agora.toast.unsupportedFileType'), 'error'); continue; }
        const limit = isVideo ? MEDIA_LIMITS.video : MEDIA_LIMITS.image;
        if (!limit.types.includes(file.type)) { showToast(t('agora.toast.invalidFormat', {type: isVideo ? 'video' : 'image'}), 'error'); continue; }
        if (file.size > limit.max) { showToast(t('agora.toast.fileTooLarge', {limit: limit.label}), 'error'); continue; }

        if (isVideo) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadeddata = () => { video.currentTime = 1; };
            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);
                BC.pendingMedia.push({ file, preview: canvas.toDataURL('image/jpeg'), type: 'video' });
                URL.revokeObjectURL(video.src);
                if (++processed === toAdd.length) BC._render();
            };
            video.src = URL.createObjectURL(file);
        } else {
            const reader = new FileReader();
            reader.onload = (ev) => {
                BC.pendingMedia.push({ file, preview: ev.target.result, type: 'image' });
                if (++processed === toAdd.length) BC._render();
            };
            reader.readAsDataURL(file);
        }
    }
    // Reset input so same files can be re-selected
    if (e.target) e.target.value = '';
}

export function removeImage(index) {
    if (typeof index === 'number') {
        BC.pendingMedia.splice(index, 1);
    } else {
        // Legacy: clear all
        BC.pendingMedia = [];
        BC.pendingImage = null;
        BC.pendingImagePreview = null;
        BC.pendingMediaType = null;
    }
    const input = document.getElementById('bc-image-input');
    if (input) input.value = '';
    BC._render();
}

// ============================================================================
// USERNAME CHECK
// ============================================================================

let _usernameTimer = null;

export function onWizUsernameInput(value) {
    BC.wizUsername = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    BC.wizUsernameOk = null;
    BC.wizFee = null;
    clearTimeout(_usernameTimer);
    const input = document.getElementById('wiz-username-input');
    if (input) input.value = BC.wizUsername;

    if (BC.wizUsername.length >= 1 && BC.wizUsername.length <= 15) {
        BC.wizChecking = true;
        renderWizardStatus();
        _usernameTimer = setTimeout(async () => {
            try {
                const [available, feeData] = await Promise.all([
                    BackchatTx.isUsernameAvailable(BC.wizUsername),
                    BackchatTx.getUsernamePrice(BC.wizUsername.length)
                ]);
                BC.wizUsernameOk = available;
                BC.wizFee = feeData.formatted;
            } catch (e) { console.warn('Username check failed:', e); }
            BC.wizChecking = false;
            renderWizardStatus();
        }, 600);
    } else {
        BC.wizChecking = false;
        renderWizardStatus();
    }
}

function renderWizardStatus() {
    const row = document.getElementById('wiz-username-status');
    if (row) {
        if (BC.wizChecking) {
            row.innerHTML = `<span class="bc-username-checking"><i class="fa-solid fa-spinner fa-spin"></i> ${t('agora.profileSetup.usernameChecking')}</span>`;
        } else if (BC.wizUsernameOk === true) {
            row.innerHTML = `<span class="bc-username-ok"><i class="fa-solid fa-check"></i> ${t('agora.profileSetup.usernameAvailable')}</span>
                ${BC.wizFee && BC.wizFee !== '0.0' ? `<span class="bc-username-fee">${BC.wizFee} BNB</span>` : `<span class="bc-username-fee">${t('agora.profileSetup.usernameFree')}</span>`}`;
        } else if (BC.wizUsernameOk === false) {
            row.innerHTML = `<span class="bc-username-taken"><i class="fa-solid fa-xmark"></i> ${t('agora.profileSetup.usernameTaken')}</span>`;
        } else {
            row.innerHTML = '';
        }
    }
    const nextBtn = document.querySelector('.bc-wizard-nav .bc-btn-primary');
    if (nextBtn && BC.wizStep === 1) nextBtn.disabled = !BC.wizUsernameOk;
}

// ============================================================================
// LIVE STREAMING
// ============================================================================

let _mediaRecorder = null;
let _recordedChunks = [];

export async function goLive() {
    if (BC.isLive) { showToast(t('agora.toast.alreadyLive'), 'info'); return; }
    if (!State.isConnected) { showToast(t('agora.toast.connectToGoLive'), 'error'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast(t('agora.toast.browserNoSupport'), 'error');
        return;
    }
    try {
        showToast(t('agora.toast.requestingCamera'), 'info');
        const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        testStream.getTracks().forEach(t => t.stop());

        showToast(t('agora.toast.creatingLivePost'), 'info');
        await BackchatTx.createPost({
            content: 'LIVE NOW', tag: BC.composeTag, contentType: 2,
            operator: getOperatorAddress(),
            onSuccess: async (receipt) => {
                try {
                    let postId = null;
                    if (receipt?.logs) {
                        for (const log of receipt.logs) {
                            try {
                                const iface = new ethers.Interface(agoraABI);
                                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                                if (parsed?.name === 'PostCreated' && parsed.args?.postId != null) {
                                    postId = String(parsed.args.postId);
                                    break;
                                }
                            } catch (_) {}
                        }
                    }
                    if (!postId) {
                        try {
                            const count = await BackchatTx.getPostCount();
                            postId = String(count);
                        } catch (_) { postId = String(Date.now()); }
                    }

                    const ls = new LiveStream();
                    const { roomId, stream } = await ls.startStream(postId, State.userAddress);
                    BC.liveStream = ls;
                    BC.isLive = true;
                    BC.liveViewerCount = 0;
                    _startRecording(stream);
                    ls.onViewerCountChange = (count) => {
                        BC.liveViewerCount = count;
                        const el = document.querySelector('[data-live-viewers]');
                        if (el) el.textContent = `${count} viewer${count !== 1 ? 's' : ''}`;
                    };
                    showToast(t('agora.toast.youAreLive'), 'success');
                    BC._render();
                    setTimeout(() => {
                        const video = document.getElementById('bc-local-video');
                        if (video) video.srcObject = stream;
                    }, 150);
                } catch (e) {
                    console.error('[Agora] LiveStream start error:', e);
                    showToast(t('agora.toast.failedToStartStream', {error: e.message}), 'error');
                }
            },
            onError: (e) => {
                showToast(t('agora.toast.failedToCreateLive', {error: e?.message || 'Transaction rejected'}), 'error');
            }
        });
    } catch (e) {
        console.error('[Agora] goLive error:', e);
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
            showToast(t('agora.toast.cameraPermDenied'), 'error');
        } else if (e.name === 'NotFoundError') {
            showToast(t('agora.toast.noCameraFound'), 'error');
        } else if (e.name === 'NotReadableError') {
            showToast(t('agora.toast.cameraInUse'), 'error');
        } else {
            showToast(t('agora.toast.failedToGoLive', {error: e.message}), 'error');
        }
    }
}

export async function endLive() {
    if (!BC.liveStream) return;
    _stopRecording();
    await BC.liveStream.endStream();
    BC.liveStream = null;
    BC.isLive = false;
    BC.liveViewerCount = 0;
    showToast(t('agora.toast.streamEndedSaving'), 'success');
    BC._render();
    const vodCID = await _uploadVOD();
    if (vodCID) {
        console.log('[Agora] VOD saved with CID:', vodCID);
        invalidateFeedCache(); await loadPosts();
    }
}

export async function watchLive(postId) {
    if (!State.isConnected) return;
    const room = await LiveStream.getRoomByPostId(postId);
    if (!room) { showToast(t('agora.toast.streamEnded'), 'info'); return; }
    const ls = new LiveStream();
    ls.onRemoteStream = (stream) => {
        const video = document.getElementById('bc-remote-video');
        if (video) video.srcObject = stream;
    };
    ls.onStreamEnd = () => {
        showToast(t('agora.toast.streamEnded'), 'info');
        BC.liveStream = null;
        BC.watchingStreamId = null;
        BC._render();
    };
    ls.onError = (msg) => { showToast(t('agora.toast.streamError', {error: msg}), 'error'); };
    await ls.joinStream(room.id, State.userAddress);
    BC.liveStream = ls;
    BC.watchingStreamId = String(postId);
    BC._render();
    setTimeout(() => {
        if (ls.remoteStream) {
            const video = document.getElementById('bc-remote-video');
            if (video) video.srcObject = ls.remoteStream;
        }
    }, 200);
}

export function leaveLive() {
    if (BC.liveStream && !BC.isLive) BC.liveStream.leaveStream();
    BC.liveStream = null;
    BC.watchingStreamId = null;
    BC._render();
}

function _startRecording(stream) {
    if (!MediaRecorder || !stream) return;
    _recordedChunks = [];
    try {
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
            ? 'video/webm;codecs=vp9,opus'
            : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
                ? 'video/webm;codecs=vp8,opus'
                : 'video/webm';
        _mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1500000 });
        _mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) _recordedChunks.push(e.data); };
        _mediaRecorder.onstop = () => { console.log(`[Agora] Recording stopped: ${_recordedChunks.length} chunks`); };
        _mediaRecorder.start(5000);
    } catch (e) {
        console.warn('[Agora] MediaRecorder not available:', e.message);
    }
}

function _stopRecording() {
    if (_mediaRecorder && _mediaRecorder.state !== 'inactive') _mediaRecorder.stop();
}

async function _uploadVOD() {
    if (_recordedChunks.length === 0) return null;
    const blob = new Blob(_recordedChunks, { type: 'video/webm' });
    const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
    if (blob.size > 100 * 1024 * 1024) {
        showToast(t('agora.toast.recordingTooLarge', {size: sizeMB}), 'error');
        return null;
    }
    showToast(t('agora.toast.savingRecording', {size: sizeMB}), 'info');
    try {
        const file = new File([blob], `agora-live-${Date.now()}.webm`, { type: 'video/webm' });
        const result = await irysUploadFile(file, { tags: [{ name: 'Type', value: 'agora-vod' }] });
        showToast(t('agora.toast.recordingSaved'), 'success');
        return result.id;
    } catch (e) {
        console.error('[Agora] VOD upload failed:', e);
        showToast(t('agora.toast.failedToSaveRecording', {error: e.message}), 'error');
        return null;
    } finally {
        _recordedChunks = [];
        _mediaRecorder = null;
    }
}

// ============================================================================
// ACTION CART
// ============================================================================

const CART_STORAGE_KEY = 'agora_action_cart';

function _saveCart() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(BC.actionCart));
    } catch (_) {}
}

export function restoreCart() {
    try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (!saved) return;
        const items = JSON.parse(saved);
        if (!Array.isArray(items) || items.length === 0) return;
        BC.actionCart = items;
        // Re-apply optimistic UI
        const myAddr = State.userAddress?.toLowerCase();
        if (myAddr) {
            for (const item of items) {
                if (item.type === 'like') {
                    const postId = item.targetId;
                    if (!BC.likesMap.has(postId)) BC.likesMap.set(postId, new Set());
                    BC.likesMap.get(postId).add(myAddr);
                } else if (item.type === 'follow') {
                    BC.following.add(item.targetId.toLowerCase());
                }
            }
        }
    } catch (_) {}
}

export function removeFromCart(index) {
    const item = BC.actionCart[index];
    if (!item) return;
    const myAddr = State.userAddress?.toLowerCase();
    // Revert optimistic UI
    if (item.type === 'like' && myAddr) {
        BC.likesMap.get(item.targetId)?.delete(myAddr);
    } else if (item.type === 'follow' && myAddr) {
        BC.following.delete(item.targetId.toLowerCase());
    }
    BC.actionCart.splice(index, 1);
    _saveCart();
    if (BC.actionCart.length === 0) BC.cartVisible = false;
    BC._render();
}

export function clearCart() {
    const myAddr = State.userAddress?.toLowerCase();
    // Revert all optimistic UI
    if (myAddr) {
        for (const item of BC.actionCart) {
            if (item.type === 'like') {
                BC.likesMap.get(item.targetId)?.delete(myAddr);
            } else if (item.type === 'follow') {
                BC.following.delete(item.targetId.toLowerCase());
            }
        }
    }
    BC.actionCart = [];
    BC.cartVisible = false;
    _saveCart();
    showToast(t('agora.toast.cartCleared'), 'info');
    BC._render();
}

export function toggleCart() {
    BC.cartVisible = !BC.cartVisible;
    BC._render();
}

export function getCartFeeTotal() {
    const ethers = window.ethers;
    let likes = 0, follows = 0, downvotes = 0;
    for (const item of BC.actionCart) {
        if (item.type === 'like') likes++;
        else if (item.type === 'follow') follows++;
        else if (item.type === 'downvote') downvotes++;
    }
    const total = BC.fees.like * BigInt(likes) + BC.fees.follow * BigInt(follows) + BC.fees.downvote * BigInt(downvotes);
    return { total, formatted: ethers.formatEther(total), likes, follows, downvotes };
}

export async function submitCart() {
    if (BC.actionCart.length === 0) { showToast(t('agora.toast.cartEmpty'), 'info'); return; }
    if (BC.cartSubmitting) return;

    BC.cartSubmitting = true;
    BC._render();

    const { total } = getCartFeeTotal();
    const items = [...BC.actionCart];

    await BackchatTx.batchActions({
        actions: items,
        totalFee: total,
        operator: getOperatorAddress(),
        onSuccess: async () => {
            BC.actionCart = [];
            BC.cartVisible = false;
            BC.cartSubmitting = false;
            _saveCart();
            showToast(t('agora.toast.batchSuccess', {count: String(items.length)}), 'success');
            invalidateFeedCache(); await loadPosts();
            BC._render();
        },
        onError: (err) => {
            console.error('[Agora] Batch failed:', err);
            BC.cartSubmitting = false;
            showToast(err?.shortMessage || err?.message || t('agora.toast.batchFailed'), 'error');
            BC._render();
        }
    });

    BC.cartSubmitting = false;
    BC._render();
}

// ============================================================================
// SHARE
// ============================================================================

export function sharePost(postId) {
    document.querySelectorAll('.bc-post-dropdown').forEach(el => el.style.display = 'none');
    const post = BC.postsById.get(postId);
    const authorUsername = getProfileUsername(post?.author);
    const myAddress = State.userAddress || '';
    const postParam = authorUsername ? `@${authorUsername}/${postId}` : `post=${postId}`;
    const refParam = myAddress ? `&ref=${myAddress}` : '';
    const url = `${window.location.origin}/#agora?${postParam}${refParam}`;
    const authorName = authorUsername ? `@${authorUsername}` : 'someone';
    const preview = post?.content ? post.content.slice(0, 100) + (post.content.length > 100 ? '...' : '') : '';
    const text = preview || `Check out ${authorName}'s post on Backchain Agora`;

    if (navigator.share) {
        navigator.share({ title: `${authorName} on Backchain`, text, url }).catch(() => {});
    } else {
        navigator.clipboard.writeText(url).then(() => {
            showToast(t('agora.toast.linkCopied'), 'success');
        }).catch(() => {
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            showToast(t('agora.toast.linkCopied'), 'success');
        });
    }
}

// ============================================================================
// MODAL HELPERS
// ============================================================================

export function closeModal(name) {
    document.getElementById(`modal-${name}`)?.classList.remove('active');
}

export function togglePostMenu(postId) {
    const menu = document.getElementById(`post-menu-${postId}`);
    if (!menu) return;
    const isVisible = menu.style.display !== 'none';
    document.querySelectorAll('.bc-post-dropdown').forEach(el => el.style.display = 'none');
    menu.style.display = isVisible ? 'none' : 'block';
}

// Close menus on click outside
document.addEventListener('click', () => {
    document.querySelectorAll('.bc-post-dropdown').forEach(el => el.style.display = 'none');
});
