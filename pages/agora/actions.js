// pages/agora/actions.js
// Agora V13 — User action handlers (social interactions)
// ============================================================================

const ethers = window.ethers;

import { State } from '../../state.js';
import { showToast } from '../../ui-feedback.js';
import { agoraABI } from '../../config.js';
import { BackchatTx } from '../../modules/transactions/index.js';
import { irysUploadFile } from '../../modules/core/index.js';
import { LiveStream } from '../../modules/webrtc-live.js';
import { BC, getMaxContent, getOperatorAddress, MEDIA_LIMITS } from './state.js';
import { getProfileName, getProfileUsername, getIPFSUrl } from './utils.js';
import { loadPosts } from './data-loader.js';

// ============================================================================
// NAVIGATION
// ============================================================================

export function navigateView(view, data) {
    BC.viewHistory.push({ view: BC.view, activeTab: BC.activeTab, selectedPost: BC.selectedPost, selectedProfile: BC.selectedProfile });
    BC.view = view;
    if (data?.post) BC.selectedPost = data.post;
    if (data?.profile) BC.selectedProfile = data.profile;
    BC._render();
}

export function goBack() {
    if (BC.viewHistory.length > 0) {
        const prev = BC.viewHistory.pop();
        BC.view = prev.view;
        BC.activeTab = prev.activeTab || BC.view;
        BC.selectedPost = prev.selectedPost;
        BC.selectedProfile = prev.selectedProfile;
    } else {
        BC.view = 'feed';
        BC.activeTab = 'feed';
    }
    BC._render();
}

// ============================================================================
// POST ACTIONS
// ============================================================================

export async function doCreatePost() {
    const input = document.getElementById('bc-compose-input');
    const content = input?.value?.trim();
    if (!content) { showToast('Please write something', 'error'); return; }
    const maxLen = getMaxContent();
    if (content.length > maxLen) { showToast(`Post too long (max ${maxLen.toLocaleString()} chars)`, 'error'); return; }

    BC.isPosting = true;
    BC._render();

    let finalContent = content;
    let contentType = 0;

    if (BC.pendingImage) {
        const isVideo = BC.pendingMediaType === 'video';
        try {
            BC.isUploadingImage = true;
            BC._render();
            const result = await uploadMediaToStorage(BC.pendingImage);
            const cid = result.ipfsHash || '';
            if (cid) {
                finalContent = content + (isVideo ? '\n[vid]' : '\n[img]') + cid;
                contentType = isVideo ? 2 : 1;
            }
        } catch (e) {
            console.error('[Agora] Media upload failed:', e);
            showToast('Upload failed: ' + e.message, 'error');
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
            BC.pendingImage = null;
            BC.pendingImagePreview = null;
            BC.pendingMediaType = null;
            BC.composeTag = 0;
            BC.isPosting = false;
            showToast('Post created!', 'success');
            await loadPosts();
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
    if (!content) { showToast('Please write a reply', 'error'); return; }

    const btn = document.getElementById('bc-reply-btn');
    await BackchatTx.createReply({
        parentId, content, contentType: 0,
        operator: getOperatorAddress(),
        button: btn,
        onSuccess: async () => {
            if (input) input.value = '';
            showToast('Reply posted!', 'success');
            await loadPosts();
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
            showToast('Reposted!', 'success');
            await loadPosts();
        }
    });
}

export async function doLike(postId) {
    const myAddr = State.userAddress?.toLowerCase();
    const post = BC.postsById.get(postId);
    if (post && post.author?.toLowerCase() === myAddr) {
        showToast('You can\'t like your own post', 'error');
        return;
    }
    // Optimistic UI
    if (myAddr) {
        if (!BC.likesMap.has(postId)) BC.likesMap.set(postId, new Set());
        BC.likesMap.get(postId).add(myAddr);
        BC._render();
    }
    await BackchatTx.like({
        postId,
        operator: getOperatorAddress(),
        onSuccess: () => showToast('Liked!', 'success'),
        onError: (err) => {
            console.error('[Agora] Like failed:', err);
            showToast('Like failed — check console for details', 'error');
            BC.likesMap.get(postId)?.delete(myAddr);
            BC._render();
        }
    });
}

export async function doSuperLike(postId, amount) {
    const ethAmount = ethers.parseEther(amount || '0.001');
    await BackchatTx.superLike({
        postId, ethAmount,
        operator: getOperatorAddress(),
        onSuccess: async () => {
            showToast('Super Liked!', 'success');
            await loadPosts();
        }
    });
}

export async function doDownvote(postId) {
    await BackchatTx.downvote({
        postId,
        operator: getOperatorAddress(),
        onSuccess: async () => {
            showToast('Downvoted', 'success');
            await loadPosts();
        },
        onError: (err) => {
            showToast(err?.shortMessage || err?.message || 'Downvote failed', 'error');
        }
    });
}

export async function doDeletePost(postId) {
    await BackchatTx.deletePost({
        postId,
        onSuccess: async () => {
            showToast('Post deleted', 'success');
            await loadPosts();
        }
    });
}

export async function doEditPost(postId) {
    const input = document.getElementById('bc-edit-post-input');
    const newContent = input?.value?.trim();
    if (!newContent) { showToast('Content is required', 'error'); return; }
    const maxLen = getMaxContent();
    if (newContent.length > maxLen) { showToast(`Too long (max ${maxLen.toLocaleString()})`, 'error'); return; }

    const btn = document.getElementById('bc-edit-post-btn');
    await BackchatTx.editPost({
        postId, newContent, button: btn,
        onSuccess: async () => {
            showToast('Post edited!', 'success');
            closeModal('edit-post');
            await loadPosts();
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
            showToast('User blocked', 'success');
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
            showToast('User unblocked', 'success');
            BC._render();
        },
        onError: (err) => { showToast(err?.shortMessage || err?.message || 'Unblock failed', 'error'); }
    });
}

export async function doPinPost(postId) {
    await BackchatTx.pinPost({
        postId,
        onSuccess: async () => {
            showToast('Post pinned!', 'success');
            await loadPosts();
        }
    });
}

export async function doFollow(address) {
    await BackchatTx.follow({
        toFollow: address,
        operator: getOperatorAddress(),
        onSuccess: () => {
            BC.following.add(address.toLowerCase());
            showToast('Followed!', 'success');
            BC._render();
        }
    });
}

export async function doUnfollow(address) {
    await BackchatTx.unfollow({
        toUnfollow: address,
        onSuccess: () => {
            BC.following.delete(address.toLowerCase());
            showToast('Unfollowed', 'success');
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
            showToast('Profile created!', 'success');
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
    const btn = document.getElementById('bc-edit-profile-btn');

    let avatar = BC.userProfile?.avatar || '';
    const avatarFile = document.getElementById('edit-avatar-file')?.files?.[0];
    if (avatarFile) {
        try {
            btn && (btn.disabled = true);
            btn && (btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Optimizing & uploading avatar...');
            const result = await irysUploadFile(avatarFile, {
                tags: [{ name: 'Type', value: 'agora-avatar' }],
                optimize: { maxWidth: 512, maxHeight: 512, quality: 0.8 }
            });
            avatar = result.id;
        } catch (e) {
            showToast('Avatar upload error: ' + e.message, 'error');
            btn && (btn.disabled = false);
            btn && (btn.innerHTML = '<i class="fa-solid fa-check"></i> Save Changes');
            return;
        }
    }

    const language = document.getElementById('edit-language')?.value || BC.userProfile?.language || '';
    const metadataURI = JSON.stringify({ displayName, bio, avatar, language });

    await BackchatTx.updateProfile({
        metadataURI, button: btn,
        onSuccess: () => {
            BC.userProfile.displayName = displayName;
            BC.userProfile.bio = bio;
            BC.userProfile.avatar = avatar;
            BC.userProfile.language = language;
            BC.profiles.set(State.userAddress.toLowerCase(), { ...BC.profiles.get(State.userAddress.toLowerCase()), displayName, bio, avatar, language });
            closeModal('edit-profile');
            showToast('Profile updated!', 'success');
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
            const names = ['Verified', 'Premium', 'Elite'];
            showToast(`${names[tier]} badge obtained!`, 'success');
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
            showToast('Post reported. Author blocked from your feed.', 'success');
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
            const names = ['Standard', 'Featured'];
            showToast(`Post boosted (${names[tier]}) for ${days} day${days !== 1 ? 's' : ''}!`, 'success');
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
            showToast(`Tipped ${amount} ETH!`, 'success');
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
            showToast(`Profile boosted for ${days} day${days !== 1 ? 's' : ''}!`, 'success');
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
            showToast('Tag changed!', 'success');
            await loadPosts();
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
    const file = e.target?.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) { showToast('Unsupported file type. Use images or videos.', 'error'); return; }
    const limit = isVideo ? MEDIA_LIMITS.video : MEDIA_LIMITS.image;
    if (!limit.types.includes(file.type)) { showToast(`Invalid ${isVideo ? 'video' : 'image'} format.`, 'error'); return; }
    if (file.size > limit.max) { showToast(`File too large. Maximum ${limit.label}.`, 'error'); return; }

    BC.pendingImage = file;
    if (isVideo) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadeddata = () => { video.currentTime = 1; };
        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            BC.pendingImagePreview = canvas.toDataURL('image/jpeg');
            BC.pendingMediaType = 'video';
            BC._render();
            URL.revokeObjectURL(video.src);
        };
        video.src = URL.createObjectURL(file);
    } else {
        BC.pendingMediaType = 'image';
        const reader = new FileReader();
        reader.onload = (ev) => { BC.pendingImagePreview = ev.target.result; BC._render(); };
        reader.readAsDataURL(file);
    }
}

export function removeImage() {
    BC.pendingImage = null;
    BC.pendingImagePreview = null;
    BC.pendingMediaType = null;
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
            row.innerHTML = '<span class="bc-username-checking"><i class="fa-solid fa-spinner fa-spin"></i> Checking...</span>';
        } else if (BC.wizUsernameOk === true) {
            row.innerHTML = `<span class="bc-username-ok"><i class="fa-solid fa-check"></i> Available</span>
                ${BC.wizFee && BC.wizFee !== '0.0' ? `<span class="bc-username-fee">${BC.wizFee} ETH</span>` : '<span class="bc-username-fee">FREE</span>'}`;
        } else if (BC.wizUsernameOk === false) {
            row.innerHTML = '<span class="bc-username-taken"><i class="fa-solid fa-xmark"></i> Taken</span>';
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
    if (BC.isLive) { showToast('You are already live!', 'info'); return; }
    if (!State.isConnected) { showToast('Connect your wallet to go live', 'error'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('Your browser does not support live streaming (HTTPS required)', 'error');
        return;
    }
    try {
        showToast('Requesting camera access...', 'info');
        const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        testStream.getTracks().forEach(t => t.stop());

        showToast('Creating live post on-chain...', 'info');
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
                    showToast('You are now LIVE!', 'success');
                    BC._render();
                    setTimeout(() => {
                        const video = document.getElementById('bc-local-video');
                        if (video) video.srcObject = stream;
                    }, 150);
                } catch (e) {
                    console.error('[Agora] LiveStream start error:', e);
                    showToast('Failed to start stream: ' + e.message, 'error');
                }
            },
            onError: (e) => {
                showToast('Failed to create live post: ' + (e?.message || 'Transaction rejected'), 'error');
            }
        });
    } catch (e) {
        console.error('[Agora] goLive error:', e);
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
            showToast('Camera/mic permission denied. Please allow access and try again.', 'error');
        } else if (e.name === 'NotFoundError') {
            showToast('No camera or microphone found on this device', 'error');
        } else if (e.name === 'NotReadableError') {
            showToast('Camera is in use by another application', 'error');
        } else {
            showToast('Failed to go live: ' + e.message, 'error');
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
    showToast('Stream ended. Saving recording...', 'success');
    BC._render();
    const vodCID = await _uploadVOD();
    if (vodCID) {
        console.log('[Agora] VOD saved with CID:', vodCID);
        await loadPosts();
    }
}

export async function watchLive(postId) {
    if (!State.isConnected) return;
    const room = await LiveStream.getRoomByPostId(postId);
    if (!room) { showToast('Stream has ended', 'info'); return; }
    const ls = new LiveStream();
    ls.onRemoteStream = (stream) => {
        const video = document.getElementById('bc-remote-video');
        if (video) video.srcObject = stream;
    };
    ls.onStreamEnd = () => {
        showToast('Stream ended', 'info');
        BC.liveStream = null;
        BC.watchingStreamId = null;
        BC._render();
    };
    ls.onError = (msg) => { showToast('Stream error: ' + msg, 'error'); };
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
        showToast(`Recording too large (${sizeMB}MB). Max 100MB.`, 'error');
        return null;
    }
    showToast(`Saving recording to Arweave (${sizeMB}MB)...`, 'info');
    try {
        const file = new File([blob], `agora-live-${Date.now()}.webm`, { type: 'video/webm' });
        const result = await irysUploadFile(file, { tags: [{ name: 'Type', value: 'agora-vod' }] });
        showToast('Live recording saved permanently!', 'success');
        return result.id;
    } catch (e) {
        console.error('[Agora] VOD upload failed:', e);
        showToast('Failed to save recording: ' + e.message, 'error');
        return null;
    } finally {
        _recordedChunks = [];
        _mediaRecorder = null;
    }
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
            showToast('Link copied!', 'success');
        }).catch(() => {
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            showToast('Link copied!', 'success');
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
