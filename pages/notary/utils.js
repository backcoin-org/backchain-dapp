// pages/notary/utils.js
// Notary V10 — Utility functions
// ============================================================================

import { FILE_TYPES } from './state.js';
import { resolveContentUrl } from '../../modules/core/index.js';

export function getFileTypeInfo(mimeType = '', fileName = '') {
    const mime = mimeType.toLowerCase();
    const name = fileName.toLowerCase();
    if (mime.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(name)) return FILE_TYPES.image;
    if (mime.includes('pdf') || name.endsWith('.pdf')) return FILE_TYPES.pdf;
    if (mime.includes('audio') || /\.(mp3|wav|ogg|flac|aac|m4a)$/.test(name)) return FILE_TYPES.audio;
    if (mime.includes('video') || /\.(mp4|avi|mov|mkv|webm|wmv)$/.test(name)) return FILE_TYPES.video;
    if (mime.includes('word') || mime.includes('document') || /\.(doc|docx|odt|rtf)$/.test(name)) return FILE_TYPES.document;
    if (mime.includes('sheet') || mime.includes('excel') || /\.(xls|xlsx|csv|ods)$/.test(name)) return FILE_TYPES.spreadsheet;
    if (/\.(js|ts|py|java|cpp|c|h|html|css|json|xml|sol|rs|go|php|rb)$/.test(name)) return FILE_TYPES.code;
    if (mime.includes('zip') || mime.includes('archive') || /\.(zip|rar|7z|tar|gz)$/.test(name)) return FILE_TYPES.archive;
    return FILE_TYPES.default;
}

export function formatTimestamp(ts) {
    if (!ts) return '';
    let date;
    if (typeof ts === 'number') date = new Date(ts > 1e12 ? ts : ts * 1000);
    else if (typeof ts === 'string') date = new Date(ts);
    else if (ts?.toDate) date = ts.toDate();
    else if (ts?.seconds) date = new Date(ts.seconds * 1000);
    else return '';
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export function formatDateFull(ts) {
    if (!ts) return '';
    const date = typeof ts === 'number' ? new Date(ts > 1e12 ? ts : ts * 1000) : new Date(ts);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function shortenAddress(addr) {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function shortenHash(hash) {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export function resolveStorageUrl(uri) {
    return resolveContentUrl(uri) || '';
}

export function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
}

export function parseMetaJson(meta) {
    if (!meta) return {};
    try {
        if (meta.trim().startsWith('{')) {
            return JSON.parse(meta);
        }
    } catch {}
    return { desc: meta };
}

export function extractStorageUri(meta) {
    if (!meta) return '';
    try {
        if (meta.trim().startsWith('{')) {
            const obj = JSON.parse(meta);
            if (obj.uri) return obj.uri;
        }
    } catch {}
    const arMatch = meta.match(/ar:\/\/[a-zA-Z0-9_-]{43,44}/);
    if (arMatch) return arMatch[0];
    const ipfsMatch = meta.match(/ipfs:\/\/\S+/);
    if (ipfsMatch) return ipfsMatch[0];
    const cidMatch = meta.match(/\b(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy\S+)\b/);
    if (cidMatch) return cidMatch[1];
    if (meta.includes('---')) {
        const parts = meta.split('---');
        const uri = parts[parts.length - 1].trim();
        if (uri.length > 10) return uri;
    }
    return '';
}
