// pages/agora/data-loader.js
// Agora V14 — Data loading from Firebase (indexed by backchain-indexer-service)
// Falls back to on-chain queryFilter only if Firebase is unavailable.
// ============================================================================

const ethers = window.ethers;

import { State } from '../../state.js';
import { agoraABI } from '../../config.js';
import { BackchatTx } from '../../modules/transactions/index.js';
import { calculateFeeClientSide, chunkedQueryFilter } from '../../modules/core/index.js';
import { NetworkManager } from '../../modules/core/index.js';
import { LiveStream } from '../../modules/webrtc-live.js';
import { BC, getAgoraAddress, EVENTS_LOOKBACK } from './state.js';
import { parseMetadata, parsePostContent } from './utils.js';
import { db } from '../../modules/firebase-auth-service.js';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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
// GLOBAL STATS — Firebase first, on-chain fallback
// ============================================================================

export async function loadGlobalStats() {
    try {
        // Try Firebase first (indexed stats)
        const statsDoc = await getDoc(doc(db, 'agora_stats', 'global'));
        if (statsDoc.exists()) {
            const data = statsDoc.data();
            BC.globalStats = {
                totalPosts: data.totalPosts || 0,
                totalReplies: data.totalReplies || 0,
                totalReposts: data.totalReposts || 0,
                totalProfiles: data.totalProfiles || 0,
                totalLikes: data.totalLikes || 0,
                totalFollows: data.totalFollows || 0,
            };
            return;
        }
    } catch (e) {
        console.warn('[Agora] Firebase stats unavailable, falling back to on-chain:', e.message);
    }
    // Fallback: on-chain
    try {
        BC.globalStats = await BackchatTx.getGlobalStats();
    } catch (e) {
        console.warn('[Agora] Failed to load global stats:', e.message);
    }
}

// ============================================================================
// PROFILES — Firebase (agora_users collection)
// ============================================================================

export async function loadProfiles() {
    try {
        // Read all profiles from Firebase
        const usersSnap = await getDocs(collection(db, 'agora_users'));

        for (const docSnap of usersSnap.docs) {
            const data = docSnap.data();
            const addr = (data.address || docSnap.id).toLowerCase();
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
            // Store follow counts from indexed data
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
// SOCIAL GRAPH — Firebase (agora_follows collection)
// ============================================================================

export async function loadSocialGraph() {
    BC.following = new Set();
    BC.followers = new Set();
    BC.followCounts = new Map();

    if (!State.isConnected || !State.userAddress) return;
    const myAddr = State.userAddress.toLowerCase();

    try {
        // My following
        const followingSnap = await getDocs(
            query(collection(db, 'agora_follows'), where('follower', '==', myAddr))
        );
        for (const d of followingSnap.docs) {
            BC.following.add(d.data().followed);
        }

        // My followers
        const followersSnap = await getDocs(
            query(collection(db, 'agora_follows'), where('followed', '==', myAddr))
        );
        for (const d of followersSnap.docs) {
            BC.followers.add(d.data().follower);
        }

        console.log(`[Agora] Social graph: following=${BC.following.size}, followers=${BC.followers.size}`);
    } catch (e) {
        console.warn('[Agora] Failed to load social graph:', e.message);
    }
}

// ============================================================================
// BLOCKED AUTHORS — Firebase (agora_blocks collection)
// ============================================================================

export async function loadBlockedAuthors() {
    if (!State.isConnected || !State.userAddress) return;
    const myAddr = State.userAddress.toLowerCase();

    try {
        const blocksSnap = await getDocs(
            query(collection(db, 'agora_blocks'), where('blocker', '==', myAddr))
        );
        for (const d of blocksSnap.docs) {
            BC.blockedAuthors.add(d.data().blocked);
        }
        console.log(`[Agora] Blocked authors: ${BC.blockedAuthors.size}`);
    } catch (e) {
        console.warn('[Agora] Failed to load blocked authors:', e.message);
    }
}

// ============================================================================
// POSTS — Firebase (agora_posts collection) with smart feed algorithm
// ============================================================================

export async function loadPosts() {
    BC.isLoading = true;
    BC._render();

    try {
        BC.contractAvailable = !!getAgoraAddress();
        if (!BC.contractAvailable) {
            BC.error = 'Agora contract not deployed yet.';
            return;
        }

        console.log('[Agora] Loading posts from Firebase...');

        // Read posts from Firebase — last 200 non-deleted, ordered by timestamp
        const postsSnap = await getDocs(
            query(
                collection(db, 'agora_posts'),
                where('deleted', '==', false),
                orderBy('timestamp', 'desc'),
                limit(200)
            )
        );

        const allItems = [];
        const feedPosts = [];
        BC.postsById = new Map();
        BC.replies = new Map();
        BC.replyCountMap = new Map();
        BC.repostCountMap = new Map();
        BC.likesMap = new Map();

        for (const docSnap of postsSnap.docs) {
            const data = docSnap.data();
            const pid = data.postId || docSnap.id;
            const type = data.type || 'post';
            const timestamp = data.timestamp?.seconds || data.timestamp?.toDate?.()?.getTime?.() / 1000 || 0;

            if (type === 'post') {
                const { text, media, mediaCID, isVideo } = parsePostContent(data.contentHash || '');
                const post = {
                    id: pid, type: 'post',
                    author: data.author,
                    content: text, media, mediaCID, isVideo,
                    tag: data.tag || 0,
                    timestamp,
                    superLikeETH: 0n, // Firebase stores as number, not BigInt
                    editedAt: data.editedAt?.seconds || 0,
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
                    editedAt: data.editedAt?.seconds || 0,
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

        console.log(`[Agora] Firebase: ${postsSnap.size} docs → ${feedPosts.length} feed posts, ${allItems.length} total items`);

        // Check user likes (still on-chain — Firebase doesn't track per-user likes)
        if (State.isConnected && State.userAddress) {
            const contract = getContract();
            if (contract) {
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
            const engagement = likes + replies * 2 + reposts * 1.5;
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
                const likes = p.likesCount || 0;
                const replies = p.repliesCount || BC.replyCountMap.get(p.id) || 0;
                const reposts = p.repostsCount || BC.repostCountMap.get(p.id) || 0;
                const base = 1 + likes * 0.5 + replies * 1.0 + reposts * 0.8;
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
