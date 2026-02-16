// pages/agora/data-loader.js
// Agora V13 — Data loading from smart contract
// ============================================================================

const ethers = window.ethers;

import { State } from '../../state.js';
import { agoraABI } from '../../config.js';
import { BackchatTx } from '../../modules/transactions/index.js';
import { calculateFeeClientSide } from '../../modules/core/index.js';
import { LiveStream } from '../../modules/webrtc-live.js';
import { BC, getAgoraAddress, EVENTS_LOOKBACK } from './state.js';
import { parseMetadata, parsePostContent } from './utils.js';

// ============================================================================
// CONTRACT ACCESS
// ============================================================================

export function getContract() {
    if (State.agoraContract) return State.agoraContract;
    if (State.agoraContractPublic) return State.agoraContractPublic;
    const addr = getAgoraAddress();
    if (!addr) return null;
    if (State.publicProvider) return new ethers.Contract(addr, agoraABI, State.publicProvider);
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
// USER STATUS
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
// GLOBAL STATS
// ============================================================================

export async function loadGlobalStats() {
    try {
        BC.globalStats = await BackchatTx.getGlobalStats();
    } catch (e) {
        console.warn('[Agora] Failed to load global stats:', e.message);
    }
}

// ============================================================================
// PROFILES
// ============================================================================

export async function loadProfiles() {
    try {
        const contract = getContract();
        if (!contract) { BC.hasProfile = false; return; }

        const [createEvents, updateEvents] = await Promise.all([
            contract.queryFilter(contract.filters.ProfileCreated(), EVENTS_LOOKBACK).catch(() => []),
            contract.queryFilter(contract.filters.ProfileUpdated(), EVENTS_LOOKBACK).catch(() => [])
        ]);

        for (const ev of createEvents) {
            const addr = ev.args.user.toLowerCase();
            const meta = parseMetadata(ev.args.metadataURI);
            BC.profiles.set(addr, {
                username: ev.args.username,
                metadataURI: ev.args.metadataURI || '',
                displayName: meta.displayName,
                bio: meta.bio,
                avatar: meta.avatar,
                language: meta.language
            });
        }

        for (const ev of updateEvents) {
            const addr = ev.args.user.toLowerCase();
            const existing = BC.profiles.get(addr);
            if (!existing) continue;
            const meta = parseMetadata(ev.args.metadataURI);
            BC.profiles.set(addr, {
                ...existing,
                metadataURI: ev.args.metadataURI || '',
                displayName: meta.displayName || existing.displayName,
                bio: meta.bio,
                avatar: meta.avatar || existing.avatar,
                language: meta.language || existing.language
            });
        }

        if (State.isConnected && State.userAddress) {
            const myAddr = State.userAddress.toLowerCase();
            let myProfile = BC.profiles.get(myAddr);
            if (!myProfile) {
                try {
                    const profile = await BackchatTx.getUserProfile(State.userAddress);
                    if (profile && profile.usernameHash && profile.usernameHash !== ethers.ZeroHash) {
                        const meta = parseMetadata(profile.metadataURI);
                        myProfile = { username: null, metadataURI: profile.metadataURI, displayName: meta.displayName, bio: meta.bio, avatar: meta.avatar, language: meta.language };
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
// SOCIAL GRAPH
// ============================================================================

export async function loadSocialGraph() {
    BC.following = new Set();
    BC.followers = new Set();
    BC.followCounts = new Map();

    if (!State.isConnected || !State.userAddress) return;
    try {
        const contract = getContract();
        if (!contract) return;
        const followEvents = await contract.queryFilter(contract.filters.Followed(), EVENTS_LOOKBACK).catch(() => []);
        const unfollowEvents = await contract.queryFilter(contract.filters.Unfollowed(), EVENTS_LOOKBACK).catch(() => []);
        const myAddr = State.userAddress.toLowerCase();

        for (const ev of followEvents) {
            if (ev.args.follower?.toLowerCase() === myAddr) BC.following.add(ev.args.followed?.toLowerCase());
            if (ev.args.followed?.toLowerCase() === myAddr) BC.followers.add(ev.args.follower?.toLowerCase());
        }
        for (const ev of unfollowEvents) {
            if (ev.args.follower?.toLowerCase() === myAddr) BC.following.delete(ev.args.followed?.toLowerCase());
            if (ev.args.followed?.toLowerCase() === myAddr) BC.followers.delete(ev.args.follower?.toLowerCase());
        }
        console.log(`[Agora] Social graph: following=${BC.following.size}, followers=${BC.followers.size}`);
    } catch (e) {
        console.warn('[Agora] Failed to load social graph:', e.message);
    }
}

// ============================================================================
// BLOCKED AUTHORS
// ============================================================================

export async function loadBlockedAuthors() {
    if (!State.isConnected || !State.userAddress) return;
    try {
        const contract = getContract();
        if (!contract) return;
        const reportEvents = await contract.queryFilter(contract.filters.PostReported(), EVENTS_LOOKBACK).catch(() => []);
        const myAddr = State.userAddress.toLowerCase();
        for (const ev of reportEvents) {
            if (ev.args.reporter?.toLowerCase() === myAddr) {
                const postId = ev.args.postId.toString();
                const post = BC.postsById.get(postId);
                if (post?.author) BC.blockedAuthors.add(post.author.toLowerCase());
            }
        }
        console.log(`[Agora] Blocked authors: ${BC.blockedAuthors.size}`);
    } catch (e) {
        console.warn('[Agora] Failed to load blocked authors:', e.message);
    }
}

// ============================================================================
// POSTS (with smart feed algorithm)
// ============================================================================

export async function loadPosts() {
    BC.isLoading = true;
    BC._render();

    try {
        const backchatAddress = getAgoraAddress();
        if (!backchatAddress) {
            BC.contractAvailable = false;
            BC.error = 'Agora contract not deployed yet.';
            return;
        }
        const contract = getContract();
        if (!contract) {
            BC.contractAvailable = false;
            BC.error = 'Could not connect to Agora contract';
            return;
        }
        BC.contractAvailable = true;

        const [postEvents, replyEvents, repostEvents] = await Promise.all([
            contract.queryFilter(contract.filters.PostCreated(), EVENTS_LOOKBACK).catch(e => { console.warn('[Agora] PostCreated query failed:', e.message); return []; }),
            contract.queryFilter(contract.filters.ReplyCreated(), EVENTS_LOOKBACK).catch(e => { console.warn('[Agora] ReplyCreated query failed:', e.message); return []; }),
            contract.queryFilter(contract.filters.RepostCreated(), EVENTS_LOOKBACK).catch(e => { console.warn('[Agora] RepostCreated query failed:', e.message); return []; })
        ]);
        console.log(`[Agora] Events found: ${postEvents.length} posts, ${replyEvents.length} replies, ${repostEvents.length} reposts`);

        const allEventItems = [];
        for (const ev of postEvents.slice(-80)) allEventItems.push({ ev, type: 'post' });
        for (const ev of replyEvents.slice(-60)) allEventItems.push({ ev, type: 'reply' });
        for (const ev of repostEvents.slice(-30)) allEventItems.push({ ev, type: 'repost' });

        const allItems = [];
        const feedPosts = [];
        BC.postsById = new Map();
        BC.replies = new Map();
        BC.replyCountMap = new Map();
        BC.repostCountMap = new Map();
        BC.likesMap = new Map();

        // Batch reads via getPostsBatch
        const allPostIds = allEventItems.map(({ ev }) => ev.args.postId || ev.args.newPostId);
        const allMetadata = [];
        for (let i = 0; i < allPostIds.length; i += 20) {
            const batchIds = allPostIds.slice(i, i + 20);
            try {
                const batchResult = await BackchatTx.getPostsBatch(batchIds);
                allMetadata.push(...batchResult);
            } catch {
                for (const pid of batchIds) {
                    try { allMetadata.push(await BackchatTx.getPost(pid)); } catch { allMetadata.push(null); }
                }
            }
        }

        for (let j = 0; j < allEventItems.length; j++) {
            const { ev, type } = allEventItems[j];
            const meta = allMetadata[j];
            const pid = (ev.args.postId || ev.args.newPostId).toString();

            if (meta && meta.deleted) continue;

            const timestamp = meta ? meta.createdAt : 0;
            const likesCount = meta ? meta.likes : 0;
            const superLikeETH = meta ? (meta.superLikeETH || 0n) : 0n;
            const downvotesCount = meta ? meta.downvotes : 0;
            const repliesCount = meta ? meta.replies : 0;
            const repostsCount = meta ? meta.reposts : 0;
            const editedAt = meta ? meta.editedAt : 0;
            const postTag = meta ? meta.tag : 0;

            if (type === 'post') {
                const { text, mediaCID, isVideo } = parsePostContent(ev.args.contentHash || ev.args.content || '');
                const post = {
                    id: pid, type: 'post',
                    author: ev.args.author || (meta ? meta.author : null),
                    content: text, mediaCID, isVideo,
                    tag: ev.args.tag != null ? Number(ev.args.tag) : postTag,
                    timestamp, superLikeETH, editedAt,
                    likesCount, downvotesCount, repliesCount, repostsCount,
                    txHash: ev.transactionHash
                };
                allItems.push(post);
                feedPosts.push(post);
                BC.postsById.set(pid, post);
            } else if (type === 'reply') {
                const parentId = ev.args.parentId.toString();
                const { text, mediaCID, isVideo } = parsePostContent(ev.args.contentHash || ev.args.content || '');
                const reply = {
                    id: pid, type: 'reply', parentId,
                    author: ev.args.author || (meta ? meta.author : null),
                    content: text, mediaCID, isVideo,
                    tag: ev.args.tag != null ? Number(ev.args.tag) : postTag,
                    timestamp, superLikeETH, editedAt,
                    likesCount, downvotesCount,
                    txHash: ev.transactionHash
                };
                allItems.push(reply);
                BC.postsById.set(pid, reply);
                if (!BC.replies.has(parentId)) BC.replies.set(parentId, []);
                BC.replies.get(parentId).push(reply);
                BC.replyCountMap.set(parentId, (BC.replyCountMap.get(parentId) || 0) + 1);
            } else if (type === 'repost') {
                const originalPostId = ev.args.originalId?.toString() || ev.args.originalPostId?.toString() || '0';
                const repost = {
                    id: pid, type: 'repost', originalPostId,
                    author: ev.args.author || ev.args.reposter,
                    timestamp, superLikeETH: 0n, editedAt: 0,
                    txHash: ev.transactionHash
                };
                allItems.push(repost);
                feedPosts.push(repost);
                BC.postsById.set(pid, repost);
                BC.repostCountMap.set(originalPostId, (BC.repostCountMap.get(originalPostId) || 0) + 1);
            }
        }

        // Check user likes
        if (State.isConnected && State.userAddress) {
            const postIds = allItems.filter(p => p.type !== 'repost').map(p => p.id);
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

        // Smart Feed Algorithm
        const nowSec = Math.floor(Date.now() / 1000);
        const myLang = BC.userProfile?.language || BC.wizLanguage || '';
        const isConnected = State.isConnected && State.userAddress;

        function feedScore(post) {
            const author = (post.type === 'repost'
                ? BC.postsById.get(post.originalPostId)?.author
                : post.author)?.toLowerCase() || '';
            const age = Math.max(nowSec - post.timestamp, 1);
            const recency = 1000 / (1 + age / 21600);
            const followBonus = (isConnected && BC.following.has(author)) ? 500 : 0;
            const authorProfile = BC.profiles.get(author);
            const langBonus = (myLang && authorProfile?.language === myLang) ? 300 : 0;
            const likes = post.likesCount || 0;
            const replies = post.repliesCount || BC.replyCountMap.get(post.id) || 0;
            const reposts = post.repostsCount || BC.repostCountMap.get(post.id) || 0;
            const superETH = Number(ethers.formatEther(post.superLikeETH || 0n));
            const engagement = likes + replies * 2 + reposts * 1.5 + Math.min(superETH * 100, 200);
            return recency + followBonus + langBonus + engagement;
        }

        feedPosts.forEach(p => { p._score = feedScore(p); });
        feedPosts.sort((a, b) => b._score - a._score);

        const filterBlocked = (posts) => {
            if (BC.blockedAuthors.size === 0) return posts;
            return posts.filter(p => !BC.blockedAuthors.has(p.author?.toLowerCase()));
        };

        BC.posts = filterBlocked(feedPosts);
        BC.allItems = allItems;

        // Discover: Engagement-ranked
        BC.trendingPosts = filterBlocked([...allItems]
            .filter(p => p.type !== 'repost'))
            .map(p => {
                const ageH = Math.max((nowSec - p.timestamp) / 3600, 0.5);
                const ethVal = Number(ethers.formatEther(p.superLikeETH || 0n));
                const likes = p.likesCount || 0;
                const replies = p.repliesCount || BC.replyCountMap.get(p.id) || 0;
                const reposts = p.repostsCount || BC.repostCountMap.get(p.id) || 0;
                const base = 1 + likes * 0.5 + replies * 1.0 + reposts * 0.8 + ethVal * 50;
                p._trendScore = base / Math.sqrt(ageH);
                return p;
            })
            .sort((a, b) => b._trendScore - a._trendScore);

        console.log(`[Agora] Loaded: ${BC.posts.length} feed posts, ${BC.allItems.length} total items, ${BC.trendingPosts.length} trending`);
    } catch (e) {
        console.error('[Agora] Failed to load posts:', e);
        BC.error = e.message;
    } finally {
        BC.isLoading = false;
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
