// pages/agora/utils.js
// Agora V13 — Utility functions (formatting, avatars, content parsing)
// ============================================================================

const ethers = window.ethers;

import { State } from '../../state.js';
import { resolveContentUrl } from '../../modules/core/index.js';
import { BC, TAGS } from './state.js';

// ============================================================================
// TEXT & ADDRESS
// ============================================================================

export function shortenAddress(addr) {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatTimeAgo(timestamp) {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatETH(wei) {
    if (!wei || wei === 0n) return '0';
    const eth = parseFloat(ethers.formatEther(wei));
    if (eth < 0.0001) return '<0.0001';
    if (eth < 0.01) return eth.toFixed(4);
    if (eth < 1) return eth.toFixed(3);
    return eth.toFixed(2);
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// CONTENT PARSING
// ============================================================================

export function getIPFSUrl(uri) {
    return resolveContentUrl(uri) || '';
}

export function parsePostContent(content) {
    const empty = { text: '', media: [], mediaCID: '', isVideo: false };
    if (!content) return empty;

    // New format: [gallery]img:CID1|vid:CID2|img:CID3
    const galleryIdx = content.indexOf('\n[gallery]');
    if (galleryIdx !== -1) {
        const text = content.slice(0, galleryIdx);
        const media = content.slice(galleryIdx + 10).trim().split('|').map(item => {
            if (item.startsWith('vid:')) return { cid: item.slice(4), type: 'video' };
            if (item.startsWith('img:')) return { cid: item.slice(4), type: 'image' };
            return { cid: item, type: 'image' };
        }).filter(m => m.cid);
        const first = media[0] || null;
        return { text, media, mediaCID: first?.cid || '', isVideo: first?.type === 'video' };
    }

    // Legacy: [vid]CID
    const vidIdx = content.indexOf('\n[vid]');
    if (vidIdx !== -1) {
        const cid = content.slice(vidIdx + 6).trim();
        return { text: content.slice(0, vidIdx), media: [{ cid, type: 'video' }], mediaCID: cid, isVideo: true };
    }

    // Legacy: [img]CID
    const imgIdx = content.indexOf('\n[img]');
    if (imgIdx !== -1) {
        const cid = content.slice(imgIdx + 6).trim();
        return { text: content.slice(0, imgIdx), media: [{ cid, type: 'image' }], mediaCID: cid, isVideo: false };
    }

    return { text: content, media: [], mediaCID: '', isVideo: false };
}

export function parseMetadata(metadataURI) {
    if (!metadataURI) return { displayName: '', bio: '', avatar: '', language: '' };
    try {
        const data = JSON.parse(metadataURI);
        return { displayName: data.displayName || '', bio: data.bio || '', avatar: data.avatar || '', language: data.language || '' };
    } catch {
        return { displayName: '', bio: '', avatar: '', language: '' };
    }
}

export function linkifyContent(escapedHtml) {
    if (!escapedHtml) return '';
    // URLs
    let html = escapedHtml.replace(/(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener" style="color:var(--bc-accent);text-decoration:none;" onclick="event.stopPropagation()">$1</a>');
    // @mentions
    html = html.replace(/@([a-z0-9_]{1,15})/g, (match, username) => {
        let addr = null;
        for (const [a, p] of BC.profiles) {
            if (p.username === username) { addr = a; break; }
        }
        if (addr) return `<span style="color:var(--bc-accent);cursor:pointer;" onclick="event.stopPropagation(); AgoraPage.viewProfile('${addr}')">@${username}</span>`;
        return `<span style="color:var(--bc-accent);">@${username}</span>`;
    });
    return html;
}

// ============================================================================
// PROFILE HELPERS
// ============================================================================

export function getInitials(address) {
    if (!address) return '?';
    return address.slice(2, 4).toUpperCase();
}

export function getProfileAvatar(address) {
    if (!address) return '';
    const profile = BC.profiles.get(address.toLowerCase());
    return profile?.avatar ? getIPFSUrl(profile.avatar) : '';
}

export function renderAvatar(address) {
    const url = getProfileAvatar(address);
    const username = getProfileUsername(address);
    const fallback = username ? username.charAt(0).toUpperCase() : getInitials(address);
    if (url) return `<img src="${url}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" onerror="this.outerHTML='${fallback}'">`;
    return fallback;
}

export function getProfileName(address) {
    if (!address) return '?';
    const profile = BC.profiles.get(address.toLowerCase());
    if (profile?.displayName) return profile.displayName;
    if (profile?.username) return `@${profile.username}`;
    return shortenAddress(address);
}

export function getProfileUsername(address) {
    if (!address) return null;
    return BC.profiles.get(address.toLowerCase())?.username || null;
}

export function isUserBoosted(address) {
    if (address?.toLowerCase() === State.userAddress?.toLowerCase()) return BC.isBoosted;
    return false;
}

export function isUserBadged(address) {
    if (address?.toLowerCase() === State.userAddress?.toLowerCase()) return BC.hasBadge;
    return false;
}

export function getTagInfo(tagId) {
    return TAGS[tagId] || TAGS[0];
}
