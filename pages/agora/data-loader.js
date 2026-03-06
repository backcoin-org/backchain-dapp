// pages/agora/data-loader.js
// Agora V15 — Data loading via Backend API (backchain-backand Cloud Functions)
// Indexer → Firestore (backchain-backand) → API → Frontend
// ============================================================================

const ethers = window.ethers;

import { State } from '../../state.js';
import { agoraABI } from '../../config.js';
import { BackchatTx } from '../../modules/transactions/index.js';
import { calculateFeeClientSide } from '../../modules/core/index.js';
import { LiveStream } from '../../modules/webrtc-live.js';
import { BC, getAgoraAddress } from './state.js';
import { parseMetadata, parsePostContent } from './utils.js';

// ============================================================================
// API CONFIGURATION
// ============================================================================

const AGORA_API = 'https://us-central1-backchain-backand.cloudfunctions.net/getAgoraFeed';
const API_TIMEOUT = 15000; // 15s (Cloud Function cold start can be slow)
const FEED_CACHE_MS = 30000; // 30s cache
const PAGE_SIZE = 30;

// Cache keyed by params string
let _feedCaches = new Map(); // key → { data, time }
let _pendingFetches = new Map(); // key → Promise

function _cacheKey(params) {
    return `${params.sort || 'smart'}|${params.tag ?? -1}|${params.lang || ''}|${params.offset || 0}`;
}

async function fetchAgoraFeed(userAddress, params = {}) {
    const key = _cacheKey(params);
    const now = Date.now();
    const cached = _feedCaches.get(key);
    if (cached && (now - cached.time) < FEED_CACHE_MS) {
        return cached.data;
    }

    // Deduplicate concurrent requests for same key
    if (_pendingFetches.has(key)) return _pendingFetches.get(key);

    const promise = _doFetchAgoraFeed(userAddress, params).finally(() => {
        _pendingFetches.delete(key);
    });
    _pendingFetches.set(key, promise);
    return promise;
}

async function _doFetchAgoraFeed(userAddress, params = {}) {
    const qp = new URLSearchParams();
    if (userAddress) qp.set('user', userAddress.toLowerCase());
    if (params.sort && params.sort !== 'smart') qp.set('sort', params.sort);
    if (params.tag != null && params.tag >= 0) qp.set('tag', String(params.tag));
    if (params.lang) qp.set('lang', params.lang);
    qp.set('limit', String(params.limit || PAGE_SIZE));
    if (params.offset) qp.set('offset', String(params.offset));

    const url = `${AGORA_API}?${qp.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        const key = _cacheKey(params);
        _feedCaches.set(key, { data, time: Date.now() });
        return data;
    } catch (e) {
        clearTimeout(timeout);
        throw e;
    }
}

// Invalidate all cached pages after actions (post, like, etc.)
export function invalidateFeedCache() {
    _feedCaches.clear();
    _pendingFetches.clear();
}

// ============================================================================
// CONTRACT ACCESS (for on-chain reads like hasLiked, getUserProfile)
// ============================================================================

export function getContract() {
    if (State.agoraContractPublic) return State.agoraContractPublic;
    const addr = getAgoraAddress();
    if (!addr) return null;
    if (State.publicProvider) return new ethers.Contract(addr, agoraABI, State.publicProvider);
    if (State.agoraContract) return State.agoraContract;
    return null;
}

// ============================================================================
// FEES
// ============================================================================

export async function loadFees() {
    try {
        let likeFee = 0n, followFee = 0n, downvoteFee = 0n;
        let boostStdFee = 0n, boostFeatFee = 0n;
        try {
            [likeFee, followFee, downvoteFee, boostStdFee, boostFeatFee] = await Promise.all([
                calculateFeeClientSide(ethers.id('AGORA_LIKE'), 0n),
                calculateFeeClientSide(ethers.id('AGORA_FOLLOW'), 0n),
                calculateFeeClientSide(ethers.id('AGORA_DOWNVOTE'), 0n),
                calculateFeeClientSide(ethers.id('AGORA_BOOST_STD'), 0n),
                calculateFeeClientSide(ethers.id('AGORA_BOOST_FEAT'), 0n)
            ]);
        } catch (e) {
            console.warn('[Agora] Fee calc fallback:', e.message);
        }
        BC.fees = {
            post: 0n, reply: 0n, repost: 0n,
            like: likeFee, follow: followFee,
            downvote: downvoteFee,
            boostStd: boostStdFee, boostFeat: boostFeatFee,
            badge: 0n
        };
    } catch (e) {
        console.warn('[Agora] Failed to load fees:', e.message);
    }
}

// ============================================================================
// USER STATUS (still on-chain — real-time accuracy)
// ============================================================================

export async function loadUserStatus() {
    if (!State.isConnected || !State.userAddress) return;
    try {
        const profile = await BackchatTx.getUserProfile(State.userAddress).catch(() => null);
        if (profile) {
            BC.hasBadge = profile.hasBadge;
            BC.isBoosted = profile.boosted;
            BC.boostExpiry = profile.boostExpiry;
            BC.badgeExpiry = profile.badgeExpiry;
            BC.badgeTier = profile.badgeTier;
        }
    } catch (e) {
        console.warn('[Agora] Failed to load user status:', e.message);
    }
}

// ============================================================================
// GLOBAL STATS — from API feed data, on-chain fallback
// ============================================================================

export async function loadGlobalStats() {
    try {
        const feed = await fetchAgoraFeed(State.userAddress, { sort: BC.feedSort, tag: BC.selectedTag, lang: BC.selectedLanguage || '' });
        if (feed.stats) {
            BC.globalStats = {
                totalPosts: feed.stats.totalPosts || 0,
                totalReplies: feed.stats.totalReplies || 0,
                totalReposts: feed.stats.totalReposts || 0,
                totalProfiles: feed.stats.totalProfiles || 0,
                totalLikes: feed.stats.totalLikes || 0,
                totalFollows: feed.stats.totalFollows || 0,
            };
            return;
        }
    } catch (e) {
        console.warn('[Agora] API stats unavailable, falling back to on-chain:', e.message);
    }
    // Fallback: on-chain
    try {
        BC.globalStats = await BackchatTx.getGlobalStats();
    } catch (e) {
        console.warn('[Agora] Failed to load global stats:', e.message);
    }
}

// ============================================================================
// PROFILES — from API feed data
// ============================================================================

export async function loadProfiles() {
    try {
        const feed = await fetchAgoraFeed(State.userAddress, { sort: BC.feedSort, tag: BC.selectedTag, lang: BC.selectedLanguage || '' });

        for (const data of (feed.profiles || [])) {
            const addr = (data.address || '').toLowerCase();
            if (!addr) continue;
            const meta = parseMetadata(data.metadataURI || '');
            BC.profiles.set(addr, {
                username: data.username || '',
                metadataURI: data.metadataURI || '',
                displayName: meta.displayName,
                bio: meta.bio,
                avatar: meta.avatar,
                banner: meta.banner,
                language: meta.language,
                location: meta.location,
                links: meta.links
            });
            if (data.followerCount != null || data.followingCount != null) {
                BC.followCounts.set(addr, {
                    followers: data.followerCount || 0,
                    following: data.followingCount || 0
                });
            }
        }

        // Check current user's profile
        if (State.isConnected && State.userAddress) {
            const myAddr = State.userAddress.toLowerCase();
            let myProfile = BC.profiles.get(myAddr);
            if (!myProfile) {
                // Try on-chain as fallback (in case indexer hasn't caught up)
                try {
                    const profile = await BackchatTx.getUserProfile(State.userAddress);
                    if (profile && profile.usernameHash && profile.usernameHash !== ethers.ZeroHash) {
                        const meta = parseMetadata(profile.metadataURI);
                        myProfile = { username: null, metadataURI: profile.metadataURI, displayName: meta.displayName, bio: meta.bio, avatar: meta.avatar, banner: meta.banner, language: meta.language, location: meta.location, links: meta.links };
                        BC.profiles.set(myAddr, myProfile);
                    }
                    if (profile) {
                        BC.followCounts.set(myAddr, { followers: profile.followers, following: profile.following });
                    }
                } catch {}
            }
            if (myProfile) {
                BC.userProfile = { ...myProfile, address: State.userAddress };
                BC.hasProfile = true;
                if (BC.selectedLanguage === null && myProfile.language) {
                    BC.selectedLanguage = myProfile.language;
                }
            } else {
                BC.hasProfile = false;
                BC.userProfile = null;
            }
        } else {
            BC.hasProfile = false;
        }
        console.log('[Agora] Profiles loaded:', BC.profiles.size, '| hasProfile:', BC.hasProfile);
    } catch (e) {
        console.warn('[Agora] Failed to load profiles:', e.message);
        BC.hasProfile = false;
    }
    BC._render();
}

// ============================================================================
// SOCIAL GRAPH — from API feed data
// ============================================================================

export async function loadSocialGraph() {
    BC.following = new Set();
    BC.followers = new Set();
    BC.followCounts = new Map();

    if (!State.isConnected || !State.userAddress) return;

    try {
        const feed = await fetchAgoraFeed(State.userAddress, { sort: BC.feedSort, tag: BC.selectedTag, lang: BC.selectedLanguage || '' });
        for (const addr of (feed.following || [])) {
            BC.following.add(addr);
        }
        for (const addr of (feed.followers || [])) {
            BC.followers.add(addr);
        }
        console.log(`[Agora] Social graph: following=${BC.following.size}, followers=${BC.followers.size}`);
    } catch (e) {
        console.warn('[Agora] Failed to load social graph:', e.message);
    }
}

// ============================================================================
// BLOCKED AUTHORS — from API feed data
// ============================================================================

export async function loadBlockedAuthors() {
    if (!State.isConnected || !State.userAddress) return;

    try {
        const feed = await fetchAgoraFeed(State.userAddress, { sort: BC.feedSort, tag: BC.selectedTag, lang: BC.selectedLanguage || '' });
        for (const addr of (feed.blocks || [])) {
            BC.blockedAuthors.add(addr);
        }
        console.log(`[Agora] Blocked authors: ${BC.blockedAuthors.size}`);
    } catch (e) {
        console.warn('[Agora] Failed to load blocked authors:', e.message);
    }
}

// ============================================================================
// POSTS — from API feed data + smart feed algorithm
// ============================================================================

function _parsePosts(rawPosts) {
    const allItems = [];
    const feedPosts = [];

    for (const data of rawPosts) {
        const pid = data.postId;
        const type = data.type || 'post';
        const timestamp = data.timestamp || 0;

        if (type === 'post') {
            const { text, media, mediaCID, isVideo } = parsePostContent(data.contentHash || '');
            const post = {
                id: pid, type: 'post',
                author: data.author,
                content: text, media, mediaCID, isVideo,
                tag: data.tag || 0,
                timestamp,
                superLikeETH: 0n,
                editedAt: data.editedAt || 0,
                likesCount: data.likes || 0,
                downvotesCount: data.downvotes || 0,
                repliesCount: data.replies || 0,
                repostsCount: data.reposts || 0,
                txHash: data.txHash
            };
            allItems.push(post);
            feedPosts.push(post);
            BC.postsById.set(pid, post);
        } else if (type === 'reply') {
            const parentId = data.parentId;
            const { text, media, mediaCID, isVideo } = parsePostContent(data.contentHash || '');
            const reply = {
                id: pid, type: 'reply', parentId,
                author: data.author,
                content: text, media, mediaCID, isVideo,
                tag: data.tag || 0,
                timestamp,
                superLikeETH: 0n,
                editedAt: data.editedAt || 0,
                likesCount: data.likes || 0,
                downvotesCount: data.downvotes || 0,
                txHash: data.txHash
            };
            allItems.push(reply);
            BC.postsById.set(pid, reply);
            if (!BC.replies.has(parentId)) BC.replies.set(parentId, []);
            BC.replies.get(parentId).push(reply);
            BC.replyCountMap.set(parentId, (BC.replyCountMap.get(parentId) || 0) + 1);
        } else if (type === 'repost') {
            const originalPostId = data.originalPostId || '0';
            const repost = {
                id: pid, type: 'repost', originalPostId,
                author: data.author,
                timestamp, superLikeETH: 0n, editedAt: 0,
                txHash: data.txHash
            };
            allItems.push(repost);
            feedPosts.push(repost);
            BC.postsById.set(pid, repost);
            BC.repostCountMap.set(originalPostId, (BC.repostCountMap.get(originalPostId) || 0) + 1);
        }
    }
    return { allItems, feedPosts };
}

async function _checkUserLikes(items) {
    if (!State.isConnected || !State.userAddress) return;
    const contract = getContract();
    if (!contract) return;
    const postIds = items.filter(p => p.type !== 'repost').map(p => p.id);
    for (let i = 0; i < postIds.length; i += 10) {
        const batch = postIds.slice(i, i + 10);
        const results = await Promise.all(
            batch.map(pid => contract.hasLiked(pid, State.userAddress).catch(() => false))
        );
        for (let j = 0; j < batch.length; j++) {
            if (results[j]) {
                if (!BC.likesMap.has(batch[j])) BC.likesMap.set(batch[j], new Set());
                BC.likesMap.get(batch[j]).add(State.userAddress.toLowerCase());
            }
        }
    }
}

export async function loadPosts() {
    BC.isLoading = true;
    BC._render();

    try {
        BC.contractAvailable = !!getAgoraAddress();
        if (!BC.contractAvailable) {
            BC.error = 'Agora contract not deployed yet.';
            return;
        }

        const params = {
            sort: BC.feedSort,
            tag: BC.selectedTag >= 0 ? BC.selectedTag : undefined,
            lang: BC.selectedLanguage || '',
            limit: PAGE_SIZE,
            offset: 0
        };

        console.log(`[Agora] Loading posts: sort=${params.sort}, tag=${params.tag ?? 'all'}, lang=${params.lang || 'all'}`);

        const feed = await fetchAgoraFeed(State.userAddress, params);
        const rawPosts = feed.posts || [];

        // Reset collections for fresh load
        BC.postsById = new Map();
        BC.replies = new Map();
        BC.replyCountMap = new Map();
        BC.repostCountMap = new Map();
        BC.likesMap = new Map();

        const { allItems, feedPosts } = _parsePosts(rawPosts);

        console.log(`[Agora] API: ${rawPosts.length} docs → ${feedPosts.length} feed posts, ${allItems.length} total items`);

        await _checkUserLikes(allItems);

        // Filter blocked authors
        const filterBlocked = (posts) => {
            if (BC.blockedAuthors.size === 0) return posts;
            return posts.filter(p => !BC.blockedAuthors.has(p.author?.toLowerCase()));
        };

        BC.posts = filterBlocked(feedPosts);
        BC.allItems = allItems;
        const apiTotal = feed.total || rawPosts.length;
        BC.feedHasMore = (0 + rawPosts.length) < apiTotal;
        BC.feedPage = 0;

        // Discover: server returns sorted by engagement when sort=top
        // For client-side discover tab, re-rank by trending score
        const nowSec = Math.floor(Date.now() / 1000);
        BC.trendingPosts = filterBlocked([...allItems]
            .filter(p => p.type !== 'repost'))
            .map(p => {
                const ageH = Math.max((nowSec - p.timestamp) / 3600, 0.5);
                const likes = p.likesCount || 0;
                const replies = p.repliesCount || BC.replyCountMap.get(p.id) || 0;
                const reposts = p.repostsCount || BC.repostCountMap.get(p.id) || 0;
                const base = 1 + likes * 0.5 + replies * 1.0 + reposts * 0.8;
                p._trendScore = base / Math.sqrt(ageH);
                return p;
            })
            .sort((a, b) => b._trendScore - a._trendScore);

        console.log(`[Agora] Loaded: ${BC.posts.length} feed, ${BC.trendingPosts.length} trending, hasMore=${BC.feedHasMore}`);
    } catch (e) {
        console.error('[Agora] Failed to load posts:', e);
        BC.error = e.message;
    } finally {
        BC.isLoading = false;
        BC._render();
    }
}

// Load next page of posts (called by infinite scroll sentinel)
export async function loadMorePosts() {
    if (BC.feedLoadingMore || !BC.feedHasMore) return;
    BC.feedLoadingMore = true;
    BC._render();

    try {
        const offset = BC.posts.length;
        const params = {
            sort: BC.feedSort,
            tag: BC.selectedTag >= 0 ? BC.selectedTag : undefined,
            lang: BC.selectedLanguage || '',
            limit: PAGE_SIZE,
            offset
        };

        console.log(`[Agora] Loading more posts: offset=${offset}`);
        const feed = await fetchAgoraFeed(State.userAddress, params);
        const rawPosts = feed.posts || [];

        if (rawPosts.length === 0) {
            BC.feedHasMore = false;
        } else {
            const { allItems, feedPosts } = _parsePosts(rawPosts);
            await _checkUserLikes(allItems);

            const filterBlocked = (posts) => {
                if (BC.blockedAuthors.size === 0) return posts;
                return posts.filter(p => !BC.blockedAuthors.has(p.author?.toLowerCase()));
            };

            BC.posts.push(...filterBlocked(feedPosts));
            BC.allItems.push(...allItems);
            const apiTotal = feed.total || 0;
            BC.feedHasMore = (offset + rawPosts.length) < apiTotal;
            console.log(`[Agora] Loaded ${rawPosts.length} more posts, total=${BC.posts.length}, hasMore=${BC.feedHasMore}`);
        }
    } catch (e) {
        console.warn('[Agora] Failed to load more posts:', e.message);
    } finally {
        BC.feedLoadingMore = false;
        BC._render();
    }
}

// ============================================================================
// LIVE ROOMS
// ============================================================================

export async function loadActiveRooms() {
    try {
        const rooms = await LiveStream.getActiveRooms();
        BC.activeRooms = new Map();
        rooms.forEach(r => BC.activeRooms.set(String(r.postId), r));
    } catch (e) {
        console.warn('[Agora] Failed to load live rooms:', e);
    }
}
